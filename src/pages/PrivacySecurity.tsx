import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, Server, UserCheck, ArrowLeft, Info, Smartphone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacySecurity() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: "Data We Collect",
      content: "We collect essential information to provide health tracking services for students at Jaffna Hindu College. This includes: Full Name, Class/Division, Student ID, Height, Weight, BMI data, and physical activity logs. We also store profile photos if provided by the student or teacher."
    },
    {
      icon: Eye,
      title: "How We Use Your Data",
      content: "Your health data is used to generate personalized AI insights, track growth trends, and calculate health points for the school leaderboard. Teachers and administrators use this data to monitor the overall well-being of the student body and provide necessary health interventions."
    },
    {
      icon: Lock,
      title: "Data Security",
      content: "All data is stored securely using industry-standard encryption. Access is restricted based on user roles (Student, Teacher, Coach, Admin). We use Firebase's robust security rules to ensure that students can only access their own private records, while authorized staff can only view data relevant to their assigned classes."
    },
    {
      icon: UserCheck,
      title: "Your Privacy Rights",
      content: "As a student of Jaffna Hindu College, you have the right to view your health records at any time through your Digital Health Passport. You can request corrections to your data through your class teacher. We do not share your personal health information with any third-party organizations outside of the school administration."
    },
    {
      icon: Server,
      title: "Storage & Retention",
      content: "Data is retained for the duration of your enrollment at Jaffna Hindu College. Upon graduation or leaving the school, your records may be archived or deleted in accordance with the school's data retention policy."
    },
    {
      icon: Smartphone,
      title: "Access on iOS Devices",
      content: "For the best experience on Apple devices, you can add Health Guard to your home screen. This provides quick access and a full-screen experience similar to a native application.",
      link: "/ios-shortcut",
      linkText: "Learn how to add shortcut"
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
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Privacy & Security</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            At Jaffna Hindu College, we take your health data privacy seriously. This page explains how we protect and manage your information within the Health Guard application.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                  <section.icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{section.title}</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {section.content}
                  </p>
                  {section.link && (
                    <button 
                      onClick={() => navigate(section.link)}
                      className="mt-4 text-blue-500 hover:text-blue-600 font-bold flex items-center gap-2 text-sm"
                    >
                      {section.linkText}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-blue-500 rounded-[32px] p-8 text-white text-center">
          <Info className="mx-auto mb-4 opacity-50" size={32} />
          <h3 className="text-xl font-bold mb-2">Questions?</h3>
          <p className="text-blue-100 mb-6">
            If you have any questions regarding your data privacy or security, please contact the IT Department or the Health Committee at Jaffna Hindu College.
          </p>
          <p className="text-sm text-blue-200">
            Last Updated: March 2026
          </p>
        </div>
      </div>
    </div>
  );
}
