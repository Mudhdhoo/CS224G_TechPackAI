
import { motion } from "framer-motion";
import { ArrowRight, Clock, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MetricsSection = () => {
  const metrics = [
    {
      icon: <Clock className="w-10 h-10 text-[#8B5CF6]" />,
      title: "10x Faster",
      subtitle: "From 10 hours → 1 hour",
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-[#8B5CF6]" />,
      title: "Higher Accuracy",
      subtitle: "Eliminate human errors",
    },
    {
      icon: <Mail className="w-10 h-10 text-[#8B5CF6]" />,
      title: "80% Less Email",
      subtitle: "Cut back-and-forth by 80%",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Get from Design to Product <span className="text-[#8B5CF6]">10x Faster</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Reduce tech pack creation time from 10 hours to just 60 minutes.
            AI-powered, structured, and completely error-free.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white"
            >
              <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-8 mx-auto group-hover:scale-110 transition-transform duration-300">
                {metric.icon}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
                {metric.title}
              </h3>
              <p className="text-xl text-gray-600 text-center">
                {metric.subtitle}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Link to="/signup">
            <Button 
              size="lg"
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Try for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default MetricsSection;
