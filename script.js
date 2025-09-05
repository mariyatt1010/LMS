// LocalStorage keys
const KEY_BOOKS = 'lib_books_v1';
const KEY_MEMBERS = 'lib_members_v1';
const KEY_TRANSACTIONS = 'lib_transactions_v1';

// load or initialize
let books = JSON.parse(localStorage.getItem(KEY_BOOKS)) || [];
let members = JSON.parse(localStorage.getItem(KEY_MEMBERS)) || [];
let transactions = JSON.parse(localStorage.getItem(KEY_TRANSACTIONS)) || [];

// SAVE
function saveAll() {
  localStorage.setItem(KEY_BOOKS, JSON.stringify(books));
  localStorage.setItem(KEY_MEMBERS, JSON.stringify(members));
  localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(transactions));
}

/* ---------------- UI update helpers ---------------- */
function updateStats() {
  document.getElementById('totalBooks').innerText = books.length;
  document.getElementById('activeUsers').innerText = members.length;
  document.getElementById('transactionsCount').innerText = transactions.length;
  const availableSum = books.reduce((s,b) => s + (b.availableCopies || 0), 0);
  document.getElementById('availableBooks').innerText = availableSum;
}

/* Show/hide sections */
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  // refresh lists when switching
  if (id === 'books') displayBooks();
  if (id === 'members') displayMembers();
  if (id === 'transactions') displayTransactions();
}

/* ---------------- BOOKS ---------------- */
function validateBookInput(id, title, author, copies) {
  if (!id || !title || !author) { alert('Please fill all book fields'); return false; }
  if (isNaN(copies) || copies <= 0) { alert('Copies should be a positive number'); return false; }
  if (books.find(b => b.id === id)) { alert('Book ID already exists'); return false; }
  return true;
}

function addBook() {
  const id = (document.getElementById('bookIdInput').value || '').trim();
  const title = (document.getElementById('bookTitleInput').value || '').trim();
  const author = (document.getElementById('bookAuthorInput').value || '').trim();
  const copies = parseInt(document.getElementById('bookCopiesInput').value, 10);

  if (!validateBookInput(id, title, author, copies)) return;

  const book = {
    id, title, author,
    totalCopies: copies,
    availableCopies: copies,
    issuedCount: 0
  };
  books.push(book);
  saveAll();
  displayBooks();
  updateStats();
  // clear inputs
  document.getElementById('bookIdInput').value = '';
  document.getElementById('bookTitleInput').value = '';
  document.getElementById('bookAuthorInput').value = '';
  document.getElementById('bookCopiesInput').value = '';
}

