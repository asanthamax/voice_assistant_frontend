'use client';

import clsx from "clsx";
import { FiSettings } from "react-icons/fi";
import { useContext, useState } from "react";

import StatusIndicator from "./components/statusIndicator";
import SettingsModal from "./components/settings";
import About from "./components/about";
import Record from "./components/records";
import History from "./components/history";
import { AppContext } from "./context";

export default function Home() {
  const { setShowSettings } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'about'>('record');

  return (
    <div className="conatiner">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">🎤 Voice Assistant</h1>
            <p className="text-gray-600 mt-1">AI-powered voice interaction</p>
          </div>
          <br/>
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <FiSettings size={24} className="text-gray-700" />
          </button>
        <br/>
        <br/>


        {/* Status Indicator */}
        <StatusIndicator />
        <br/>

        {/* Settings Modal */}
        <SettingsModal />

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-50 rounded-lg p-1 shadow">
          {(['record', 'history', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-3 rounded-lg font-semibold transition-all capitalize',
                activeTab === tab
                  ? 'bg-blue-600 text-gray-100'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {tab === 'record' && '🎙️'} {tab === 'history' && '📝'} {tab === 'about' && 'ℹ️'} {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-50 rounded-lg shadow-lg p-6 mb-8">
          {activeTab === 'record' && <Record/>}
          {activeTab === 'history' && <History/>}
          {activeTab === 'about' && <About/>}
        </div>

        <br/>
        <br/>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p>Voice Assistant © 2025 | Built with Next.js & React</p>
        </div>
    </div>
  )
}
