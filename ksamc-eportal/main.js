// KSAMC E-Portal - Fixed JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

// Global variables
let currentUser = null;
let applications = [];

// Initialize application
function initApp() {
    console.log('KSAMC E-Portal Initialized');
    
    // Check login status
    checkLoginStatus();
    
    // Setup event listeners
    setupEventListeners();

    

    //NEW SHADELLE
    // Document upload functionality
document.getElementById('uploadDocsBtn').addEventListener('click', showUploadModal);
document.getElementById('closeUploadModal').addEventListener('click', hideAllModals);
document.getElementById('cancelUpload').addEventListener('click', hideAllModals);
document.getElementById('browseBtn').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('saveDocuments').addEventListener('click', saveDocuments);

// Drag and drop events
const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());

//======================================\\

// Show upload modal
function showUploadModal() {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        showLoginModal();
        return;
    }
    
    // Check if there's a current application
    if (applications.length === 0) {
        showNotification('Please create an application first', 'error');
        return;
    }
    
    document.getElementById('uploadModal').style.display = 'flex';
    loadUploadedDocuments();
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// System Requirement 2.1: File validation
function handleFiles(files) {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    let validFiles = [];
    let invalidFiles = [];
    
    Array.from(files).forEach(file => {
        // Validate file type
        if (!allowedTypes.includes(file.type) && 
            !file.name.toLowerCase().endsWith('.pdf') &&
            !file.name.toLowerCase().endsWith('.docx') &&
            !file.name.toLowerCase().endsWith('.jpg') &&
            !file.name.toLowerCase().endsWith('.jpeg')) {
            invalidFiles.push(`${file.name} - Invalid file type`);
            return;
        }
        
        // Validate file size
        if (file.size > maxSize) {
            invalidFiles.push(`${file.name} - File too large (max 10MB)`);
            return;
        }
        
        validFiles.push(file);
    });
    
    // Show errors
    if (invalidFiles.length > 0) {
        showNotification(`Invalid files: ${invalidFiles.join(', ')}`, 'error');
    }
    
    // Upload valid files
    if (validFiles.length > 0) {
        uploadFiles(validFiles);
    }
}

// Upload files to server
function uploadFiles(files) {
    // Show progress bar
    document.getElementById('uploadProgress').style.display = 'block';
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Simulate upload progress (in real app, this would be actual AJAX)
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Uploading... ${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Add files to documents list
            files.forEach(file => {
                addDocumentToList({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: getFileExtension(file.name),
                    size: formatFileSize(file.size),
                    date: new Date().toLocaleString()
                });
            });
            
            // Hide progress bar
            setTimeout(() => {
                document.getElementById('uploadProgress').style.display = 'none';
                progressFill.style.width = '0%';
                showNotification(`${files.length} document(s) uploaded successfully`, 'success');
                document.getElementById('saveDocuments').disabled = false;
            }, 500);
        }
    }, 100);
}

