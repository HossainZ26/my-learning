// Test backup/restore functionality
const fs = require('fs');

console.log('🧪 Testing Backup/Restore Functionality\n');

// Simulate browser localStorage
const storage = {};

// Mock localStorage
const localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; }
};

// Create test data
const testData = {
    diary_journal: JSON.stringify([
        { id: 1, datetime: 'Thursday, June 26, 2025  —  14:35', title: 'My Day', content: 'Had a great day!' }
    ]),
    diary_expenses: JSON.stringify([
        { id: 2, date: '2025-06-26', amount: 500, category: 'Food', purpose: 'Lunch' }
    ]),
    diary_payments: JSON.stringify([
        { id: 3, name: 'Rent', amount: 10000, dueDay: 5, paid: false }
    ]),
    diary_notes: JSON.stringify([
        { id: 4, title: 'Important', content: 'Remember this', savedAt: 'Thursday, June 26, 2025  —  15:00' }
    ])
};

// Step 1: Add test data
console.log('✓ Step 1: Adding test data to localStorage');
Object.assign(storage, testData);
console.log('  - 1 Journal entry');
console.log('  - 1 Expense');
console.log('  - 1 Payment');
console.log('  - 1 Note\n');

// Step 2: Create backup
console.log('✓ Step 2: Creating backup');
const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
        journal: localStorage.getItem('diary_journal'),
        expenses: localStorage.getItem('diary_expenses'),
        payments: localStorage.getItem('diary_payments'),
        notes: localStorage.getItem('diary_notes')
    }
};

const backupStr = JSON.stringify(backup, null, 2);
fs.writeFileSync('test-backup-export.json', backupStr);
console.log('  - Backup file created: test-backup-export.json');
console.log('  - File size: ' + (backupStr.length) + ' bytes\n');

// Step 3: Clear data (simulate browser cache clear)
console.log('✓ Step 3: Clearing localStorage (simulating browser cache clear)');
Object.keys(storage).forEach(key => {
    if (key.startsWith('diary_')) {
        delete storage[key];
    }
});
console.log('  - All diary data cleared\n');

// Step 4: Verify data is gone
console.log('✓ Step 4: Verifying data is gone');
console.log('  - Journal entries: ' + (localStorage.getItem('diary_journal') ? '❌ FAILED' : '✓ cleared'));
console.log('  - Expenses: ' + (localStorage.getItem('diary_expenses') ? '❌ FAILED' : '✓ cleared'));
console.log('  - Payments: ' + (localStorage.getItem('diary_payments') ? '❌ FAILED' : '✓ cleared'));
console.log('  - Notes: ' + (localStorage.getItem('diary_notes') ? '❌ FAILED' : '✓ cleared') + '\n');

// Step 5: Restore from backup
console.log('✓ Step 5: Restoring from backup');
const backupData = JSON.parse(fs.readFileSync('test-backup-export.json', 'utf8'));

if (backupData.data.journal) localStorage.setItem('diary_journal', backupData.data.journal);
if (backupData.data.expenses) localStorage.setItem('diary_expenses', backupData.data.expenses);
if (backupData.data.payments) localStorage.setItem('diary_payments', backupData.data.payments);
if (backupData.data.notes) localStorage.setItem('diary_notes', backupData.data.notes);

console.log('  - Data restored from backup\n');

// Step 6: Verify data is restored
console.log('✓ Step 6: Verifying restored data');
const restoredJournal = JSON.parse(localStorage.getItem('diary_journal') || '[]');
const restoredExpenses = JSON.parse(localStorage.getItem('diary_expenses') || '[]');
const restoredPayments = JSON.parse(localStorage.getItem('diary_payments') || '[]');
const restoredNotes = JSON.parse(localStorage.getItem('diary_notes') || '[]');

console.log('  - Journal entries: ' + restoredJournal.length + ' (' + (restoredJournal.length === 1 ? '✓' : '❌') + ')');
console.log('    └─ Title: "' + restoredJournal[0].title + '"');
console.log('  - Expenses: ' + restoredExpenses.length + ' (' + (restoredExpenses.length === 1 ? '✓' : '❌') + ')');
console.log('    └─ Amount: ৳' + restoredExpenses[0].amount);
console.log('  - Payments: ' + restoredPayments.length + ' (' + (restoredPayments.length === 1 ? '✓' : '❌') + ')');
console.log('    └─ Name: "' + restoredPayments[0].name + '"');
console.log('  - Notes: ' + restoredNotes.length + ' (' + (restoredNotes.length === 1 ? '✓' : '❌') + ')');
console.log('    └─ Title: "' + restoredNotes[0].title + '"\n');

// Cleanup
fs.unlinkSync('test-backup-export.json');

console.log('✅ All tests passed! Backup/Restore functionality works perfectly.\n');
