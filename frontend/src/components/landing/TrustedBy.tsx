
import { motion } from "framer-motion";

const TrustedBy = () => {
  const companies = [
    { 
      name: "Fashion Forward", 
      className: "w-32 h-12 bg-gradient-to-r from-accent-purple/20 to-accent-purple/10" 
    },
    { 
      name: "Style Studio", 
      className: "w-36 h-12 bg-gradient-to-r from-accent-purple/20 to-accent-purple/10" 
    },
    { 
      name: "Design Hub", 
      className: "w-36 h-12 bg-gradient-to-r from-accent-purple/20 to-accent-purple/10" 
    },
    { 
      name: "Trend Co", 
      className: "w-32 h-12 bg-gradient-to-r from-accent-purple/20 to-accent-purple/10" 
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-24 bg-white/50 backdrop-blur-sm border-y border-neutral-200">
      <div className="container-padding">
        <motion.p 
          className="text-center text-lg text-neutral-600 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Trusted by leading fashion brands worldwide
        </motion.p>
        <motion.div 
          className="flex flex-wrap justify-center items-center gap-12 md:gap-16"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {companies.map((company) => (
            <motion.div
              key={company.name}
              className={`${company.className} rounded-xl flex items-center justify-center relative group`}
              variants={item}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-neutral-600 font-medium tracking-wide absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {company.name}
              </span>
              <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-accent-purple/10 group-hover:opacity-0 transition-opacity duration-200 rounded-xl" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBy;
