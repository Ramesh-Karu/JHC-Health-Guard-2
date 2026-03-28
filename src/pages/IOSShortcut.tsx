import React from 'react';
import { motion } from 'motion/react';
import { Apple, ArrowLeft, Share, PlusSquare, Home, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function IOSShortcut() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Smartphone,
      title: "Open Safari",
      content: "Open the Safari browser on your iPhone or iPad and navigate to jhchealthguard.online."
    },
    {
      icon: Share,
      title: "Tap Share",
      content: "Tap the 'Share' icon at the bottom of the screen (it looks like a square with an arrow pointing up)."
    },
    {
      icon: PlusSquare,
      title: "Add to Home Screen",
      content: "Scroll down the list of options and tap 'Add to Home Screen'."
    },
    {
      icon: Home,
      title: "Confirm",
      content: "Name the shortcut 'Health Guard' and tap 'Add' in the top right corner. The app icon will now appear on your home screen."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 mx-auto mb-6">
            <Apple className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Add to iOS Home Screen</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Follow these simple steps to add Health Guard as a shortcut on your Apple device for quick and easy access.
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-12 bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 px-4">Video Tutorial</h2>
          <div className="flex justify-center">
            <div className="aspect-[9/16] w-full max-w-[320px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-lg">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/TSNLy8wESMU?mute=1&autoplay=1&loop=1&playlist=TSNLy8wESMU" 
                title="iOS Add to Home Screen Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 px-4 text-center italic">
            Note: This demonstration shows the "Add to Home Screen" process on iOS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                  <step.icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-blue-500 rounded-[32px] p-8 text-white text-center">
          <Smartphone className="mx-auto mb-4 opacity-50" size={32} />
          <h3 className="text-xl font-bold mb-2">Why add a shortcut?</h3>
          <p className="text-blue-100 mb-6">
            Adding Health Guard to your home screen allows you to access your health records, QR passport, and AI insights with a single tap, just like a native app.
          </p>
        </div>
      </div>
    </div>
  );
}
