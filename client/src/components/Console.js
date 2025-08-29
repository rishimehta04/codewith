import React, { useState, useRef, useEffect } from "react";

function Console({ output, error, isRunning, onInput }) {
  const [currentInput, setCurrentInput] = useState('');
  const [terminalLines, setTerminalLines] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const consoleEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines]);

  // Update terminal when output/error changes
  useEffect(() => {
    if (output || error) {
      console.log('📺 Console received:', { output, error });
      
      if (error && error.trim()) {
        // Add error to terminal
        setTerminalLines(prev => [...prev, {
          type: 'error',
          content: error.trim(),
          timestamp: Date.now()
        }]);
      } else if (output && output.trim()) {
        // Add output to terminal
        setTerminalLines(prev => [...prev, {
          type: 'output', 
          content: output.trim(),
          timestamp: Date.now()
        }]);
        
        // Check if program is waiting for input (simple heuristic)
        if (output.includes(':') || output.includes('?') || output.toLowerCase().includes('enter')) {
          setWaitingForInput(true);
        }
      }
    }
  }, [output, error]);

  // Focus input when waiting for input
  useEffect(() => {
    if (waitingForInput && !isRunning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput, isRunning]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (currentInput.trim()) {
      // Add user input to terminal display
      setTerminalLines(prev => [...prev, {
        type: 'input',
        content: currentInput.trim(),
        timestamp: Date.now()
      }]);

      // Send input to parent component
      if (onInput) {
        onInput(currentInput.trim());
      }

      // Clear input and reset waiting state
      setCurrentInput('');
      setWaitingForInput(false);
    }
  };

  const clearConsole = () => {
    setTerminalLines([]);
    setWaitingForInput(false);
  };

  const handleConsoleClick = () => {
    if (inputRef.current && !isRunning) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Handle Ctrl+C to clear input
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setCurrentInput('');
    }
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Terminal Header */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2" 
           style={{ backgroundColor: "#2d2d2d", borderBottom: "1px solid #444" }}>
        <div className="d-flex align-items-center">
          <div className="d-flex me-3">
            <div className="rounded-circle me-1" style={{ width: "12px", height: "12px", backgroundColor: "#ff5f57" }}></div>
            <div className="rounded-circle me-1" style={{ width: "12px", height: "12px", backgroundColor: "#ffbd2e" }}></div>
            <div className="rounded-circle" style={{ width: "12px", height: "12px", backgroundColor: "#28ca42" }}></div>
          </div>
          <span className="text-light fw-bold">Console</span>
          {isRunning && (
            <div className="ms-3 d-flex align-items-center">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              <small className="text-warning">Running...</small>
            </div>
          )}
          {waitingForInput && !isRunning && (
            <small className="text-info ms-3">Waiting for input...</small>
          )}
        </div>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={clearConsole}
          title="Clear Console"
          style={{ fontSize: "12px" }}
        >
          Clear
        </button>
      </div>

      {/* Terminal Content */}
      <div 
        className="flex-grow-1 p-3 overflow-auto position-relative"
        style={{
          backgroundColor: "#1e1e1e",
          fontFamily: "JetBrains Mono, Consolas, 'Courier New', monospace",
          fontSize: "14px",
          color: "#ffffff",
          cursor: "text",
          lineHeight: "1.5"
        }}
        onClick={handleConsoleClick}
      >
        {/* Welcome Message */}
        {terminalLines.length === 0 && !isRunning && (
          <div style={{ color: "#888", opacity: 0.7 }}>
            <div>CodeWith C++ Terminal</div>
            <div className="mt-1">Click "Run Code" to execute your program...</div>
          </div>
        )}

        {/* Terminal History */}
        {terminalLines.map((line, index) => (
          <div key={`${line.timestamp}-${index}`} className="mb-1">
            {line.type === 'input' && (
              <div style={{ color: "#61dafb" }}>
                <span style={{ color: "#888" }}>$ </span>
                <span>{line.content}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div style={{ color: "#98d982" }}>
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: "pre-wrap", 
                  fontFamily: "inherit",
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "inherit"
                }}>
                  {line.content}
                </pre>
              </div>
            )}
            {line.type === 'error' && (
              <div style={{ color: "#ff6b6b" }}>
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: "pre-wrap", 
                  fontFamily: "inherit",
                  background: "none",
                  border: "none", 
                  padding: 0,
                  color: "inherit"
                }}>
                  {line.content}
                </pre>
              </div>
            )}
          </div>
        ))}

        {/* Current Input Line */}
        {(!isRunning && (waitingForInput || terminalLines.length > 0)) && (
          <div className="d-flex align-items-center">
            <span style={{ color: "#888" }}>$ </span>
            <form onSubmit={handleInputSubmit} className="flex-grow-1">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-light border-0 w-100"
                style={{
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  outline: "none",
                  color: "#61dafb"
                }}
                placeholder=""
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </div>
        )}

        {/* Running indicator */}
        {isRunning && (
          <div className="d-flex align-items-center" style={{ color: "#ffbd2e" }}>
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>Executing C++ program...</span>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}

export default Console;
