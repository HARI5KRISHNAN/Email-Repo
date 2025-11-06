import { BackendEmail, Email } from './types';

/**
 * Transforms a backend email to frontend email format
 */
export function transformBackendEmail(backendEmail: BackendEmail, folder: Email['folder'] = 'inbox'): Email {
  // Extract name and email from "Name <email>" format or just use email
  const parseEmailAddress = (address: string): { name: string; email: string; short: string } => {
    const match = address.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      const name = match[1].trim();
      const email = match[2].trim();
      const short = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return { name, email, short };
    }
    // Just email address
    const parts = address.split('@')[0].split('.');
    const short = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return { name: address, email: address, short };
  };

  const sender = parseEmailAddress(backendEmail.from_address || 'unknown');
  const recipients = (backendEmail.to_addresses || [])
    .map(addr => {
      const parsed = parseEmailAddress(addr.trim());
      return { name: parsed.name, email: parsed.email };
    });

  // Create a snippet from the email body
  const createSnippet = (body: string, maxLength: number = 100): string => {
    // Remove HTML tags
    const text = body.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const body = backendEmail.body_html || backendEmail.body_text || '';

  return {
    id: String(backendEmail.id),
    threadId: `thread-${backendEmail.id}`, // Simple thread ID for now
    sender: sender.name,
    senderShort: sender.short,
    senderEmail: sender.email,
    to: recipients,
    subject: backendEmail.subject || '(No Subject)',
    snippet: createSnippet(body),
    body: body,
    timestamp: backendEmail.received_at || backendEmail.created_at || new Date().toISOString(),
    isRead: backendEmail.is_read ?? false,
    isStarred: backendEmail.is_starred ?? false,
    isImportant: backendEmail.folder === 'important',
    folder: (backendEmail.folder?.toLowerCase() || folder) as Email['folder'],
  };
}

/**
 * Transforms an array of backend emails to frontend format
 */
export function transformBackendEmails(backendEmails: BackendEmail[], folder: Email['folder'] = 'inbox'): Email[] {
  return backendEmails.map(email => transformBackendEmail(email, folder));
}
