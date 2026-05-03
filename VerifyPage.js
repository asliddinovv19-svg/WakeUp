import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const VerifyPage = () => {
  const { verify, language } = useAuth();
  const t = translations[language];
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, email } = location.state || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  if (!userId) {
    navigate('/signup');
    return null;
  }

  const handleInput = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[idx] = v;
    setCode(newCode);
    if (v && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('6 xonali kodni to\'liq kiriting');
      return;
    }
    setLoading(true);
    try {
      await verify(userId, fullCode);
      toast.success('Email tasdiqlandi! Xush kelibsiz 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Noto\'g\'ri kod');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post('/api/auth/resend-code', { userId });
      toast.success('Yangi kod yuborildi!');
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgDecor} />
      <div style={styles.container}>
        <div style={styles.icon}>📧</div>
        <h1 style={styles.title}>{t.verifyEmail}</h1>
        <p style={styles.sub}>
          {t.codeSentTo} <span style={{color:'var(--green)'}}>{email}</span>
        </p>

        <div style={styles.codeWrap} onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputs.current[idx] = el}
              style={{
                ...styles.codeInput,
                borderColor: digit ? 'var(--green)' : 'var(--border)',
                color: digit ? 'var(--green)' : 'var(--text)',
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
        >
          {loading ? '...' : t.verifyBtn}
        </button>

        <button
          style={styles.resendBtn}
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? '...' : t.resendCode}
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--black)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    alignItems: 'center',
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '40px 28px',
    textAlign: 'center',
  },
  icon: { fontSize: '56px' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--text)',
  },
  sub: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--text-dim)',
    lineHeight: 1.5,
  },
  codeWrap: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  codeInput: {
    width: '48px',
    height: '58px',
    background: 'var(--dark3)',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  }
};

export default VerifyPage;
