import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const EMOJIS = ['🎭','👁','🗡','🕯','🩸','⚰️','🔮','💀'];

export default function WaitingRoom({ game, isHost, genre, onStart, socketId }) {
  const [addBots, setAddBots] = useState(true);

  const copy = () => navigator.clipboard.writeText(game.episodeId);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative' }}>
      <div className="atmos" />

      <div style={{ width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>

        {/* Code */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:32 }}>
          <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.2em', fontWeight:700, marginBottom:10 }}>EPISODE CODE</p>
          <motion.div whileTap={{ scale:0.96 }} onClick={copy} style={{ cursor:'pointer', display:'inline-block' }}>
            <div style={{
              fontFamily:'var(--serif)', fontSize:40, fontWeight:700, letterSpacing:'0.25em', color:'#C9A84C',
              padding:'10px 28px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:16,
            }}>{game.episodeId}</div>
          </motion.div>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:8, fontStyle:'italic' }}>tap to copy · share with friends</p>
        </motion.div>

        {/* Players */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}
          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, padding:'18px 20px', marginBottom:14 }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.18em', fontWeight:700 }}>
              CAST · {game.players.length}/8
            </p>
            <span className="pulse" style={{ fontSize:9, color:'rgba(139,0,0,0.8)', fontWeight:700 }}>● WAITING</span>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <AnimatePresence>
              {game.players.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }}
                  transition={{ delay: i*0.06 }}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12,
                    background: p.id===socketId ? 'rgba(139,0,0,0.08)' : 'rgba(255,255,255,0.03)',
                    border: p.id===socketId ? '1px solid rgba(139,0,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize:20 }}>{EMOJIS[i%EMOJIS.length]}</span>
                  <span style={{ flex:1, fontWeight:500, fontSize:14 }}>{p.name}</span>
                  {p.id===socketId && <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>you</span>}
                  {p.walletAddress && <span style={{ fontSize:10, color:'rgba(74,150,74,0.8)' }}>◎</span>}
                </motion.div>
              ))}
            </AnimatePresence>

            {game.players.length < 2 && (
              <p style={{ textAlign:'center', fontFamily:'var(--serif)', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.2)', padding:'10px 0' }}>
                Waiting for more players...
              </p>
            )}
          </div>
        </motion.div>

        {/* Host controls */}
        {isHost && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'16px 20px' }}
          >
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom:16 }}>
              <input type="checkbox" checked={addBots} onChange={e=>setAddBots(e.target.checked)}
                style={{ width:'auto', accentColor:'#8B0000' }} />
              <span style={{ fontSize:13 }}>Fill with AI players</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,0.25)', fontStyle:'italic' }}>recommended</span>
            </label>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => onStart({ genre, addBots })}
              style={{
                width:'100%', padding:'14px', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
                background:'linear-gradient(135deg,#8B0000,#5C0000)', border:'1px solid rgba(139,0,0,0.6)', color:'#fff',
              }}
            >
              Begin the Episode
            </motion.button>
          </motion.div>
        )}

        {!isHost && (
          <p style={{ textAlign:'center', fontFamily:'var(--serif)', fontStyle:'italic', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
            Waiting for the host to begin...
          </p>
        )}
      </div>
    </div>
  );
}
