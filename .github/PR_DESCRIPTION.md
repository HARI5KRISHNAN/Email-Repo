## Summary

Fixed multiple critical issues preventing email inbox sync from working:

### Issues Fixed

1. **Backend Container Crash**
   - Fixed imap-simple version from 5.2.0 to 5.1.0 (correct version)

2. **Database Constraints**
   - Added unique constraint on message_id
   - Changed to composite constraint (message_id, folder, owner) to allow same message in multiple folders

3. **IMAP Parsing Errors**
   - Fixed body parsing by fetching entire message instead of TEXT part only
   - Added safety checks for missing email bodies

4. **CORS Issues**
   - Added support for multiple frontend ports (3006, 3007, 5173)

5. **Frontend Display Bug**
   - Fixed missing emails dependency in useMemo hook causing UI not to update

6. **Email Delivery**
   - Created Postfix vmailbox database for virtual mailbox delivery
   - Fixed Postfix to Dovecot delivery pipeline

7. **Self-Sent Emails**
   - Fixed issue where emails sent to yourself only appeared in Sent folder
   - Now correctly appear in both Sent and Inbox folders

### Test Results

✅ Backend syncing 14+ emails from Dovecot via IMAP
✅ Emails displayed correctly in frontend
✅ Sending emails through UI works
✅ Email delivery to recipients' mailboxes functional
✅ Self-sent emails appear in both folders

### Commits Included

- Fix inbox sync issues - allow same message in multiple folders
- Fix inbox display - add emails dependency to useMemo
- Fix CORS to allow multiple frontend ports
- Add test script to verify IMAP sync functionality
- Fix inbox sync issues - mail not appearing in UI
- Fix imap-simple version to 5.1.0
- Fix missing imap-simple dependency causing backend crash
- Add Dovecot diagnostics script

## Testing

Tested with users alice, bob, and charlie sending emails to each other and to themselves. All scenarios working correctly.
