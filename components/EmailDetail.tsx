import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Email, ToolbarItem, Recipient } from '../types';
import { ALL_TOOLBAR_ITEMS, DEFAULT_TOOLBAR_ITEM_IDS, DotsVerticalIcon, ReplyIcon, UnreadIcon, StarIcon, PaperclipIcon, ChevronDownIcon, CogIcon, SignatureIcon, ReplyAllIcon, SparklesIcon } from '../constants';
import api from '../api';

const isValidEmail = (email: string): boolean => {
  // A simple regex for email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

interface EditableRecipientFieldProps {
  label: string;
  recipients: Recipient[];
  setRecipients: (recipients: Recipient[]) => void;
  invalidEmails: string[];
}

const EditableRecipientField: React.FC<EditableRecipientFieldProps> = ({ label, recipients, setRecipients, invalidEmails }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addRecipient = (emailStr: string) => {
    const email = emailStr.trim().replace(/,$/, ''); // remove trailing comma
    if (email && !recipients.some(r => r.email === email)) {
      setRecipients([...recipients, { name: email, email: email }]);
    }
    setInputValue('');
  };

  const removeRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter(r => r.email !== emailToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ';', ' '].includes(e.key)) {
      e.preventDefault();
      addRecipient(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '') {
      if (recipients.length > 0) {
        removeRecipient(recipients[recipients.length - 1].email);
      }
    }
  };

  return (
    <div className="flex items-baseline gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-700 w-8">{label}:</span>
      <div 
        className="flex-1 flex flex-wrap items-center gap-1 p-1 rounded-md border border-slate-200 bg-white focus-within:ring-1 focus-within:ring-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        {recipients.map(recipient => {
          const isInvalid = invalidEmails.includes(recipient.email);
          return (
            <div 
              key={recipient.email} 
              className={`flex items-center gap-1.5 bg-slate-200 text-slate-800 rounded px-2 py-0.5 text-xs ${isInvalid ? 'ring-2 ring-red-500' : ''}`}
            >
              <span>{recipient.name}</span>
              <button 
                type="button"
                onClick={() => removeRecipient(recipient.email)} 
                className="text-slate-500 hover:text-slate-900 font-bold"
                aria-label={`Remove ${recipient.name}`}
              >
                &times;
              </button>
            </div>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addRecipient(inputValue)}
          placeholder={recipients.length === 0 ? "Add recipients" : ""}
          className="flex-grow p-1 bg-transparent focus:outline-none min-w-[120px]"
        />
      </div>
    </div>
  );
};


const ScheduleSendModal = ({
    isOpen,
    onClose,
    onSchedule,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (time: string) => void;
}) => {
    const [scheduleTime, setScheduleTime] = useState('');

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            now.setHours(now.getHours() + 1);
            now.setMinutes(0);
            now.setSeconds(0);
            const isoString = now.toISOString().slice(0, 16);
            setScheduleTime(isoString);
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const handleScheduleClick = () => {
        if (!scheduleTime) {
            alert('Please select a date and time.');
            return;
        }
        if (new Date(scheduleTime) < new Date()) {
            alert('Scheduled time must be in the future.');
            return;
        }
        onSchedule(scheduleTime);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Schedule Send</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none" aria-label="Close schedule send modal">&times;</button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-slate-600 mb-4">Choose a future date and time to send this email.</p>
                    <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-sm"
                        aria-label="Scheduled date and time"
                    />
                </div>
                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                    <button onClick={handleScheduleClick} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Schedule</button>
                </div>
            </div>
        </div>
    );
};

