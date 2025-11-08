
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Compose from './components/Compose';
import Calendar from './components/Calendar';
import ScheduleMeeting from './components/ScheduleMeeting';
import VideoCall from './components/VideoCall';
import { folders } from './constants';
import { Email, Folder, KeycloakProps, EmailListResponse } from './types';
import api from './api';
import { transformBackendEmails } from './emailTransformer';

export type SortOrder = 'date-desc' | 'date-asc';

function App({ keycloak }: KeycloakProps) {
  const [selectedFolder, setSelectedFolder] = useState<Folder['id']>('inbox');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [folderCounts, setFolderCounts] = useState<{ inbox: number; sent: number; important: number; spam: number; trash: number; draft: number }>({ inbox: 0, sent: 0, important: 0, spam: 0, trash: 0, draft: 0 });
  const [activeVideoCall, setActiveVideoCall] = useState<{ roomName: string; displayName: string } | null>(null);

  // Load pinned threads from localStorage
  useEffect(() => {
    const storedPins = localStorage.getItem('pinnedThreadIds');
    if (storedPins) {
        setPinnedThreadIds(JSON.parse(storedPins));
    }
  }, []);

  // Fetch folder counts
  const fetchCounts = async () => {
    try {
      const response = await api.get('/mail/counts');
      if (response.data.ok) {
        setFolderCounts(response.data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch folder counts:', err);
    }
  };

  // Fetch emails from backend
  useEffect(() => {
    // Skip email fetching for calendar and schedule views
    if (selectedFolder === 'calendar' || selectedFolder === 'schedule') {
      setLoading(false);
      return;
    }

    const fetchEmails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle drafts separately
        if (selectedFolder === 'draft') {
          const response = await api.get('/mail/drafts');
          if (response.data.ok) {
            // Transform drafts to email format for display
            const draftEmails: Email[] = response.data.drafts.map((draft: any) => ({
              id: `draft-${draft.id}`,
              threadId: `draft-thread-${draft.id}`,
              sender: 'Draft',
              senderShort: 'D',
              senderEmail: draft.user_email,
              to: draft.to_recipients.map((email: string) => ({ name: email, email })),
              cc: draft.cc_recipients?.map((email: string) => ({ name: email, email })) || [],
              subject: draft.subject || '(No subject)',
              snippet: draft.body.replace(/<[^>]*>/g, '').substring(0, 100) || '(No content)',
              body: draft.body || '',
              timestamp: draft.updated_at,
              isStarred: false,
              isRead: true,
              folder: 'draft',
              draftData: draft // Store original draft data
            }));
            setEmails(draftEmails);
          }
          await fetchCounts();
          return;
        }

        let endpoint = '/mail/inbox';
        if (selectedFolder === 'sent') {
          endpoint = '/mail/sent';
        } else if (selectedFolder === 'important') {
          endpoint = '/mail/important';
        } else if (selectedFolder === 'spam') {
          endpoint = '/mail/spam';
        } else if (selectedFolder === 'trash') {
          endpoint = '/mail/trash';
        }

        const response = await api.get<EmailListResponse>(endpoint);
        const transformedEmails = transformBackendEmails(response.data.rows, selectedFolder as any);
        setEmails(transformedEmails);
        await fetchCounts();
      } catch (err: any) {
        console.error('Failed to fetch emails:', err);
        setError(err.message || 'Failed to load emails');
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [selectedFolder]);

  const handleEmailSent = () => {
    // Skip refresh for calendar and schedule views
    if (selectedFolder === 'calendar' || selectedFolder === 'schedule') {
      return;
    }

    // Refresh emails after sending
    setLoading(true);
    const fetchEmails = async () => {
      try {
        let endpoint = '/mail/inbox';
        if (selectedFolder === 'sent') {
          endpoint = '/mail/sent';
        } else if (selectedFolder === 'important') {
          endpoint = '/mail/important';
        } else if (selectedFolder === 'spam') {
          endpoint = '/mail/spam';
        } else if (selectedFolder === 'trash') {
          endpoint = '/mail/trash';
        }
        const response = await api.get<EmailListResponse>(endpoint);
        const transformedEmails = transformBackendEmails(response.data.rows, selectedFolder as any);
        setEmails(transformedEmails);
      } catch (err: any) {
        console.error('Failed to refresh emails:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  };

  const togglePinThread = (threadId: string) => {
    setPinnedThreadIds(prev => {
        const newPinnedIds = prev.includes(threadId)
            ? prev.filter(id => id !== threadId)
            : [...prev, threadId];
        localStorage.setItem('pinnedThreadIds', JSON.stringify(newPinnedIds));
        return newPinnedIds;
    });
  };

  const handleStarToggle = (emailId: string, isStarred: boolean) => {
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, isStarred } : email
    ));
    fetchCounts();
  };

  const handleThreadSelect = async (threadId: string) => {
    // Check if this is a draft
    const thread = threads[threadId];
    if (thread && thread[0] && thread[0].folder === 'draft') {
      // Open draft in compose window
      const draftEmail = thread[0];
      const draftData = draftEmail.draftData;

      if (draftData) {
        setEditingDraft(draftData);
        setShowCompose(true);
      }
      return;
    }

    setSelectedThreadId(threadId);

    // Mark all unread emails in the thread as read
    if (thread) {
      const unreadEmails = thread.filter(email => !email.isRead);
      for (const email of unreadEmails) {
        try {
          await api.patch(`/mail/${email.id}/read`);
        } catch (err) {
          console.error('Failed to mark email as read:', err);
        }
      }

      // Update local state
      setEmails(prev => prev.map(email =>
        unreadEmails.some(e => e.id === email.id) ? { ...email, isRead: true } : email
      ));

      // Refresh counts
      fetchCounts();
    }
  };

  const handleMarkAsUnread = async (emailId: string) => {
    try {
      await api.patch(`/mail/${emailId}/unread`);

      // Update local state
      setEmails(prev => prev.map(email =>
        email.id === emailId ? { ...email, isRead: false } : email
      ));

      // Refresh counts
      fetchCounts();
    } catch (err) {
      console.error('Failed to mark email as unread:', err);
    }
  };

  const handleEmailDrop = async (emailId: string, targetFolder: string) => {
    try {
      // Call the move API
      await api.post(`/mail/${emailId}/move`, { to: targetFolder });

      // Remove the email from current view
      setEmails(prev => prev.filter(email => email.id !== emailId));

      // Refresh counts to update sidebar
      await fetchCounts();

      console.log(`Moved email ${emailId} to ${targetFolder}`);
    } catch (err) {
      console.error('Failed to move email:', err);
      alert('Failed to move email. Please try again.');
    }
  };

  const handleMoveToSpam = async (emailId: string) => {
    try {
      // Call the move API to move to SPAM
      await api.post(`/mail/${emailId}/move`, { to: 'SPAM' });

      // Remove the email from current view
      setEmails(prev => prev.filter(email => email.id !== emailId));

      // Clear selection
      setSelectedThreadId(null);

      // Refresh counts to update sidebar
      await fetchCounts();

      console.log(`Moved email ${emailId} to SPAM`);
    } catch (err) {
      console.error('Failed to move to spam:', err);
      alert('Failed to move to spam. Please try again.');
    }
  };

  const handleMoveToTrash = async (emailId: string) => {
    try {
      // Call the move API to move to TRASH
      await api.post(`/mail/${emailId}/move`, { to: 'TRASH' });

      // Remove the email from current view
      setEmails(prev => prev.filter(email => email.id !== emailId));

      // Clear selection
      setSelectedThreadId(null);

      // Refresh counts to update sidebar
      await fetchCounts();

      console.log(`Moved email ${emailId} to TRASH`);
    } catch (err) {
      console.error('Failed to move to trash:', err);
      alert('Failed to move to trash. Please try again.');
    }
  };

  const handleJoinMeeting = (meeting: any) => {
    if (meeting.meeting_link) {
      // Use embedded VideoCall instead of opening in new tab
      // This avoids the authentication prompts from meet.jit.si web interface
      const displayName = keycloak.tokenParsed?.preferred_username || 'Guest';

      // Extract room name from meeting link
      let roomName = '';
      const match = meeting.meeting_link.match(/\/([^\/]+)$/);
      if (match) {
        roomName = match[1];
      }

      if (roomName) {
        setActiveVideoCall({
          roomName: roomName,
          displayName: displayName
        });
      } else {
        // Fallback: open in new tab if can't extract room name
        window.open(meeting.meeting_link, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Fallback to embedded mode if no meeting link
      let roomName = meeting.id;
      setActiveVideoCall({
        roomName: roomName,
        displayName: keycloak.tokenParsed?.preferred_username || 'User'
      });
    }
  };

  const threads = useMemo(() => {
    const groups: { [key: string]: Email[] } = {};
    emails.forEach(email => {
      if (!groups[email.threadId]) {
        groups[email.threadId] = [];
      }
      groups[email.threadId].push(email);
    });
    // Sort emails within each thread by timestamp, newest first
    Object.values(groups).forEach(thread =>
      thread.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
    return groups;
  }, [emails]);

  const displayThreads = useMemo(() => {
    // FIX: Explicitly type `allThreads` to `Email[][]` to fix type inference issues with `Object.values`.
    // This ensures that `thread` parameters in subsequent array methods are correctly typed.
    const allThreads: Email[][] = Object.values(threads);

    // Filter threads based on folder and search query
    const filteredThreads = allThreads
        .filter(thread => {
            // Important folder is a virtual folder showing starred emails from all folders
            if (selectedFolder === 'important') {
                return true;
            }
            const latestMessage = thread[0];
            return latestMessage.folder === selectedFolder;
        })
        .filter(thread => {
            const query = searchQuery.toLowerCase();
            if (!query) return true;
            // Search across all messages in the thread
            return thread.some(email =>
                email.sender.toLowerCase().includes(query) ||
                email.subject.toLowerCase().includes(query) ||
                email.snippet.toLowerCase().includes(query)
            );
        });
    
    // Separate pinned from unpinned
    const pinnedThreads: Email[][] = [];
    const unpinnedThreads: Email[][] = [];
    filteredThreads.forEach(thread => {
        if (pinnedThreadIds.includes(thread[0].threadId)) {
            pinnedThreads.push(thread);
        } else {
            unpinnedThreads.push(thread);
        }
    });

    // Sort each group independently
    const sortFn = (a: Email[], b: Email[]) => {
        const latestA = a[0];
        const latestB = b[0];
        switch (sortOrder) {
            case 'date-asc':
                return new Date(latestA.timestamp).getTime() - new Date(latestB.timestamp).getTime();
            case 'date-desc':
            default:
                return new Date(latestB.timestamp).getTime() - new Date(latestA.timestamp).getTime();
        }
    };

    pinnedThreads.sort(sortFn);
    unpinnedThreads.sort(sortFn);

    // Return pinned threads first
    return [...pinnedThreads, ...unpinnedThreads];

  }, [threads, selectedFolder, searchQuery, sortOrder, pinnedThreadIds]);

  const selectedThread = selectedThreadId ? threads[selectedThreadId] : null;

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden">
      <Header keycloak={keycloak} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={(folderId) => {
              setSelectedFolder(folderId);
              setSelectedThreadId(null);
          }}
          onCompose={() => setShowCompose(true)}
          counts={folderCounts}
          onEmailDrop={handleEmailDrop}
        />
        <main className="flex flex-1 overflow-hidden border-l border-slate-200">
          {selectedFolder === 'calendar' ? (
            <div className="flex-1 bg-white">
              <Calendar onJoinMeeting={handleJoinMeeting} />
            </div>
          ) : selectedFolder === 'schedule' ? (
            <div className="flex-1 bg-white">
              <ScheduleMeeting onJoinMeeting={(data) => {
                // Use embedded VideoCall instead of opening in new tab
                setActiveVideoCall(data);
              }} />
            </div>
          ) : (
            <>
              <div className="w-full md:w-[350px] lg:w-[400px] xl:w-[450px] bg-white border-r border-slate-200 flex-shrink-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">Loading emails...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <div className="text-center">
                      <p className="text-red-500 mb-2">Error loading emails</p>
                      <p className="text-sm text-slate-500">{error}</p>
                    </div>
                  </div>
                ) : (
                  <EmailList
                    threads={displayThreads}
                    selectedThreadId={selectedThreadId}
                    onSelectThread={handleThreadSelect}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                    pinnedThreadIds={pinnedThreadIds}
                    onTogglePin={togglePinThread}
                    onStarToggle={handleStarToggle}
                    onMarkAsUnread={handleMarkAsUnread}
                    selectedFolder={selectedFolder}
                  />
                )}
              </div>
              <div className="flex-1 bg-white hidden md:block">
                <EmailDetail
                  thread={selectedThread}
                  onMarkAsUnread={handleMarkAsUnread}
                  onMoveToSpam={handleMoveToSpam}
                  onMoveToTrash={handleMoveToTrash}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Compose
            onClose={() => {
              setShowCompose(false);
              setEditingDraft(null);
            }}
            onSent={() => {
              setShowCompose(false);
              setEditingDraft(null);
              handleEmailSent();
            }}
            draft={editingDraft}
          />
        </div>
      )}

      {activeVideoCall && (
        <VideoCall
          roomName={activeVideoCall.roomName}
          displayName={activeVideoCall.displayName}
          onClose={() => setActiveVideoCall(null)}
        />
      )}
    </div>
  );
}

export default App;
