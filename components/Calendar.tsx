import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { getAllEntries } from '../services/storage';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  onOpenSettings: () => void;
}

// Helpers for missing date-fns exports
const subMonths = (date: Date, amount: number) => addMonths(date, -amount);

const startOfMonth = (date: Date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const Calendar: React.FC<CalendarProps> = ({ onSelectDate, onOpenSettings }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // We re-fetch entries whenever the month changes to update indicators
  const entries = useMemo(() => getAllEntries(), [currentMonth]);

  const hasEntry = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.some(e => e.date === dateStr);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  return (
    <div className="flex flex-col h-full bg-zen-bg p-4 animate-fade-in relative">
      <header className="flex justify-between items-center mb-8 pt-4">
        <h2 className="text-3xl font-serif font-bold text-zen-text">
          {format(currentMonth, 'yyyy年 MM月')}
        </h2>
        <div className="flex items-center space-x-2">
           {/* Navigation Buttons */}
           <div className="flex space-x-1 mr-2">
            <button 
                onClick={prevMonth} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="上一月"
            >
                <ChevronLeft className="w-6 h-6 text-zen-accent" />
            </button>
            <button 
                onClick={nextMonth} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="下一月"
            >
                <ChevronRight className="w-6 h-6 text-zen-accent" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-zen-muted hover:text-zen-text"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-zen-muted uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day) => {
          const isCurrent = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const dayHasEntry = hasEntry(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center justify-start pt-2 rounded-xl transition-all duration-200
                h-20 sm:h-24
                ${!isCurrent ? 'opacity-30' : 'opacity-100'}
                ${isDayToday ? 'bg-zen-accent/10' : 'hover:bg-gray-50'}
              `}
            >
              <span className={`
                text-sm font-medium
                ${isDayToday ? 'text-zen-accent font-bold' : 'text-zen-text'}
              `}>
                {format(day, 'd')}
              </span>
              
              {dayHasEntry && (
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zen-accent"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
