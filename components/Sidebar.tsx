
import React, { useState } from 'react';
import { Folder } from '../types';

interface SidebarProps {
    folders: Folder[];
    selectedFolder: string;
    onSelectFolder: (folderId: Folder['id']) => void;
    onCompose?: () => void;
    counts?: { inbox: number; sent: number; important: number; spam: number; trash: number };
    onEmailDrop?: (emailId: string, targetFolder: string) => void;
}

const Sidebar = ({ folders, selectedFolder, onSelectFolder, onCompose, counts, onEmailDrop }: SidebarProps) => {
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolder(folderId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverFolder(null);
    };

    const handleDrop = (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolder(null);

        const emailId = e.dataTransfer.getData('emailId');
        if (emailId && onEmailDrop) {
            onEmailDrop(emailId, folderId.toUpperCase());
        }
    };

    return (
        <aside className="w-64 bg-white flex-shrink-0 px-4 py-6 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        SC
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Sheldon Cooper</p>
                        <p className="text-sm text-slate-500">sheldon.cooper@tbbt.com</p>
                    </div>
                </div>

                <button
                    onClick={onCompose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    Compose mail
                </button>

                <nav>
                    <ul>
                        {folders.map(folder => (
                            <li
                                key={folder.id}
                                onDragOver={(e) => handleDragOver(e, folder.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, folder.id)}
                            >
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); onSelectFolder(folder.id); }}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                        selectedFolder === folder.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : dragOverFolder === folder.id
                                        ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {folder.icon}
                                        <span>{folder.name}</span>
                                    </div>
                                    {counts && counts[folder.id as keyof typeof counts] > 0 && folder.id !== 'spam' && folder.id !== 'trash' && (
                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {counts[folder.id as keyof typeof counts]}
                                        </span>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
