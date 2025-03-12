import { Check, ArrowRight, MessageSquare, Users, History, Factory, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Features = () => {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Tech Pack Creation",
      description: "Automate the entire tech pack creation process in minutes.",
      points: ["AI-generated measurements", "Intelligent material suggestions", "Standardized documentation"],
      image: "/images/features/ai-builder.svg"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Chat-Based Tech Pack Assistant",
      description: "AI chat assistant that helps you refine and generate tech packs in real-time.",
      points: ["Auto-suggests missing details", "Instantly revises based on feedback", "Understands brand-specific preferences"],
      image: "/images/features/ai-chat.svg"
    },
    {
      icon: <History className="w-6 h-6" />,
      title: "Smart Version Control & Change Tracking",
      description: "Track every edit and keep your team on the same page.",
      points: ["View all historical changes", "Compare previous versions", "Prevent outdated tech packs from being used"],
      image: "/images/features/version-control.svg"
    },

    {
      icon: <Users className="w-6 h-6" />,
      title: "(New comming feature) Collaborative Workspace ",
      description: "Work seamlessly with your team and manufacturers.",
      points: ["Real-time collaboration", "Version control & history tracking", "Instant feedback & approvals"],
      image: "/images/features/collaboration.svg"
    },
    {
      icon: <Factory className="w-6 h-6" />,
      title: "(New comming feature) Seamless Manufacturer Integration",
      description: "Connect directly with manufacturers to speed up production.",
      points: ["Direct manufacturer comments & approvals", "Structured order-ready formats", "Reduce miscommunication & errors"],
      image: "/images/features/manufacturer.svg"
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
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-purple-50 to-purple-50/30 -z-10" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8B5CF615_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF615_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] -z-10" />
      
      {/* Top fade for smooth transition */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-50/30 to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div 
            className="inline-flex items-center gap-2 bg-[#8B5CF6]/10 text-[#8B5CF6] px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-4 h-4" />
            POWERFUL FEATURES
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything you need to create
            <br />
            perfect tech packs
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Our AI-powered platform streamlines your entire tech pack workflow,
            <br />
            from creation to manufacturer approval.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-32"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title} 
              variants={item}
              className={`flex flex-col lg:flex-row gap-16 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-1 max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-[#8B5CF6] font-semibold">Feature {index + 1}/5</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-xl text-gray-600 mb-8">{feature.description}</p>
                <ul className="space-y-4 mb-8">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#8B5CF6]" />
                      </div>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>

              </div>
              <div className="flex-1">
                <Card className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl overflow-hidden shadow-xl border-0">
                  <img 
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto rounded-lg shadow-lg"
                    loading="lazy"
                  />
                </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="mt-32 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link 
            to="/signup"
            className="inline-block group"
          >
            <motion.div
              className="bg-[#8B5CF6] text-white px-16 py-8 rounded-2xl font-semibold text-2xl shadow-lg
                       hover:shadow-xl transition-all duration-300 transform group-hover:scale-110"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Try for free
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
