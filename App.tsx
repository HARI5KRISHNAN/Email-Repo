
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Compose from './components/Compose';
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

  // Load pinned threads from localStorage
  useEffect(() => {
    const storedPins = localStorage.getItem('pinnedThreadIds');
    if (storedPins) {
        setPinnedThreadIds(JSON.parse(storedPins));
    }
  }, []);

  // Fetch emails from backend
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        setError(null);

        let endpoint = '/mail/inbox';
        if (selectedFolder === 'sent') {
          endpoint = '/mail/sent';
        }

        const response = await api.get<EmailListResponse>(endpoint);
        const transformedEmails = transformBackendEmails(response.data.rows, selectedFolder as any);
        setEmails(transformedEmails);
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
    // Refresh emails after sending
    setLoading(true);
    const fetchEmails = async () => {
      try {
        let endpoint = '/mail/inbox';
        if (selectedFolder === 'sent') {
          endpoint = '/mail/sent';
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
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={(folderId) => {
              setSelectedFolder(folderId);
              setSelectedThreadId(null);
          }}
          onCompose={() => setShowCompose(true)}
        />
        <main className="flex flex-1 overflow-hidden border-l border-slate-200">
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
                onSelectThread={setSelectedThreadId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                pinnedThreadIds={pinnedThreadIds}
                onTogglePin={togglePinThread}
                onStarToggle={handleStarToggle}
              />
            )}
          </div>
          <div className="flex-1 bg-white hidden md:block">
            <EmailDetail thread={selectedThread} />
          </div>
        </main>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Compose
            onClose={() => setShowCompose(false)}
            onSent={() => {
              setShowCompose(false);
              handleEmailSent();
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
