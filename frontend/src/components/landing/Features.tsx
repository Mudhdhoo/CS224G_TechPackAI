
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      title: "AI-Powered Tech Pack Creation",
      description: "Generate comprehensive tech packs in minutes with our advanced AI technology. Save time and reduce errors in your production workflow.",
      points: ["Automated Measurements", "Intelligent Material Suggestions", "Standardized Documentation"]
    },
    {
      title: "Collaborative Workspace",
      description: "Work seamlessly with your team and manufacturers. Share, edit, and approve tech packs in real-time.",
      points: ["Real-time Collaboration", "Version Control", "Instant Feedback"]
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-24 bg-background">
      <div className="container-padding">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block bg-accent-purple/10 text-accent-purple px-4 py-1.5 rounded-full text-sm font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            KEY FEATURES
          </motion.span>
          <motion.h2 
            className="heading-lg mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Streamline Your Fashion Production
          </motion.h2>
          <motion.p 
            className="text-neutral-600 mt-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Transform your tech pack creation process with AI-powered automation
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-24"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title} 
              variants={item}
              className={`flex flex-col md:flex-row gap-12 items-center ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-neutral-600 mb-6">{feature.description}</p>
                <ul className="space-y-4">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent-purple/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-accent-purple" />
                      </div>
                      <span className="text-neutral-700">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button className="button-primary">Get Started Free</button>
                  <button className="button-secondary">View Demo</button>
                </div>
              </div>
              <div className="flex-1">
                <Card className="glass-panel p-6 rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] bg-neutral-200 rounded-lg animate-pulse" />
                </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
