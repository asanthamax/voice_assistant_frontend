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
import RecordsNew from "./components/records_new";
import Records from "./components/records";

export default function Home() {
  const { setShowSettings } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'about'>('record');

  return (
    <RecordsNew/>
  )
}
