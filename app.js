// ============================================================
// APP.JS — My Personal Diary
//
// HOW THIS FILE IS ORGANIZED:
//  Section 1  — Navigation (switching between pages)
//  Section 2  — Mobile Sidebar (open/close)
//  Section 3  — Date & Time helpers
//  Section 4  — Toast notifications (popup messages)
//  Section 5  — Journal (add / delete / show entries)
//  Section 6  — Expenses (add / delete / filter / totals)
//  Section 7  — Monthly Payments (add / mark paid / delete)
//  Section 8  — Notes (save / delete)
//  Section 9  — Calculator
//  Section 10 — Dashboard (Home page data)
//  Section 11 — Print / Save as PDF
//  Section 12 — Utility helpers
//  Section 13 — App initialization (runs on page load)
// ============================================================


// ============================================================
// SECTION 1: NAVIGATION
// Handles switching between the 6 pages
// ============================================================

/**
 * navigate(pageName)
 *
 * Shows one page and hides all others.
 * Also highlights the correct sidebar nav item.
 *
 * @param {string} pageName  e.g. 'home', 'journal', 'expenses'
 */
function navigate(pageName) {
    // --- Step 1: Hide ALL pages ---
    // querySelectorAll returns a list of every element with class 'page'
    document.querySelectorAll('.page').forEach(function(page) {
        page.classList.remove('active');
    });

    // --- Step 2: Remove 'active' from ALL sidebar nav items ---
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });

    // --- Step 3: Show the CORRECT page ---
    // The page IDs are like "page-home", "page-journal", etc.
    var targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // --- Step 4: Highlight the correct nav item ---
    // data-page attribute matches the pageName
    var targetNav = document.querySelector('[data-page="' + pageName + '"]');
    if (targetNav) {
        targetNav.classList.add('active');
    }

    // --- Step 5: Refresh data for that page ---
    if (pageName === 'home')      { updateDashboard(); }
    if (pageName === 'journal')   { updateJournalDatetime(); renderJournalList(); }
    if (pageName === 'expenses')  { renderExpenseList(); updateTotals(); }
    if (pageName === 'payments')  { renderPaymentList(); }
    if (pageName === 'notes')     { renderNotesList(); }

    // --- Step 6: Close mobile sidebar ---
    closeSidebar();
}


// ============================================================
// SECTION 2: MOBILE SIDEBAR
// ============================================================

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
}


// ============================================================
// SECTION 3: DATE & TIME HELPERS
// ============================================================

/**
 * formatDateTime(date)
 * Returns:  "Thursday, June 26, 2025  —  14:35"
 */
function formatDateTime(date) {
    date = date || new Date();

    var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

    return days[date.getDay()] + ', '
        + months[date.getMonth()] + ' '
        + date.getDate() + ', '
        + date.getFullYear()
        + '  \u2014  '   // — em dash
        + padZero(date.getHours()) + ':'
        + padZero(date.getMinutes());
}

/**
 * formatDate(date)
 * Returns:  "2025-06-26"   (YYYY-MM-DD format for date inputs)
 */
function formatDate(date) {
    date = date || new Date();
    return date.getFullYear() + '-'
        + padZero(date.getMonth() + 1) + '-'
        + padZero(date.getDate());
}

/**
 * formatDateDisplay(dateStr)
 * Converts "2025-06-26" → "June 26, 2025"
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
    var parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0];
}

/**
 * padZero(n)
 * Ensures 2-digit format: 5 → "05",  12 → "12"
 */
function padZero(n) {
    return String(n).padStart(2, '0');
}

/**
 * Updates the clock text shown on the home page.
 * Called every second by setInterval.
 */
function updateClock() {
    var el = document.getElementById('current-datetime');
    if (el) {
        el.textContent = formatDateTime(new Date());
    }
}

/**
 * Updates the read-only datetime field in the journal form.
 * Should show the current time when the user opens the form.
 */
