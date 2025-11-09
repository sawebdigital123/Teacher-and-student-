// Auth Service
const AuthService = {
    // Current user session
    currentUser: null,

    // Initialize auth service
    init() {
        // Check for existing session
        const session = localStorage.getItem('auth_session');
        if (session) {
            this.currentUser = JSON.parse(session);
            this.redirectToDashboard();
        }
        
        // Set up form submissions
        this.setupEventListeners();
    },

    // Set up event listeners for auth forms
    setupEventListeners() {
        // Toggle between login and register forms
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const loginFormContainer = document.getElementById('loginFormContainer');
        const registerFormContainer = document.getElementById('registerFormContainer');

        if (showRegister && loginFormContainer && registerFormContainer) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginFormContainer.style.display = 'none';
                registerFormContainer.style.display = 'block';
            });
        }

        if (showLogin && loginFormContainer && registerFormContainer) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerFormContainer.style.display = 'none';
                loginFormContainer.style.display = 'block';
            });
        }

        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Registration form submission
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }
    },

    // Handle user login
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Basic validation
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            // Show loading state
            const submitBtn = document.querySelector('#loginForm button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Logging in...';

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Find user by email
            const user = StorageService.getUserByEmail(email);
            
            // Check if user exists
            if (!user) {
                this.showToast('Invalid email or password', 'error');
                return;
            }
            
            // Check password (compare hashed values)
            const hashedPassword = StorageService.hashPassword(password);
            if (user.password !== hashedPassword) {
                console.log('Password mismatch');
                this.showToast('Invalid email or password', 'error');
                return;
            }

            // Check if account is approved
            if (!user.approved && user.role === 'student') {
                this.showToast('Your account is pending admin approval', 'info');
                return;
            }

            // Create session
            this.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                approved: user.approved
            };

            // Save session to localStorage
            localStorage.setItem('auth_session', JSON.stringify(this.currentUser));

            // Show success message and redirect
            this.showToast('Login successful!', 'success');
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            this.showToast('An error occurred during login', 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    },

    // Handle user registration
    async handleRegistration() {
        // Get form values
        const user = {
            name: document.getElementById('regName').value.trim(),
            studentId: document.getElementById('regStudentId').value.trim(),
            department: document.getElementById('regDepartment').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            password: document.getElementById('regPassword').value,
            confirmPassword: document.getElementById('regConfirmPassword').value,
            role: 'student',
            phone: ''
        };

        // Validate form
        try {
            this.validateRegistration(user);
            
            // Show loading state
            const submitBtn = document.querySelector('#registerForm button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Registering...';

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Add user to storage
            const { confirmPassword, ...userData } = user; // Remove confirmPassword
            StorageService.addUser(userData);

            this.showToast('Registration successful! Please wait for admin approval.', 'success');
            
            // Reset form
            document.getElementById('registerForm').reset();
            
            // Switch to login form
            document.getElementById('registerFormContainer').style.display = 'none';
            document.getElementById('loginFormContainer').style.display = 'block';

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('#registerForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText || 'Register';
            }
        }
    },

    // Validate registration form
    validateRegistration(user) {
        // Check required fields
        const requiredFields = ['name', 'studentId', 'department', 'email', 'password', 'confirmPassword'];
        const missingFields = requiredFields.filter(field => !user[field]);
        
        if (missingFields.length > 0) {
            throw new Error('Please fill in all required fields');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
            throw new Error('Please enter a valid email address');
        }

        // Check password strength (at least 8 characters, 1 number, 1 letter)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(user.password)) {
            throw new Error('Password must be at least 8 characters long and contain at least one letter and one number');
        }

        // Check if passwords match
        if (user.password !== user.confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Check if email already exists
        const existingUser = StorageService.getUserByEmail(user.email);
        if (existingUser) {
            throw new Error('A user with this email already exists');
        }
    },

    // Logout user
    logout() {
        localStorage.removeItem('auth_session');
        this.currentUser = null;
        window.location.href = 'index.html';
    },

    // Redirect to appropriate dashboard based on user role
    redirectToDashboard() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        let dashboardUrl = 'index.html';
        
        switch (this.currentUser.role) {
            case 'admin':
                dashboardUrl = 'admin/dashboard.html';
                break;
            case 'teacher':
                dashboardUrl = 'teacher/dashboard.html';
                break;
            case 'student':
                dashboardUrl = 'student/dashboard.html';
                break;
        }

        // Only redirect if not already on the correct page
        if (!window.location.pathname.endsWith(dashboardUrl)) {
            window.location.href = dashboardUrl;
        }
    },

    // Show toast notification
    showToast(message, type = 'info') {
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
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    },

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
};

// Initialize auth service when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AuthService.init();
});

// Make AuthService globally available for other scripts
window.AuthService = AuthService;
