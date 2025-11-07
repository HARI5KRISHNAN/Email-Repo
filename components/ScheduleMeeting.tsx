import React, { useState } from 'react';
import api from '../api';
import { ScheduleIcon, CalendarIcon } from '../constants';

interface Attendee {
  email: string;
  id: string;
}

const ScheduleMeeting: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [sendInvitations, setSendInvitations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const link = `https://meet.pilot180.local/${meetingId}`;
    setMeetingLink(link);
    setLocation('Online Meeting');
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

    if (!startDate || !startTime) {
      setErrorMessage('Start date and time are required');
      return;
    }

    if (!endDate || !endTime) {
      setErrorMessage('End date and time are required');
      return;
    }

    // Combine date and time
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
          setStartTime('');
          setEndDate('');
          setEndTime('');
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ScheduleIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Schedule Meeting</h1>
          </div>
          <p className="text-slate-500">Create and schedule a new meeting with attendees</p>
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
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                placeholder="https://meet.pilot180.local/..."
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
              <p className="mt-2 text-sm text-blue-600">
                Meeting link: <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="underline">{meetingLink}</a>
              </p>
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
                setStartTime('');
                setEndDate('');
                setEndTime('');
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
