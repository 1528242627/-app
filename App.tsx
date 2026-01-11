import React, { useState } from 'react';
import Calendar from './components/Calendar';
import Editor from './components/Editor';
import Settings from './components/Settings';
import { ViewState } from './types';

function App() {
  const [view, setView] = useState<ViewState>('CALENDAR');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setView('EDITOR');
  };

  const handleBackToCalendar = () => {
    setView('CALENDAR');
  };

  const renderView = () => {
    switch (view) {
      case 'EDITOR':
        return <Editor date={selectedDate} onBack={handleBackToCalendar} />;
      case 'SETTINGS':
        return <Settings onBack={handleBackToCalendar} />;
      case 'CALENDAR':
      default:
        return <Calendar onSelectDate={handleSelectDate} onOpenSettings={() => setView('SETTINGS')} />;
    }
  };

  return (
    <div className="min-h-screen bg-zen-bg text-zen-text font-sans selection:bg-zen-accent selection:text-white">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto h-screen shadow-2xl overflow-hidden bg-white relative">
        {renderView()}
      </div>
    </div>
  );
}

export default App;
