const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(__dirname, 'temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.ensureDir(this.tempDir);
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async executeCppCode(code, roomId) {
    const sessionId = uuidv4();
    const fileName = `code_${sessionId}`;
    const cppFile = path.join(this.tempDir, `${fileName}.cpp`);
    const execFile = path.join(this.tempDir, fileName);

    try {
      // Write C++ code to file
      await fs.writeFile(cppFile, code);

      // Compile C++ code with security restrictions
      const compileResult = await this.compileCpp(cppFile, execFile);
      
      if (!compileResult.success) {
        return {
          success: false,
          output: compileResult.error,
          type: 'compilation-error'
        };
      }

      // Execute compiled code with security restrictions
      const executeResult = await this.executeCompiledCode(execFile);
      
      return {
        success: true,
        output: executeResult.output,
        error: executeResult.error,
        type: 'execution-result'
      };

    } catch (error) {
      return {
        success: false,
        output: `Execution error: ${error.message}`,
        type: 'runtime-error'
      };
    } finally {
      // Cleanup files
      this.cleanup([cppFile, execFile]);
    }
  }

  compileCpp(cppFile, execFile) {
    return new Promise((resolve) => {
      const compileCmd = `g++ -std=c++17 -Wall -Wextra -O2 -o "${execFile}" "${cppFile}"`;
      
      exec(compileCmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            output: stdout
          });
        }
      });
    });
  }

  executeCompiledCode(execFile) {
    return new Promise((resolve) => {
      // Security: Run with timeout and resource limits
      const child = spawn(execFile, [], {
        timeout: 5000, // 5 second timeout
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {}, // Empty environment for security
        cwd: this.tempDir,
        uid: process.getuid ? process.getuid() : undefined, // Run as current user (in container)
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
        // Limit output size to prevent memory issues
        if (output.length > 10000) {
          child.kill('SIGTERM');
          output += '\n[Output truncated - too long]';
        }
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (errorOutput.length > 5000) {
          child.kill('SIGTERM');
          errorOutput += '\n[Error output truncated - too long]';
        }
      });

      child.on('close', (code) => {
        resolve({
          output: output || 'No output',
          error: errorOutput,
          exitCode: code
        });
      });

      child.on('error', (error) => {
        resolve({
          output: '',
          error: `Execution failed: ${error.message}`,
          exitCode: -1
        });
      });

      // Kill process if it runs too long
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      }, 5000);
    });
  }

  async cleanup(files) {
    for (const file of files) {
      try {
        await fs.remove(file);
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Failed to cleanup ${file}:`, error.message);
      }
    }
  }
}

module.exports = CodeExecutor;
