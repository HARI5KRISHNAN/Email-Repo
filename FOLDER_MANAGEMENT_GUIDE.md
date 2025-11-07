# Folder Management & Bulk Actions - Implementation Guide

## Overview

Complete folder management system with Spam, Trash folders and bulk operations for moving, deleting, and marking emails.

## What's Been Added

### 📁 New Folders
- **Spam**: For spam/junk emails
- **Trash**: For deleted emails (soft delete)

### 🔧 Database Changes

**Migration 007** (`backend/migrations/007_add_spam_column.sql`):
- Added `is_spam` boolean column (default: false)
- Added indexes for performance:
  - `idx_mails_spam` - For spam queries
  - `idx_mails_folder_owner` - For folder + owner queries

**Note**: `folder` and `is_read` columns already exist from previous migrations.

### 🚀 Backend API Endpoints

#### Single Email Operations

**POST /api/mail/:id/move**
- Move email to any folder (INBOX, SPAM, TRASH, etc.)
- Request body: `{ "to": "SPAM" }`
- Auto-sets `is_spam = true` when moving to SPAM
- Returns updated email

**DELETE /api/mail/:id**
- Soft delete: moves email to TRASH folder
- Email can be recovered from trash
- Returns success status

**DELETE /api/mail/:id/permanent**
- ⚠️ Permanent delete from database
- Cannot be undone - use with caution!
- Returns success status

#### Bulk Operations

**POST /api/mail/bulk**
- Perform actions on multiple emails at once
- Request body: `{ "ids": [1, 2, 3], "action": "delete" }`
- Supported actions:
  - `"delete"` - Move to TRASH
  - `"spam"` - Move to SPAM folder
  - `"move"` - Move to specified folder (requires `"to"` param)
  - `"read"` - Mark as read
  - `"unread"` - Mark as unread
- Returns count of affected emails

#### Folder Endpoints

**GET /api/mail/spam**
- Fetch all emails in SPAM folder
- Includes permission checks
- Returns array of emails

**GET /api/mail/trash**
- Fetch all emails in TRASH folder
- Includes permission checks
- Returns array of emails

**GET /api/mail/counts** (updated)
- Now returns counts for all folders:
  - `inbox`: Unread emails in inbox
  - `sent`: Unread emails in sent
  - `important`: Unread starred emails
  - `spam`: All emails in spam
  - `trash`: All emails in trash

### 🎨 Frontend Changes

**New Types** (`types.ts`):
- Added `spam` to Email folder type
- Added `is_spam` to BackendEmail interface
- Updated Folder type to include spam

**Updated Constants** (`constants.tsx`):
- Added Spam folder to sidebar (with Archive icon)
- Trash folder already existed

**App.tsx**:
- Updated endpoint routing for spam/trash folders
- Updated folderCounts state to include spam and trash

**New API Helpers** (`apiHelpers.ts`):
```typescript
// Single operations
moveMail(id, to)           // Move single email
markMailRead(id, read)     // Mark as read/unread
deleteMail(id)             // Soft delete
permanentDeleteMail(id)    // Permanent delete

// Bulk operations
bulkAction({ ids, action, to })  // Generic bulk action
bulkDelete(ids)                  // Bulk move to trash
bulkSpam(ids)                    // Bulk move to spam
bulkMove(ids, to)                // Bulk move to folder
bulkMarkRead(ids)                // Bulk mark as read
bulkMarkUnread(ids)              // Bulk mark as unread
```

## 🧪 Testing Instructions

### 1. Run Database Migration

```bash
# Restart backend to auto-run migrations
docker compose restart backend

# Or run migration manually
docker exec -it pilot180-backend node scripts/migrate.js

# Verify migration
docker exec -it pilot180-mail-postgres psql -U postgres -d pilot180mail -c "\d mails"
```

### 2. Test Single Email Operations

**Move to Spam:**
```bash
curl -X POST http://localhost:8081/api/mail/1/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "SPAM"}'
```

