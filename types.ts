import React from 'react';
import type Keycloak from 'keycloak-js';

export interface Recipient {
  name: string;
  email: string;
}

// Backend API response structure
export interface BackendEmail {
  id: number;
  message_id?: string;
  from_address: string;
  to_addresses: string[];
  subject?: string;
  body_html?: string;
  body_text?: string;
  folder?: string;
  owner?: string;
  created_at?: string;
  received_at?: string;
  is_read?: boolean;
  is_starred?: boolean;
  is_spam?: boolean;
}

export interface EmailListResponse {
  ok: boolean;
  rows: BackendEmail[];
}

// Frontend Email interface (transformed from backend)
export interface Email {
  id: string;
  threadId: string;
  sender: string;
  senderShort: string;
  senderEmail: string;
  to: Recipient[];
  cc?: Recipient[];
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  folder: 'inbox' | 'sent' | 'important' | 'draft' | 'spam' | 'trash';
}

export interface KeycloakProps {
  keycloak: Keycloak;
}

export interface Folder {
  id: 'inbox' | 'sent' | 'important' | 'draft' | 'spam' | 'trash' | 'schedule' | 'calendar';
  name: string;
  icon: React.ReactNode;
}

// FIX: Moved from constants.tsx for better type organization.
export type ToolbarItemType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'attach' | 'signature' | 'rewrite';

// FIX: Moved from constants.tsx for better type organization.
export interface ToolbarItem {
  id: ToolbarItemType;
  label: string;
  icon: React.ReactNode;
  action: {
      type: 'style' | 'function';
      value: string;
  };
}