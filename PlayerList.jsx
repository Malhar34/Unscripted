import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NarratorBar from '../components/NarratorBar';

const EMOJIS = ['🎭','👁','🗡','🕯','🩸','⚰️','🔮','💀'];

export default function ResolutionScreen({ game, socketId, myRole }) {
  const [showRoles, setShowRoles] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowRoles(true), 3500); return () => clearTimeout(t); }, []);

  const winner = game.players.find(p => p.name === game.winner);
  const isWinner = winner?.id === socketId;

  return (
    <div style={{ minHeight:'100vh', position:'relative', paddingBottom:60 }}>
      <div className="atmos" />

      {/* Top */}
      <div style={{ padding:'52px 20px 20px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <p style={{ color:'#8B0000', fontSize:9, letterSpacing:'0.22em', fontWeight:700, marginBottom:8 }}>EPISODE COMPLETE</p>
        <h1 style={{ fontFamily:'var(--serif)', fontSize:30, fontWeight:800, color:'#fff', marginBottom:6 }}>{game.theme}</h1>
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(139,0,0,0.5),transparent)', maxWidth:200, margin:'0 auto' }} />
      </div>

      <div style={{ padding:'24px 20px', maxWidth:600, margin:'0 auto', position:'relative', zIndex:1 }}>

        <NarratorBar text={game.currentPlotReveal} audioUrl={game.currentAudioUrl} />

        {/* Winner */}
        {winner && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3 }}
            style={{
              textAlign:'center', padding:'28px 24px', borderRadius:20, marginBottom:24,
              background: isWinner ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)',
              border: isWinner ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.2em', fontWeight:700, marginBottom:14 }}>THE WINNER</p>
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring', stiffness:200, damping:14 }}
              style={{ fontSize:52, marginBottom:12 }}>
              {EMOJIS[game.players.indexOf(winner) % EMOJIS.length]}
            </motion.div>
            <h2 style={{ fontFamily:'var(--serif)', fontSize:28, fontWeight:800, color: isWinner ? '#C9A84C' : '#fff', marginBottom:8 }}>
              {winner.name}
            </h2>
            <span className={`role-badge role-${winner.role}`} style={{ marginBottom:16, display:'inline-block' }}>
              {winner.role?.replace('_',' ')}
            </span>
            {isWinner && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}>
                <p style={{ color:'rgba(74,150,74,0.9)', fontWeight:600, marginBottom:6 }}>You won this episode.</p>
                {game.rewardTxSignature ? (
                  <div>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>◎ 0.01 SOL sent to your wallet</p>
                    <a href={`https://explorer.solana.com/tx/${game.rewardTxSignature}?cluster=devnet`}
                      target="_blank" rel="noreferrer"
                      style={{ color:'#C9A84C', fontSize:12, textDecoration:'underline', textDecorationStyle:'dotted' }}>
                      View on Solana Explorer →
                    </a>
                  </div>
                ) : (
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', fontStyle:'italic' }}>
                    Connect a wallet next time to earn SOL rewards
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Phase recap */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'18px 20px', marginBottom:20 }}>
          <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.18em', fontWeight:700, marginBottom:16 }}>EPISODE RECAP</p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {game.phaseHistory.map((phase, i) => (
              <motion.div key={phase.phase} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.4 + i*0.12 }}
                style={{ paddingLeft:14, borderLeft:'2px solid rgba(139,0,0,0.35)' }}
              >
                <p style={{ fontSize:9, color:'rgba(139,0,0,0.8)', letterSpacing:'0.15em', fontWeight:700, marginBottom:4 }}>ACT {phase.phase}</p>
                <p style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>
                  {phase.plotReveal}
                </p>
                {phase.eliminated && (
                  <p style={{ fontSize:11, color:'rgba(139,0,0,0.7)', marginTop:6 }}>✗ {phase.eliminated} was eliminated.</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Role reveal */}
        <AnimatePresence>
          {showRoles && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'18px 20px', marginBottom:28 }}
            >
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.18em', fontWeight:700, marginBottom:14 }}>TRUE IDENTITIES</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {game.players.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.08 }}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12,
                      background:'rgba(255,255,255,0.02)', opacity: p.isEliminated ? 0.45 : 1,
                    }}
                  >
                    <span style={{ fontSize:20 }}>{EMOJIS[i%EMOJIS.length]}</span>
                    <span style={{ flex:1, fontWeight:500, fontSize:14, textDecoration: p.isEliminated ? 'line-through' : 'none', color: p.isEliminated ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                      {p.name}
                    </span>
                    <span className={`role-badge role-${p.role}`}>{p.role?.replace('_',' ')}</span>
                    {p.name === game.winner && <span style={{ fontSize:12 }}>🏆</span>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
          whileTap={{ scale:0.97 }} onClick={() => window.location.reload()}
          style={{
            width:'100%', padding:'15px', borderRadius:16, fontSize:16, fontWeight:700, cursor:'pointer',
            background:'linear-gradient(135deg,#C9A84C,#A07030)', border:'1px solid rgba(201,168,76,0.4)', color:'#000',
          }}
        >
          Play Again
        </motion.button>
      </div>
    </div>
  );
}
