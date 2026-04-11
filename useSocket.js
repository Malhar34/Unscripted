import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import NarratorBar from '../components/NarratorBar';
import PlayerList from '../components/PlayerList';

export default function IntroScreen({ game, socketId, myRole }) {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const t = setInterval(() => setCountdown(n => Math.max(0, n-1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight:'100vh', padding:'0 0 40px', position:'relative' }}>
      <div className="atmos" />

      {/* Top bar */}
      <div style={{ padding:'52px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          style={{ color:'#8B0000', fontSize:9, letterSpacing:'0.22em', fontWeight:700, marginBottom:6 }}>
          {game.genre?.replace('_',' ').toUpperCase() || 'DRAMA'}
        </motion.p>
        <motion.h1 initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          style={{ fontFamily:'var(--serif)', fontSize:26, fontWeight:800, color:'#fff', marginBottom:4 }}>
          {game.theme}
        </motion.h1>
        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.4)' }}>
          {game.setting}
        </motion.p>
      </div>

      <div style={{ padding:'20px', maxWidth:680, margin:'0 auto', position:'relative', zIndex:1 }}>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}>
          <NarratorBar text={game.narratorIntro} audioUrl={game.narratorAudioUrl} />
        </motion.div>

        {myRole && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.2 }}
            style={{ background:'rgba(139,0,0,0.07)', border:'1px solid rgba(139,0,0,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}
          >
            <span className={`role-badge role-${myRole.role}`}>{myRole.role.replace('_',' ')}</span>
            <p style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.55)' }}>{myRole.motivation}</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }} style={{ marginBottom:24 }}>
          <PlayerList players={game.players} socketId={socketId} compact />
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.8 }} style={{ textAlign:'center' }}>
          <p style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, color:'rgba(255,255,255,0.35)', marginBottom:10 }}>
            {countdown > 0 ? `Act I begins in ${countdown}...` : 'Starting...'}
          </p>
          <div style={{ height:2, background:'rgba(255,255,255,0.05)', borderRadius:2, maxWidth:160, margin:'0 auto', overflow:'hidden' }}>
            <motion.div style={{ height:'100%', background:'rgba(139,0,0,0.7)', borderRadius:2 }}
              animate={{ width:`${((8-countdown)/8)*100}%` }} transition={{ duration:0.8 }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
