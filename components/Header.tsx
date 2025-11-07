import React from 'react';
// FIX: Imported StarIcon to fix 'Cannot find name 'StarIcon'' error.
import { DotsVerticalIcon, StarIcon } from '../constants';
import { KeycloakProps } from '../types';

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


const Header = ({ keycloak }: KeycloakProps) => {
    const isAuthenticated = keycloak?.authenticated || false;
    const username = keycloak?.tokenParsed?.preferred_username || 'Guest';

    const handleLogin = () => {
        keycloak?.login();
    };

    const handleLogout = () => {
        keycloak?.logout();
    };

    return (
        <header className="bg-white border-b border-slate-200 flex-shrink-0">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <div className="bg-blue-600 p-2 rounded-lg">
                                <StarIcon className="w-6 h-6 text-white" isFilled={true} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">Mailbox</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 text-slate-500">
                        {!isAuthenticated ? (
                            <button
                                onClick={handleLogin}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Login
                            </button>
                        ) : (
                            <>
                                <button className="hover:text-slate-800"><BellIcon /></button>
                                <button className="hover:text-slate-800"><CogIcon /></button>
                                <button className="hover:text-slate-800"><MenuIcon /></button>
                                <div className="relative group">
                                    <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700">
                                        {username.charAt(0).toUpperCase()}
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                                        <div className="px-4 py-2 text-sm text-slate-700 border-b">
                                            {username}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;