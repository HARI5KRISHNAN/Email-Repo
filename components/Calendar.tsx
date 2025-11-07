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
  meeting_link?: string;
  organizer: string;
  attendees: string[];
}

interface CalendarProps {
  onJoinMeeting?: (meeting: Meeting) => void;
}

const hours = [
  'All Day',
  '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
];

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

const Calendar: React.FC<CalendarProps> = ({ onJoinMeeting }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

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

        {/* Calendar Grid - Single scroll on left */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex min-w-full">
            {/* Time column */}
            <div className="w-24 border-r border-slate-200 bg-white flex-shrink-0">
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

                        // Calculate position (12AM = 0, each hour = 96px)
                        const topOffset = startHour * 96 + (startMinutes / 60) * 96;
                        const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
                        const height = (duration / 60) * 96;

                        return (
                          <div
                            key={meeting.id}
                            onClick={() => setSelectedMeeting(meeting)}
                            className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer hover:shadow-lg transition pointer-events-auto overflow-hidden ${getColorForMeeting(meeting.id)} text-white`}
                            style={{
                              top: `${topOffset}px`,
                              height: `${Math.max(height, 40)}px`,
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
                              {' - '}
                              {endDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                            {meeting.description && height > 60 && (
                              <div className="text-xs opacity-80 truncate mt-1">
                                {meeting.description}
                              </div>
                            )}
                            {meeting.location && height > 80 && (
                              <div className="text-xs opacity-80 truncate mt-1">
                                📍 {meeting.location}
                              </div>
                            )}
                            {meeting.attendees && meeting.attendees.length > 0 && height > 100 && (
                              <div className="text-xs mt-1 flex gap-1 flex-wrap">
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
      </div>

      {/* Right Sidebar - Mini Calendar (No Scrollbar) */}
      <div className="w-72 border-l border-slate-200 flex flex-col bg-white">
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
                  onClick={() => setSelectedMeeting(meeting)}
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

      {/* Meeting Details Popup */}
      {selectedMeeting && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMeeting(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">{selectedMeeting.title}</h2>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                aria-label="Close"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Time */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Date & Time</h3>
                  <p className="text-slate-800 font-medium">
                    {new Date(selectedMeeting.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-slate-600 mt-1">
                    {new Date(selectedMeeting.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    {' - '}
                    {new Date(selectedMeeting.end_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedMeeting.description && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedMeeting.description}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedMeeting.location && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</h3>
                    <p className="text-slate-700">{selectedMeeting.location}</p>
                  </div>
                </div>
              )}

              {/* Organizer */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Organizer</h3>
                  <p className="text-slate-700">{selectedMeeting.organizer}</p>
                </div>
              </div>

              {/* Attendees */}
              {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Attendees ({selectedMeeting.attendees.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedMeeting.attendees.map((attendee, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-slate-600">
                              {attendee.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm">{attendee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center gap-3">
              <div>
                {selectedMeeting.meeting_link && (
                  <p className="text-sm text-slate-500">
                    Click "Join Meeting" to start video call
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  Close
                </button>
                {selectedMeeting.meeting_link && onJoinMeeting && (
                  <button
                    onClick={() => {
                      onJoinMeeting(selectedMeeting);
                      setSelectedMeeting(null);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Join Meeting
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