function updateJournalDatetime() {
    var el = document.getElementById('journal-datetime');
    if (el) {
        el.value = formatDateTime(new Date());
    }
}


// ============================================================
// SECTION 4: TOAST NOTIFICATIONS
// Small popup messages at the bottom of the screen
// ============================================================

/**
 * showToast(message, type)
 * Displays a temporary popup message.
 *
 * @param {string} message  Text to show
 * @param {string} type     'success' (green), 'error' (red), or '' (dark)
 */
function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;

    // Reset classes then add the type class
    toast.className = 'toast';
    if (type) toast.classList.add(type);

    // Show it (tiny delay so CSS transition works)
    setTimeout(function() { toast.classList.add('show'); }, 10);

    // Hide it after 3 seconds
    setTimeout(function() { toast.classList.remove('show'); }, 3200);
}


// ============================================================
// SECTION 5: JOURNAL
// ============================================================

// ----- 5a. Data: Read and Write to localStorage -----

/**
 * getJournalEntries()
 * Reads saved journal entries from the browser's localStorage.
 * Returns an array of entry objects.
 */
function getJournalEntries() {
    var data = localStorage.getItem('diary_journal');
    // If nothing saved yet, return an empty array
    return data ? JSON.parse(data) : [];
}

/**
 * saveJournalEntries(entries)
 * Saves the entries array to localStorage.
 */
function saveJournalEntries(entries) {
    localStorage.setItem('diary_journal', JSON.stringify(entries));
}

// ----- 5b. Add a new entry -----

function addJournalEntry() {
    var title   = document.getElementById('journal-title').value.trim();
    var content = document.getElementById('journal-content').value.trim();

    // Validation: need at least a title or some content
    if (!title && !content) {
        showToast('Please write something first!', 'error');
        return;
    }

    // Build the entry object
    var entry = {
        id:       Date.now(),                    // unique ID based on current timestamp
        datetime: formatDateTime(new Date()),    // human-readable timestamp
        title:    title || 'Untitled Entry',
        content:  content
    };

    // Get existing entries, add new one at the front (newest first), save
    var entries = getJournalEntries();
    entries.unshift(entry);                      // unshift = add to beginning of array
    saveJournalEntries(entries);

    clearJournalForm();
    renderJournalList();
    updateDashboard();
    showToast('Journal entry saved! ✓', 'success');
}

// ----- 5c. Delete an entry -----

function deleteJournalEntry(id) {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return;

    // Keep all entries EXCEPT the one with the matching id
    var entries = getJournalEntries().filter(function(e) {
        return e.id !== id;
    });

    saveJournalEntries(entries);
    renderJournalList();
    updateDashboard();
    showToast('Entry deleted.', '');
}

// ----- 5d. Render (draw) the entries list in the HTML -----

function renderJournalList() {
    var container = document.getElementById('journal-list');
    var entries   = getJournalEntries();

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-text">No journal entries yet. Start writing above!</p>';
        return;
    }

    // Build HTML string for all entries
    var html = '';
    entries.forEach(function(entry) {
        html += '<div class="entry-card">';

        // Top row: timestamp + delete button
        html +=   '<div class="entry-meta">';
        html +=     '<span class="entry-datetime">🕐 ' + escapeHtml(entry.datetime) + '</span>';
        html +=     '<button class="btn-delete" onclick="deleteJournalEntry(' + entry.id + ')">Delete</button>';
        html +=   '</div>';

        // Title
        html +=   '<div class="entry-title">' + escapeHtml(entry.title) + '</div>';

        // Content (if any)
        if (entry.content) {
            html += '<div class="entry-content">' + escapeHtml(entry.content) + '</div>';
        }

        html += '</div>';
    });

    container.innerHTML = html;
}

// ----- 5e. Clear the journal form -----

function clearJournalForm() {
    document.getElementById('journal-title').value   = '';
    document.getElementById('journal-content').value = '';
    updateJournalDatetime();                          // refresh the timestamp
}


// ============================================================
// SECTION 6: EXPENSES
// ============================================================

