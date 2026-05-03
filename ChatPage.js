import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const CHAT_TYPES = ['personal', 'city', 'region', 'country', 'world'];

const ChatPage = () => {
  const { user, language, API } = useAuth();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('world');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const chatLabels = t.chatTypes;

  const tabIcons = {
    personal: '👤',
    city: '🏙️',
    region: '🌆',
    country: '🏳️',
    world: '🌍'
  };

  const fetchMessages = async () => {
    try {
      let url = `${API}/chat/${activeTab}`;
      if (activeTab === 'personal' && selectedUser) {
        url += `?recipientId=${selectedUser._id}`;
      } else if (activeTab === 'personal' && !selectedUser) {
        setMessages([]);
        return;
      }
      const { data } = await axios.get(url);
      setMessages(data.messages || []);
    } catch (e) {}
  };

  useEffect(() => {
    setMessages([]);
    fetchMessages();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  // eslint-disable-next-line
  }, [activeTab, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (activeTab === 'personal' && !selectedUser) {
      toast.warning('Foydalanuvchi tanlang');
      return;
    }
    setSending(true);
    try {
      const payload = {
        content: input.trim(),
        chatType: activeTab,
        ...(activeTab === 'personal' && { recipientId: selectedUser._id })
      };
      const { data } = await axios.post(`${API}/chat/send`, payload);
      setMessages(prev => [...prev, data.data]);
      setInput('');
    } catch (e) {
      toast.error('Xabar yuborilmadi');
    } finally {
      setSending(false);
    }
  };

  const searchUsers = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await axios.get(`${API}/chat/users/search?q=${q}`);
      setSearchResults(data.users || []);
    } catch (e) {}
  };

  const Avatar = ({ u, size = 36 }) => {
    const initials = u?.username?.slice(0, 2).toUpperCase() || '?';
    return u?.avatar ? (
      <img src={`http://localhost:5000${u.avatar}`} alt=""
        style={{width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0}} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--dark3)', border: '1.5px solid var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: '900',
        fontSize: size * 0.35 + 'px', color: 'var(--green)', flexShrink: 0
      }}>{initials}</div>
    );
  };

  return (
    <div style={styles.page}>
      {/* Tabs */}
      <div style={styles.tabs}>
        {CHAT_TYPES.map(type => (
          <button
            key={type}
            onClick={() => { setActiveTab(type); setSelectedUser(null); }}
            style={{
              ...styles.tab,
              ...(activeTab === type ? styles.tabActive : {})
            }}
          >
            <span>{tabIcons[type]}</span>
            <span style={styles.tabLabel}>{chatLabels[type]}</span>
          </button>
        ))}
      </div>

      {/* Personal user search */}
      {activeTab === 'personal' && (
        <div style={styles.personalSearch}>
          {selectedUser ? (
            <div style={styles.selectedUser}>
              <Avatar u={selectedUser} size={32} />
              <span style={styles.selectedName}>@{selectedUser.username}</span>
              <button onClick={() => setSelectedUser(null)} style={styles.clearBtn}>✕</button>
            </div>
          ) : (
            <div style={{position: 'relative'}}>
              <input
                className="input"
                placeholder={t.searchUser}
                value={searchQ}
                onChange={e => searchUsers(e.target.value)}
                style={{paddingLeft: '14px'}}
              />
              {searchResults.length > 0 && (
                <div style={styles.searchDropdown}>
                  {searchResults.map(u => (
                    <div key={u._id} style={styles.searchItem}
                      onClick={() => { setSelectedUser(u); setSearchQ(''); setSearchResults([]); }}>
                      <Avatar u={u} size={32} />
                      <div>
                        <div style={{fontWeight: 600, fontSize: 14}}>@{u.username}</div>
                        <div style={{fontSize: 12, color: 'var(--text-dim)'}}>{u.city}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.emptyMsg}>
            <div style={{fontSize: 40, marginBottom: 8}}>💬</div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)'}}>
              {t.noMessages}
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender?._id === user?.id || msg.sender?._id === user?._id;
            return (
              <div key={msg._id} style={{
                ...styles.msgRow,
                justifyContent: isMe ? 'flex-end' : 'flex-start'
              }}>
                {!isMe && <Avatar u={msg.sender} size={28} />}
                <div style={{maxWidth: '70%'}}>
                  {!isMe && (
                    <div style={styles.msgSender}>@{msg.sender?.username}</div>
                  )}
                  <div style={{
                    ...styles.bubble,
                    ...(isMe ? styles.bubbleMe : styles.bubbleThem)
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    ...styles.msgTime,
                    textAlign: isMe ? 'right' : 'left'
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </div>
                {isMe && <Avatar u={user} size={28} />}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputBar}>
        <input
          className="input"
          style={{flex: 1, borderRadius: '40px', padding: '12px 18px'}}
          placeholder={t.typeMessage}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
        />
        <button
          className="btn btn-primary"
          style={{borderRadius: '50%', width: '46px', height: '46px', padding: 0, fontSize: '18px'}}
          onClick={sendMessage}
          disabled={sending || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--black)',
    paddingBottom: 'var(--nav-h)',
  },
  tabs: {
    display: 'flex',
    overflowX: 'auto',
    borderBottom: '1px solid var(--border)',
    background: 'var(--dark2)',
    padding: '0 8px',
    gap: '2px',
    scrollbarWidth: 'none',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: 'var(--text-dim)',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    fontSize: '18px',
  },
  tabActive: {
    color: 'var(--green)',
    borderBottomColor: 'var(--green)',
  },
  tabLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  personalSearch: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    position: 'relative',
  },
  selectedUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--dark3)',
    borderRadius: '40px',
    padding: '6px 14px',
  },
  selectedName: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--green)',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    zIndex: 100,
    overflow: 'hidden',
  },
  searchItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyMsg: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-dim)',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  msgSender: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--green)',
    marginBottom: '4px',
    marginLeft: '4px',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: '18px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  bubbleMe: {
    background: 'var(--green)',
    color: 'var(--black)',
    borderBottomRightRadius: '4px',
    fontWeight: '500',
  },
  bubbleThem: {
    background: 'var(--dark3)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderBottomLeftRadius: '4px',
  },
  msgTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '3px',
    padding: '0 4px',
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
    background: 'var(--dark2)',
  }
};

export default ChatPage;
