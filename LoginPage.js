import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const LoginPage = () => {
  const { login, language } = useAuth();
  const t = translations[language];
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.data?.needsVerification) {
        toast.warning('Email tasdiqlanmagan!');
        navigate('/verify', { state: { userId: err.response.data.userId, email: form.identifier } });
      } else {
        toast.error(msg || 'Xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background decor */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🏃</div>
          <h1 style={styles.logo}>WAKE<span style={{color:'#fff'}}>UP</span></h1>
          <p style={styles.tagline}>Yuguring. Egallang. Hukmronlik qiling.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formTitle}>{t.welcomeBack}</div>
          <div className="accent-line" />

          <div className="input-group">
            <label className="input-label">{t.usernameOrEmail}</label>
            <input
              className="input"
              type="text"
              placeholder="username yoki email"
              value={form.identifier}
              onChange={e => setForm({...form, identifier: e.target.value})}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t.password}</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? '...' : t.login}
          </button>

          <div style={styles.switchLink}>
            <span style={{color: 'var(--text-dim)'}}>{t.noAccount} </span>
            <Link to="/signup" style={styles.link}>{t.signup}</Link>
          </div>
        </form>
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
  bgDecor1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '-150px',
    left: '-150px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  logoWrap: {
    textAlign: 'center',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '42px',
    fontWeight: '900',
    color: 'var(--green)',
    letterSpacing: '2px',
    lineHeight: 1,
    marginBottom: '8px',
  },
  tagline: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-dim)',
    letterSpacing: '1px',
  },
  form: {
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text)',
  },
  switchLink: {
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  },
  link: {
    color: 'var(--green)',
    textDecoration: 'none',
    fontWeight: '700',
  }
};

export default LoginPage;