// ----- 6a. Data -----

function getExpenses() {
    var data = localStorage.getItem('diary_expenses');
    return data ? JSON.parse(data) : [];
}

function saveExpenses(expenses) {
    localStorage.setItem('diary_expenses', JSON.stringify(expenses));
}

// ----- 6b. Add expense -----

function addExpense() {
    var date     = document.getElementById('expense-date').value;
    var amount   = parseFloat(document.getElementById('expense-amount').value);
    var category = document.getElementById('expense-category').value.trim();
    var purpose  = document.getElementById('expense-purpose').value.trim();

    // Validation
    if (!date) {
        showToast('Please select a date.', 'error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount.', 'error');
        return;
    }

    var expense = {
        id:       Date.now(),
        date:     date,
        amount:   amount,
        category: category || 'General',
        purpose:  purpose
    };

    var expenses = getExpenses();
    expenses.unshift(expense);
    saveExpenses(expenses);

    clearExpenseForm();
    renderExpenseList();
    updateTotals();
    updateDashboard();
    showToast('Expense added! ✓', 'success');
}

// ----- 6c. Delete expense -----

function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    var expenses = getExpenses().filter(function(e) {
        return e.id !== id;
    });

    saveExpenses(expenses);
    renderExpenseList();
    updateTotals();
    updateDashboard();
    showToast('Expense deleted.', '');
}

// ----- 6d. Render expense list -----

