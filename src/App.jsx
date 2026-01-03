import React, { useState, useEffect, useRef } from 'react';
import { Droplet, Plus, Trash2, Calendar as CalendarIcon, BarChart3, TrendingUp, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import profileImage from './assets/Kwame Fosu Ananing.webp';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from "@vercel/analytics/next"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function WaterLog() {
  const [logs, setLogs] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailyGoal] = useState(3000); // 3000ml daily goal
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'stats', 'history', 'calendar', 'about'
  const [pendingDeleteLog, setPendingDeleteLog] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarView, setCalendarView] = useState('month');
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [isHydrationExpanded, setIsHydrationExpanded] = useState(true);
  const [isInstallGuideExpanded, setIsInstallGuideExpanded] = useState(false);
  const [isPrivacyPolicyExpanded, setIsPrivacyPolicyExpanded] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  });
  const [weekAnchorKey, setWeekAnchorKey] = useState(() => {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  });
  const calendarTouchStartRef = useRef({ x: 0, y: 0 });

  // Load data on initial mount
  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!pendingDeleteLog) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPendingDeleteLog(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingDeleteLog]);

  useEffect(() => {
    if (activeTab !== 'calendar') {
      setIsDaySheetOpen(false);
    }
  }, [activeTab]);

  const loadLogs = () => {
    try {
      // Standard browser localStorage
      const savedLogs = localStorage.getItem('water-logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error('Error loading logs from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLogs = (newLogs) => {
    try {
      // Standard browser localStorage (must store as string)
      localStorage.setItem('water-logs', JSON.stringify(newLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  };

  const addLog = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const newLog = {
      id: Date.now(),
      amount: Number(amount),
      timestamp: new Date().toISOString()
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setAmount('');
  };

  const deleteLog = (id) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
  };

  const requestDeleteLog = (log) => {
    setPendingDeleteLog(log);
  };

  const cancelDeleteLog = () => {
    setPendingDeleteLog(null);
  };

  const confirmDeleteLog = () => {
    if (!pendingDeleteLog) return;
    deleteLog(pendingDeleteLog.id);
    setPendingDeleteLog(null);
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const dateToKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const keyToDate = (key) => {
    const [y, m, day] = key.split('-').map(Number);
    return new Date(y, m - 1, day);
  };
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const addDays = (d, amount) => {
    const x = new Date(d);
    x.setDate(x.getDate() + amount);
    return x;
  };

  const dailyData = logs.reduce((acc, log) => {
    const d = new Date(log.timestamp);
    const key = dateToKey(d);
    if (!acc[key]) acc[key] = { total: 0, entries: [] };
    acc[key].total += log.amount;
    acc[key].entries.push(log);
    return acc;
  }, {});

  Object.values(dailyData).forEach((day) => {
    day.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  const getTotalForDate = (date) => {
    const key = dateToKey(date);
    return dailyData[key]?.total ?? 0;
  };

  const getTodayTotal = () => getTotalForDate(new Date());

  const getPersonalBest = () => {
    if (Object.keys(dailyData).length === 0) return 0;
    return Math.max(...Object.values(dailyData).map(day => day.total));
  };

  const getStreakInfo = () => {
    const today = startOfDay(new Date());
    const todayKey = dateToKey(today);
    const yesterdayKey = dateToKey(addDays(today, -1));

    let endKey = null;
    if ((dailyData[todayKey]?.total ?? 0) > 0) endKey = todayKey;
    else if ((dailyData[yesterdayKey]?.total ?? 0) > 0) endKey = yesterdayKey;

    const currentKeys = [];
    if (endKey) {
      let cursor = startOfDay(keyToDate(endKey));
      while (true) {
        const key = dateToKey(cursor);
        if ((dailyData[key]?.total ?? 0) > 0) {
          currentKeys.push(key);
          cursor = addDays(cursor, -1);
        } else {
          break;
        }
      }
    }

    const loggedKeys = Object.keys(dailyData)
      .filter((k) => (dailyData[k]?.total ?? 0) > 0)
      .sort((a, b) => startOfDay(keyToDate(a)) - startOfDay(keyToDate(b)));

    let longest = 0;
    let longestKeys = [];
    let runStart = 0;

    for (let i = 0; i < loggedKeys.length; i++) {
      if (i === 0) continue;
      const prev = startOfDay(keyToDate(loggedKeys[i - 1]));
      const cur = startOfDay(keyToDate(loggedKeys[i]));
      const diffDays = Math.round((cur - prev) / 86400000);

      if (diffDays !== 1) {
        const runLen = i - runStart;
        if (runLen > longest) {
          longest = runLen;
          longestKeys = loggedKeys.slice(runStart, i);
        }
        runStart = i;
      }
    }

    const finalRunLen = loggedKeys.length - runStart;
    if (finalRunLen > longest) {
      longest = finalRunLen;
      longestKeys = loggedKeys.slice(runStart);
    }

    return {
      current: currentKeys.length,
      currentKeys,
      longest,
      longestKeys
    };
  };

  const streakInfo = getStreakInfo();
  const currentStreakKeySet = new Set(streakInfo.currentKeys);

  const getMonthGrid = () => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const gridStart = startOfDay(addDays(firstOfMonth, -firstOfMonth.getDay()));
    const days = [];

    for (let i = 0; i < 42; i++) {
      const date = addDays(gridStart, i);
      const key = dateToKey(date);
      const total = dailyData[key]?.total ?? 0;
      days.push({
        key,
        date,
        inMonth: date.getMonth() === currentMonth,
        total,
        isToday: dateToKey(date) === dateToKey(new Date()),
        isStreak: currentStreakKeySet.has(key),
        isLogged: total > 0,
        isGoal: total >= dailyGoal
      });
    }

    return days;
  };

  const getWeekGrid = () => {
    const anchor = startOfDay(keyToDate(weekAnchorKey));
    const start = startOfDay(addDays(anchor, -anchor.getDay()));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const key = dateToKey(date);
      const total = dailyData[key]?.total ?? 0;
      return {
        key,
        date,
        total,
        isToday: dateToKey(date) === dateToKey(new Date()),
        isStreak: currentStreakKeySet.has(key),
        isLogged: total > 0,
        isGoal: total >= dailyGoal
      };
    });
  };

  const navigateMonth = (increment) => {
    if (increment > 0) {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const navigateCalendarBySwipe = (direction) => {
    if (calendarView === 'month') {
      navigateMonth(direction);
      return;
    }

    const delta = direction > 0 ? 7 : -7;
    setWeekAnchorKey((prev) => dateToKey(addDays(keyToDate(prev), delta)));
  };

  const formatDate = (timestamp, format = 'full') => {
    const date = new Date(timestamp);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (format === 'time') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    if (format === 'day') {
      if (date.toDateString() === today) return 'Today';
      if (date.toDateString() === yesterday) return 'Yesterday';
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
    
    // Default format (full)
    if (date.toDateString() === today) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  
  // Group logs by day
  const groupLogsByDay = () => {
    const grouped = {};
    let totalDeletable = 0;
    
    logs.forEach((log, index) => {
      const date = new Date(log.timestamp);
      // Use YYYY-MM-DD as the key for grouping
      const dateKey = date.toISOString().split('T')[0];
      const isDeletable = totalDeletable < 3;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: date,
          logs: [],
          isToday: date.toDateString() === new Date().toDateString()
        };
      }
      
      grouped[dateKey].logs.push({
        ...log,
        isDeletable,
        originalIndex: index
      });
      
      if (isDeletable) totalDeletable++;
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) => b.date - a.date);
  };

  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const total = logs
        .filter(log => new Date(log.timestamp).toDateString() === dateStr)
        .reduce((sum, log) => sum + log.amount, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: total,
        fullDate: dateStr
      });
    }
    
    return data;
  };

  const getLast30DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const total = logs
        .filter(log => new Date(log.timestamp).toDateString() === dateStr)
        .reduce((sum, log) => sum + log.amount, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: total,
        fullDate: dateStr
      });
    }
    
    return data;
  };

  const getWeekAverage = () => {
    const last7Days = getLast7DaysData();
    const total = last7Days.reduce((sum, day) => sum + day.amount, 0);
    return Math.round(total / 7);
  };

  const getMonthAverage = () => {
    const last30Days = getLast30DaysData();
    const total = last30Days.reduce((sum, day) => sum + day.amount, 0);
    return Math.round(total / 30);
  };

  const todayTotal = getTodayTotal();
  const progress = Math.min((todayTotal / dailyGoal) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mt-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <Droplet className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
                <h1 className="text-xl md:text-3xl font-bold text-gray-800">Water.isCool</h1>
              </div>
              <div>
                <button
                  onClick={() => {
                    setActiveTab('about');
                    // Small delay to ensure the about tab is rendered before scrolling
                    setTimeout(() => {
                      const element = document.getElementById('mobile-app-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium bg-blue-50 rounded-md text-blue-600 transition-colors"
                >
                  Mobile App
                </button>
              </div>
            </div>

          {/* Hydration Recommendation Accordion */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg mt-10 mb-4 sm:mb-6 overflow-hidden">
            <button 
              onClick={() => setIsHydrationExpanded(!isHydrationExpanded)}
              className="w-full px-4 py-3 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-expanded={isHydrationExpanded}
            >
              <span className="font-medium text-blue-800">Daily Hydration Recommendations</span>
              <svg 
                className={`w-5 h-5 text-blue-500 transition-transform duration-200 ${isHydrationExpanded ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isHydrationExpanded && (
              <div className="px-4 pt-2 pb-3 text-sm text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">Men:</span> 13 cups (about 3 liters)</li>
                  <li><span className="font-medium">Women:</span> 9 cups (about 2.1 liters)</li>
                  <li><span className="font-medium">Pregnant Women:</span> 10 cups</li>
                  <li><span className="font-medium">Breastfeeding:</span> 12 cups</li>
                </ul>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'today'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 text-sm sm:text-base font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Statistics</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 text-sm sm:text-base font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>History</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-2 text-sm sm:text-base font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'about'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
          </div>

          {/* Streak Display */}
          {['today', 'stats', 'calendar'].includes(activeTab) && (
            <div className="mb-4 sm:mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Current Streak</p>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-xl font-bold">{streakInfo.current} days</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Longest: {streakInfo.longest} days</div>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-gray-500">Best Water Logged</p>
                  <div className="font-semibold">{getPersonalBest()}ml</div>
                </div>
              </div>
            </div>
          )}

          {/* Today Tab */}
          {activeTab === 'today' && (
            <>
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Today's Progress</span>
                  <span className="text-sm font-bold text-blue-600">{todayTotal}ml / {dailyGoal}ml</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLog()}
                  placeholder="Amount (ml)"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none text-base sm:text-lg"
                />
                <button
                  onClick={addLog}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[250, 350, 500].map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset.toString());
                      // Short delay to ensure the state updates before adding
                      setTimeout(() => addLog(), 20);
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-1 sm:px-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    {preset}ml
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <h3 className="font-semibold text-sm sm:text-base text-gray-700">7-Day Average</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{getWeekAverage()}ml</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {((getWeekAverage() / dailyGoal) * 100).toFixed(0)}% of daily goal
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
                    <h3 className="font-semibold text-sm sm:text-base text-gray-700">30-Day Average</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-cyan-600">{getMonthAverage()}ml</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {((getMonthAverage() / dailyGoal) * 100).toFixed(0)}% of daily goal
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-2 sm:mb-3">Last 7 Days</h3>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getLast7DaysData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        fontSize={window.innerWidth < 640 ? 10 : 12} 
                        tickMargin={5}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={window.innerWidth < 640 ? 10 : 12}
                        width={window.innerWidth < 640 ? 30 : 40}
                        tickFormatter={(value) => `${value}ml`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          fontSize: window.innerWidth < 640 ? '12px' : '14px'
                        }}
                        formatter={(value) => [`${value}ml`, 'Amount']}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-2 sm:mb-3">Last 30 Days Trend</h3>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getLast30DaysData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        fontSize={window.innerWidth < 640 ? 8 : 10}
                        interval={window.innerWidth < 640 ? 9 : 4}
                        tickMargin={5}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={window.innerWidth < 640 ? 10 : 12}
                        width={window.innerWidth < 640 ? 30 : 40}
                        tickFormatter={(value) => `${value}ml`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          fontSize: window.innerWidth < 640 ? '12px' : '14px'
                        }}
                        formatter={(value) => [`${value}ml`, 'Amount']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', r: window.innerWidth < 640 ? 2 : 3 }}
                        activeDot={{ r: window.innerWidth < 640 ? 4 : 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="mt-6 space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About Water.isCool</h2>
                <div className="prose text-gray-600">
                  <p className="mb-4">
                    Water.isCool is a simple, intuitive water tracking application designed to help you stay hydrated throughout the day. 
                    Track your water intake, monitor your progress, and build healthy hydration habits.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Why Stay Hydrated?</h3>
                  <p className="mb-4">
                    Proper hydration is essential for maintaining good health. Water helps regulate body temperature, 
                    keep joints lubricated, prevent infections, deliver nutrients to cells, and keep organs functioning properly.
                  </p>

                  <h3 id="mobile-app-section" className="text-lg font-semibold text-gray-800 mt-6 mb-2">Mobile App?</h3>
                  <p className="mb-2">
                    Yes, Water.isCool is available as a mobile web app for download through your browser (Chrome recommended).
                  </p>
                  
                  <div className="mb-4">
                    <button
                      onClick={() => setIsInstallGuideExpanded(!isInstallGuideExpanded)}
                      className="flex items-center justify-between w-full text-left text-blue-600 hover:text-blue-800 focus:outline-none"
                      aria-expanded={isInstallGuideExpanded}
                    >
                      <span className="font-medium">How to install web app</span>
                    </button>
                    
                    {isInstallGuideExpanded && (
                      <div className="mt-2 pl-4 border-l-2 border-blue-200">
                        <h4 className="font-medium text-gray-800 mb-2">On Android (Using Chrome)</h4>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                          <li>Tap the three-dot menu in the top-right corner.</li>
                          <li>Select "Add to Home screen".</li>
                          <li>Tap Add.</li>
                          <li>The shortcut will appear on your home screen.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg mb-2 sm:mb-6 overflow-hidden">
                    <button
                      onClick={() => setIsPrivacyPolicyExpanded(!isPrivacyPolicyExpanded)}
                      className=" w-full px-4 py-3 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-200"
                      aria-expanded={isPrivacyPolicyExpanded}
                    >
                      <span className="text-lg font-semibold text-gray-800">Privacy Policy</span>
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${isPrivacyPolicyExpanded ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isPrivacyPolicyExpanded && (
                      <div className="mt-2 pl-4 border-l-2 border-blue-200 space-y-4">
                        <p className="text-gray-700">
                          At Water.isCool, we take your privacy seriously. Here's what you need to know about how we handle your data:
                        </p>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-800">Data Storage</h4>
                          <p className="text-gray-700">
                            All your water intake data is stored locally on your device using your browser's local storage. We don't collect, store, or transmit any of your personal data to our servers.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-800">No Data Collection</h4>
                          <p className="text-gray-700">
                            We don't track your usage, collect analytics, or gather any personal information. Your hydration data remains private and accessible only to you on the device where you use the app.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-800">Data Deletion</h4>
                          <p className="text-gray-700">
                            Since all data is stored locally, you can clear your app data at any time through your browser's settings. This will permanently delete all your water intake history.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-800">Third-Party Services</h4>
                          <p className="text-gray-700">
                            We don't use any third-party services that would have access to your data. The app functions entirely within your browser.
                          </p>
                        </div>

                        <p className="text-sm text-gray-500">
                          Last updated: January 3, 2025
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-3">About the Developer</h3>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100">
                        <img 
                          src={profileImage} 
                          alt="Kwame Fosu Ananing" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Kwame Fosu Ananing</h4>
                      <p className="text-sm text-gray-600 mb-2">Frontend Developer & Designer</p>
                      <p className="text-sm text-gray-600">Creating digital experiences that are both beautiful and functional.</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Connect with me</h4>
                    <div className="flex items-center gap-3">
                      <a 
                        href="https://github.com/ananingfosu" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-50"
                        aria-label="GitHub"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                      </a>
                      <a 
                        href="https://dribbble.com/ananingfosu" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-pink-500 transition-colors rounded-lg hover:bg-gray-50"
                        aria-label="Dribbble"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M19.13 5.09C15.22 9.14 16.24 14.79 13 16" />
                          <path d="M10.88 21.94A13.91 13.91 0 0 0 16 12a14.5 14.5 0 0 0-.5-4" />
                          <path d="M8.5 3a15.11 15.11 0 0 1 3.38 2.5 15.3 15.3 0 0 1 1.62 2.5" />
                          <path d="M12 16a6 6 0 0 1 6-6" />
                        </svg>
                      </a>
                      <a 
                        href="https://x.com/AnaningFosu" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-50"
                        aria-label="X (formerly Twitter)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                        </svg>
                      </a>
                      <a 
                        href="https://linkedin.com/in/ananingfosu" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                        aria-label="LinkedIn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                          <rect x="2" y="9" width="4" height="12" />
                          <circle cx="4" cy="4" r="2" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Water.isCool. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Calendar</h2>
                  <div className="text-sm text-gray-500 truncate">
                    {calendarView === 'month'
                      ? new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                      : (() => {
                          const week = getWeekGrid();
                          const start = week[0]?.date;
                          const end = week[6]?.date;
                          if (!start || !end) return '';
                          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        })()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCalendarView('month')}
                      className={`px-3 py-1.5 text-sm font-semibold ${calendarView === 'month' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarView('week')}
                      className={`px-3 py-1.5 text-sm font-semibold ${calendarView === 'week' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Week
                    </button>
                  </div>

                  {calendarView === 'month' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateMonth(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setCurrentMonth(now.getMonth());
                          setCurrentYear(now.getFullYear());
                          const key = dateToKey(now);
                          setSelectedDateKey(key);
                          setWeekAnchorKey(key);
                        }}
                        className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateMonth(1)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setWeekAnchorKey(dateToKey(addDays(keyToDate(weekAnchorKey), -7)))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                        aria-label="Previous week"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const key = dateToKey(now);
                          setSelectedDateKey(key);
                          setWeekAnchorKey(key);
                        }}
                        className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100"
                      >
                        This Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeekAnchorKey(dateToKey(addDays(keyToDate(weekAnchorKey), 7)))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                        aria-label="Next week"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center font-semibold py-1">{d}</div>
                    ))}
                  </div>

                  <div
                    className="grid grid-cols-7 gap-1 sm:gap-2 mt-2"
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      calendarTouchStartRef.current = { x: t.clientX, y: t.clientY };
                    }}
                    onTouchEnd={(e) => {
                      const start = calendarTouchStartRef.current;
                      const t = e.changedTouches[0];
                      const dx = t.clientX - start.x;
                      const dy = t.clientY - start.y;

                      if (Math.abs(dx) < 50) return;
                      if (Math.abs(dx) < Math.abs(dy)) return;

                      // swipe left = next, swipe right = prev
                      if (dx < 0) navigateCalendarBySwipe(1);
                      else navigateCalendarBySwipe(-1);
                    }}
                  >
                    {(calendarView === 'month' ? getMonthGrid() : getWeekGrid()).map((cell) => {
                      const isSelected = cell.key === selectedDateKey;
                      const progressPct = Math.min((cell.total / dailyGoal) * 100, 100);

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          onClick={() => {
                            setSelectedDateKey(cell.key);
                            setWeekAnchorKey(cell.key);
                            setCurrentMonth(cell.date.getMonth());
                            setCurrentYear(cell.date.getFullYear());
                            setIsDaySheetOpen(true);
                          }}
                          className={`relative h-16 sm:h-20 md:h-24 rounded-xl border p-1.5 sm:p-2 text-left transition-colors overflow-hidden ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                          } ${
                            calendarView === 'month' && !cell.inMonth ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className={`text-xs sm:text-sm font-semibold ${cell.isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                              {cell.date.getDate()}
                            </div>
                            <div className="flex items-center gap-1">
                              {cell.isStreak && (
                                <span className="inline-flex items-center justify-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">
                                  <Flame className="w-3 h-3" />
                                </span>
                              )}
                              {cell.isGoal && (
                                <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-bold">
                                  Goal
                                </span>
                              )}
                            </div>
                          </div>

                          {cell.isLogged ? (
                            <div className="mt-2">
                              <div className="text-[10px] sm:text-xs font-semibold text-gray-700">{cell.total}ml</div>
                              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className={`${cell.isGoal ? 'bg-green-500' : 'bg-blue-400'} h-full`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-[10px] sm:text-xs text-gray-400">No logs</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                      <span>Logged</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Goal met</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-400" />
                      <span>Current streak</span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {keyToDate(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Total: {dailyData[selectedDateKey]?.total ?? 0}ml
                      </div>
                    </div>
                    {(dailyData[selectedDateKey]?.total ?? 0) >= dailyGoal && (
                      <div className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">Goal met</div>
                    )}
                  </div>

                  <div className="mt-4">
                    {(dailyData[selectedDateKey]?.entries?.length ?? 0) === 0 ? (
                      <div className="text-sm text-gray-500">No entries for this day.</div>
                    ) : (
                      <div className="space-y-2 max-h-56 sm:max-h-72 overflow-y-auto pr-1">
                        {dailyData[selectedDateKey].entries.map((log) => (
                          <div key={log.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Droplet className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-800">{log.amount}ml</div>
                                <div className="text-xs text-gray-500">{formatDate(log.timestamp, 'time')}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">{formatDate(log.timestamp, 'day')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>All Entries</span>
              </h2>
              
              {logs.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-gray-400">
                  No logs yet. Start tracking your water intake!
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-300px)] sm:max-h-96 overflow-y-auto pr-1">
                  {groupLogsByDay().map((dayGroup, groupIndex) => (
                    <div key={dayGroup.date} className="space-y-2">
                      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 pt-2 pb-1 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500">
                          {formatDate(dayGroup.date, 'day')}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {dayGroup.logs.map((log) => (
                          <div
                            key={log.id}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors ${
                              log.isDeletable 
                                ? 'bg-gray-50 hover:bg-gray-100' 
                                : 'bg-gray-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Droplet 
                                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                                  log.isDeletable ? 'text-blue-400' : 'text-gray-300'
                                }`} 
                              />
                              <div className="min-w-0">
                                <div className={`font-semibold text-sm sm:text-base ${
                                  log.isDeletable ? 'text-gray-800' : 'text-gray-400'
                                }`}>
                                  {log.amount}ml
                                </div>
                                <div className="text-xs sm:text-sm text-gray-400">
                                  {formatDate(log.timestamp, 'time')}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                if (!log.isDeletable) return;
                                e.stopPropagation();
                                requestDeleteLog(log);
                              }}
                              disabled={!log.isDeletable}
                              className={`p-1 transition-colors ${
                                log.isDeletable 
                                  ? 'text-red-400 hover:text-red-600 cursor-pointer' 
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              aria-label={log.isDeletable ? 'Delete entry' : 'Cannot delete older entries'}
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {activeTab === 'calendar' && isDaySheetOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDaySheetOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Day details"
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {keyToDate(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Total: {dailyData[selectedDateKey]?.total ?? 0}ml
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDaySheetOpen(false)}
                className="text-sm font-semibold text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {(dailyData[selectedDateKey]?.entries?.length ?? 0) === 0 ? (
                <div className="text-sm text-gray-500">No entries for this day.</div>
              ) : (
                <div className="space-y-2">
                  {dailyData[selectedDateKey].entries.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Droplet className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800">{log.amount}ml</div>
                          <div className="text-xs text-gray-500">{formatDate(log.timestamp, 'time')}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(log.timestamp, 'day')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {pendingDeleteLog && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) cancelDeleteLog();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete"
      >
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
          <div className="text-lg font-semibold text-gray-800">Delete entry?</div>
          <div className="mt-2 text-sm text-gray-600">
            This will permanently delete <span className="font-semibold">{pendingDeleteLog.amount}ml</span> logged at{' '}
            <span className="font-semibold">{formatDate(pendingDeleteLog.timestamp, 'full')}</span>.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              onClick={cancelDeleteLog}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteLog}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    <SpeedInsights />
    <Analytics />
    </>
  );
}