// System Requirement 2.2: Add document to list with edit/delete options
function addDocumentToList(doc) {
    const docsContainer = document.getElementById('docsContainer');
    
    // Remove empty state if present
    const emptyState = docsContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const iconClass = getIconClass(doc.type);
    
    const docElement = document.createElement('div');
    docElement.className = 'document-item';
    docElement.dataset.id = doc.id;
    docElement.innerHTML = `
        <div class="doc-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="doc-info">
            <strong>${doc.name}</strong>
            <small>${doc.type.toUpperCase()} • ${doc.size} • Uploaded: ${doc.date}</small>
        </div>
        <div class="doc-actions">
            <button class="btn-icon edit-doc" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-doc" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    docsContainer.appendChild(docElement);
    
    // Add event listeners for edit and delete
    docElement.querySelector('.edit-doc').addEventListener('click', () => editDocument(doc.id));
    docElement.querySelector('.delete-doc').addEventListener('click', () => deleteDocument(doc.id));
}

// Helper functions
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getIconClass(fileType) {
    switch(fileType) {
        case 'pdf': return 'fa-file-pdf';
        case 'docx': return 'fa-file-word';
        case 'jpg':
        case 'jpeg': return 'fa-file-image';
        default: return 'fa-file';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// System Requirement 2.2: Edit document (rename)
function editDocument(docId) {
    const docElement = document.querySelector(`.document-item[data-id="${docId}"]`);
    const docName = docElement.querySelector('strong');
    const currentName = docName.textContent;
    
    const newName = prompt('Enter new document name (with extension):', currentName);
    if (newName && newName !== currentName) {
        docName.textContent = newName;
        showNotification('Document renamed', 'info');
    }
}

// System Requirement 2.2: Delete document
function deleteDocument(docId) {
    if (confirm('Are you sure you want to delete this document?')) {
        const docElement = document.querySelector(`.document-item[data-id="${docId}"]`);
        docElement.remove();
        
        // Show empty state if no documents left
        const docsContainer = document.getElementById('docsContainer');
        if (docsContainer.children.length === 0) {
            docsContainer.innerHTML = '<div class="empty-state">No documents uploaded yet</div>';
            document.getElementById('saveDocuments').disabled = true;
        }
        
        showNotification('Document deleted', 'success');
    }
}

// System Requirement 2.3: Save documents
function saveDocuments() {
    const docsContainer = document.getElementById('docsContainer');
    const documents = Array.from(docsContainer.querySelectorAll('.document-item')).map(doc => ({
        name: doc.querySelector('strong').textContent,
        type: doc.querySelector('small').textContent.split(' • ')[0].toLowerCase()
    }));
    
    if (documents.length === 0) {
        showNotification('No documents to save', 'error');
        return;
    }
    
    // In real implementation, this would save to server
    showNotification(`${documents.length} document(s) saved successfully`, 'success');
    hideAllModals();
}

function loadUploadedDocuments() {
    // In real implementation, this would load existing documents from server
    // For demo, clear any existing documents
    const docsContainer = document.getElementById('docsContainer');
    docsContainer.innerHTML = '<div class="empty-state">No documents uploaded yet</div>';
    document.getElementById('saveDocuments').disabled = true;
}

    //END SHADELLE CODE
    
    // Load initial data
    loadDashboardData();
}



// Check login status
function fixMissingEmails() {
    const apps = JSON.parse(localStorage.getItem('ksamc_apps') || "[]");

    let updated = false;

    apps.forEach(app => {
        if (!app.email) {
            // assign email from current user IF applicant matches
            if (currentUser && app.applicant === currentUser.username) {
                app.email = currentUser.email;
                updated = true;
            }
        }
    });

    if (updated) {
        localStorage.setItem('ksamc_apps', JSON.stringify(apps));
        console.log(" Missing emails have been added to old applications.");
    }
}

function checkLoginStatus() {
    const userData = localStorage.getItem('ksamc_user');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUIForUser();
        fixMissingEmails();
        showNotification('Welcome back!', 'success');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            switchSection(target.substring(1));
            
            // Close mobile menu if open
            document.getElementById('navMenu').classList.remove('show');
        });
    });
    
    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        document.getElementById('navMenu').classList.toggle('show');
    });
    
    // Login/Logout buttons
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', hideAllModals);
    document.getElementById('cancelModal').addEventListener('click', hideAllModals);
    document.getElementById('closeAppModal').addEventListener('click', hideAllModals);
    document.getElementById('cancelApp').addEventListener('click', hideAllModals);
    
    // Form submissions
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('appForm').addEventListener('submit', submitApplication);
    
    // Action buttons
    document.getElementById('newAppBtn').addEventListener('click', showAppModal);
    document.getElementById('trackAppBtn').addEventListener('click', () => switchSection('track'));
    document.getElementById('trackBtn').addEventListener('click', trackApplication);
    document.getElementById('updateStatusBtn').addEventListener('click', updateApplicationStatus);
    document.getElementById('getStartedBtn').addEventListener('click', showLoginModal);
    document.getElementById('quickUpdateBtn').addEventListener('click', quickUpdateStatus);
    
    //by joshua
    // Search button
    document.querySelector('.btn-search').addEventListener('click', function(e) {
        e.preventDefault();
        const searchTerm = document.querySelector('.search-box input').value;
        if (searchTerm ==="") {
            renderApplicationsTable(applications);
            showNotification(`Searching for: ${searchTerm}`, 'info');
        } else
        {
            searchApplications(searchTerm);
            showNotification(`Filtered results for: ${searchTerm}`, "success")
        }
    });

    // by joshua
    // Status filter
    //document.getElementById("filterStatus").addEventListener("change", function () {
      //  const status = this.value;

//        if (status === "") {
  //          renderApplicationsTable(applications); // show all
    //        return;
      //  }

//        const filtered = applications.filter(app => app.status === status);
  //      renderApplicationsTable(filtered);
    //});



    // Search and Filter buttons
    document.getElementById('searchBtn').addEventListener('click', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    document.getElementById('clearFiltersBtn').addEventListener('click', function(e) {
        e.preventDefault();
        clearFilters();
    });
    
    // Search on Enter key
    document.getElementById('globalSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
    
    // Filter change events
    document.getElementById('statusFilter').addEventListener('change', performSearch);
    document.getElementById('dateFilter').addEventListener('change', performSearch);
    
    // Back to top button
    const backToTop = document.getElementById('backToTop');
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Show/hide back to top button on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        const navMenu = document.getElementById('navMenu');
        const mobileBtn = document.getElementById('mobileMenuBtn');
        if (!navMenu.contains(e.target) && !mobileBtn.contains(e.target)) {
            navMenu.classList.remove('show');
        }
    });
}

// Switch between sections
function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[href="#${sectionId}"]`).classList.add('active');
    
    // Load section data if needed
    switch(sectionId) {
        case 'applications':
            loadApplications();
            break;
        case 'admin':
            loadAdminPanel();
            break;
        case 'dashboard':
            loadDashboardData();
            break;
    }
    
    // Scroll to top of section
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
}