function renderExpenseList(filterDate) {
    var container = document.getElementById('expense-list');
    var expenses  = getExpenses();

    // Apply date filter if one is given
    if (filterDate) {
        expenses = expenses.filter(function(e) {
            return e.date === filterDate;
        });
    }

    if (expenses.length === 0) {
        container.innerHTML = filterDate
            ? '<p class="empty-text">No expenses on ' + formatDateDisplay(filterDate) + '.</p>'
            : '<p class="empty-text">No expenses recorded yet.</p>';
        return;
    }

    // Sort: newest date first
    expenses.sort(function(a, b) {
        return b.date.localeCompare(a.date);
    });

    var html = '';
    expenses.forEach(function(exp) {
        html += '<div class="expense-item">';
        html +=   '<div class="expense-amount-badge">৳' + exp.amount.toLocaleString() + '</div>';
        html +=   '<div class="expense-info">';
        html +=     '<div class="expense-category-text">' + escapeHtml(exp.category) + '</div>';
        if (exp.purpose) {
            html += '<div class="expense-purpose-text">' + escapeHtml(exp.purpose) + '</div>';
        }
        html +=     '<div class="expense-date-text">📅 ' + formatDateDisplay(exp.date) + '</div>';
        html +=   '</div>';
        html +=   '<button class="btn-delete" onclick="deleteExpense(' + exp.id + ')">Delete</button>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// ----- 6e. Filter expenses by date -----

function filterExpenses() {
    var filterDate = document.getElementById('expense-filter-date').value;
    renderExpenseList(filterDate || null);
}

function clearExpenseFilter() {
    document.getElementById('expense-filter-date').value = '';
    renderExpenseList(null);
}

// ----- 6f. Calculate and show totals -----

function updateTotals() {
    var expenses   = getExpenses();
    var today      = formatDate(new Date());
    var thisMonth  = today.substring(0, 7);          // "2025-06"

    // Today: only expenses where date === today
    var todayTotal = expenses
        .filter(function(e) { return e.date === today; })
        .reduce(function(sum, e) { return sum + e.amount; }, 0);

    // This month: expenses where date starts with current year-month
    var monthTotal = expenses
        .filter(function(e) { return e.date.startsWith(thisMonth); })
        .reduce(function(sum, e) { return sum + e.amount; }, 0);

    var todayEl = document.getElementById('today-total');
    var monthEl = document.getElementById('month-total');
    if (todayEl) todayEl.textContent = '৳' + todayTotal.toLocaleString();
    if (monthEl) monthEl.textContent = '৳' + monthTotal.toLocaleString();
}

// ----- 6g. Clear expense form -----

function clearExpenseForm() {
    document.getElementById('expense-date').value     = formatDate(new Date());
    document.getElementById('expense-amount').value   = '';
    document.getElementById('expense-category').value = '';
    document.getElementById('expense-purpose').value  = '';
}


// ============================================================
// SECTION 7: MONTHLY PAYMENTS
// ============================================================

// ----- 7a. Data -----

function getPayments() {
    var data = localStorage.getItem('diary_payments');
    return data ? JSON.parse(data) : [];
}

function savePayments(payments) {
    localStorage.setItem('diary_payments', JSON.stringify(payments));
    // Also save the last-update time
    localStorage.setItem('diary_payments_updated', new Date().toISOString());
}

// ----- 7b. Add payment item -----

function addPayment() {
    var name   = document.getElementById('payment-name').value.trim();
    var amount = parseFloat(document.getElementById('payment-amount').value);
    var dueDay = parseInt(document.getElementById('payment-due-day').value);
    var notes  = document.getElementById('payment-notes').value.trim();

    if (!name) {
        showToast('Please enter a payment name.', 'error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount.', 'error');
        return;
    }

    var payment = {
        id:           Date.now(),
        name:         name,
        amount:       amount,
        dueDay:       isNaN(dueDay) ? null : dueDay,
        notes:        notes,
        paid:         false,     // starts as unpaid
        lastPaidDate: null
    };

    var payments = getPayments();
    payments.push(payment);
    savePayments(payments);

    clearPaymentForm();
    renderPaymentList();
    updateDashboard();
    showToast('Payment item added! ✓', 'success');
}

// ----- 7c. Toggle paid / unpaid -----

function togglePaymentPaid(id) {
    var payments = getPayments();

    payments = payments.map(function(p) {
        if (p.id === id) {
            p.paid = !p.paid;
            // Record the date it was marked paid
            p.lastPaidDate = p.paid ? formatDate(new Date()) : null;
        }
        return p;
    });

    savePayments(payments);
    renderPaymentList();
    updateDashboard();

    var payment = payments.find(function(p) { return p.id === id; });
    if (payment) {
        showToast(
            payment.paid
                ? payment.name + ' marked as paid ✓'
                : payment.name + ' marked as unpaid',
            payment.paid ? 'success' : ''
        );
    }
}

// ----- 7d. Reset all to unpaid (for new month) -----

function resetAllPayments() {
    var payments = getPayments();
    if (payments.length === 0) return;

    if (!confirm('Mark ALL payments as unpaid? Use this at the start of a new month.')) return;

    payments = payments.map(function(p) {
        p.paid = false;
        // Don't clear lastPaidDate — it's useful history
        return p;
    });

    savePayments(payments);
    renderPaymentList();
    updateDashboard();
    showToast('All payments reset to unpaid. New month started!', '');
}

// ----- 7e. Delete payment item -----

function deletePayment(id) {
    if (!confirm('Delete this payment item?')) return;

    var payments = getPayments().filter(function(p) {
        return p.id !== id;
    });

    savePayments(payments);
    renderPaymentList();
    updateDashboard();
    showToast('Payment item deleted.', '');
}

// ----- 7f. Render payment list -----

function renderPaymentList() {
    var container = document.getElementById('payment-list');
    var payments  = getPayments();

    // Show last-update time
    var lastUpdateEl = document.getElementById('payments-last-update');
    var lastUpdate   = localStorage.getItem('diary_payments_updated');
    if (lastUpdateEl && lastUpdate) {
        lastUpdateEl.textContent = 'Last updated: ' + formatDateTime(new Date(lastUpdate));
    }

    if (payments.length === 0) {
        container.innerHTML = '<p class="empty-text">No payment items added yet.</p>';
        return;
    }

    // Sort: unpaid first, then paid
    payments.sort(function(a, b) {
        if (a.paid === b.paid) return 0;
        return a.paid ? 1 : -1;
    });

    var html = '';
    payments.forEach(function(p) {
        html += '<div class="payment-card' + (p.paid ? ' paid' : '') + '">';

        // Left side: name, due day, notes, last paid info
        html +=   '<div class="payment-left">';
        html +=     '<div class="payment-name">' + escapeHtml(p.name) + '</div>';
        if (p.dueDay) {
            html += '<div class="payment-due">📅 Due every month on day ' + p.dueDay + '</div>';
        }
        if (p.notes) {
            html += '<div class="payment-due">📌 ' + escapeHtml(p.notes) + '</div>';
        }
        if (p.lastPaidDate) {
            html += '<div class="payment-last-paid">✓ Last paid: ' + formatDateDisplay(p.lastPaidDate) + '</div>';
        }
        html +=   '</div>';

        // Right side: amount + action buttons
        html +=   '<div class="payment-right">';
        html +=     '<span class="payment-amount-text">৳' + p.amount.toLocaleString() + '</span>';

        if (p.paid) {
            html += '<button class="btn-paid" onclick="togglePaymentPaid(' + p.id + ')">✓ Paid</button>';
        } else {
            html += '<button class="btn-mark-paid" onclick="togglePaymentPaid(' + p.id + ')">Mark Paid</button>';
        }

        html +=     '<button class="btn-delete" onclick="deletePayment(' + p.id + ')">Delete</button>';
        html +=   '</div>';

        html += '</div>';
    });

    container.innerHTML = html;
}

// ----- 7g. Clear payment form -----

function clearPaymentForm() {
    document.getElementById('payment-name').value    = '';
    document.getElementById('payment-amount').value  = '';
    document.getElementById('payment-due-day').value = '';
    document.getElementById('payment-notes').value   = '';
}


// ============================================================
// SECTION 8: NOTES
// ============================================================

// ----- 8a. Data -----

function getNotes() {
    var data = localStorage.getItem('diary_notes');
    return data ? JSON.parse(data) : [];
}

function saveNotesData(notes) {
    localStorage.setItem('diary_notes', JSON.stringify(notes));
}

// ----- 8b. Save a note -----

function saveNote() {
    var title   = document.getElementById('note-title').value.trim();
    var content = document.getElementById('note-content').value.trim();

    if (!title && !content) {
        showToast('Please write something!', 'error');
        return;
    }

    var note = {
        id:      Date.now(),
        title:   title || 'Untitled Note',
        content: content,
        savedAt: formatDateTime(new Date())
    };

    var notes = getNotes();
    notes.unshift(note);
    saveNotesData(notes);

    clearNoteForm();
    renderNotesList();
    updateDashboard();
    showToast('Note saved! ✓', 'success');
}

// ----- 8c. Delete a note -----

function deleteNote(id) {
    if (!confirm('Delete this note?')) return;

    var notes = getNotes().filter(function(n) {
        return n.id !== id;
    });

    saveNotesData(notes);
    renderNotesList();
    updateDashboard();
    showToast('Note deleted.', '');
}

// ----- 8d. Render notes grid -----

function renderNotesList() {
    var container = document.getElementById('notes-list');
    var notes     = getNotes();

    if (notes.length === 0) {
        container.innerHTML = '<p class="empty-text">No notes yet. Write something above!</p>';
        return;
    }

    var html = '';
    notes.forEach(function(note) {
        html += '<div class="note-card">';
        html +=   '<div class="note-card-title">' + escapeHtml(note.title) + '</div>';
        html +=   '<div class="note-card-content">' + escapeHtml(note.content) + '</div>';
        html +=   '<div class="note-card-footer">';
        html +=     '<span class="note-saved-at">🕐 ' + escapeHtml(note.savedAt) + '</span>';
        html +=     '<button class="btn-delete" onclick="deleteNote(' + note.id + ')">Delete</button>';
        html +=   '</div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// ----- 8e. Clear note form -----

function clearNoteForm() {
    document.getElementById('note-title').value   = '';
    document.getElementById('note-content').value = '';
}


// ============================================================
// SECTION 9: CALCULATOR
// ============================================================

// This variable stores the expression as the user types it
// Example: after pressing 1, +, 2, calcExpression = "1+2"
var calcExpression = '';

/**
 * calcInput(value)
 * Called when the user presses a calculator button.
 * Appends the value to the expression and updates the display.
 */
function calcInput(value) {
    calcExpression += value;
    document.getElementById('calc-result').textContent = calcExpression;
    document.getElementById('calc-expression').innerHTML = '&nbsp;';
}

/**
 * calcEquals()
 * Evaluates the current expression and shows the result.
 */
function calcEquals() {
    if (!calcExpression) return;

    try {
        // Store the original expression to show above the result
        var displayExpr = calcExpression;

        // Evaluate the math expression safely
        // Function() is safer than eval() for simple arithmetic
        var result = Function('"use strict"; return (' + calcExpression + ')')();

        // Remove floating point precision errors (e.g. 0.1 + 0.2 = 0.30000000004)
        result = parseFloat(result.toFixed(10));

        // Show the expression above and result below
        document.getElementById('calc-expression').textContent = displayExpr + ' =';
        document.getElementById('calc-result').textContent     = result;

        // Next input will continue from the result
        calcExpression = String(result);

    } catch (error) {
        // If the expression is invalid (like "5++3")
        document.getElementById('calc-result').textContent = 'Error';
        document.getElementById('calc-expression').textContent = 'Invalid expression';
        calcExpression = '';
    }
}

/**
 * calcClear()
 * Resets the calculator completely (C button).
 */
function calcClear() {
    calcExpression = '';
    document.getElementById('calc-result').textContent     = '0';
    document.getElementById('calc-expression').innerHTML   = '&nbsp;';
}

/**
 * calcBackspace()
 * Removes the last character typed (⌫ button).
 */
function calcBackspace() {
    calcExpression = calcExpression.slice(0, -1);   // remove last character
    document.getElementById('calc-result').textContent = calcExpression || '0';
}


// ============================================================
// SECTION 10: DASHBOARD (HOME PAGE)
// Updates the 4 summary cards and shows recent journal entries
// ============================================================

function updateDashboard() {
    // --- Journal count ---
    var journalCount = getJournalEntries().length;
    var el = document.getElementById('summary-journal');
    if (el) el.textContent = journalCount;

    // --- Today's expense total ---
    var expenses  = getExpenses();
    var today     = formatDate(new Date());
    var todayTotal = expenses
        .filter(function(e) { return e.date === today; })
        .reduce(function(sum, e) { return sum + e.amount; }, 0);
    var elExp = document.getElementById('summary-expenses');
    if (elExp) elExp.textContent = '৳' + todayTotal.toLocaleString();

    // --- Pending (unpaid) payments count ---
    var pending = getPayments().filter(function(p) { return !p.paid; }).length;
    var elPay = document.getElementById('summary-payments');
    if (elPay) elPay.textContent = pending;

    // --- Notes count ---
    var notesCount = getNotes().length;
    var elNotes = document.getElementById('summary-notes');
    if (elNotes) elNotes.textContent = notesCount;

    // --- Render recent journal entries ---
    renderHomeRecentJournal();
}

/**
 * Shows the 3 most recent journal entries on the Home page
 */
function renderHomeRecentJournal() {
    var container = document.getElementById('home-recent-journal');
    if (!container) return;

    var entries = getJournalEntries().slice(0, 3);  // only first 3

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-text">No entries yet. '
            + '<button class="btn-link" onclick="navigate(\'journal\')">Write your first entry →</button></p>';
        return;
    }

    var html = '';
    entries.forEach(function(entry) {
        // Show only a short preview of content (first 100 characters)
        var preview = '';
        if (entry.content) {
            preview = entry.content.length > 100
                ? entry.content.substring(0, 100) + '...'
                : entry.content;
        }

        html += '<div class="entry-card">';
        html +=   '<div class="entry-meta">';
        html +=     '<span class="entry-datetime">🕐 ' + escapeHtml(entry.datetime) + '</span>';
        html +=   '</div>';
        html +=   '<div class="entry-title">' + escapeHtml(entry.title) + '</div>';
        if (preview) {
            html += '<div class="entry-content">' + escapeHtml(preview) + '</div>';
        }
        html += '</div>';
    });

    container.innerHTML = html;
}


// ============================================================
// SECTION 11: PRINT / SAVE AS PDF
// Opens browser's print dialog. User can choose "Save as PDF".
// ============================================================

/**
 * printJournal()
 * Fills the hidden #print-area with journal entries, then opens print dialog.
 */
function printJournal() {
    var entries = getJournalEntries();

    if (entries.length === 0) {
        showToast('No journal entries to print.', 'error');
        return;
    }

    var html = '';
    html += '<div style="font-family: Georgia, serif; color: #111;">';
    html +=   '<h1 style="font-size: 22pt; margin-bottom: 6pt;">📓 My Daily Journal</h1>';
    html +=   '<p style="color: #777; font-size: 10pt; margin-bottom: 18pt;">';
    html +=     'Printed on ' + formatDateTime(new Date());
    html +=   '</p>';
    html +=   '<hr style="border: 1px solid #ddd; margin-bottom: 20pt;">';

    entries.forEach(function(entry) {
        html += '<div class="print-entry" style="margin-bottom: 22pt; padding-bottom: 18pt; border-bottom: 1px solid #eee;">';
        html +=   '<p style="font-size: 9pt; color: #999; margin-bottom: 5pt;">' + escapeHtml(entry.datetime) + '</p>';
        html +=   '<h3 style="font-size: 14pt; margin-bottom: 10pt;">' + escapeHtml(entry.title) + '</h3>';
        if (entry.content) {
            html += '<p style="font-size: 11pt; line-height: 1.8; white-space: pre-wrap;">' + escapeHtml(entry.content) + '</p>';
        }
        html += '</div>';
    });

    html += '</div>';

    document.getElementById('print-area').innerHTML = html;
    window.print();
}

/**
 * printExpenses()
 * Fills the hidden #print-area with a formatted expense table, then opens print dialog.
 */
function printExpenses() {
    var expenses = getExpenses();

    if (expenses.length === 0) {
        showToast('No expenses to print.', 'error');
        return;
    }

    // Sort by date (newest first)
    expenses.sort(function(a, b) { return b.date.localeCompare(a.date); });

    // Calculate total
    var total = expenses.reduce(function(sum, e) { return sum + e.amount; }, 0);

    var html = '';
    html += '<div style="font-family: Georgia, serif; color: #111;">';
    html +=   '<h1 style="font-size: 22pt; margin-bottom: 6pt;">💰 Expense Report</h1>';
    html +=   '<p style="color: #777; font-size: 10pt; margin-bottom: 6pt;">Printed on ' + formatDateTime(new Date()) + '</p>';
    html +=   '<p style="font-size: 13pt; font-weight: bold; margin-bottom: 18pt;">Grand Total: ৳' + total.toLocaleString() + '</p>';
    html +=   '<hr style="border: 1px solid #ddd; margin-bottom: 16pt;">';

    // Table
    html += '<table style="width:100%; border-collapse: collapse; font-size: 10pt;">';
    html +=   '<thead>';
    html +=     '<tr style="background: #f0f0f0;">';
    html +=       '<th style="padding: 8pt; text-align: left; border: 1px solid #ccc;">Date</th>';
    html +=       '<th style="padding: 8pt; text-align: left; border: 1px solid #ccc;">Category</th>';
    html +=       '<th style="padding: 8pt; text-align: left; border: 1px solid #ccc;">Purpose</th>';
    html +=       '<th style="padding: 8pt; text-align: right; border: 1px solid #ccc;">Amount (৳)</th>';
    html +=     '</tr>';
    html +=   '</thead>';
    html +=   '<tbody>';

    expenses.forEach(function(exp) {
        html += '<tr>';
        html +=   '<td style="padding: 6pt 8pt; border: 1px solid #ddd;">' + formatDateDisplay(exp.date) + '</td>';
        html +=   '<td style="padding: 6pt 8pt; border: 1px solid #ddd;">' + escapeHtml(exp.category) + '</td>';
        html +=   '<td style="padding: 6pt 8pt; border: 1px solid #ddd;">' + escapeHtml(exp.purpose || '-') + '</td>';
        html +=   '<td style="padding: 6pt 8pt; border: 1px solid #ddd; text-align: right;">৳' + exp.amount.toLocaleString() + '</td>';
        html += '</tr>';
    });

    // Total row
    html +=   '<tr style="font-weight: bold; background: #f9f9f9;">';
    html +=     '<td colspan="3" style="padding: 8pt; border: 1px solid #ccc; text-align: right;">TOTAL</td>';
    html +=     '<td style="padding: 8pt; border: 1px solid #ccc; text-align: right;">৳' + total.toLocaleString() + '</td>';
    html +=   '</tr>';

    html +=   '</tbody>';
    html += '</table>';
    html += '</div>';

    document.getElementById('print-area').innerHTML = html;
    window.print();
}


// ============================================================
// SECTION 12: UTILITY HELPERS
// ============================================================

/**
 * escapeHtml(text)
 *
 * IMPORTANT SECURITY FUNCTION.
 * When you put user input directly into HTML, someone could type
 * malicious code like <script>...</script>. This function converts
 * special characters to safe versions so they display as text only.
 *
 * Example:  "<b>hello</b>"  becomes  "&lt;b&gt;hello&lt;/b&gt;"
 */
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}


// ============================================================
// SECTION 13: APP INITIALIZATION
// This function runs once when the page first loads.
// ============================================================

function init() {
    // ----- Set up sidebar navigation click events -----
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var page = this.getAttribute('data-page');
            navigate(page);
        });
    });

    // ----- Set default values in forms -----
    // Expense date defaults to today
    var expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput) {
        expenseDateInput.value = formatDate(new Date());
    }

    // Journal datetime shows current time
    updateJournalDatetime();

    // ----- Start the live clock on Home page -----
    // updateClock() runs every 1000 milliseconds (1 second)
    setInterval(updateClock, 1000);
    updateClock();   // call once immediately so it doesn't wait 1 second

    // Also update journal datetime every minute
    setInterval(updateJournalDatetime, 60000);

    // ----- Load the Home page data -----
    updateDashboard();

    // ----- Keyboard shortcuts for the Calculator -----
    document.addEventListener('keydown', function(e) {
        // Only work when the Calculator page is active
        var activePage = document.querySelector('.page.active');
        if (!activePage || activePage.id !== 'page-calculator') return;

        // Number keys
        if (e.key >= '0' && e.key <= '9') { calcInput(e.key); return; }

        // Operators and special keys
        if (e.key === '.')        { calcInput('.'); return; }
        if (e.key === '+')        { calcInput('+'); return; }
        if (e.key === '-')        { calcInput('-'); return; }
        if (e.key === '*')        { calcInput('*'); return; }
        if (e.key === '/')        { e.preventDefault(); calcInput('/'); return; }  // prevent browser find shortcut
        if (e.key === 'Enter' || e.key === '=') { calcEquals(); return; }
        if (e.key === 'Backspace') { calcBackspace(); return; }
        if (e.key === 'Escape')    { calcClear(); return; }
    });

    // ----- Done! -----
    console.log('✓ My Personal Diary loaded successfully!');
    console.log('  All data is saved to your browser\'s localStorage.');
    console.log('  localStorage stays on YOUR computer only — private and offline.');
}

// Run init() when the whole page (HTML) has finished loading
document.addEventListener('DOMContentLoaded', init);