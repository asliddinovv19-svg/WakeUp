import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const SignupPage = () => {
  const { register, language } = useAuth();
  const t = translations[language];
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }
    if (form.username.length < 3) {
      toast.error('Username kamida 3 belgidan iborat bo\'lishi kerak');
      return;
    }
    setLoading(true);
    try {
      const data = await register(form.username, form.email, form.password);
      toast.success('Kod emailingizga yuborildi!');
      navigate('/verify', { state: { userId: data.userId, email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgDecor} />
      <div style={styles.container}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🏃</div>
          <h1 style={styles.logo}>WAKE<span style={{color:'#fff'}}>UP</span></h1>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formTitle}>{t.createAccount}</div>
          <div className="accent-line" />

          <div className="input-group">
            <label className="input-label">{t.username}</label>
            <input
              className="input"
              type="text"
              placeholder="sizning_ismingiz"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value.toLowerCase().replace(/\s/g, '_')})}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t.email}</label>
            <input
              className="input"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t.password}</label>
            <input
              className="input"
              type="password"
              placeholder="Min 6 belgi"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.passwordStrength}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.strengthBar,
                  background: form.password.length > i 
                    ? form.password.length >= 10 ? '#00ff88' 
                    : form.password.length >= 6 ? '#ffd600' 
                    : '#ff3b3b'
                    : 'var(--dark4)'
                }}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? '...' : t.signup}
          </button>

          <div style={styles.switchLink}>
            <span style={{color: 'var(--text-dim)'}}>{t.haveAccount} </span>
            <Link to="/login" style={styles.link}>{t.login}</Link>
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
  bgDecor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
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
  logoWrap: { textAlign: 'center' },
  logoIcon: { fontSize: '48px', marginBottom: '8px' },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '42px',
    fontWeight: '900',
    color: 'var(--green)',
    letterSpacing: '2px',
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
  passwordStrength: {
    display: 'flex',
    gap: '4px',
    marginTop: '-10px',
  },
  strengthBar: {
    flex: 1,
    height: '3px',
    borderRadius: '2px',
    transition: 'background 0.3s',
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

export default SignupPage;
