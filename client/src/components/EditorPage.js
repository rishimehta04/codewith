import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import Console from "./Console";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState('cpp');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const codeRef = useRef(null);

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const socketRef = useRef(null);
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, Try again later");
        navigate("/");
      };

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: Location.state?.username,
      });

      // Listen for new clients joining the chatroom
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          // this insure that new user connected message do not display to that user itself
          if (username !== Location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          // also send the code to sync
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      // listening for code output
      socketRef.current.on(ACTIONS.CODE_OUTPUT, ({ output, error, success, type }) => {
        console.log('📝 Code execution result received:', { output, error, success, type });
        
        setIsRunning(false);
        setOutput(output || '');
        setError(error || '');
        
        // Log to console for debugging
        if (output) {
          console.log('✅ Code Output:', output);
        }
        if (error) {
          console.log('❌ Code Error:', error);
        }
        
        if (!success) {
          console.error('💥 Execution failed:', type);
          toast.error(`Execution failed: ${type}`);
        } else {
          console.log('🎉 Code executed successfully!');
          toast.success('Code executed successfully!');
        }
      });
    };
    init();

    // cleanup
    return () => {
      socketRef.current && socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.CODE_OUTPUT);
    };
  }, []);

  if (!Location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success(`roomIs is copied`);
    } catch (error) {
      console.log(error);
      toast.error("unable to copy the room Id");
    }
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const runCode = () => {
    if (!codeRef.current || !codeRef.current.trim()) {
      toast.error('Please write some code first!');
      return;
    }

    console.log('🚀 Running code:', {
      language,
      codeLength: codeRef.current.length,
      roomId
    });

    setIsRunning(true);
    setOutput('');
    setError('');
    
    const payload = {
      roomId,
      code: codeRef.current,
      language: language
    };
    
    console.log('📤 Emitting RUN_CODE event:', payload);
    
    socketRef.current.emit(ACTIONS.RUN_CODE, payload);
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* client panel */}
        <div
          className="col-md-2 bg-dark text-light d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0, 0, 0, 0.1)" }}
        >
          {/* <img
            src="/images/codewith.png"
            alt="Logo"
            className="img-fluid mx-auto"
            style={{ maxWidth: "150px", marginTop: "-43px" }}
          /> */}
          <hr style={{ marginTop: "-3rem" }} />

          {/* Client list container */}
          <div className="d-flex flex-column flex-grow-1 overflow-auto">
            <span className="mb-2">Members</span>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          <hr />
          
          {/* Language Selector */}
          <div className="mb-3">
            <label className="form-label text-light">Language:</label>
            <select 
              className="form-select" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="cpp">C++</option>
              <option value="javascript" disabled>JavaScript (Coming Soon)</option>
            </select>
          </div>

          {/* Language Info */}
          <div className="mb-3 p-2 rounded" style={{ backgroundColor: "#2d2d2d" }}>
            <small className="text-muted">Currently editing:</small>
            <div className="text-light">main.cpp</div>
          </div>

          <hr />
          {/* Buttons */}
          <div className="mt-auto ">
            <button className="btn btn-success" onClick={copyRoomId}>
              Copy Room ID
            </button>
            <button
              className="btn btn-danger mt-2 mb-2 px-3 btn-block"
              onClick={leaveRoom}
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Editor panel */}
        <div className="col-md-10 text-light d-flex flex-column h-100" style={{ backgroundColor: "#1e1e1e" }}>
          {/* Editor Section */}
          <div style={{ height: "60%", position: "relative" }}>
            {/* Editor Header */}
            <div className="d-flex align-items-center px-3 py-2" 
                 style={{ backgroundColor: "#2d2d2d", borderBottom: "1px solid #444" }}>
              <div className="d-flex align-items-center">
                <span className="text-light me-3">main.cpp</span>
                <small className="text-muted">{language.toUpperCase()}</small>
              </div>
              <div className="ms-auto">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={runCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Running...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play me-1"></i>
                      Run
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Editor */}
            <div style={{ height: "calc(100% - 50px)" }}>
              <Editor
                socketRef={socketRef}
                roomId={roomId}
                language={language}
                onCodeChange={(code) => {
                  codeRef.current = code;
                }}
              />
            </div>
          </div>
          
          {/* Console Section */}
          <div style={{ height: "40%", borderTop: "1px solid #444" }}>
            <Console 
              output={output} 
              error={error} 
              isRunning={isRunning}
              onInput={(input) => {
                console.log('📥 User input:', input);
                // TODO: Send input to running program
                // For now, just log it - we'll implement program input later
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
