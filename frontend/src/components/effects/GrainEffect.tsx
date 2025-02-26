const GrainEffect = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 2000 2000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          filter: 'contrast(320%) brightness(100%)',
          mixBlendMode: 'normal',
          animation: 'grain 8s steps(10) infinite'
        }}
      />
      <style jsx>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0) }
          10% { transform: translate(-2%, -2%) }
          20% { transform: translate(1%, 1%) }
          30% { transform: translate(2%, -1%) }
          40% { transform: translate(-1%, 2%) }
          50% { transform: translate(1%, -2%) }
          60% { transform: translate(-2%, 1%) }
          70% { transform: translate(2%, 2%) }
          80% { transform: translate(-1%, -1%) }
          90% { transform: translate(1%, 2%) }
        }
      `}</style>
    </div>
  );
};

export default GrainEffect;