// Authentication handler with proper validation
async function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('authUsername').value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const role = document.getElementById('authRole').value;
    
    // Clear previous errors
    clearAuthErrors();
    
    // Validation
    let isValid = true;
    
    // Username validation
    if (!username) {
        showAuthError('authUsername', 'Username is required');
        isValid = false;
    } else if (username.length < 3) {
        showAuthError('authUsername', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showAuthError('authEmail', 'Email is required');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        showAuthError('authEmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!password) {
        showAuthError('authPassword', 'Password is required');
        isValid = false;
    } else if (!passwordRegex.test(password)) {
        showAuthError('authPassword', 'Password must be at least 8 characters, include a number and a special symbol (@$!%*#?&)');
        isValid = false;
    }
    
    if (!isValid) {
        return;
    }
    
    // Check if user already exists (by email)
    const storedUsers = localStorage.getItem('ksamc_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        if (existingUser.isLoggedIn) {
            showAuthError('authEmail', 'This user is already logged in');
            return;
        }
        // Check password
        if (existingUser.password === password) {
            // Update login status
            existingUser.isLoggedIn = true;
            localStorage.setItem('ksamc_users', JSON.stringify(users));
            
            // Set current user (without storing password)
            const { password: _, ...userWithoutPassword } = existingUser;
            currentUser = userWithoutPassword;
            localStorage.setItem('ksamc_user', JSON.stringify(userWithoutPassword));
        } else {
            showAuthError('authPassword', 'Incorrect password');
            return;
        }
    } else {
        // New user registration
        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            role: role,
            fullName: username.charAt(0).toUpperCase() + username.slice(1),
            isLoggedIn: true,
            createdAt: new Date().toISOString()
        };
        
        // Store user
        users.push(newUser);
        localStorage.setItem('ksamc_users', JSON.stringify(users));
        
        // Set current user (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        currentUser = userWithoutPassword;
        localStorage.setItem('ksamc_user', JSON.stringify(userWithoutPassword));
    }
    
    // Update UI
    updateUIForUser();
    hideAllModals();
    showNotification(`Welcome ${currentUser.fullName}!`, 'success');
    
    // Load user data
    loadDashboardData();
}

// Helper functions for auth validation
function clearAuthErrors() {
    document.querySelectorAll('.auth-error').forEach(el => el.remove());
}

function showAuthError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.createElement('div');
    error.className = 'auth-error';
    error.style.color = '#dc3545';
    error.style.fontSize = '12px';
    error.style.marginTop = '5px';
    error.textContent = message;
    
    // Remove existing error for this field
    const existingError = field.parentElement.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
    
    field.parentElement.appendChild(error);
}

