import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const formatArea = (sqm) => {
  if (!sqm) return '0 m²';
  if (sqm >= 1000000) return `${(sqm/1000000).toFixed(2)} km²`;
  if (sqm >= 1000) return `${(sqm/1000).toFixed(1)} ha`;
  return `${Math.round(sqm)} m²`;
};

const formatDist = (m) => {
  if (!m) return '0 km';
  return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

const ProfilePage = () => {
  const { user, language, setLanguage, logout, updateUser, API } = useAuth();
  const t = translations[language];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bio: user?.bio || '',
    city: user?.city || '',
    region: user?.region || '',
    country: user?.country || '',
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'WU';

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/user/profile`, form);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profil yangilandi!');
    } catch (e) {
      toast.error('Xatolik yuz berdi');
    }
    setSaving(false);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await axios.post(`${API}/user/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatar: data.avatar });
      toast.success('Rasm yangilandi!');
    } catch (e) {
      toast.error('Rasm yuklanmadi');
    }
  };

  return (
    <div style={styles.page}>
      {/* Header bg */}
      <div style={styles.headerBg} />

      {/* Avatar section */}
      <div style={styles.avatarSection}>
        <div style={styles.avatarWrap}>
          {user?.avatar ? (
            <img src={`http://localhost:5000${user.avatar}`} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>{initials}</div>
          )}
          <button style={styles.avatarEdit} onClick={() => fileRef.current?.click()}>📷</button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar} />
        </div>
        <div style={styles.username}>@{user?.username}</div>
        <div style={styles.email}>{user?.email}</div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statValue}>{formatArea(user?.totalArea)}</div>
          <div style={styles.statLabel}>{t.totalArea}</div>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <div style={styles.statValue}>{user?.totalRuns || 0}</div>
          <div style={styles.statLabel}>{t.totalRuns}</div>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <div style={styles.statValue}>{formatDist(user?.totalDistance)}</div>
          <div style={styles.statLabel}>{t.totalDistance}</div>
        </div>
      </div>

      {/* Info / Edit */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div className="section-title" style={{marginBottom:0}}>{t.editProfile}</div>
          {!editing && (
            <button className="btn btn-outline" style={{padding:'6px 14px',fontSize:12}}
              onClick={() => setEditing(true)}>✏️ Edit</button>
          )}
        </div>

        {editing ? (
          <div style={styles.editForm}>
            <div className="input-group">
              <label className="input-label">{t.bio}</label>
              <textarea
                className="input"
                style={{resize:'vertical',minHeight:'80px',fontFamily:'var(--font-body)'}}
                placeholder="O'zingiz haqida yozing..."
                value={form.bio}
                onChange={e => setForm({...form, bio: e.target.value})}
                maxLength={200}
              />
            </div>
            <div className="input-group">
              <label className="input-label">{t.city}</label>
              <input className="input" placeholder="Toshkent" value={form.city}
                onChange={e => setForm({...form, city: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">{t.region}</label>
              <input className="input" placeholder="Toshkent viloyati" value={form.region}
                onChange={e => setForm({...form, region: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">{t.country}</label>
              <input className="input" placeholder="O'zbekiston" value={form.country}
                onChange={e => setForm({...form, country: e.target.value})} />
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-primary" style={{flex:1}}
                onClick={handleSave} disabled={saving}>
                {saving ? '...' : t.save}
              </button>
              <button className="btn btn-ghost" style={{flex:1}}
                onClick={() => setEditing(false)}>{t.cancel}</button>
            </div>
          </div>
        ) : (
          <div style={styles.infoList}>
            {user?.bio && (
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>💬</span>
                <span style={styles.infoText}>{user.bio}</span>
              </div>
            )}
            {user?.city && (
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>🏙️</span>
                <span style={styles.infoText}>{user.city}</span>
              </div>
            )}
            {user?.country && (
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>🌍</span>
                <span style={styles.infoText}>{user.country}</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoIcon}>📅</span>
              <span style={styles.infoText}>
                {new Date(user?.createdAt).toLocaleDateString()} dan beri a'zo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Language */}
      <div style={styles.section}>
        <div className="section-title">{t.language}</div>
        <div style={styles.langRow}>
          <button
            className={`btn ${language === 'uz' ? 'btn-primary' : 'btn-ghost'}`}
            style={{flex:1}}
            onClick={() => setLanguage('uz')}
          >🇺🇿 O'zbek</button>
          <button
            className={`btn ${language === 'en' ? 'btn-primary' : 'btn-ghost'}`}
            style={{flex:1}}
            onClick={() => setLanguage('en')}
          >🇬🇧 English</button>
        </div>
      </div>

      {/* Logout */}
      <div style={styles.section}>
        <button className="btn btn-danger btn-full" onClick={logout}>
          🚪 {t.logout}
        </button>
      </div>

      <div style={{height: '20px'}} />
    </div>
  );
};

const styles = {
  page: { background: 'var(--black)', minHeight: '100vh' },
  headerBg: {
    height: '120px',
    background: 'linear-gradient(135deg, #0d1f14 0%, #050f08 100%)',
    borderBottom: '1px solid rgba(0,255,136,0.1)',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '-60px',
    padding: '0 20px 24px',
  },
  avatarWrap: { position: 'relative', marginBottom: '12px' },
  avatar: {
    width: 100, height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--green)',
  },
  avatarPlaceholder: {
    width: 100, height: 100,
    borderRadius: '50%',
    background: 'var(--dark3)',
    border: '3px solid var(--green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '900',
    fontSize: '32px',
    color: 'var(--green)',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 30, height: 30,
    borderRadius: '50%',
    background: 'var(--dark4)',
    border: '2px solid var(--border)',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    fontWeight: '900',
    color: 'var(--text)',
    marginBottom: '4px',
  },
  email: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  statsRow: {
    display: 'flex',
    margin: '0 16px 16px',
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  },
  statBox: { flex: 1, textAlign: 'center' },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: '900',
    color: 'var(--green)',
    marginBottom: '4px',
  },
  statLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
  },
  statDivider: {
    width: 1,
    background: 'var(--border)',
    margin: '0 8px',
  },
  section: {
    padding: '0 16px 20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  infoIcon: { fontSize: '18px', flexShrink: 0 },
  infoText: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: 1.5,
  },
  langRow: {
    display: 'flex',
    gap: '10px',
  }
};

export default ProfilePage;
