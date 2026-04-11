import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LINES = [
  'Consulting the writers room...',
  'Assigning secret roles...',
  'Setting the stage...',
  'Briefing the cast...',
  'Preparing the first act...',
  'The curtain rises soon...',
];

export default function GeneratingScreen({ theme }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % LINES.length), 1900);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:24, position:'relative' }}>
      <div className="atmos" />

      <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
        {/* Spinning ring */}
        <div style={{
          width:64, height:64, borderRadius:'50%',
          border:'1.5px solid rgba(139,0,0,0.2)',
          borderTopColor:'#8B0000',
          animation:'spin 1.2s linear infinite',
          margin:'0 auto 32px',
        }} />

        <motion.h2
          key={theme}
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ fontFamily:'var(--serif)', fontSize:28, fontWeight:700, color:'#fff', marginBottom:10 }}
        >
          {theme || 'Generating Episode...'}
        </motion.h2>

        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            transition={{ duration:0.3 }}
            style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, color:'rgba(255,255,255,0.35)' }}
          >
            {LINES[idx]}
          </motion.p>
        </AnimatePresence>

        <p style={{ fontSize:11, color:'rgba(255,255,255,0.15)', marginTop:24 }}>5–10 seconds</p>
      </div>
    </div>
  );
}