// Update UI based on user role
function updateUIForUser() {
    if (!currentUser) return;
    
    // Update user display
    document.getElementById('currentUser').textContent = currentUser.fullName;
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    
    // Show/hide admin features // RBAC - SAMARA
    const isStaff = currentUser.role !== 'client';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isStaff ? 'block' : 'none';
    });
}

// Logout function
function handleLogout() {
    // Update user login status
    const storedUsers = localStorage.getItem('ksamc_users');
    if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const userIndex = users.findIndex(user => user.email === currentUser?.email);
        if (userIndex !== -1) {
            users[userIndex].isLoggedIn = false;
            localStorage.setItem('ksamc_users', JSON.stringify(users));
        }
    }
    
    localStorage.removeItem('ksamc_user');
    currentUser = null;
    
    // Reset UI
    document.getElementById('currentUser').textContent = 'Guest User';
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
    });
    
    showNotification('Logged out successfully', 'info');
    showLoginModal();
}

// Load dashboard data
function loadDashboardData() {
    // Load applications from localStorage
    const storedApps = localStorage.getItem('ksamc_apps');
    applications = storedApps ? JSON.parse(storedApps) : [];
    
    // Update stats
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'received' || app.status === 'under_review').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    
    document.getElementById('totalApps').textContent = total;
    document.getElementById('pendingApps').textContent = pending;
    document.getElementById('approvedApps').textContent = approved;
    
    // Load recent activity
    if (applications.length > 0) {
        const recentApp = applications[applications.length - 1];
        const activityItem = document.querySelector('.activity-item');
        if (activityItem) {
            activityItem.querySelector('h4').textContent = 'Application Submitted';
            activityItem.querySelector('p').textContent = `${recentApp.tracking_number} - ${recentApp.project_name}`;
            activityItem.querySelector('small').textContent = `${recentApp.date} • ${recentApp.last_updated}`;
        }
    }
    
    // Load quick status update if admin
    if (currentUser && currentUser.role !== 'client') {
        loadQuickStatusUpdate();
    }
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

// Show app modal
function showAppModal() {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        showLoginModal();
        return;
    }
    document.getElementById('appModal').style.display = 'flex';
}

// Hide all modals
function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset forms
    document.getElementById('authForm').reset();
    document.getElementById('appForm').reset();
    clearAuthErrors();
}

// Submit new application
function submitApplication(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login first', 'error');
        showLoginModal();
        return;
    }
    
    const projectName = document.getElementById('projectName').value;
    const propertyAddress = document.getElementById('propertyAddress').value;
    const projectType = document.getElementById('projectType').value;
    const description = document.getElementById('projectDesc').value;
    
    // Validation
    if (!projectName || !propertyAddress) {
        showNotification('Please fill required fields', 'error');
        return;
    }
    
    // Generate tracking number // SAMARA SYS REQ 3.0
    const trackingNumber = 'KSAMC-' + new Date().getFullYear() + '-' + 
                          String(applications.length + 1).padStart(3, '0');
    
    // Create application object with status history
    //edited by joshua 12/4/2025
    const newApp = {
        id: Date.now(),
        tracking_number: trackingNumber,
        project_name: projectName,
        property_address: propertyAddress,
        project_type: projectType,
        description: description,
        status: 'received',
        applicant: currentUser.fullName,
        email: currentUser.email,
        date: new Date().toLocaleDateString(),
        last_updated: new Date().toLocaleString(),
        statusHistory: []
    };
    
    // Add to applications
    applications.push(newApp);
    localStorage.setItem('ksamc_apps', JSON.stringify(applications));
    
    // Send notification
    sendNotification(trackingNumber, 'received', 'Application submitted successfully');
    
    // Success
    showNotification(`Application submitted! Tracking #: ${trackingNumber}`, 'success');
    hideAllModals();
    
    // Refresh data
    loadDashboardData();
    loadApplications();
    
    // Switch to applications section
    switchSection('applications');
}

// Load applications
function loadApplications() {
    // Filter applications for current user if not admin
    let userApps = applications;
    if (currentUser && currentUser.role === 'client') {
        userApps = applications.filter(app => app.email === currentUser.email);
    }
    
    renderApplicationsTable(userApps);
}

