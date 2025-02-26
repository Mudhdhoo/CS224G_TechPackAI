import { motion } from "framer-motion";

const HeroIllustration = () => {
  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Background gradient circles */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* Tech Pack Preview */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-white rounded-lg shadow-2xl overflow-hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Header */}
        <div className="h-14 bg-gradient-to-r from-gray-100 to-gray-50 border-b flex items-center px-4">
          <div className="w-3 h-3 rounded-full bg-red-400 mr-2" />
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        
        {/* Content */}
        <div className="p-6">
          <motion.div 
            className="w-full h-6 bg-gray-200 rounded mb-4"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
          <motion.div 
            className="w-2/3 h-6 bg-gray-200 rounded mb-8"
            initial={{ width: "0%" }}
            animate={{ width: "66%" }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />
          
          {/* Tech Pack Elements */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="h-32 bg-gray-100 rounded-lg"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Floating Elements */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 rounded-lg bg-gradient-to-br from-accent-blue/30 to-purple-500/30 backdrop-blur-sm"
          initial={{ 
            x: -50 + i * 50, 
            y: -100 + i * 100,
            scale: 0,
            opacity: 0 
          }}
          animate={{ 
            x: -20 + i * 40,
            y: -80 + i * 80,
            scale: 1,
            opacity: 0.8
          }}
          transition={{
            duration: 2,
            delay: 1.2 + i * 0.2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      ))}
    </div>
  );
};

export default HeroIllustration;
