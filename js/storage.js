// Storage Service
const StorageService = {
    // Initialize storage with seed data if empty
    init() {
        if (!localStorage.getItem('users')) {
            this.seedData();
        }
    },

    // Seed initial data
    seedData() {
        // Users
        const users = [
            {
                id: this.generateId(),
                role: 'admin',
                name: 'Admin User',
                email: 'admin@example.com',
                password: this.hashPassword('Admin@123'),
                phone: '1234567890',
                approved: true,
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                role: 'teacher',
                name: 'John Doe',
                email: 'teacher@example.com',
                password: this.hashPassword('Teacher@123'),
                phone: '0987654321',
                approved: true,
                department: 'Computer Science',
                subjects: ['Web Development', 'Algorithms'],
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                role: 'student',
                name: 'Jane Smith',
                email: 'student@example.com',
                password: this.hashPassword('Student@123'),
                phone: '5551234567',
                approved: true,
                studentId: 'ST001',
                department: 'Computer Science',
                createdAt: new Date().toISOString()
            }
        ];

        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('appointments', JSON.stringify([]));
        localStorage.setItem('messages', JSON.stringify([]));
    },

    // Generate a simple ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Simple password hashing (in a real app, use a proper hashing library)
    hashPassword(password) {
        if (!password) return '';
        // Add a simple salt to prevent basic attacks
        const salt = 'appointment_system_';
        return btoa(salt + password);
    },

    // User methods
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },

    getUserById(id) {
        return this.getUsers().find(user => user.id === id);
    },

    getUserByEmail(email) {
        return this.getUsers().find(user => user.email === email);
    },

    addUser(user) {
        const users = this.getUsers();
        
        // Check if user already exists
        if (users.some(u => u.email === user.email)) {
            throw new Error('User with this email already exists');
        }
        
        user.id = this.generateId();
        user.password = this.hashPassword(user.password);
        user.approved = user.role === 'admin' || user.role === 'teacher' ? true : false;
        user.createdAt = new Date().toISOString();
        
        users.push(user);
        this.saveUsers(users);
        return user;
    },

    updateUser(id, updates) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        
        // Don't allow updating email to one that's already taken
        if (updates.email && users.some((u, i) => u.email === updates.email && i !== userIndex)) {
            throw new Error('Email already in use');
        }
        
        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveUsers(users);
        return users[userIndex];
    },
    
    // Save users array to localStorage
    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },

    // Appointment methods
    getAppointments() {
        return JSON.parse(localStorage.getItem('appointments') || '[]');
    },

    getAppointmentsByUser(userId) {
        return this.getAppointments().filter(appt => 
            appt.studentId === userId || appt.teacherId === userId
        );
    },

    addAppointment(appointment) {
        const appointments = this.getAppointments();
        appointment.id = this.generateId();
        appointment.createdAt = new Date().toISOString();
        appointment.status = 'pending'; // pending, approved, cancelled, completed
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        return appointment;
    },

    updateAppointment(id, updates) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(apt => apt.id === id);
        if (index !== -1) {
            appointments[index] = { ...appointments[index], ...updates };
            localStorage.setItem('appointments', JSON.stringify(appointments));
            return appointments[index];
        }
        return null;
    },

    // Message methods
    getMessages() {
        return JSON.parse(localStorage.getItem('messages') || '[]');
    },

    getMessagesByUser(userId) {
        return this.getMessages().filter(msg => 
            msg.senderId === userId || msg.recipientId === userId
        );
    },

    addMessage(message) {
        const messages = this.getMessages();
        message.id = this.generateId();
        message.createdAt = new Date().toISOString();
        message.read = false;
        messages.push(message);
        localStorage.setItem('messages', JSON.stringify(messages));
        return message;
    },

    markMessageAsRead(id) {
        const messages = this.getMessages();
        const index = messages.findIndex(msg => msg.id === id);
        if (index !== -1) {
            messages[index].read = true;
            localStorage.setItem('messages', JSON.stringify(messages));
            return messages[index];
        }
        return null;
    },

    // Reset admin credentials to default
    resetAdminCredentials() {
        const users = this.getUsers();
        const admin = users.find(u => u.role === 'admin');
        
        if (admin) {
            admin.password = this.hashPassword('Admin@123');
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Admin password has been reset to: Admin@123');
            return true;
        }
        return false;
    }
};

// Initialize storage when the file is loaded
StorageService.init();

// Helper function to reset admin password (for development)
function resetAdminPassword() {
    if (confirm('Reset admin password to default (Admin@123)?')) {
        if (StorageService.resetAdminCredentials()) {
            alert('Admin password has been reset to: Admin@123');
        } else {
            alert('Failed to reset admin password');
        }
    }
}

// Uncomment the line below and refresh the page to reset admin password
// resetAdminPassword();
