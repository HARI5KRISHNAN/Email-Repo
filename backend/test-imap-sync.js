// Test script to verify IMAP sync works
import { fetchImapEmails } from './services/imapService.js';

console.log('🧪 Testing IMAP sync for bob@pilot180.local...\n');

try {
  await fetchImapEmails('bob@pilot180.local', 'password');
  console.log('\n✅ IMAP sync test completed!');
  console.log('Check the database for synced emails.');
  process.exit(0);
} catch (err) {
  console.error('\n❌ IMAP sync test failed:', err.message);
  process.exit(1);
}
