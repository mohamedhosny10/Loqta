"use client";
import { FilePlus2, Handshake, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function HowItWorks() {
  const steps = [
    {
      icon: FilePlus2,
      title: 'Report a Lost Item',
      desc: 'Create a clear report with details, photos, and location.'
    },
    {
      icon: MapPin,
      title: 'Report a Found Item',
      desc: 'Pin where it was found so owners can locate it.'
    },
    {
      icon: Handshake,
      title: 'Help Reunite Owners',
      desc: 'Connect responsibly and help items find their way home.'
    }
  ];

  return (
    <section className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold mb-10">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map(({ icon: Icon, title, desc }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: idx * 0.05 }}
            className="group rounded-2xl border border-gray-200 p-6 hover:shadow transition relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full rounded-t-2xl" />
            <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <Icon />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


