// Admin Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!AuthService.isAuthenticated() || !AuthService.hasRole('admin')) {
        window.location.href = '../index.html';
        return;
    }

    // Initialize UI components
    initSidebar();
    updateUserInfo();
    loadDashboardStats();
    setupEventListeners();
    loadRecentActivity();
});

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    // Toggle sidebar on mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('sidebar-toggled');
            sidebar.classList.toggle('toggled');
            
            if (sidebar.classList.contains('toggled')) {
                sidebar.style.marginLeft = `-${sidebar.offsetWidth}px`;
                mainContent.style.marginLeft = '0';
            } else {
                sidebar.style.marginLeft = '0';
                mainContent.style.marginLeft = `${sidebar.offsetWidth}px`;
            }
        });
    }
    
    // Handle sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Handle logout button
            if (this.id === 'logoutBtn' || this.id === 'logoutBtn2') {
                e.preventDefault();
                AuthService.logout();
                return;
            }
            
            // Handle other navigation
            if (this.dataset.section) {
                e.preventDefault();
                const section = this.dataset.section;
                loadSection(section);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Update page title
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = this.textContent.trim();
                }
            }
        });
    });
}

// Update user info in the top bar
function updateUserInfo() {
    const currentUser = AuthService.getCurrentUser();
    const userElement = document.getElementById('currentUser');
    
    if (userElement && currentUser) {
        userElement.textContent = currentUser.name;
    }
}

// Load dashboard statistics
function loadDashboardStats() {
    const users = StorageService.getUsers();
    const teachers = users.filter(user => user.role === 'teacher');
    const students = users.filter(user => user.role === 'student');
    const pendingApprovals = students.filter(student => !student.approved).length;
    
    // Update UI
    document.getElementById('teacherCount').textContent = teachers.length;
    document.getElementById('studentCount').textContent = students.length;
    document.getElementById('pendingCount').textContent = pendingApprovals;
    
    // Load pending approvals if on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        loadPendingApprovals();
    }
}

