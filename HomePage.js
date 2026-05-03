import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const formatArea = (sqm) => {
  if (sqm >= 1000000) return `${(sqm / 1000000).toFixed(2)} km²`;
  if (sqm >= 1000) return `${(sqm / 1000).toFixed(1)} ha`;
  return `${Math.round(sqm)} m²`;
};

const formatDist = (m) => {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
};

const getGreeting = (t) => {
  const h = new Date().getHours();
  if (h < 12) return `${t.greeting} ${t.morning}`;
  if (h < 18) return `${t.greeting} ${t.afternoon}`;
  return `${t.greeting} ${t.evening}`;
};

const newsItems = [
  { id: 1, emoji: '🏆', title: 'Haftalik sovrinlar', desc: 'Eng ko\'p hudud egallaganlar uchun maxsus sovrinlar!', tag: 'Yangilik' },
  { id: 2, emoji: '🤝', title: 'Yangi hamkorlar', desc: 'Toshkent markazi restoranlar bilan hamkorlik boshlandi', tag: 'Hamkor' },
  { id: 3, emoji: '🗺️', title: 'Xarita yangilandi', desc: 'Yangi hududlar uchun nom berish imkoniyati qo\'shildi', tag: 'Update' },
  { id: 4, emoji: '🎯', title: 'Challenge', desc: 'Bu oy eng ko\'p km yugurgan odam iPhone 15 yutib oladi!', tag: 'Challenge' },
];

const HomePage = () => {
  const { user, language, API } = useAuth();
  const t = translations[language];
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const { data } = await axios.get(`${API}/user/me`);
        setRuns(data.runs || []);
      } catch (e) {}
    };
    fetchRuns();
  }, [API]);

  const Avatar = () => {
    const initials = user?.username?.slice(0, 2).toUpperCase() || 'WU';
    return user?.avatar ? (
      <img src={`http://localhost:5000${user.avatar}`} alt="avatar"
        style={{...styles.avatar, objectFit: 'cover'}} />
    ) : (
      <div style={styles.avatarPlaceholder}>{initials}</div>
    );
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.greeting}>{getGreeting(t)} 👋</div>
          <div style={styles.username}>@{user?.username}</div>
        </div>
        <Avatar />
      </div>

      {/* Big stat */}
      <div style={styles.heroCard}>
        <div style={styles.heroLabel}>
          {language === 'uz' ? 'Jami Hududingiz' : 'Total Territory'}
        </div>
        <div style={styles.heroValue}>{formatArea(user?.totalArea || 0)}</div>
        <div style={styles.heroSub}>
          🏃 {user?.totalRuns || 0} {t.runsCompleted} · 📍 {formatDist(user?.totalDistance || 0)}
        </div>
        <button 
          className="btn btn-primary"
          style={{marginTop: '16px', width: '100%'}}
          onClick={() => navigate('/map')}
        >
          🚀 {t.startRun}
        </button>
      </div>

      {/* Stats grid */}
      <div style={styles.section}>
        <div className="section-title">{t.yourStats}</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{formatArea(user?.weeklyArea || 0)}</div>
            <div className="stat-label">{t.weeklyStats}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user?.totalRuns || 0}</div>
            <div className="stat-label">{t.totalRuns}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatDist(user?.totalDistance || 0)}</div>
            <div className="stat-label">{t.totalDistance}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{color: '#ffd600'}}>
              #{Math.floor(Math.random() * 50) + 1}
            </div>
            <div className="stat-label">{t.leaderboard}</div>
          </div>
        </div>
      </div>

      {/* Recent runs */}
      {runs.length > 0 && (
        <div style={styles.section}>
          <div className="section-title">{t.recentActivity}</div>
          <div style={styles.runsList}>
            {runs.slice(0, 5).map(run => (
              <div key={run._id} style={styles.runItem}>
                <div style={styles.runIcon}>🏃</div>
                <div style={styles.runInfo}>
                  <div style={styles.runDist}>{formatDist(run.distance)}</div>
                  <div style={styles.runMeta}>
                    {Math.round(run.duration / 60)} min · {new Date(run.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {run.area > 0 && (
                  <div className="badge badge-green">+{formatArea(run.area)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News */}
      <div style={styles.section}>
        <div className="section-title">{t.news}</div>
        <div style={styles.newsList}>
          {newsItems.map(item => (
            <div key={item.id} style={styles.newsCard}>
              <div style={styles.newsEmoji}>{item.emoji}</div>
              <div style={styles.newsContent}>
                <div style={styles.newsTitle}>{item.title}</div>
                <div style={styles.newsDesc}>{item.desc}</div>
              </div>
              <div className="badge badge-green" style={{flexShrink:0}}>{item.tag}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{height: '20px'}} />
    </div>
  );
};

const styles = {
  page: { background: 'var(--black)', minHeight: '100vh' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 20px 8px',
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-dim)',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  username: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    fontWeight: '900',
    color: 'var(--text)',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--dark3)',
    border: '2px solid var(--green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '900',
    fontSize: '16px',
    color: 'var(--green)',
  },
  heroCard: {
    margin: '16px 20px',
    background: 'linear-gradient(135deg, #0d1f14 0%, #0a1a10 100%)',
    border: '1px solid rgba(0,255,136,0.2)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--green)',
    marginBottom: '8px',
  },
  heroValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '42px',
    fontWeight: '900',
    color: 'var(--green)',
    lineHeight: 1,
    marginBottom: '8px',
    textShadow: '0 0 30px rgba(0,255,136,0.4)',
  },
  heroSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  section: { padding: '8px 20px 16px' },
  runsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  runItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
  },
  runIcon: { fontSize: '24px' },
  runInfo: { flex: 1 },
  runDist: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text)',
  },
  runMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-dim)',
    marginTop: '2px',
  },
  newsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  newsCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px 16px',
  },
  newsEmoji: { fontSize: '28px', flexShrink: 0 },
  newsContent: { flex: 1, minWidth: 0 },
  newsTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '2px',
  },
  newsDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--text-dim)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
};

export default HomePage;