**Soft Delete:**
```bash
curl -X DELETE http://localhost:8081/api/mail/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Move back to Inbox:**
```bash
curl -X POST http://localhost:8081/api/mail/1/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "INBOX"}'
```

### 3. Test Bulk Operations

**Bulk Delete:**
```bash
curl -X POST http://localhost:8081/api/mail/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3], "action": "delete"}'
```

**Bulk Move to Spam:**
```bash
curl -X POST http://localhost:8081/api/mail/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids": [4, 5, 6], "action": "spam"}'
```

**Bulk Mark as Read:**
```bash
curl -X POST http://localhost:8081/api/mail/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids": [7, 8, 9], "action": "read"}'
```

### 4. Test Folder Endpoints

**Fetch Spam:**
```bash
curl http://localhost:8081/api/mail/spam \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Fetch Trash:**
```bash
curl http://localhost:8081/api/mail/trash \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Counts:**
```bash
curl http://localhost:8081/api/mail/counts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Verify in Database

```sql
-- Check folder distribution
SELECT folder, COUNT(*) as count
FROM mails
GROUP BY folder;

-- Check spam emails
SELECT id, subject, folder, is_spam
FROM mails
WHERE folder = 'SPAM';

-- Check trash emails
SELECT id, subject, folder
FROM mails
WHERE folder = 'TRASH';
```

### 6. Frontend Testing

1. **Rebuild and restart:**
```bash
docker compose down
docker compose build
docker compose up -d
```

2. **In Browser:**
   - Check sidebar shows Spam and Trash folders with counts
   - Click Spam folder - should show spam emails
   - Click Trash folder - should show deleted emails
   - Verify counts update correctly

## 🔐 Security Features

- ✅ All endpoints require authentication
- ✅ Permission checks on every operation
- ✅ Users can only move/delete their own emails or emails sent to them
- ✅ Bulk operations filter out unauthorized emails automatically
- ✅ SQL injection protection via parameterized queries

## 📊 Usage Examples

### Frontend Usage

```typescript
import {
  moveMail,
  deleteMail,
  bulkSpam,
  bulkMarkRead
} from './apiHelpers';

// Move single email to spam
await moveMail('123', 'SPAM');

// Delete single email
await deleteMail('456');

// Mark multiple emails as spam
await bulkSpam(['1', '2', '3']);

// Mark multiple as read
await bulkMarkRead(['4', '5', '6']);
```

### Integration with UI Components

The API helpers are ready to be integrated with your UI components for:
- Multi-select checkboxes in EmailList
- Bulk action toolbar
- Context menus
- Drag and drop to folders

## 🚦 Next Steps

To complete the UI integration (not yet implemented):
1. Add checkboxes to EmailList component for multi-select
2. Add bulk action toolbar when items are selected
3. Wire up toolbar buttons to bulk API helpers
4. Add confirmation dialogs for delete operations
5. Add undo functionality for trash (move back to original folder)
6. Add "Empty Trash" button for permanent delete all in trash

## 📝 Notes

- **Soft delete is default** - emails moved to TRASH can be recovered
- **Permanent delete is available** but use with caution
- **SPAM folder** automatically sets `is_spam = true`
- **Counts refresh automatically** after operations
- **Backend migration** runs automatically on container start

## 🐛 Troubleshooting

**Migration not running:**
```bash
docker compose restart backend
docker logs pilot180-backend -f
```

**Counts not updating:**
```bash
# Check backend logs for errors
docker logs pilot180-backend -f

# Verify is_spam column exists
docker exec -it pilot180-mail-postgres psql -U postgres -d pilot180mail -c "\d mails"
```

**Permission errors:**
```bash
# Check token is valid
# Verify user owns the email or is in to_addresses
SELECT id, owner, to_addresses FROM mails WHERE id = YOUR_EMAIL_ID;
```

## ✅ All Changes Committed

Commit: `f5ad20f` - "Add folder management with Spam/Trash and bulk actions functionality"

All code is pushed to branch: `claude/debug-mail-inbox-sync-011CUpUjKnnke71Qo5WpVZVQ`