// Load pending approvals
function loadPendingApprovals() {
    const pendingSection = document.getElementById('pendingApprovalsSection');
    if (!pendingSection) return;
    
    const users = StorageService.getUsers();
    const pendingStudents = users.filter(user => user.role === 'student' && !user.approved);
    
    if (pendingStudents.length === 0) {
        pendingSection.innerHTML = `
            <div class="alert alert-info">
                No pending student approvals at this time.
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Pending Student Approvals</h5>
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Registration Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    pendingStudents.forEach(student => {
        html += `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${new Date(student.registrationDate || Date.now()).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-success me-2" onclick="approveStudent('${student.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectStudent('${student.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    pendingSection.innerHTML = html;
}

// Approve student
function approveStudent(studentId) {
    if (!confirm('Are you sure you want to approve this student?')) return;
    
    const users = StorageService.getUsers();
    const userIndex = users.findIndex(u => u.id === studentId);
    
    if (userIndex !== -1) {
        users[userIndex].approved = true;
        StorageService.saveUsers(users);
        showToast('Student approved successfully', 'success');
        loadDashboardStats(); // Refresh the dashboard
        loadStudentsSection(); // Refresh the students list
    }
}

// Approve teacher
function approveTeacher(teacherId) {
    if (!confirm('Are you sure you want to approve this teacher?')) return;
    
    const users = StorageService.getUsers();
    const userIndex = users.findIndex(u => u.id === teacherId);
    
    if (userIndex !== -1) {
        users[userIndex].approved = true;
        StorageService.saveUsers(users);
        showToast('Teacher approved successfully', 'success');
        loadTeachersSection(); // Refresh the teachers list
    }
}

// Reject student
function rejectStudent(studentId) {
    if (!confirm('Are you sure you want to reject this student? This action cannot be undone.')) return;
    
    const users = StorageService.getUsers();
    const updatedUsers = users.filter(u => u.id !== studentId);
    
    StorageService.saveUsers(updatedUsers);
    showToast('Student rejected successfully', 'success');
    loadDashboardStats(); // Refresh the dashboard
}

// Load recent activity
function loadRecentActivity() {
    // In a real app, this would fetch from an API
    const activities = [
        { date: '2023-11-09 10:30', activity: 'New student registration', user: 'John Doe', status: 'Pending' },
        { date: '2023-11-09 09:15', activity: 'Appointment booked', user: 'Jane Smith', status: 'Confirmed' },
        { date: '2023-11-08 14:20', activity: 'Teacher added', user: 'Dr. Smith', status: 'Completed' },
        { date: '2023-11-08 11:05', activity: 'Student approved', user: 'Alice Johnson', status: 'Completed' },
        { date: '2023-11-07 16:45', activity: 'System updated', user: 'System', status: 'Completed' }
    ];
    
    const tbody = document.querySelector('#recentActivityTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    activities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.date}</td>
            <td>${activity.activity}</td>
            <td>${activity.user}</td>
            <td><span class="badge bg-success">${activity.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Load a specific section
function loadSection(section) {
    const content = document.getElementById('mainContent');
    if (!content) return;
    
    // Show loading state
    content.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        switch(section) {
            case 'dashboard':
                window.location.href = 'dashboard.html';
                break;
            case 'teachers':
                loadTeachersSection();
                break;
            case 'students':
                loadStudentsSection();
                break;
            case 'appointments':
                loadAppointmentsSection();
                break;
            case 'settings':
                loadSettingsSection();
                break;
            case 'profile':
                loadProfileSection();
                break;
            default:
                content.innerHTML = '<div class="alert alert-info">Section not found</div>';
        }
    }, 500);
}

// Load Teachers Section
function loadTeachersSection() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    
    const users = StorageService.getUsers();
    const teachers = users.filter(user => user.role === 'teacher');
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Manage Teachers</h4>
            <button class="btn btn-primary" id="addTeacherBtn">
                <i class="fas fa-plus me-2"></i>Add Teacher
            </button>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover" id="teachersTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Subjects</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    if (teachers.length === 0) {
        html += `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="text-muted">No teachers found</div>
                </td>
            </tr>
        `;
    } else {
        teachers.forEach(teacher => {
            const statusBadge = teacher.approved 
                ? '<span class="badge bg-success">Approved</span>' 
                : '<span class="badge bg-warning">Pending</span>';
                
            html += `
                <tr>
                    <td>${teacher.name || 'N/A'}</td>
                    <td>${teacher.email || 'N/A'}</td>
                    <td>${teacher.department || 'N/A'}</td>
                    <td>${teacher.subjects ? teacher.subjects.join(', ') : 'N/A'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${!teacher.approved ? `
                            <button class="btn btn-sm btn-success me-2" onclick="approveTeacher('${teacher.id}')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-info me-2" onclick="editTeacher('${teacher.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${teacher.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    
    // Add event listeners for teacher actions
    document.getElementById('addTeacherBtn')?.addEventListener('click', showAddTeacherModal);
    document.querySelectorAll('.edit-teacher').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const teacherId = e.currentTarget.dataset.id;
            editTeacher(teacherId);
        });
    });
    
    document.querySelectorAll('.delete-teacher').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const teacherId = e.currentTarget.dataset.id;
            deleteTeacher(teacherId);
        });
    });
}

// Show add teacher modal
function showAddTeacherModal() {
    // In a real app, this would show a modal with a form
    alert('Add Teacher functionality will be implemented here');
}

// Edit teacher
function editTeacher(teacherId) {
    // In a real app, this would show a pre-filled form in a modal
    alert(`Edit Teacher ${teacherId} functionality will be implemented here`);
}

// Delete teacher
function deleteTeacher(teacherId) {
    if (confirm('Are you sure you want to delete this teacher?')) {
        // In a real app, this would make an API call
        console.log(`Deleting teacher with ID: ${teacherId}`);
        showToast('Teacher deleted successfully', 'success');
        loadTeachersSection(); // Refresh the list
    }
}

