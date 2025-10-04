import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://mini-chat-app-backend-qh1z.onrender.com/';
const ROOM = 'group';

export default function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState(''); // '' | 'private' | 'broadcast'
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [privateRecipient, setPrivateRecipient] = useState('');
  const [privateRecipientConfirmed, setPrivateRecipientConfirmed] = useState(false);
  const [privateMsg, setPrivateMsg] = useState('');
  const [privateMessages, setPrivateMessages] = useState([]); // {from, message}
  const [allUsers, setAllUsers] = useState([]); // for demo, not real-time
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (joined && !socketRef.current) {
      const socket = io(SOCKET_URL);
      socketRef.current = socket;
      socket.emit('joinRoom', username);
      socket.emit('register', username);
      socket.on('userJoined', (msg) => {
        setNotifications((prev) => [...prev, msg]);
      });
      socket.on('chatMessage', (msgObj) => {
        setMessages((prev) => [...prev, msgObj]);
      });
      socket.on('privateMessage', ({from, to, message}) => {
        setPrivateMessages((prev) => [...prev, {from, to, message}]); // always use both from and to
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [joined, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, notifications, privateMessages]);

  // Demo: add user to list on join (not real-time, for demo only)
  useEffect(() => {
    if (joined && username && !allUsers.includes(username)) {
      setAllUsers((prev) => [...prev, username]);
    }
  }, [joined, username]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) setJoined(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && socketRef.current) {
      const msgObj = { username, text: message };
      socketRef.current.emit('chatMessage', msgObj);
      setMessages((prev) => [...prev, msgObj]);
      setMessage('');
    }
  };

  const handlePrivateSend = (e) => {
    e.preventDefault();
    if (privateRecipient && privateMsg && socketRef.current) {
      socketRef.current.emit('privateMessage', { to: privateRecipient, message: privateMsg });
      setPrivateMessages((prev) => [...prev, { from: username, to: privateRecipient, message: privateMsg }]);
      setPrivateMsg('');
    }
  };

  if (!joined) {
    return (
      <div className="popup-bg">
        <div className="popup-card">
          <h2>Enter your name</h2>
          <p className="subtitle">Enter your name to start chatting. This will be used to identify you.</p>
          <form onSubmit={handleJoin} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem"}}>
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="popup-input"
            />
            <button type="submit" className="popup-btn">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="popup-bg">
        <div className="popup-card" style={{minWidth:400,alignItems:'center',padding:'2.5rem 2rem'}}>
          <h2 style={{fontSize:'1.6rem',marginBottom:'2.2rem',fontWeight:700}}>Choose The Chat Visibility</h2>
          <div style={{display:'flex',gap:'2rem',marginBottom:'1rem'}}>
            <button
              style={{background:'#5be584',color:'#111',fontWeight:600,fontSize:'1.15rem',border:'none',borderRadius:'2rem',padding:'0.9rem 2.5rem',display:'flex',alignItems:'center',gap:'0.7rem',boxShadow:'0 2px 8px #5be58444',cursor:'pointer'}}
              onClick={()=>setMode('private')}
            >
              <span role="img" aria-label="private">🛡️</span> Private
            </button>
            <button
              style={{background:'#6ecbff',color:'#111',fontWeight:600,fontSize:'1.15rem',border:'none',borderRadius:'2rem',padding:'0.9rem 2.5rem',display:'flex',alignItems:'center',gap:'0.7rem',boxShadow:'0 2px 8px #6ecbff44',cursor:'pointer'}}
              onClick={()=>setMode('broadcast')}
            >
              <span role="img" aria-label="broadcast">📢</span> Broadcast
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'private' && !privateRecipientConfirmed) {
    return (
      <div className="popup-bg">
        <div className="popup-card" style={{minWidth:350,alignItems:'center',padding:'2.2rem 2rem'}}>
          <h2 style={{fontSize:'1.3rem',marginBottom:'1.5rem',fontWeight:700}}>Enter recipient username</h2>
          <form onSubmit={e => {e.preventDefault(); if(privateRecipient) setPrivateRecipientConfirmed(true);}} style={{display:'flex',gap:'1rem',alignItems:'center'}}>
            <input
              type="text"
              placeholder="Recipient username"
              value={privateRecipient}
              onChange={e => setPrivateRecipient(e.target.value)}
              className="popup-input"
              style={{minWidth:180}}
              required
            />
            <button type="submit" className="popup-btn">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'private' && privateRecipientConfirmed) {
    return (
      <div className="chat-ui">
        <div className="chat-header-ui" style={{background:'#f8fafc', borderBottom:'1.5px solid #e0e0e0'}}>
          <div className="chat-header-avatar" style={{background:'#176b5c'}}>{username[0]?.toUpperCase()}</div>
          <div className="chat-header-title" style={{fontWeight:700}}>Private Chat</div>
          <div className="chat-header-user">Signed in as <b>{username}</b></div>
        </div>
        <div className="chat-body-ui" style={{justifyContent:'flex-start', alignItems:'center', minHeight:'300px'}}>
          <div style={{margin:'2.5rem 0 1.5rem 0', background:'#ececec', color:'#222', fontWeight:600, fontSize:'1.15rem', borderRadius:'1rem', padding:'0.7rem 2.2rem', boxShadow:'0 2px 8px #ccc'}}>Chatting with {privateRecipient}</div>
          <div style={{width:'100%', maxWidth:'420px', margin:'0 auto'}}>
            {privateMessages.filter(pm =>
              (pm.from === username && pm.to === privateRecipient) ||
              (pm.from === privateRecipient && pm.to === username)
            ).map((pm, idx) => (
              <div key={idx} style={{background: pm.from === username ? '#d4f8c4' : '#fffbe6', borderRadius:'8px', padding:'0.5rem 1rem', color:'#176b5c', marginBottom:'0.4rem', alignSelf: pm.from === username ? 'flex-end' : 'flex-start'}}>
                <b>{pm.from === username ? 'You' : pm.from}:</b> {pm.message}
              </div>
            ))}
          </div>
        </div>
        <form className="chat-input-ui" style={{background:'#fff', borderTop:'1.5px solid #e0e0e0'}} onSubmit={handlePrivateSend}>
          <input
            type="text"
            placeholder="Type a message..."
            style={{fontSize:'1.05rem'}}
            value={privateMsg}
            onChange={e => setPrivateMsg(e.target.value)}
          />
          <button type="submit" style={{background:'#25d366',fontWeight:700}}>Send</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-ui">
      <div className="chat-header-ui">
        <div className="chat-header-avatar">{username[0]?.toUpperCase()}</div>
        <div className="chat-header-title">Realtime group chat</div>
        <div className="chat-header-user">Signed in as <b>{username}</b></div>
      </div>
      <div className="chat-body-ui">
        <div className="messages-ui">
          {notifications.map((note, idx) => (
            <div className="msg-bubble" style={{background:'#f3f3f3', color:'#176b5c', fontStyle:'italic'}} key={"notif-"+idx}>{note}</div>
          ))}
          {messages.map((msg, idx) => (
            <div
              className={msg.username === username ? 'msg-bubble own-bubble' : 'msg-bubble'}
              key={idx}
            >
              <div className="msg-text">{msg.text}</div>
              <div className="msg-meta">
                <span className="msg-user">{msg.username}</span>
                <span className="msg-time">{msg.time ? msg.time : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form className="chat-input-ui" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
