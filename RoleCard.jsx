import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const GENRES = [
  { value:'murder_mystery',       label:'Murder Mystery',       icon:'🗡' },
  { value:'political_scandal',    label:'Political Scandal',    icon:'🏛' },
  { value:'heist',                label:'Heist',                icon:'💎' },
  { value:'romance_betrayal',     label:'Romance Betrayal',     icon:'🥀' },
  { value:'corporate_espionage',  label:'Corporate Espionage',  icon:'🕴' },
  { value:'supernatural_thriller',label:'Supernatural Thriller',icon:'👁' },
];

export default function LobbyScreen({ onJoin }) {
  const [mode, setMode]       = useState(null);
  const [name, setName]       = useState('');
  const [code, setCode]       = useState('');
  const [genre, setGenre]     = useState('murder_mystery');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const createGame = async () => {
    if (!name.trim()) return setError('Enter a name to continue.');
    setLoading(true); setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/games`, { method:'POST' });
      const { episodeId } = await res.json();
      onJoin({ episodeId, playerName: name.trim(), genre, isHost: true });
    } catch { setError('Could not reach server. Is it running?'); }
    setLoading(false);
  };

  const joinGame = () => {
    if (!name.trim()) return setError('Enter a name to continue.');
    if (!code.trim()) return setError('Enter a game code.');
    onJoin({ episodeId: code.trim().toUpperCase(), playerName: name.trim(), genre, isHost: false });
  };

  const btn = (label, onClick, ghost) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width:'100%', padding:'14px', borderRadius:14, fontSize:15, fontWeight:700,
        background: ghost ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#8B0000,#5C0000)',
        border: ghost ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(139,0,0,0.6)',
        color: ghost ? 'rgba(255,255,255,0.6)' : '#fff',
        cursor:'pointer', transition:'opacity 0.2s',
      }}
    >{label}</motion.button>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative' }}>
      <div className="atmos" />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }}>
        {/* Title */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:44 }}>
          <p style={{ color:'#8B0000', fontSize:10, letterSpacing:'0.25em', fontWeight:700, marginBottom:10 }}>AN INTERACTIVE DRAMA</p>
          <h1 style={{ fontFamily:'var(--serif)', fontSize:52, fontWeight:800, color:'#ffffff', lineHeight:1, marginBottom:10 }}>Episodes</h1>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(139,0,0,0.6),transparent)', margin:'0 auto', maxWidth:120 }} />
          <p style={{ fontFamily:'var(--serif)', fontSize:13, fontStyle:'italic', color:'rgba(255,255,255,0.35)', marginTop:10 }}>
            AI-generated social deduction drama.<br/>Every match is a new story.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div key="home" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:'flex', flexDirection:'column', gap:10 }}
            >
              {btn('Create New Episode', () => setMode('create'))}
              {btn('Join with Code', () => setMode('join'), true)}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={() => onJoin({ episodeId:null, demo:true, playerName:'Guest', genre:'murder_mystery', isHost:true })}
                style={{ background:'none', border:'none', color:'rgba(201,168,76,0.6)', fontSize:12, fontFamily:'var(--serif)', fontStyle:'italic', marginTop:8, cursor:'pointer', textDecoration:'underline', textDecorationStyle:'dotted' }}
              >
                Try demo mode (solo)
              </motion.button>
            </motion.div>
          )}

          {mode && (
            <motion.div key="form" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'24px 22px', display:'flex', flexDirection:'column', gap:16 }}
            >
              <div>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', fontWeight:700, marginBottom:8 }}>YOUR NAME</p>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter character name..."
                  autoFocus maxLength={20} onKeyDown={e=>e.key==='Enter'&&(mode==='create'?createGame():joinGame())} />
              </div>

              {mode === 'join' && (
                <div>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', fontWeight:700, marginBottom:8 }}>GAME CODE</p>
                  <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="XXXXXX"
                    maxLength={6} style={{ letterSpacing:'0.2em', fontSize:20, textAlign:'center' }} />
                </div>
              )}

              {mode === 'create' && (
                <div>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', fontWeight:700, marginBottom:10 }}>EPISODE GENRE</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {GENRES.map(g => (
                      <motion.button key={g.value} whileTap={{ scale:0.96 }} onClick={() => setGenre(g.value)}
                        style={{
                          padding:'10px 8px', borderRadius:12, fontSize:12, fontWeight:600, cursor:'pointer',
                          background: genre===g.value ? 'rgba(139,0,0,0.2)' : 'rgba(255,255,255,0.03)',
                          border: genre===g.value ? '1px solid rgba(139,0,0,0.5)' : '1px solid rgba(255,255,255,0.07)',
                          color: genre===g.value ? '#fff' : 'rgba(255,255,255,0.5)',
                          transition:'all 0.15s',
                        }}
                      >
                        <span style={{ display:'block', fontSize:18, marginBottom:4 }}>{g.icon}</span>
                        {g.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p style={{ color:'#cc4444', fontSize:12, textAlign:'center' }}>{error}</p>}

              <div style={{ display:'flex', gap:10 }}>
                <motion.button whileTap={{ scale:0.97 }} onClick={() => { setMode(null); setError(''); }}
                  style={{ flex:'0 0 80px', padding:'12px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer' }}>
                  Back
                </motion.button>
                <motion.button whileTap={{ scale:0.97 }} onClick={mode==='create'?createGame:joinGame} disabled={loading}
                  style={{ flex:1, padding:'12px', borderRadius:12, background:'linear-gradient(135deg,#8B0000,#5C0000)', border:'1px solid rgba(139,0,0,0.6)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  {loading ? 'Creating...' : mode==='create' ? 'Create Lobby' : 'Join Episode'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