function displayBooks(list) {
  const arr = Array.isArray(list) ? list : books;
  const tbody = document.getElementById('booksTbody');
  tbody.innerHTML = '';
  if (!arr.length) {
    tbody.innerHTML = `<tr><td colspan="6">No books found</td></tr>`;
    return;
  }
  arr.forEach((b) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(b.id)}</td>
      <td style="text-align:left;">${escapeHtml(b.title)}</td>
      <td style="text-align:left;">${escapeHtml(b.author)}</td>
      <td>${b.totalCopies}</td>
      <td>${b.availableCopies}</td>
      <td>
        <button class="btn" onclick="issueBook('${b.id}')">Issue</button>
        <button class="btn" onclick="returnBook('${b.id}')">Return</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------------- MEMBERS ---------------- */
function addMember() {
  const id = (document.getElementById('memberIdInput').value || '').trim();
  const name = (document.getElementById('memberNameInput').value || '').trim();
  if (!id || !name) { alert('Please fill member id and name'); return; }
  if (members.find(m => m.id === id)) { alert('Member ID exists'); return; }
  members.push({ id, name, issuedBooks: [] });
  saveAll();
  displayMembers();
  updateStats();
  document.getElementById('memberIdInput').value = '';
  document.getElementById('memberNameInput').value = '';
}

function displayMembers() {
  const tbody = document.getElementById('membersTbody');
  tbody.innerHTML = '';
  if (!members.length) {
    tbody.innerHTML = `<tr><td colspan="3">No members</td></tr>`;
    return;
  }
  members.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(m.id)}</td>
      <td style="text-align:left;">${escapeHtml(m.name)}</td>
      <td>${m.issuedBooks ? m.issuedBooks.length : 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------------- ISSUE / RETURN ---------------- */
function issueBook(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) { alert('Book not found'); return; }
  if (!book.availableCopies || book.availableCopies <= 0) { alert('No copies available'); return; }

  const memberId = prompt(`Enter Member ID to issue book "${book.title}":`);
  if (!memberId) return;
  const member = members.find(m => m.id === memberId.trim());
  if (!member) { alert('Member not found'); return; }

  // prevent duplicate same book to same member
  member.issuedBooks = member.issuedBooks || [];
  if (member.issuedBooks.includes(bookId)) { alert('This member already has this book'); return; }

  member.issuedBooks.push(bookId);
  book.availableCopies = (book.availableCopies || 0) - 1;
  book.issuedCount = (book.issuedCount || 0) + 1;
  transactions.push({ type: 'Issued', bookId: bookId, bookTitle: book.title, memberId: member.id, memberName: member.name, date: new Date().toLocaleString() });
  saveAll();
  displayBooks();
  displayMembers();
  displayTransactions();
  updateStats();
  alert(`Book issued to ${member.name}`);
}

function returnBook(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) { alert('Book not found'); return; }

  const memberId = prompt(`Enter Member ID returning book "${book.title}":`);
  if (!memberId) return;
  const member = members.find(m => m.id === memberId.trim());
  if (!member) { alert('Member not found'); return; }

  member.issuedBooks = member.issuedBooks || [];
  const idx = member.issuedBooks.indexOf(bookId);
  if (idx === -1) { alert('This member does not have this book'); return; }

  member.issuedBooks.splice(idx, 1);
  book.availableCopies = (book.availableCopies || 0) + 1;
  transactions.push({ type: 'Returned', bookId: bookId, bookTitle: book.title, memberId: member.id, memberName: member.name, date: new Date().toLocaleString() });
  saveAll();
  displayBooks();
  displayMembers();
  displayTransactions();
  updateStats();
  alert(`Book returned by ${member.name}`);
}

/* ---------------- SEARCH ---------------- */
function searchBook() {
  const q = (document.getElementById('bookSearchInput').value || '').trim().toLowerCase();
  if (!q) { displayBooks(); return; }
  const filtered = books.filter(b =>
    (b.id && b.id.toLowerCase().includes(q)) ||
    (b.title && b.title.toLowerCase().includes(q)) ||
    (b.author && b.author.toLowerCase().includes(q))
  );
  displayBooks(filtered);
}

/* ---------------- TRANSACTIONS ---------------- */
function displayTransactions() {
  const container = document.getElementById('transactionsList');
  container.innerHTML = '';
  if (!transactions.length) { container.innerHTML = '<p>No transactions yet.</p>'; return; }
  // reverse order latest first
  [...transactions].reverse().forEach(t => {
    const p = document.createElement('p');
    p.innerHTML = `<strong>[${escapeHtml(t.type)}]</strong> ${escapeHtml(t.bookTitle)} — ${escapeHtml(t.memberName)} <span style="opacity:.7">(${escapeHtml(t.date)})</span>`;
    container.appendChild(p);
  });
}

/* ---------------- UTIL ---------------- */
function escapeHtml(s) { if (!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

/* ---------------- INIT ---------------- */
document.getElementById('addBookBtn')?.addEventListener('click', addBook);
document.getElementById('addMemberBtn')?.addEventListener('click', addMember);

// initial rendering
displayBooks();
displayMembers();
displayTransactions();
updateStats();

// expose showSection to global (used by onclick in HTML)
window.showSection = showSection;
window.issueBook = issueBook;
window.returnBook = returnBook;
window.searchBook = searchBook;