// UPDATED by Joshua - System Requirements 6.2 & 6.3
function performSearch() {
    const searchTerm = document.getElementById('globalSearchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filtered = applications;
    
    // Filter by search term (System Requirement 6.2)
    if (searchTerm) {
        filtered = filtered.filter(app =>
            app.tracking_number.toLowerCase().includes(searchTerm) ||
            app.project_name.toLowerCase().includes(searchTerm) ||
            app.property_address.toLowerCase().includes(searchTerm) ||
            (app.applicant && app.applicant.toLowerCase().includes(searchTerm)) ||
            (app.email && app.email.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by status (System Requirement 6.3)
    if (statusFilter) {
        filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Filter by date (System Requirement 6.3)
    if (dateFilter) {
        const now = new Date();
        filtered = filtered.filter(app => {
            const appDate = new Date(app.date);
            switch(dateFilter) {
                case 'today':
                    return appDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date();
                    weekAgo.setDate(now.getDate() - 7);
                    return appDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date();
                    monthAgo.setMonth(now.getMonth() - 1);
                    return appDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    // Filter for current user if not admin (client role)
    if (currentUser && currentUser.role === 'client') {
        filtered = filtered.filter(app => app.email === currentUser.email);
    }
    
    renderApplicationsTable(filtered);
    
    // Show notification with results count
    if (searchTerm || statusFilter || dateFilter) {
        showNotification(`Found ${filtered.length} application(s)`, 'info');
    }
}

function clearFilters() {
    document.getElementById('globalSearchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    loadApplications();
    showNotification('Filters cleared', 'info');
}

function renderApplicationsTable(appList) {
    const tableBody = document.getElementById('appsTableBody');
    tableBody.innerHTML = '';

    if (appList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    ${applications.length === 0 ? 
                        'No applications yet. Click "New Application" to get started.' : 
                        currentUser && currentUser.role === 'client' ?
                        'No applications found for your account.' :
                        'No applications match your search criteria.'}
                </td>
            </tr>
        `;
        return;
    }

    appList.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${app.tracking_number}</strong></td>
            <td>
                <div><strong>${app.project_name}</strong></div>
                <small>${app.project_type} • ${app.property_address.substring(0, 30)}${app.property_address.length > 30 ? '...' : ''}</small>
            </td>
            <td><span class="status-badge ${app.status}">${formatStatus(app.status)}</span></td>
            <td>${app.date}</td>
            <td>
                <button onclick="viewApplication('${app.tracking_number}')" class="btn-action">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Track application - SEARCH 
function trackApplication() {
    const trackingNumber = document.getElementById('trackInput').value.trim();
    
    if (!trackingNumber) {
        showNotification('Please enter a tracking number', 'error');
        return;
    }
    
    // Find application
    const app = applications.find(a => a.tracking_number === trackingNumber);
    
    if (!app) {
        showNotification('Application not found', 'error');
        document.getElementById('trackResult').style.display = 'none';
        return;
    }
    
    // Update display
    document.getElementById('trackNumber').textContent = app.tracking_number;
    document.getElementById('trackStatus').textContent = formatStatus(app.status);
    document.getElementById('trackStatus').className = `status-badge ${app.status}`;
    document.getElementById('trackUpdate').textContent = app.last_updated;
    
    // SAMARA: System Requirement 3.3
    const timeline = document.getElementById('statusTimeline');
    
    // Create status history array
    const statusHistory = [
        {
            date: app.date,
            status: 'Application Submitted',
            description: 'Your application was received by KSAMC',
            timestamp: app.date
        }
    ];
    
    // Add additional status updates from statusHistory if it exists
    if (app.statusHistory && app.statusHistory.length > 0) {
        app.statusHistory.forEach(history => {
            statusHistory.push({
                date: history.date,
                status: history.status,
                description: history.description || 'Status updated',
                timestamp: history.timestamp || history.date
            });
        });
    }
    
    // Always add current status as latest entry
    statusHistory.push({
        date: app.last_updated,
        status: formatStatus(app.status),
        description: getStatusDescription(app.status),
        timestamp: app.last_updated
    });
    
    // Display timeline
    timeline.innerHTML = '';
    
    statusHistory.forEach((item, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        const isActive = index === statusHistory.length - 1;
        const dotColor = isActive ? 'background: var(--primary);' : 'background: var(--gray-400);';
        
        timelineItem.innerHTML = `
            <div class="timeline-dot" style="${dotColor}"></div>
            <div class="timeline-content">
                <span class="timeline-date">${item.date}</span>
                <span class="timeline-status">${item.status}</span>
                <p class="timeline-desc">${item.description}</p>
            </div>
        `;
        timeline.appendChild(timelineItem);
    });
    
    // Show results
    document.getElementById('trackResult').style.display = 'block';
    showNotification('Application found. Status history displayed.', 'success');
}

// Load admin panel RBAC SAMARA
function loadAdminPanel() {
    if (!currentUser || currentUser.role === 'client') return;
    
    // Populate application select
    const appSelect = document.getElementById('appSelect');
    appSelect.innerHTML = '<option value="">Choose application...</option>';
    
    applications.forEach(app => {
        const option = document.createElement('option');
        option.value = app.tracking_number;
        option.textContent = `${app.tracking_number} - ${app.project_name} (${formatStatus(app.status)})`;
        appSelect.appendChild(option);
    });
    
    // Display applications list
    const appsList = document.getElementById('adminAppsList');
    appsList.innerHTML = '';
    
    if (applications.length === 0) {
        appsList.innerHTML = '<p class="empty-state">No applications to manage</p>';
        return;
    }
    
    applications.slice(-5).reverse().forEach(app => {
        const div = document.createElement('div');
        div.className = 'admin-app-item';
        div.innerHTML = `
            <div>
                <strong>${app.tracking_number}</strong>
                <span class="status-badge ${app.status}">${formatStatus(app.status)}</span>
            </div>
            <p>${app.project_name}</p>
            <small>Submitted: ${app.date} • ${app.applicant || 'Unknown'}</small>
        `;
        
        // Make clickable to auto-fill the form
        div.addEventListener('click', () => {
            document.getElementById('appSelect').value = app.tracking_number;
            showNotification(`Selected ${app.tracking_number}`, 'info');
        });
        
        appsList.appendChild(div);
    });
}

// Update application status
function updateApplicationStatus() {
    const trackingNumber = document.getElementById('appSelect').value;
    const newStatus = document.getElementById('statusSelect').value;
    const notes = document.getElementById('statusNotes').value;
    
    if (!trackingNumber || !newStatus) {
        showNotification('Please select application and status', 'error');
        return;
    }
    
    // Find and update application
    const appIndex = applications.findIndex(app => app.tracking_number === trackingNumber);
    
    if (appIndex !== -1) {
        const oldStatus = applications[appIndex].status;
        
        // Save status history before updating
        if (!applications[appIndex].statusHistory) {
            applications[appIndex].statusHistory = [];
        }
        
        // Add current status to history before changing it
        applications[appIndex].statusHistory.push({
            date: applications[appIndex].last_updated,
            status: formatStatus(oldStatus),
            description: notes || 'Status updated by admin',
            timestamp: new Date().toISOString()
        });
        
        // Update current status
        applications[appIndex].status = newStatus;
        applications[appIndex].last_updated = new Date().toLocaleString();
        
        // Save back to localStorage
        localStorage.setItem('ksamc_apps', JSON.stringify(applications));

        emailjs.send("service_q2gger7", "template_wq7261d", {
        tracking: trackingNumber,
        status: newStatus.replace("_", " "),
        notes: notes || "No additional notes provided.",
        recipient_email: applications[appIndex].email   // must exist
    }).then(() => {
        showNotification("Email sent successfully!", "success");
    }).catch((error) => {
        console.error("EmailJS Error:", error);
        showNotification("Status updated but email failed to send.", "error");
        console.log("Full error:", error.status, error.text, error.response);
    });
        
        // Send notification
        sendNotification(trackingNumber, newStatus, notes || 'Status updated');
        
        showNotification(`Status updated to ${formatStatus(newStatus)}`, 'success');
        
        // Refresh data
        loadDashboardData();
        loadApplications();
        loadAdminPanel();
        loadQuickStatusUpdate();
        
        // Clear form
        document.getElementById('statusNotes').value = '';
        document.getElementById('appSelect').value = '';
    } else {
        showNotification('Application not found', 'error');
    }
}

// Load quick status update section
function loadQuickStatusUpdate() {
    if (!currentUser || currentUser.role === 'client') return;
    
    // Show the quick update section
    document.getElementById('quickStatusUpdate').style.display = 'block';
    
    // Populate dropdown
    const quickSelect = document.getElementById('quickAppSelect');
    quickSelect.innerHTML = '<option value="">Select application to update...</option>';
    
    // Add all applications to dropdown
    applications.forEach(app => {
        const option = document.createElement('option');
        option.value = app.tracking_number;
        option.textContent = `${app.tracking_number} - ${app.project_name} (Current: ${formatStatus(app.status)})`;
        quickSelect.appendChild(option);
    });
    
    // If no applications, show message
    if (applications.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No applications available";
        option.disabled = true;
        quickSelect.appendChild(option);
    }
}

// Quick update function
function quickUpdateStatus() {
    const trackingNumber = document.getElementById('quickAppSelect').value;
    const newStatus = document.getElementById('quickStatusSelect').value;
    
    if (!trackingNumber) {
        showNotification('Please select an application', 'error');
        return;
    }
    
    // Find and update application
    const appIndex = applications.findIndex(app => app.tracking_number === trackingNumber);
    
    if (appIndex !== -1) {
        const oldStatus = applications[appIndex].status;
        
        // Save status history
        if (!applications[appIndex].statusHistory) {
            applications[appIndex].statusHistory = [];
        }
        
        applications[appIndex].statusHistory.push({
            date: applications[appIndex].last_updated,
            status: formatStatus(oldStatus),
            description: 'Status updated via dashboard',
            timestamp: new Date().toISOString()
        });
        
        applications[appIndex].status = newStatus;
        applications[appIndex].last_updated = new Date().toLocaleString();
        
        // Save back to localStorage
        localStorage.setItem('ksamc_apps', JSON.stringify(applications));
        
        // Send notification
        sendNotification(trackingNumber, newStatus, 'Status updated via dashboard');
        
        showNotification(`Status updated to ${formatStatus(newStatus)}`, 'success');
        
        // Refresh all data
        loadDashboardData();
        loadApplications();
        loadAdminPanel();
        loadQuickStatusUpdate();
        
        // Reset selection
        document.getElementById('quickAppSelect').value = '';
    }
}

// Helper function to format status for display
function formatStatus(status) {
    const statusMap = {
        'received': 'Received',
        'under_review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'additional_info_required': 'Additional Info Required'
    };
    return statusMap[status] || status.replace('_', ' ');
}

// Helper function to get status description
function getStatusDescription(status) {
    const descriptions = {
        'received': 'Your application is in queue for initial review',
        'under_review': 'KSAMC staff are currently reviewing your application',
        'approved': 'Your application has been approved. Permit will be issued shortly.',
        'rejected': 'Your application did not meet requirements. Please check notes for details.',
        'additional_info_required': 'Additional information is needed to process your application'
    };
    return descriptions[status] || 'Status updated';
}

// View application details
function viewApplication(trackingNumber) {
    switchSection('track');
    document.getElementById('trackInput').value = trackingNumber;
    trackApplication();
}


// changed by joshua 12/3/2025
//function searchApplications(searchTerm) {
  //const filtered = applications.filter(app =>
    //    app.tracking_number.toLowerCase().includes(searchTerm) ||
      //  app.project_name.toLowerCase().includes(searchTerm) ||
        //app.project_type.toLowerCase().includes(searchTerm) ||
        //app.status.toLowerCase().includes(searchTerm)
    //);

    //renderApplicationsTable(filtered);
//}

// Send notification
function sendNotification(trackingNumber, status, message) {
    console.log(`Notification: ${trackingNumber} - ${status} - ${message}`);
    
    const notification = {
        tracking_number: trackingNumber,
        status: status,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    // Store notification
    const notifications = JSON.parse(localStorage.getItem('ksamc_notifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('ksamc_notifications', JSON.stringify(notifications));
    
    // Show UI notification
    showNotification(`Status update sent for ${trackingNumber}`, 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <div>${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Make functions globally available
window.viewApplication = viewApplication;
window.switchSection = switchSection;

// Initialize on load
window.addEventListener('load', initApp);