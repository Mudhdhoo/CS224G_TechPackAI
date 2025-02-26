import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";

const AnimatedDocument = () => {
  const pathControls = useAnimationControls();

  useEffect(() => {
    const animate = async () => {
      await pathControls.start({
        pathLength: 1,
        transition: { duration: 2, ease: "easeInOut" }
      });
    };
    animate();
  }, [pathControls]);

  return (
    <div className="relative w-full h-full flex items-center justify-center mt-20">
      {/* Background glow effect */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* Main document container */}
      <motion.div
        className="relative z-10 w-[500px] h-[600px] rounded-xl bg-white shadow-2xl overflow-hidden"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Document header */}
        <div className="h-14 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="text-sm text-gray-500">Tech Pack Preview</div>
        </div>

        {/* Animated document content */}
        <div className="p-6 relative h-[calc(100%-3.5rem)] flex items-center justify-center">
          <svg
            viewBox="0 0 400 500"
            className="w-full h-full"
            style={{ maxHeight: "500px" }}
          >
            {/* T-shirt outline */}
            <motion.path
              d="M200,100 
                 L160,120 
                 Q120,130 100,180
                 L80,250
                 L120,270
                 L130,200
                 Q140,170 160,160
                 L200,150
                 L240,160
                 Q260,170 270,200
                 L280,270
                 L320,250
                 L300,180
                 Q280,130 240,120
                 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={pathControls}
            />
            
            {/* Measurements and annotations */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              {/* Shoulder width */}
              <line x1="160" y1="120" x2="240" y2="120" stroke="#4F46E5" strokeWidth="1" strokeDasharray="5,5" />
              <text x="185" y="115" fontSize="12" fill="#4F46E5">18"</text>
              
              {/* Length */}
              <line x1="200" y1="100" x2="200" y2="150" stroke="#4F46E5" strokeWidth="1" strokeDasharray="5,5" />
              <text x="205" y="125" fontSize="12" fill="#4F46E5">26"</text>
              
              {/* Chest width */}
              <line x1="130" y1="200" x2="270" y2="200" stroke="#4F46E5" strokeWidth="1" strokeDasharray="5,5" />
              <text x="185" y="195" fontSize="12" fill="#4F46E5">22"</text>
            </motion.g>
          </svg>
          
          {/* Floating elements */}
          <motion.div
            className="absolute top-4 right-4 w-20 h-20 rounded-lg bg-blue-500/10"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-16 h-16 rounded-lg bg-purple-500/10"
            animate={{
              y: [0, 10, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AnimatedDocument;
