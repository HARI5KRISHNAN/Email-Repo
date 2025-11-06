
import React from 'react';
import { Email } from '../types';
import { PinIcon, SearchIcon, StarIcon, UnreadIcon } from '../constants';
import { SortOrder } from '../App';
import api from '../api';

interface ThreadListItemProps {
    thread: Email[];
    isSelected: boolean;
    onSelect: (threadId: string) => void;
    isPinned: boolean;
    onTogglePin: (threadId: string) => void;
    onStarToggle: (emailId: string, isStarred: boolean) => void;
    onMarkAsUnread: (emailId: string) => void;
}

const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, isSelected, onSelect, isPinned, onTogglePin, onStarToggle, onMarkAsUnread }) => {
    const latestMessage = thread[0];
    const threadCount = thread.length;
    const isThreadUnread = thread.some(e => !e.isRead);

    const handleStarClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStarredState = !latestMessage.isStarred;

        try {
            await api.patch(`/mail/${latestMessage.id}/star`, {
                isStarred: newStarredState
            });
            onStarToggle(latestMessage.id, newStarredState);
        } catch (error) {
            console.error('Failed to toggle star:', error);
        }
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return date.toLocaleDateString();
        interval = seconds / 2592000;
        if (interval > 1) return date.toLocaleDateString();
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };

    return (
        <div 
            onClick={() => onSelect(latestMessage.threadId)}
            className={`group cursor-pointer border-b border-slate-200 p-4 ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
        >
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 truncate">
                            {isThreadUnread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>}
                            {/* REFINEMENT: Use semibold for unread threads for a cleaner look. */}
                            <h3 className={`${isThreadUnread ? 'font-semibold' : 'font-medium'} text-sm text-slate-800 truncate`}>
                                {latestMessage.sender}
                                {threadCount > 1 && <span className="font-normal text-slate-500 ml-1">({threadCount})</span>}
                            </h3>
                            {isPinned && <PinIcon className="w-4 h-4 text-blue-600 flex-shrink-0" isFilled={true} />}
                        </div>
                        <div className="flex-shrink-0 ml-2">
                             <p className="text-xs text-slate-500 group-hover:hidden">{timeAgo(latestMessage.timestamp)}</p>
                             <div className="hidden group-hover:flex items-center gap-2 text-slate-500">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTogglePin(latestMessage.threadId); }}
                                    title={isPinned ? "Unpin conversation" : "Pin conversation"}
                                    className={`p-1 rounded-full hover:bg-slate-200 ${isPinned ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                    aria-label={isPinned ? "Unpin conversation" : "Pin conversation"}
                                >
                                    <PinIcon className="w-5 h-5" isFilled={isPinned} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMarkAsUnread(latestMessage.id); }}
                                    title="Mark as unread"
                                    className="p-1 rounded-full hover:bg-slate-200 hover:text-slate-800"
                                    aria-label="Mark as unread"
                                >
                                    <UnreadIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* REFINEMENT: Use semibold and higher contrast colors for unread subjects. */}
                    <p className={`${isThreadUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'} text-sm truncate`}>{latestMessage.subject.replace(/Re: /g, '')}</p>
                    <p className="text-xs text-slate-500 truncate">{latestMessage.snippet}</p>
                </div>
                <button onClick={handleStarClick} className={`mt-0.5 ${latestMessage.isStarred ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-400'}`}>
                    <StarIcon isFilled={latestMessage.isStarred} className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

interface EmailListProps {
    threads: Email[][];
    selectedThreadId: string | null;
    onSelectThread: (threadId: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortOrder: SortOrder;
    onSortChange: (order: SortOrder) => void;
    pinnedThreadIds: string[];
    onTogglePin: (threadId: string) => void;
    onStarToggle: (emailId: string, isStarred: boolean) => void;
    onMarkAsUnread: (emailId: string) => void;
}

const EmailList = ({ threads, selectedThreadId, onSelectThread, searchQuery, onSearchChange, sortOrder, onSortChange, pinnedThreadIds, onTogglePin, onStarToggle, onMarkAsUnread }: EmailListProps) => {
    const unreadCount = threads.reduce((count, thread) => {
        return count + (thread.some(e => !e.isRead) ? 1 : 0);
    }, 0);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex-shrink-0">
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="block w-full bg-slate-100 border border-transparent rounded-lg py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="p-4 border-b border-slate-200 flex-shrink-0 flex justify-between items-center text-sm">
                 <p className="text-slate-600">
                    {`${threads.length} conversations · ${unreadCount} unread`}
                </p>
                <div className="flex items-center">
                    <select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(e) => onSortChange(e.target.value as SortOrder)}
                        className="bg-transparent border-none text-slate-600 font-medium text-sm py-1 pr-8 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label="Sort conversations"
                    >
                        <option value="date-desc">Date: Newest</option>
                        <option value="date-asc">Date: Oldest</option>
                    </select>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {threads.map(thread => (
                    <ThreadListItem
                        key={thread[0].threadId}
                        thread={thread}
                        isSelected={selectedThreadId === thread[0].threadId}
                        onSelect={onSelectThread}
                        isPinned={pinnedThreadIds.includes(thread[0].threadId)}
                        onTogglePin={onTogglePin}
                        onStarToggle={onStarToggle}
                        onMarkAsUnread={onMarkAsUnread}
                    />
                ))}
            </div>
        </div>
    );
};

export default EmailList;