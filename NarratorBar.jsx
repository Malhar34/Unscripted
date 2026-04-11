import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

const VOTE_SECS = 30;
const EMOJIS = ['🎭','👁','🗡','🕯','🩸','⚰️','🔮','💀'];

export default function VoteScreen({ game, socketId, onCastVote, onForceResolve, isHost }) {
  const [timeLeft, setTimeLeft] = useState(VOTE_SECS);
  const [myVote,   setMyVote]   = useState(null);

  const me = game.players.find(p => p.id === socketId);
  const active = game.players.filter(p => !p.isEliminated);
  const votedCount = active.filter(p => game.votes?.[p.id] !== undefined).length;
  const hasVoted = !!game.votes?.[socketId];

  useEffect(() => {
    setTimeLeft(VOTE_SECS);
    const t = setInterval(() => setTimeLeft(n => Math.max(0, n-1)), 1000);
    return () => clearInterval(t);
  }, []);

  const castVote = (targetId) => {
    if (hasVoted || myVote || me?.isEliminated) return;
    setMyVote(targetId);
    onCastVote(targetId);
  };

  const timerColor = timeLeft > 15 ? '#C9A84C' : timeLeft > 5 ? '#ff8833' : '#ff3333';
  const voteTarget = myVote || game.votes?.[socketId];
  const maxVotes = Math.max(...Object.values(game.votes || {}).reduce((acc, v) => { acc[v]=(acc[v]||0)+1; return acc; }, {}), 1) || 1;

  // tally: { playerId: count }
  const tally = Object.values(game.votes || {}).reduce((acc, v) => { acc[v]=(acc[v]||0)+1; return acc; }, {});

  return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      <div className="atmos" />

      {/* Top bar */}
      <div style={{ padding:'52px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#8B0000', fontSize:9, letterSpacing:'0.22em', fontWeight:700, marginBottom:4 }}>▸ ACCUSATION VOTE</p>
            <h2 style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:700, color:'#fff' }}>Who do you accuse?</h2>
          </div>
          <motion.div
            animate={timeLeft <= 10 ? { scale:[1,1.1,1] } : {}}
            transition={{ duration:0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:12, background:'rgba(139,0,0,0.12)', border:'1px solid rgba(139,0,0,0.3)' }}
          >
            <Clock size={12} color="#8B0000" />
            <span style={{ color:timerColor, fontSize:18, fontWeight:700, fontVariantNumeric:'tabular-nums', transition:'color 0.3s' }}>{timeLeft}s</span>
          </motion.div>
        </div>
        {/* timer bar */}
        <div style={{ height:2, background:'rgba(255,255,255,0.05)', borderRadius:2, marginTop:14, overflow:'hidden' }}>
          <motion.div style={{ height:'100%', borderRadius:2, background:'rgba(139,0,0,0.8)' }}
            animate={{ width:`${(timeLeft/VOTE_SECS)*100}%` }} transition={{ duration:1, ease:'linear' }} />
        </div>
      </div>

      <div style={{ padding:'20px', maxWidth:680, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:20 }}>
          <div>
            {/* Live vote tally */}
            <AnimatePresence>
              {Object.keys(tally).length > 0 && (
                <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'14px 16px', marginBottom:18 }}
                >
                  <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', fontWeight:700, marginBottom:12 }}>LIVE ACCUSATIONS</p>
                  {Object.entries(tally).sort(([,a],[,b])=>b-a).map(([id, count]) => {
                    const p = game.players.find(pl => pl.id === id);
                    return (
                      <div key={id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:16 }}>{EMOJIS[game.players.indexOf(p) % EMOJIS.length]}</span>
                        <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)', width:80 }}>{p?.name}</span>
                        <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${(count/Math.max(...Object.values(tally)))*100}%` }}
                            style={{ height:'100%', background:'rgba(139,0,0,0.7)', borderRadius:2 }} />
                        </div>
                        <span style={{ color:'#C9A84C', fontSize:15, fontWeight:700, minWidth:16, textAlign:'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accusation targets */}
            {!me?.isEliminated && !hasVoted && !myVote && (
              <div>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', fontWeight:700, marginBottom:12 }}>POINT YOUR FINGER</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {active.filter(p => p.id !== socketId).map((p, i) => {
                    const vc = tally[p.id] || 0;
                    return (
                      <motion.button key={p.id}
                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.07 }}
                        whileTap={{ scale:0.97 }} onClick={() => castVote(p.id)}
                        style={{
                          textAlign:'left', display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                          borderRadius:14, cursor:'pointer',
                          background: myVote===p.id ? 'rgba(139,0,0,0.12)' : 'rgba(255,255,255,0.03)',
                          border: myVote===p.id ? '1.5px solid rgba(139,0,0,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                          transition:'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize:22, flexShrink:0 }}>{EMOJIS[game.players.indexOf(p) % EMOJIS.length]}</span>
                        <span style={{ flex:1, fontSize:15, fontWeight:500 }}>{p.name}</span>
                        {vc > 0 && (
                          <span style={{ fontSize:12, fontWeight:700, color:'#8B0000', background:'rgba(139,0,0,0.12)', padding:'2px 8px', borderRadius:6 }}>
                            {vc} accused
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {(hasVoted || myVote) && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ textAlign:'center', padding:'24px 0' }}
              >
                <p style={{ color:'#C9A84C', fontFamily:'var(--serif)', fontStyle:'italic', fontSize:15, marginBottom:6 }}>
                  You accused {game.players.find(p => p.id === voteTarget)?.name}.
                </p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13 }}>
                  {votedCount}/{active.length} have voted.
                </p>
                {isHost && (
                  <button onClick={onForceResolve}
                    style={{ marginTop:16, fontSize:12, color:'rgba(139,0,0,0.7)', background:'none', border:'1px solid rgba(139,0,0,0.2)', padding:'6px 16px', borderRadius:8, cursor:'pointer' }}>
                    Force resolve
                  </button>
                )}
              </motion.div>
            )}

            {me?.isEliminated && (
              <p style={{ textAlign:'center', fontFamily:'var(--serif)', fontStyle:'italic', color:'rgba(255,255,255,0.2)', paddingTop:20 }}>
                The dead cannot vote.
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', fontWeight:700, marginBottom:10 }}>
              {votedCount}/{active.length} VOTED
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {active.map((p, i) => (
                <div key={p.id} style={{
                  display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10,
                  background: game.votes?.[p.id] ? 'rgba(139,0,0,0.06)' : 'rgba(255,255,255,0.02)',
                  border:'1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize:16 }}>{EMOJIS[game.players.indexOf(p)%EMOJIS.length]}</span>
                  <span style={{ fontSize:12, flex:1, color:'rgba(255,255,255,0.6)' }}>{p.name}</span>
                  {game.votes?.[p.id] && <span style={{ fontSize:9, color:'#8B0000', fontWeight:700 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