const ToolbarCustomizationModal = ({
    isOpen,
    onClose,
    onSave,
    currentItems,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (items: ToolbarItem[]) => void;
    currentItems: ToolbarItem[];
}) => {
    const [tempItems, setTempItems] = useState(currentItems);

    useEffect(() => {
        setTempItems(currentItems);
    }, [currentItems, isOpen]);

    if (!isOpen) return null;

    const handleToggle = (item: ToolbarItem) => {
        setTempItems(prev =>
            prev.some(i => i.id === item.id)
                ? prev.filter(i => i.id !== item.id)
                : [...prev, item]
        );
    };

    const handleMove = (id: string, direction: 'up' | 'down') => {
        const index = tempItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= tempItems.length) return;

        const newItems = [...tempItems];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setTempItems(newItems);
    };
    
    const visibleItemIds = new Set(tempItems.map(i => i.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Customize Toolbar</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none" aria-label="Close customization modal">&times;</button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-slate-600 mb-4">Select and reorder the tools you want to see in your toolbar.</p>
                    <ul className="space-y-2">
                        {ALL_TOOLBAR_ITEMS.map(item => (
                            <li key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        aria-label={`Toggle ${item.label}`}
                                        className="accent-blue-600"
                                        checked={visibleItemIds.has(item.id)}
                                        onChange={() => handleToggle(item)}
                                    />
                                    <div className="w-6 h-6 flex items-center justify-center">{item.icon}</div>
                                    <span className="text-sm">{item.label}</span>
                                </div>
                                {visibleItemIds.has(item.id) && (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleMove(item.id, 'up')} className="p-1 rounded hover:bg-slate-200" aria-label={`Move ${item.label} up`}>&uarr;</button>
                                        <button onClick={() => handleMove(item.id, 'down')} className="p-1 rounded hover:bg-slate-200" aria-label={`Move ${item.label} down`}>&darr;</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                    <button onClick={() => { onSave(tempItems); onClose(); }} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save</button>
                </div>
            </div>
        </div>
    );
};


const ReplyBox = ({
    email,
    to,
    cc,
    subject,
    setTo,
    setCc,
    setSubject,
    onCancel,
    initialContent,
}: {
    email: Email;
    to: Recipient[];
    cc: Recipient[];
    subject: string;
    setTo: (recipients: Recipient[]) => void;
    setCc: (recipients: Recipient[]) => void;
    setSubject: (subject: string) => void;
    onCancel: () => void;
    initialContent: string;
}) => {
    const [replyContent, setReplyContent] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const [isToolbarSettingsOpen, setIsToolbarSettingsOpen] = useState(false);
    const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const scheduleMenuRef = useRef<HTMLDivElement>(null);
    const [isRewriting, setIsRewriting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [validationErrors, setValidationErrors] = useState<{to: string[], cc: string[]}>({ to: [], cc: [] });
    
    const initialToolbarItems = DEFAULT_TOOLBAR_ITEM_IDS.map(id => ALL_TOOLBAR_ITEMS.find(item => item.id === id)).filter(Boolean) as ToolbarItem[];
    const [toolbarItems, setToolbarItems] = useState<ToolbarItem[]>(initialToolbarItems);

    useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            editor.innerHTML = initialContent;
            
            editor.focus();
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(editor, 0);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }, [initialContent]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (scheduleMenuRef.current && !scheduleMenuRef.current.contains(event.target as Node)) {
                setIsScheduleMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFiles = (files: File[]) => {
        setAttachments(prev => [...prev, ...files]);
    };

    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };
    
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    const handleSend = () => {
        const invalidTo = to.filter(r => !isValidEmail(r.email)).map(r => r.email);
        const invalidCc = cc.filter(r => !isValidEmail(r.email)).map(r => r.email);

        if (invalidTo.length > 0 || invalidCc.length > 0) {
            setValidationErrors({ to: invalidTo, cc: invalidCc });
            alert('Please correct the invalid email addresses highlighted in red.');
            return;
        }
        setValidationErrors({ to: [], cc: [] });

        const content = editorRef.current?.innerHTML || '';
        if (!content.trim() || content === '<br>') {
            alert('Cannot send an empty email.');
            return;
        }
        console.log('--- Sending Email ---');
        console.log('To:', to.map(r => r.email).join(', '));
        console.log('CC:', cc.map(r => r.email).join(', '));
        console.log('Subject:', subject);
        console.log('From:', 'sheldon.cooper@tbbt.com');
        console.log('Body:', content);
        console.log('Attachments:', attachments.map(f => f.name));
        console.log('---------------------');
        if (editorRef.current) editorRef.current.innerHTML = '';
        setReplyContent('');
        setAttachments([]);
        alert('Email sent! (Check the console)');
        onCancel();
    };

    const handleSchedule = (time: string) => {
        console.log('--- Scheduling Email ---');
        console.log('Scheduled time:', time);
        console.log('To:', to.map(r => r.email).join(', '));
        console.log('CC:', cc.map(r => r.email).join(', '));
        console.log('Subject:', subject);
        console.log('Body:', editorRef.current?.innerHTML || '');
        console.log('Attachments:', attachments.map(f => f.name));
        console.log('------------------------');
        alert(`Email scheduled for ${new Date(time).toLocaleString()}! (Check the console)`);
        setIsScheduleModalOpen(false);
        onCancel();
    };

    const handleDiscard = () => {
        if (editorRef.current) editorRef.current.innerHTML = '';
        setReplyContent('');
        setAttachments([]);
        onCancel();
    };
    
    const handleRewrite = async () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (!selection || !selectedText) {
            alert('Please select the text you want to rewrite.');
            return;
        }
        
        const range = selection.getRangeAt(0);
        setIsRewriting(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Rewrite the following text: "${selectedText}"`,
            });
            const rewrittenText = response.text;
            
            const userConfirmed = confirm(`Suggested rewrite:\n\n"${rewrittenText}"\n\nDo you want to replace the selected text?`);

            if (userConfirmed) {
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('insertText', false, rewrittenText);
            }
        } catch (error) {
            console.error('Error rewriting text:', error);
            alert('Failed to rewrite text. Please check the console for details.');
        } finally {
            setIsRewriting(false);
        }
    };

    const handleToolbarAction = (action: ToolbarItem['action']) => {
        if (action.type === 'style') {
            document.execCommand(action.value, false, undefined);
        } else if (action.type === 'function') {
            switch (action.value) {
                case 'attachFile':
                    fileInputRef.current?.click();
                    break;
                case 'insertSignature':
                    const signature = `<br><br>--<br>Regards,<br>Sheldon Cooper`;
                     if (editorRef.current) {
                        editorRef.current.focus();
                        document.execCommand('insertHTML', false, signature);
                     }
                    break;
                case 'rewrite':
                    handleRewrite();
                    break;
            }
        }
         editorRef.current?.focus();
    };
    
    const textToolbarButtonClasses = "flex items-center gap-1 text-sm px-3 h-9 rounded hover:bg-slate-200 text-slate-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400";
    const iconToolbarButtonClasses = "flex items-center justify-center h-9 w-9 rounded hover:bg-slate-200 text-slate-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed";


    return (
        <div className="bg-rose-50 border-t border-slate-200 p-4">
             <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(Array.from(e.target.files || []))} multiple className="hidden" />
             <ScheduleSendModal 
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSchedule={handleSchedule}
             />
             <ToolbarCustomizationModal
                isOpen={isToolbarSettingsOpen}
                onClose={() => setIsToolbarSettingsOpen(false)}
                onSave={setToolbarItems}
                currentItems={toolbarItems}
            />
             <div className="bg-blue-100 text-blue-800 text-sm p-3 rounded-lg mb-4 flex justify-between items-center">
                <p>This mail will be sent to all the members of usa-all@tbbt.com</p>
                <a href="#" className="font-semibold text-blue-600 hover:underline">Share as draft</a>
            </div>
            <div className="text-sm text-slate-600 mb-4 space-y-2">
                <p><span className="font-medium text-slate-700 w-8">From:</span> sheldon.cooper@tbbt.com</p>
                <EditableRecipientField label="To" recipients={to} setRecipients={setTo} invalidEmails={validationErrors.to} />
                <EditableRecipientField label="CC" recipients={cc} setRecipients={setCc} invalidEmails={validationErrors.cc} />
                 <div className="flex items-center gap-2 text-sm text-slate-600 border-t border-slate-200 pt-2">
                    <span className="font-medium text-slate-700 w-8">Subject:</span>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="flex-1 w-full py-1 px-2 bg-transparent border-b border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Subject"
                        aria-label="Email subject"
                    />
                </div>
            </div>
            <div 
                className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                 {isDragging && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-75 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none z-10">
                        <p className="text-blue-600 font-semibold">Drop files here to attach</p>
                    </div>
                 )}
                <div 
                    ref={editorRef}
                    contentEditable={true}
                    className="w-full min-h-[128px] p-4 text-sm resize-none border-none focus:ring-0 focus:outline-none overflow-y-auto"
                    data-placeholder="Great to hear from you!"
                    onInput={(e) => setReplyContent(e.currentTarget.innerHTML)}
                    aria-label="Email reply content"
                ></div>

                {attachments.length > 0 && (
                     <div className="p-2 border-t border-slate-200 bg-slate-50">
                         <ul className="space-y-1">
                             {attachments.map((file, index) => (
                                 <li key={`${file.name}-${index}`} className="flex items-center justify-between text-sm bg-slate-100 p-2 rounded-md">
                                     <div className="flex items-center gap-2 truncate min-w-0">
                                          <PaperclipIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                          <span className="truncate text-slate-700 font-medium">{file.name}</span>
                                          <span className="text-slate-500 flex-shrink-0">({formatBytes(file.size)})</span>
                                     </div>
                                     <button onClick={() => handleRemoveAttachment(index)} className="text-slate-500 hover:text-slate-800 text-xl leading-none p-1 rounded-full hover:bg-slate-200 flex-shrink-0" aria-label={`Remove ${file.name}`}>
                                         &times;
                                     </button>
                                 </li>
                             ))}
                         </ul>
                     </div>
                )}
                
                <div className="flex justify-between items-center border-t border-slate-200 bg-slate-50 p-2">
                    <div className="flex items-center gap-1 text-slate-600">
                        <button className={textToolbarButtonClasses} aria-label="Select font family">SF Pro Text <ChevronDownIcon className="w-3 h-3" /></button>
                        <button className={textToolbarButtonClasses} aria-label="Select font size">14 <ChevronDownIcon className="w-3 h-3" /></button>
                        <div className="h-6 border-l border-slate-300 mx-2"></div>
                        
                        {toolbarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleToolbarAction(item.action)}
                                className={iconToolbarButtonClasses}
                                title={item.label}
                                aria-label={item.label}
                                disabled={item.id === 'rewrite' && isRewriting}
                            >
                                {item.id === 'rewrite' && isRewriting ? (
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    item.icon
                                )}
                            </button>
                        ))}

                        <div className="h-6 border-l border-slate-300 mx-2"></div>
                        <button 
                            onClick={() => setIsToolbarSettingsOpen(true)}
                            className={iconToolbarButtonClasses}
                            title="Customize toolbar"
                            aria-label="Customize toolbar"
                        >
                            <CogIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={handleDiscard}
                            className="font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 py-2 px-4 rounded-full text-sm transition-colors"
                            aria-label="Discard draft"
                        >
                            Discard
                        </button>
                        <div className="flex rounded-full shadow-sm bg-teal-500">
                            <button 
                                onClick={handleSend}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 pl-5 pr-4 rounded-l-full transition-colors duration-200 flex items-center gap-2 text-sm"
                                aria-label="Send email"
                            >
                                Send
                            </button>
                            <div className="relative" ref={scheduleMenuRef}>
                                <button 
                                    onClick={() => setIsScheduleMenuOpen(prev => !prev)}
                                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 pr-4 pl-2 rounded-r-full border-l border-teal-400"
                                    aria-label="More send options"
                                    aria-haspopup="true"
                                    aria-expanded={isScheduleMenuOpen}
                                >
                                    <ChevronDownIcon className="w-4 h-4" />
                                </button>
                                {isScheduleMenuOpen && (
                                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg z-20 border border-slate-200">
                                        <ul className="py-1">
                                            <li>
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setIsScheduleMenuOpen(false);
                                                        setIsScheduleModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                >
                                                    Schedule Send
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface ThreadMessageProps {
    email: Email;
    isExpanded: boolean;
    onToggle: () => void;
}

const RecipientList = ({ recipients }: { recipients: Recipient[] }) => (
    <>
        {recipients.map((r, i) => (
            <React.Fragment key={r.email}>
                <a href={`mailto:${r.email}`} className="text-slate-600 hover:text-slate-900 hover:underline">{r.name}</a>
                {i < recipients.length - 1 && ', '}
            </React.Fragment>
        ))}
    </>
);

const ThreadMessage: React.FC<ThreadMessageProps> = ({ email, isExpanded, onToggle }) => {
    return (
        <div className="border border-slate-200 rounded-lg mb-4 overflow-hidden">
            <div 
                className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''}`}
                onClick={onToggle}
            >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-md flex-shrink-0">
                    {email.senderShort}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <div>
                            <p className="font-bold text-slate-800">{email.sender}</p>
                            <p className="text-sm text-slate-500 truncate">
                                {isExpanded ? 
                                    (
                                        <span className="flex items-baseline gap-1.5">
                                            <span>to</span>
                                            <span className="text-slate-700"><RecipientList recipients={email.to} /></span>
                                        </span>
                                    )
                                : email.snippet}
                            </p>
                        </div>
                        <p className="text-sm text-slate-500 flex-shrink-0 ml-4">{new Date(email.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                 <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            {isExpanded && (
                 <div className="p-6 border-t border-slate-200">
                     <h3 className="text-lg font-bold text-slate-800 mb-4">{email.subject}</h3>
                     <div className="text-sm text-slate-500 mb-6 space-y-1">
                        <p><span className="font-medium text-slate-800">From:</span> <a href={`mailto:${email.senderEmail}`} className="text-slate-600 hover:text-slate-900 hover:underline">{email.sender}</a></p>
                        <p><span className="font-medium text-slate-800">To:</span> <RecipientList recipients={email.to} /></p>
                        {email.cc && email.cc.length > 0 && (
                            <p><span className="font-medium text-slate-800">CC:</span> <RecipientList recipients={email.cc} /></p>
                        )}
                    </div>
                     <div 
                        className="prose prose-sm max-w-none text-slate-700" 
                        dangerouslySetInnerHTML={{ __html: email.body }} 
                    />
                 </div>
            )}
        </div>
    );
};

interface EmailDetailProps {
    thread: Email[] | null;
    onMarkAsUnread?: (emailId: string) => void;
}

const EmailDetail = ({ thread, onMarkAsUnread }: EmailDetailProps) => {
    const [isStarred, setIsStarred] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyTo, setReplyTo] = useState<Recipient[]>([]);
    const [replyCc, setReplyCc] = useState<Recipient[]>([]);
    const [replySubject, setReplySubject] = useState('');
    const [initialReplyContent, setInitialReplyContent] = useState('');
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
    const [subject, setSubject] = useState('');
    const subjectRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (thread && thread.length > 0) {
            const latestMessage = thread[0];
            setIsStarred(latestMessage.isStarred);
            setIsReplying(false);
            setSummary('');
            setExpandedMessageId(latestMessage.id); // Expand the newest message by default
            setSubject(latestMessage.subject.replace(/Re: /g, ''));
        }
    }, [thread]);
    
    useEffect(() => {
        const textarea = subjectRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [subject, thread]);

    useEffect(() => {
        if (!thread) return;

        const timerId = setTimeout(() => {
            console.log('Auto-saving subject:', subject);
        }, 1000);

        return () => {
            clearTimeout(timerId);
        };
    }, [subject, thread]);

    if (!thread) {
        return <div className="h-full flex items-center justify-center text-slate-500">Select a conversation to read</div>;
    }
    
    const latestMessage = thread[0];

    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    const handleSummarize = async () => {
        setIsSummarizing(true);
        setSummary('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const conversationText = thread
                .slice()
                .reverse() // Summarize oldest to newest
                .map(e => `${e.sender}: ${stripHtml(e.body)}`)
                .join('\n\n');

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Summarize the following email conversation in a few sentences:\n\n${conversationText}`,
            });
            setSummary(response.text);
        } catch (error) {
            console.error('Error summarizing email:', error);
            alert('Failed to summarize the email. Please check the console for details.');
        } finally {
            setIsSummarizing(false);
        }
    };
    
    const handleToggleMessage = (messageId: string) => {
        setExpandedMessageId(prev => (prev === messageId ? null : messageId));
    };

    const handleStarToggle = async () => {
        const newStarredState = !isStarred;
        setIsStarred(newStarredState);

        try {
            await api.patch(`/mail/${latestMessage.id}/star`, {
                isStarred: newStarredState
            });
        } catch (error) {
            console.error('Failed to toggle star:', error);
            // Revert on error
            setIsStarred(!newStarredState);
        }
    };

    const handleReply = () => {
        setReplyTo([{ name: latestMessage.sender, email: latestMessage.senderEmail }]);
        setReplyCc([]);
        setReplySubject(latestMessage.subject.startsWith('Re: ') ? latestMessage.subject : `Re: ${latestMessage.subject}`);
        const quoteHeader = `
            <br><br>
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
                    <p><strong>From:</strong> ${latestMessage.sender}</p>
                    <p><strong>Date:</strong> ${new Date(latestMessage.timestamp).toLocaleString()}</p>
                    <p><strong>Subject:</strong> ${latestMessage.subject}</p>
                </div>
                <blockquote style="margin: 0; padding-left: 1em; border-left: 2px solid #d1d5db;">
                    ${latestMessage.body}
                </blockquote>
            </div>`;
        setInitialReplyContent(quoteHeader);
        setIsReplying(true);
    };

    const handleReplyAll = () => {
        const myEmail = "sheldon.cooper@tbbt.com";
        const allRecipients = new Set<string>();
        thread.forEach(email => {
            if (email.senderEmail !== myEmail) allRecipients.add(JSON.stringify({name: email.sender, email: email.senderEmail}));
            email.to.forEach(r => { if (r.email !== myEmail) allRecipients.add(JSON.stringify(r))});
            email.cc?.forEach(r => { if (r.email !== myEmail) allRecipients.add(JSON.stringify(r))});
        });
        
        const uniqueRecipients: Recipient[] = Array.from(allRecipients).map(r => JSON.parse(r));
        const toList = uniqueRecipients.filter(r => r.email === latestMessage.senderEmail);
        const ccList = uniqueRecipients.filter(r => r.email !== latestMessage.senderEmail);

        setReplyTo(toList);
        setReplyCc(ccList);
        setReplySubject(latestMessage.subject.startsWith('Re: ') ? latestMessage.subject : `Re: ${latestMessage.subject}`);
        const quoteHeader = `
            <br><br>
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
                    <p><strong>From:</strong> ${latestMessage.sender}</p>
                    <p><strong>Date:</strong> ${new Date(latestMessage.timestamp).toLocaleString()}</p>
                    <p><strong>Subject:</strong> ${latestMessage.subject}</p>
                </div>
                <blockquote style="margin: 0; padding-left: 1em; border-left: 2px solid #d1d5db;">
                    ${latestMessage.body}
                </blockquote>
            </div>`;
        setInitialReplyContent(quoteHeader);
        setIsReplying(true);
    };

    const handleCancelReply = () => {
        setIsReplying(false);
        setReplyTo([]);
        setReplyCc([]);
        setReplySubject('');
        setInitialReplyContent('');
    };
    

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-2">
                        <textarea
                            ref={subjectRef}
                            rows={1}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Subject"
                            className="w-full text-xl font-bold text-slate-800 p-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors flex-grow placeholder-slate-500 resize-none overflow-hidden"
                            aria-label="Email subject"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button onClick={handleReply} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-100" aria-label="Reply">
                            <ReplyIcon className="w-4 h-4" /> Reply
                        </button>
                        <button onClick={handleReplyAll} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-100" aria-label="Reply to all">
                            <ReplyAllIcon className="w-4 h-4" /> Reply All
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-100" aria-label="Forward">
                            <ReplyIcon className="w-4 h-4 -scale-x-100" /> Forward
                        </button>
                         <button onClick={handleSummarize} disabled={isSummarizing} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-wait" aria-label="Summarize with AI">
                            <SparklesIcon className="w-4 h-4" />
                            {isSummarizing ? 'Summarizing...' : 'Summarize'}
                        </button>
                        <div className="h-6 border-l border-slate-300"></div>
                        <button
                            onClick={handleStarToggle}
                            className={`p-2 border border-transparent rounded-lg hover:bg-slate-100 ${isStarred ? 'text-yellow-500' : 'text-slate-500 hover:text-slate-800'}`}
                            title={isStarred ? "Unstar this conversation" : "Star this conversation"}
                            aria-label={isStarred ? "Unstar this conversation" : "Star this conversation"}
                        >
                            <StarIcon className="w-5 h-5" isFilled={isStarred} />
                        </button>
                        <button
                            onClick={() => onMarkAsUnread && onMarkAsUnread(latestMessage.id)}
                            className="p-2 border border-transparent rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                            title="Mark as unread"
                            aria-label="Mark as unread"
                        >
                            <UnreadIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 border border-transparent rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800" aria-label="More conversation options">
                            <DotsVerticalIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                 {(isSummarizing || summary) && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-center justify-between">
                             <h4 className="font-bold text-blue-800 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5" />
                                AI Summary
                            </h4>
                            {!isSummarizing && (
                                <button onClick={() => setSummary('')} className="text-blue-600 hover:text-blue-900 text-xl leading-none" aria-label="Close summary">&times;</button>
                            )}
                        </div>
                        {isSummarizing ? (
                            <p className="text-blue-700 text-sm mt-2 animate-pulse">Generating summary...</p>
                        ) : (
                            <p className="text-blue-800 text-sm mt-2">{summary}</p>
                        )}
                    </div>
                )}
                
                {thread.slice().reverse().map(email => (
                    <ThreadMessage 
                        key={email.id}
                        email={email}
                        isExpanded={expandedMessageId === email.id}
                        onToggle={() => handleToggleMessage(email.id)}
                    />
                ))}
            </div>
            
            {isReplying && (
                <ReplyBox 
                    email={latestMessage}
                    to={replyTo}
                    cc={replyCc}
                    subject={replySubject}
                    setTo={setReplyTo}
                    setCc={setReplyCc}
                    setSubject={setReplySubject}
                    onCancel={handleCancelReply}
                    initialContent={initialReplyContent}
                />
            )}
        </div>
    );
};

export default EmailDetail;
