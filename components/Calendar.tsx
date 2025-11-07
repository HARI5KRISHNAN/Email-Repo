import React, { useState, useEffect } from 'react';
import api from '../api';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../constants';

interface Meeting {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  organizer: string;
  attendees: string[];
}

const hours = ['All Day', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'];

const colorPalette = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-amber-500', 'bg-indigo-500'];

function getWeekDays(date: Date) {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Start from Monday

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const Calendar: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/mail/calendar/meetings');
      setMeetings(response.data.meetings || []);
    } catch (err: any) {
      console.error('Failed to fetch meetings:', err);
      setError(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = getWeekDays(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.start_time);
      return (
        meetingDate.getDate() === day.getDate() &&
        meetingDate.getMonth() === day.getMonth() &&
        meetingDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const getColorForMeeting = (meetingId: string) => {
    const index = meetings.findIndex(m => m.id === meetingId);
    return colorPalette[index % colorPalette.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center p-4">
          <CalendarIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">Error loading calendar</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white text-slate-800">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
          >
            Today
          </button>

          <div className="flex items-center gap-4">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-xl font-semibold min-w-48 text-center">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>

            <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="w-32" />
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden flex">
          {/* Time column */}
          <div className="w-24 border-r border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
            {hours.map((hour, idx) => (
              <div
                key={hour}
                className={`h-24 border-b border-slate-200 text-xs text-slate-500 px-2 py-1 ${
                  idx === 0 ? 'font-semibold' : ''
                }`}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex flex-1 overflow-x-auto">
            {weekDays.map((day, dayIdx) => {
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();
              const dayMeetings = getMeetingsForDay(day);

              return (
                <div key={dayIdx} className="flex-1 min-w-32 border-r border-slate-200 relative">
                  {/* Day header */}
                  <div className="sticky top-0 bg-white border-b border-slate-200 z-10">
                    <div
                      className={`flex flex-col items-center py-2 px-1 ${
                        isToday ? 'bg-blue-500 text-white rounded-lg m-1' : ''
                      }`}
                    >
                      <span className="text-xs font-semibold">{dayNames[day.getDay()]}</span>
                      <span className="text-lg font-bold">{day.getDate()}</span>
                    </div>
                  </div>

                  {/* Hour slots */}
                  <div className="relative">
                    {hours.slice(1).map((_, hourIdx) => (
                      <div key={hourIdx} className="h-24 border-b border-slate-200" />
                    ))}

                    {/* Meetings */}
                    <div className="absolute inset-0 pointer-events-none">
                      {dayMeetings.map((meeting) => {
                        const startDate = new Date(meeting.start_time);
                        const endDate = new Date(meeting.end_time);
                        const startHour = startDate.getHours();
                        const startMinutes = startDate.getMinutes();
                        const endHour = endDate.getHours();
                        const endMinutes = endDate.getMinutes();

                        // Calculate position (8AM = 0, each hour = 96px)
                        const topOffset = (startHour - 8) * 96 + (startMinutes / 60) * 96;
                        const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
                        const height = (duration / 60) * 96;

                        if (startHour < 8 || startHour >= 20) return null; // Only show 8AM-8PM

                        return (
                          <div
                            key={meeting.id}
                            className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer hover:shadow-lg transition pointer-events-auto overflow-hidden ${getColorForMeeting(meeting.id)} text-white`}
                            style={{
                              top: `${topOffset}px`,
                              height: `${height}px`,
                              minHeight: '40px',
                            }}
                            title={`${meeting.title}\n${meeting.description}\nOrganizer: ${meeting.organizer}\nAttendees: ${meeting.attendees.length}`}
                          >
                            <div className="truncate font-semibold">{meeting.title}</div>
                            <div className="text-xs opacity-90">
                              {startDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                            {meeting.location && height > 60 && (
                              <div className="text-xs opacity-80 truncate mt-1">
                                📍 {meeting.location}
                              </div>
                            )}
                            {meeting.attendees && meeting.attendees.length > 0 && height > 80 && (
                              <div className="text-xs mt-1 flex gap-1">
                                {Array.from({ length: Math.min(meeting.attendees.length, 5) }).map((_, i) => (
                                  <div key={i} className="w-3 h-3 rounded-full bg-white/30" />
                                ))}
                                {meeting.attendees.length > 5 && (
                                  <span className="text-xs">+{meeting.attendees.length - 5}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Mini Calendar */}
      <div className="w-72 border-l border-slate-200 flex flex-col bg-white overflow-y-auto">
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-700">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>
          </div>

          {/* Mini Calendar */}
          <div className="text-xs">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-slate-500 h-6 flex items-center justify-center text-xs"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }, (_, i) => {
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                const dayNum = i - firstDay + 1;
                const isToday =
                  dayNum === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={i}
                    className={`text-center h-6 flex items-center justify-center rounded text-xs cursor-pointer font-medium transition ${
                      dayNum < 1 || dayNum > daysInMonth
                        ? 'text-slate-300'
                        : isToday
                          ? 'bg-blue-500 text-white font-bold rounded-full'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dayNum > 0 && dayNum <= daysInMonth ? dayNum : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Meetings Summary */}
        <div className="px-5 py-4 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Upcoming Meetings
          </h3>
          <div className="space-y-2">
            {meetings.slice(0, 5).map((meeting) => {
              const startDate = new Date(meeting.start_time);
              return (
                <div
                  key={meeting.id}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className={`inline-block w-2 h-2 rounded-full ${getColorForMeeting(meeting.id)} mr-2`} />
                  <span className="text-sm font-medium text-slate-700">{meeting.title}</span>
                  <p className="text-xs text-slate-500 mt-1">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                    {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              );
            })}
            {meetings.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No upcoming meetings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
