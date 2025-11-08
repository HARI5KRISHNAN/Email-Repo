import React, { useState } from 'react';
import api from '../api';
import { ScheduleIcon, CalendarIcon } from '../constants';

interface Attendee {
  email: string;
  id: string;
}

interface ScheduleMeetingProps {
  onJoinMeeting?: (meetingData: { roomName: string; displayName: string }) => void;
}

const ScheduleMeeting: React.FC<ScheduleMeetingProps> = ({ onJoinMeeting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [sendInvitations, setSendInvitations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Generate hours (00-23) and minutes (00, 05, 10, ..., 55)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const link = `https://meet.jit.si/${meetingId}`;
    setMeetingLink(link);
    setLocation('Online Meeting');
  };

  const startInstantMeeting = () => {
    // Set to current time
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

    // Format dates
    const dateStr = now.toISOString().split('T')[0];
    const startH = now.getHours().toString().padStart(2, '0');
    const startM = Math.floor(now.getMinutes() / 5) * 5; // Round to nearest 5 minutes
    const endH = endTime.getHours().toString().padStart(2, '0');
    const endM = Math.floor(endTime.getMinutes() / 5) * 5;

    setStartDate(dateStr);
    setStartHour(startH);
    setStartMinute(startM.toString().padStart(2, '0'));
    setEndDate(dateStr);
    setEndHour(endH);
    setEndMinute(endM.toString().padStart(2, '0'));

    // Generate meeting link automatically
    generateMeetingLink();

    // Set default title if empty
    if (!title.trim()) {
      setTitle('Instant Meeting');
    }
  };

  const startAndJoinInstantMeeting = () => {
    // Generate meeting ID
    const meetingId = Math.random().toString(36).substring(2, 15);
    const link = `https://meet.jit.si/${meetingId}`;

    // Create meeting data
    const meetingData = {
      roomName: meetingId,
      displayName: 'User' // You can get this from keycloak or user context
    };

    // Launch video call immediately (no backend dependency)
    if (onJoinMeeting) {
      onJoinMeeting(meetingData);
    }

    // Optionally save meeting to backend (don't block if it fails)
    // This happens in background, won't affect video call
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);

    // Use setTimeout to ensure video call launches first
    setTimeout(() => {
      api.post('/meetings', {
        title: 'Instant Meeting',
        description: 'Quick video conference',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        location: 'Online Meeting',
        meeting_link: link,
        attendees: []
      }).catch(err => {
        // Silently fail - video call already launched
        console.log('Note: Meeting not saved to calendar (optional feature)');
      });
    }, 100);
  };

  const addAttendee = () => {
    const email = newAttendeeEmail.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    // Check if already added
    if (attendees.some(a => a.email === email)) {
      setErrorMessage('This attendee is already added');
      return;
    }

    setAttendees([...attendees, { email, id: Date.now().toString() }]);
    setNewAttendeeEmail('');
    setErrorMessage('');
  };

  const removeAttendee = (id: string) => {
    setAttendees(attendees.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!title.trim()) {
      setErrorMessage('Meeting title is required');
      return;
    }

    if (!startDate) {
      setErrorMessage('Start date and time are required');
      return;
    }

    if (!endDate) {
      setErrorMessage('End date and time are required');
      return;
    }

    // Combine date and time
    const startTime = `${startHour}:${startMinute}`;
    const endTime = `${endHour}:${endMinute}`;
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    // Validate end time is after start time
    if (endDateTime <= startDateTime) {
      setErrorMessage('End time must be after start time');
      return;
    }

    if (attendees.length === 0) {
      setErrorMessage('Please add at least one attendee');
      return;
    }

    try {
      setIsSubmitting(true);

      const meetingData = {
        title: title.trim(),
        description: description.trim(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: location.trim() || 'Not specified',
        meeting_link: meetingLink.trim() || null,
        attendees: attendees.map(a => a.email),
        send_invitations: sendInvitations
      };

      const response = await api.post('/mail/calendar/meetings', meetingData);

      if (response.data.ok) {
        setSuccessMessage('Meeting scheduled successfully!');

        // Reset form
        setTimeout(() => {
          setTitle('');
          setDescription('');
          setStartDate('');
          setStartHour('09');
          setStartMinute('00');
          setEndDate('');
          setEndHour('10');
          setEndMinute('00');
          setLocation('');
          setMeetingLink('');
          setAttendees([]);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Failed to schedule meeting:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAttendee();
    }
  };

  return (
    <div className="h-full bg-white overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ScheduleIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Schedule Meeting</h1>
          </div>
          <p className="text-slate-500">Create and schedule a new meeting with attendees</p>
        </div>

        {/* Start Instant Meeting Buttons */}
        <div className="mb-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={startInstantMeeting}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Prepare Instant Meeting</span>
          </button>

          {onJoinMeeting && (
            <button
              type="button"
              onClick={startAndJoinInstantMeeting}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Start & Join Now</span>
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✓ {successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">✗ {errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Team Sync"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add meeting agenda, notes, or any additional details..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  size={1}
                  className="px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white h-[50px]"
                  style={{ maxHeight: '200px' }}
                >
                  {hours.map(hour => (
                    <option key={hour} value={hour}>
                      {parseInt(hour) === 0 ? '12 AM' : parseInt(hour) < 12 ? `${parseInt(hour)} AM` : parseInt(hour) === 12 ? '12 PM' : `${parseInt(hour) - 12} PM`}
                    </option>
                  ))}
                </select>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {minutes.map(min => (
                    <option key={min} value={min}>{min}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  size={1}
                  className="px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white h-[50px]"
                  style={{ maxHeight: '200px' }}
                >
                  {hours.map(hour => (
                    <option key={hour} value={hour}>
                      {parseInt(hour) === 0 ? '12 AM' : parseInt(hour) < 12 ? `${parseInt(hour)} AM` : parseInt(hour) === 12 ? '12 PM' : `${parseInt(hour) - 12} PM`}
                    </option>
                  ))}
                </select>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {minutes.map(min => (
                    <option key={min} value={min}>{min}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Conference Room A or Online"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Meeting Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.jit.si/..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={generateMeetingLink}
                className="px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                Generate Link
              </button>
            </div>
            {meetingLink && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase">Meeting Link</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-blue-700 bg-white px-3 py-2 rounded border border-blue-200 font-mono break-all">
                    {meetingLink}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(meetingLink);
                      alert('Meeting link copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                    title="Copy link to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  {onJoinMeeting && (
                    <button
                      type="button"
                      onClick={() => {
                        // Extract meeting ID from link
                        const match = meetingLink.match(/\/([^\/]+)$/);
                        if (match) {
                          const roomName = match[1];
                          onJoinMeeting({
                            roomName: roomName,
                            displayName: 'User'
                          });
                        }
                      }}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Attendees <span className="text-red-500">*</span>
            </label>

            {/* Add Attendee Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newAttendeeEmail}
                onChange={(e) => setNewAttendeeEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter attendee email address"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addAttendee}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Add
              </button>
            </div>

            {/* Attendees List */}
            {attendees.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} added
                </p>
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-slate-700">{attendee.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Remove attendee"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Invitations Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="sendInvitations"
              checked={sendInvitations}
              onChange={(e) => setSendInvitations(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="sendInvitations" className="text-sm font-medium text-slate-700 cursor-pointer">
              Send email invitations to all attendees
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Scheduling Meeting...' : 'Schedule Meeting'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setDescription('');
                setStartDate('');
                setStartHour('09');
                setStartMinute('00');
                setEndDate('');
                setEndHour('10');
                setEndMinute('00');
                setLocation('');
                setMeetingLink('');
                setAttendees([]);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="px-6 py-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeeting;