// Load Students Section
function loadStudentsSection() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    
    const users = StorageService.getUsers();
    const students = users.filter(user => user.role === 'student' && user.approved);
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Manage Students</h4>
            <button class="btn btn-primary" id="addStudentBtn">
                <i class="fas fa-plus me-2"></i>Add Student
            </button>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover" id="studentsTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Student ID</th>
                                <th>Department</th>
                                <th>Registration Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    if (students.length === 0) {
        html += `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="text-muted">No approved students found</div>
                </td>
            </tr>
        `;
    } else {
        students.forEach(student => {
            html += `
                <tr>
                    <td>${student.name || 'N/A'}</td>
                    <td>${student.email || 'N/A'}</td>
                    <td>${student.studentId || 'N/A'}</td>
                    <td>${student.department || 'N/A'}</td>
                    <td>${student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2" onclick="editStudent('${student.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

// Load Appointments Section
function loadAppointmentsSection() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Appointments</h4>
        </div>
        <div class="card">
            <div class="card-body">
                <p>Appointments management will be implemented here</p>
            </div>
        </div>
    `;
}

// Load Settings Section
function loadSettingsSection() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="row">
            <div class="col-lg-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Change Password</h5>
                    </div>
                    <div class="card-body">
                        <form id="changePasswordForm">
                            <div class="mb-3">
                                <label for="currentPassword" class="form-label">Current Password</label>
                                <input type="password" class="form-control" id="currentPassword" required>
                            </div>
                            <div class="mb-3">
                                <label for="newPassword" class="form-label">New Password</label>
                                <input type="password" class="form-control" id="newPassword" required>
                            </div>
                            <div class="mb-3">
                                <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
                                <input type="password" class="form-control" id="confirmNewPassword" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Update Password</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add form submission handler
    document.getElementById('changePasswordForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        
        // In a real app, this would validate and update the password
        showToast('Password updated successfully', 'success');
        this.reset();
    });
}

// Load Profile Section
function loadProfileSection() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    
    const user = AuthService.getCurrentUser();
    
    content.innerHTML = `
        <div class="row">
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-body text-center">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4e73df&color=fff&size=150" 
                             alt="Profile" class="rounded-circle img-fluid" style="width: 150px;">
                        <h5 class="my-3">${user.name}</h5>
                        <p class="text-muted mb-1">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                        <p class="text-muted mb-4">${user.email}</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-body">
                        <form id="profileForm">
                            <div class="row">
                                <div class="col-sm-3">
                                    <p class="mb-0">Full Name</p>
                                </div>
                                <div class="col-sm-9">
                                    <input type="text" class="form-control" value="${user.name}" id="profileName">
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-sm-3">
                                    <p class="mb-0">Email</p>
                                </div>
                                <div class="col-sm-9">
                                    <input type="email" class="form-control" value="${user.email}" id="profileEmail">
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-sm-3">
                                    <p class="mb-0">Phone</p>
                                </div>
                                <div class="col-sm-9">
                                    <input type="tel" class="form-control" value="${user.phone || ''}" id="profilePhone">
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-sm-12">
                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add form submission handler
    document.getElementById('profileForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        // In a real app, this would update the user's profile
        showToast('Profile updated successfully', 'success');
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add Teacher Modal
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'addTeacherBtn') {
            showAddTeacherModal();
        }
    });
    
    // Save Teacher Form
    const saveTeacherForm = document.getElementById('saveTeacherForm');
    if (saveTeacherForm) {
        saveTeacherForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle save teacher
            const modal = bootstrap.Modal.getInstance(document.getElementById('teacherModal'));
            modal.hide();
            showToast('Teacher saved successfully', 'success');
        });
    }
    
    // Logout buttons
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            AuthService.logout();
        });
    });
    
    // Check admin role on page load
    document.addEventListener('DOMContentLoaded', function() {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.role !== 'admin') {
            // Hide or disable approval functionality for non-admin users
            const approvalButtons = document.querySelectorAll('[onclick^="approveStudent"], [onclick^="rejectStudent"]');
            approvalButtons.forEach(btn => {
                btn.disabled = true;
                btn.title = 'Only admin can approve/reject requests';
            });
        }
    });
    
    // Handle responsive sidebar toggle
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth < 768) {
            sidebar.style.marginLeft = `-${sidebar.offsetWidth}px`;
            mainContent.style.marginLeft = '0';
        } else {
            sidebar.style.marginLeft = '0';
            mainContent.style.marginLeft = `${sidebar.offsetWidth}px`;
        }
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
        <button class="toast-close">&times;</button>
    `;
    
    const container = document.getElementById('toast') || document.body;
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remove after delay
    const removeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    };
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', removeToast);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(removeToast, 5000);
}
