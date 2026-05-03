import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

const PERIODS = ['weekly', 'monthly', 'yearly', 'all'];

const formatArea = (sqm) => {
  if (!sqm) return '0 m²';
  if (sqm >= 1000000) return `${(sqm/1000000).toFixed(2)} km²`;
  if (sqm >= 1000) return `${(sqm/1000).toFixed(1)} ha`;
  return `${Math.round(sqm)} m²`;
};

const RankBadge = ({ rank }) => {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div style={{
      width: 36, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: medals[rank] ? '22px' : '14px',
      fontWeight: '900',
      color: rank <= 3 ? 'var(--yellow)' : 'var(--text-dim)',
      flexShrink: 0,
    }}>
      {medals[rank] || `#${rank}`}
    </div>
  );
};

const LeaderboardPage = () => {
  const { user, language, API } = useAuth();
  const t = translations[language];
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(false);

  const periodLabels = {
    weekly: t.weekly,
    monthly: t.monthly,
    yearly: t.yearly,
    all: t.allTime
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: res } = await axios.get(`${API}/leaderboard?period=${period}`);
        setData(res.leaderboard || []);
        setMyRank(res.myRank);
      } catch (e) {}
      setLoading(false);
    };
    fetch();
  }, [period, API]);

  const Avatar = ({ u, size = 40 }) => {
    const initials = u?.username?.slice(0, 2).toUpperCase() || '?';
    return u?.avatar ? (
      <img src={`http://localhost:5000${u.avatar}`} alt=""
        style={{width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0}} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--dark3)', border: '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: '900',
        fontSize: size * 0.35 + 'px', color: 'var(--text-dim)', flexShrink: 0
      }}>{initials}</div>
    );
  };

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>🏆 {t.leaderboard}</div>
        {myRank && (
          <div className="badge badge-green">
            {t.yourRank}: #{myRank}
          </div>
        )}
      </div>

      {/* Period tabs */}
      <div style={styles.tabs}>
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              ...styles.tab,
              ...(period === p ? styles.tabActive : {})
            }}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>⏳ Yuklanmoqda...</div>
      ) : data.length === 0 ? (
        <div style={styles.empty}>
          <div style={{fontSize: 48, marginBottom: 12}}>🏆</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-dim)'}}>
            Hali kimda-kim reytingda yo'q. Birinchi bo'ling!
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 1 && (
            <div style={styles.podium}>
              {/* 2nd */}
              {top3[1] && (
                <div style={styles.podiumItem}>
                  <Avatar u={top3[1]} size={52} />
                  <div style={styles.podiumMedal}>🥈</div>
                  <div style={styles.podiumName}>@{top3[1].username}</div>
                  <div style={styles.podiumArea}>{formatArea(top3[1].area)}</div>
                  <div style={{...styles.podiumBar, height: 60, background:'#aaa'}} />
                </div>
              )}
              {/* 1st */}
              <div style={styles.podiumItem}>
                <Avatar u={top3[0]} size={64} />
                <div style={styles.podiumMedal}>🥇</div>
                <div style={{...styles.podiumName, color:'var(--yellow)'}}>@{top3[0].username}</div>
                <div style={{...styles.podiumArea, color:'var(--yellow)'}}>{formatArea(top3[0].area)}</div>
                <div style={{...styles.podiumBar, height: 80, background:'var(--yellow)'}} />
              </div>
              {/* 3rd */}
              {top3[2] && (
                <div style={styles.podiumItem}>
                  <Avatar u={top3[2]} size={44} />
                  <div style={styles.podiumMedal}>🥉</div>
                  <div style={styles.podiumName}>@{top3[2].username}</div>
                  <div style={styles.podiumArea}>{formatArea(top3[2].area)}</div>
                  <div style={{...styles.podiumBar, height: 44, background:'#cd7f32'}} />
                </div>
              )}
            </div>
          )}

          {/* Rest of list */}
          <div style={styles.list}>
            {rest.map(item => {
              const isMe = item.id === user?.id || item.id === user?._id;
              return (
                <div key={item.id} style={{
                  ...styles.listItem,
                  ...(isMe ? styles.listItemMe : {})
                }}>
                  <RankBadge rank={item.rank} />
                  <Avatar u={item} size={40} />
                  <div style={styles.listInfo}>
                    <div style={styles.listName}>
                      @{item.username}
                      {isMe && <span style={styles.youBadge}> YOU</span>}
                    </div>
                    <div style={styles.listMeta}>{item.city} · {item.totalRuns} yugurish</div>
                  </div>
                  <div style={styles.listArea}>{formatArea(item.area)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  page: { background: 'var(--black)', minHeight: '100vh', paddingBottom: '20px' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 20px 16px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--text)',
  },
  tabs: {
    display: 'flex',
    padding: '0 16px',
    gap: '8px',
    marginBottom: '16px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '40px',
    border: '1px solid var(--border)',
    background: 'var(--dark2)',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'var(--green)',
    color: 'var(--black)',
    borderColor: 'var(--green)',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  podium: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px 20px 0',
    marginBottom: '8px',
  },
  podiumItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
  },
  podiumMedal: { fontSize: '28px' },
  podiumName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text)',
    textAlign: 'center',
  },
  podiumArea: {
    fontFamily: 'var(--font-display)',
    fontSize: '13px',
    fontWeight: '900',
    color: 'var(--green)',
  },
  podiumBar: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    opacity: 0.4,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 16px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--dark2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
  },
  listItemMe: {
    borderColor: 'rgba(0,255,136,0.4)',
    background: 'rgba(0,255,136,0.05)',
  },
  listInfo: { flex: 1, minWidth: 0 },
  listName: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-dim)',
    marginTop: '2px',
  },
  listArea: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--green)',
    flexShrink: 0,
  },
  youBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--green)',
    fontWeight: '700',
  }
};

export default LeaderboardPage;
