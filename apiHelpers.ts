import api from './api';

// Move single mail to a folder
export const moveMail = (id: string, to: string) =>
  api.post(`/mail/${id}/move`, { to });

// Mark single mail as read or unread
export const markMailRead = (id: string, read: boolean) =>
  api.patch(`/mail/${id}/${read ? 'read' : 'unread'}`);

// Delete single mail (soft delete to TRASH)
export const deleteMail = (id: string) =>
  api.delete(`/mail/${id}`);

// Permanent delete (cannot be undone)
export const permanentDeleteMail = (id: string) =>
  api.delete(`/mail/${id}/permanent`);

// Bulk operations
export interface BulkActionParams {
  ids: string[];
  action: 'delete' | 'spam' | 'move' | 'read' | 'unread';
  to?: string; // Required for 'move' action
}

export const bulkAction = ({ ids, action, to }: BulkActionParams) =>
  api.post('/mail/bulk', {
    ids: ids.map(id => parseInt(id, 10)), // Convert string IDs to numbers
    action,
    to
  });

// Convenience functions for specific bulk actions
export const bulkDelete = (ids: string[]) =>
  bulkAction({ ids, action: 'delete' });

export const bulkSpam = (ids: string[]) =>
  bulkAction({ ids, action: 'spam' });

export const bulkMove = (ids: string[], to: string) =>
  bulkAction({ ids, action: 'move', to });

export const bulkMarkRead = (ids: string[]) =>
  bulkAction({ ids, action: 'read' });

export const bulkMarkUnread = (ids: string[]) =>
  bulkAction({ ids, action: 'unread' });
