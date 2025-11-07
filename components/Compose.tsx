import React, { useState } from 'react';
import api from '../api';

interface DraftData {
  id: number;
  to_recipients: string[];
  cc_recipients: string[];
  subject: string;
  body: string;
  draft_type: string;
  in_reply_to?: string;
}

interface ComposeProps {
  onClose?: () => void;
  onSent?: () => void;
  draft?: DraftData;
}

export default function Compose({ onClose, onSent, draft }: ComposeProps) {
  const [to, setTo] = useState(draft ? draft.to_recipients.join(', ') : '');
  const [subject, setSubject] = useState(draft?.subject || '');
  const [body, setBody] = useState(draft?.body || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const hasContent = () => {
    return to.trim() !== '' || subject.trim() !== '' || body.trim() !== '';
  };

  const handleClose = () => {
    if (hasContent()) {
      setShowDiscardDialog(true);
    } else {
      if (onClose) onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    if (onClose) onClose();
  };

  const handleSaveDraft = async () => {
    try {
      const toArray = to.split(',').map(s => s.trim()).filter(Boolean);

      const payload: any = {
        to: toArray,
        cc: [],
        subject,
        body,
        draftType: 'compose'
      };

      // If editing an existing draft, include the ID to update it
      if (draft) {
        payload.id = draft.id;
      }

      await api.post('/mail/drafts', payload);

      setShowDiscardDialog(false);
      if (onSent) onSent(); // Trigger refresh
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft: ' + (err.response?.data?.error || err.message));
    }
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const toArray = to.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/mail/send', {
        to: toArray,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
      });

      // If we were editing a draft, delete it after sending
      if (draft) {
        try {
          await api.delete(`/mail/drafts/${draft.id}`);
        } catch (err) {
          console.error('Failed to delete draft after send:', err);
        }
      }

      // Clear form
      setTo('');
      setSubject('');
      setBody('');

      // Notify parent
      if (onSent) onSent();
      if (onClose) onClose();

      alert('Email sent successfully!');
    } catch (err: any) {
      console.error('Send failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Compose Email</h2>
        {onClose && (
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={onSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            To (comma separated)
          </label>
          <input
            type="text"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="user@example.com, another@example.com"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Message
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={10}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Discard Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Save draft?</h3>
            <p className="text-slate-600 mb-6">
              You have unsaved changes. Do you want to save this email as a draft?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDiscardDialog(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium"
              >
                Discard
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
