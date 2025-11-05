import React from 'react';
// FIX: Imported ToolbarItem and ToolbarItemType from types.ts where they are now defined.
import { Email, Folder, Recipient, ToolbarItem, ToolbarItemType } from './types';

// Icon Components
export const MailIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
export const SendIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
export const StarIcon = ({ className = 'w-6 h-6', isFilled = false }: { className?: string, isFilled?: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
export const DraftIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
export const TrashIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
export const ScheduleIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const CalendarIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
export const SearchIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
export const ArchiveIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
export const DotsVerticalIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
export const ReplyIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
export const ReplyAllIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        <path className="opacity-60" strokeLinecap="round" strokeLinejoin="round" d="M7 10h10a8 8 0 018 8v2M7 10l6 6m-6-6l6-6" />
    </svg>
);
export const UnreadIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
    </svg>
);
export const FolderIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
export const PaperclipIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
export const ChevronDownIcon = ({ className = 'w-4 h-4' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
export const CogIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
export const SignatureIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
export const StrikethroughIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" /></svg>;
export const SparklesIcon = ({ className = 'w-6 h-6' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.002 6.002L6 6m12 6.002L18 12m3 0h-4m4 0v-4m-2 2l.002.002M6.343 17.657l-2.828 2.828m2.828-2.828l2.828 2.828M12 21v-4M10 19h4" /></svg>;
export const PinIcon = ({ className = 'w-6 h-6', isFilled = false }: { className?: string, isFilled?: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={isFilled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
);

// Mock Data
export const folders: Folder[] = [
  { id: 'inbox', name: 'Inbox', icon: <MailIcon className="w-5 h-5" /> },
  { id: 'sent', name: 'Sent mail', icon: <SendIcon className="w-5 h-5" /> },
  { id: 'important', name: 'Important', icon: <StarIcon className="w-5 h-5" /> },
  { id: 'draft', name: 'Draft', icon: <DraftIcon className="w-5 h-5" /> },
  { id: 'trash', name: 'Trash', icon: <TrashIcon className="w-5 h-5" /> },
  { id: 'schedule', name: 'Schedule Meeting', icon: <ScheduleIcon className="w-5 h-5" /> },
  { id: 'calendar', name: 'Calendar', icon: <CalendarIcon className="w-5 h-5" /> },
];

const defaultRecipient: Recipient[] = [{ name: 'Sheldon Cooper', email: 'sheldon.cooper@tbbt.com' }];

export const emails: Email[] = [
  {
    id: '1',
    threadId: 'thread-1',
    sender: 'LinkedIn',
    senderShort: 'LI',
    senderEmail: 'notifications@linkedin.com',
    to: defaultRecipient,
    subject: 'Product and User Exp...',
    snippet: 'You have a new connection request...',
    body: `
      <p>Hi Sheldon,</p>
      <p>You have a new connection request from <strong>Preeti</strong> who is a UX Designer.</p>
      <p>We're always looking for ways to improve your LinkedIn experience. Please let us know what you think!</p>
      <p>Thanks,<br>The LinkedIn Team</p>
    `,
    timestamp: '2024-11-05T10:00:00Z',
    isRead: false,
    isStarred: true,
    isImportant: false,
    folder: 'inbox',
  },
  {
    id: '2',
    threadId: 'thread-2',
    sender: 'Figma',
    senderShort: 'FG',
    senderEmail: 'team@figma.com',
    to: defaultRecipient,
    subject: 'UX micro tips: volum...',
    snippet: 'Check out the latest design tips...',
    body: '<p>Discover the latest trends in UX design and how to apply them in your projects. Our new guide covers volumetric design, micro-interactions, and more.</p>',
    timestamp: '2024-11-05T09:30:00Z',
    isRead: false,
    isStarred: true,
    isImportant: false,
    folder: 'inbox',
  },
  {
    id: '3',
    threadId: 'thread-3',
    sender: 'Dribbble',
    senderShort: 'DR',
    senderEmail: 'shots@dribbble.com',
    to: defaultRecipient,
    subject: 'Preeti is now following...',
    snippet: 'You have a new follower on Dribbble',
    body: '<p>Great news! <strong>Preeti</strong> is now following your work on Dribbble. Keep up the great work and share more of your amazing designs.</p>',
    timestamp: '2024-11-05T08:00:00Z',
    isRead: true,
    isStarred: false,
    isImportant: false,
    folder: 'inbox',
  },
  {
    id: '4',
    threadId: 'thread-4',
    sender: 'Dribbble',
    senderShort: 'DR',
    senderEmail: 'shots@dribbble.com',
    to: defaultRecipient,
    subject: 'Behind the (Character...',
    snippet: 'New design showcase available',
    body: '<p>Go behind the scenes of character design with our latest showcase. See how top artists bring their creations to life.</p>',
    timestamp: '2024-11-04T11:00:00Z',
    isRead: true,
    isStarred: false,
    isImportant: false,
    folder: 'inbox',
  },
  {
    id: '5',
    threadId: 'thread-5',
    sender: 'UIB Marketplace',
    senderShort: 'UIB',
    senderEmail: 'marketplace@uib.com',
    to: defaultRecipient,
    subject: 'Crypto products for d...',
    snippet: 'Explore our new range of crypto design assets.',
    body: '<p>Introducing a new collection of crypto-themed UI kits, icons, and illustrations. Perfect for your next fintech or blockchain project.</p>',
    timestamp: '2024-11-04T10:00:00Z',
    isRead: true,
    isStarred: true,
    isImportant: false,
    folder: 'inbox',
  },
  {
    id: '6',
    threadId: 'thread-6',
    sender: 'David Murray',
    senderShort: 'DM',
    senderEmail: 'david.murray@email.com',
    to: [
        { name: 'Sheldon Cooper', email: 'sheldon.cooper@tbbt.com' },
        { name: 'Leonard Hofstadter', email: 'leonard.hofstadter@tbbt.com' }
    ],
    cc: [
        { name: 'USA-All', email: 'usa-all@tbbt.com' },
        { name: 'Penny', email: 'penny.blossom@tbbt.com' }
    ],
    subject: 'Admission Information Request',
    snippet: 'Thank you for your precious time!',
    body: `
      <p>Hi Sheldon,</p>
      <p>Thank you for your precious time!</p>
      <p>I was hoping to get some more information about the admission process. Could you please let me know the next steps?</p>
      <br/>
      <p>Best regards,<br>David Murray</p>
    `,
    timestamp: '2024-11-03T14:00:00Z',
    isRead: true,
    isStarred: false,
    isImportant: true,
    folder: 'inbox',
  },
  {
    id: '7',
    threadId: 'thread-6',
    sender: 'Sheldon Cooper',
    senderShort: 'SC',
    senderEmail: 'sheldon.cooper@tbbt.com',
    to: [{ name: 'David Murray', email: 'david.murray@email.com' }],
    cc: [
        { name: 'USA-All', email: 'usa-all@tbbt.com' },
    ],
    subject: 'Re: Admission Information Request',
    snippet: 'Great to hear from you!',
    body: `
      <p>Hi David,</p>
      <p>Great to hear from you!</p>
      <p>The next step is to fill out the online application form. You can find it on the university website.</p>
      <br/>
      <p>Best,<br>Sheldon</p>
    `,
    timestamp: '2024-11-03T15:30:00Z',
    isRead: true,
    isStarred: false,
    isImportant: true,
    folder: 'inbox',
  }
];

// Toolbar Customization
export const ALL_TOOLBAR_ITEMS: ToolbarItem[] = [
    { id: 'bold', label: 'Bold', icon: <span className="font-bold">B</span>, action: { type: 'style', value: 'bold' } },
    { id: 'italic', label: 'Italic', icon: <span className="italic">I</span>, action: { type: 'style', value: 'italic' } },
    { id: 'underline', label: 'Underline', icon: <span className="underline">U</span>, action: { type: 'style', value: 'underline' } },
    { id: 'strikethrough', label: 'Strikethrough', icon: <span className="line-through">S</span>, action: { type: 'style', value: 'strikeThrough' } },
    { id: 'rewrite', label: 'Rewrite with AI', icon: <SparklesIcon className="w-5 h-5" />, action: { type: 'function', value: 'rewrite' } },
    { id: 'attach', label: 'Attach file', icon: <PaperclipIcon className="w-5 h-5" />, action: { type: 'function', value: 'attachFile' } },
    { id: 'signature', label: 'Insert signature', icon: <SignatureIcon className="w-5 h-5" />, action: { type: 'function', value: 'insertSignature' } },
];

export const DEFAULT_TOOLBAR_ITEM_IDS: ToolbarItemType[] = ['bold', 'italic', 'underline', 'strikethrough', 'rewrite', 'attach', 'signature'];