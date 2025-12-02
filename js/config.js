// API Configuration
const API_CONFIG = {
    BASE_URL: 'mock://localhost:3000/api', // Using mock for frontend-only
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            ME: '/auth/me'
        },
        BOOKING: {
            CREATE: '/bookings',
            GET_ALL: '/bookings',
            GET_ONE: '/bookings'
        }
    }
};

// Make API_CONFIG globally available
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
}

// Mock authentication system
window.mockAuth = {
    users: JSON.parse(localStorage.getItem('mockUsers') || '[]'),
    
    // Register new user
    register: async function(name, email, password) {
        // Check if user already exists
        const existingUser = this.users.find(u => u.email === email);
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: btoa(password), // Simple encoding (not secure for production)
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(this.users));
        
        return {
            success: true,
            message: 'Registration successful',
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        };
    },
    
    // Login user
    login: async function(email, password) {
        const user = this.users.find(u => u.email === email);
        if (!user || user.password !== btoa(password)) {
            throw new Error('Invalid email or password');
        }
        
        const token = btoa(`${user.id}:${Date.now()}`);
        const userData = { id: user.id, name: user.name, email: user.email };
        
        return {
            success: true,
            token,
            user: userData
        };
    },
    
    // Logout user
    logout: async function() {
        return { success: true, message: 'Logged out successfully' };
    }
};

// Helper function to get full API URL (now handles mock calls)
window.getApiUrl = function(endpoint) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    console.log('getApiUrl called with endpoint:', endpoint, 'Full URL:', url);
    return url;
};

// Mock fetch override for authentication
const originalFetch = window.fetch;
window.fetch = async function(url, options) {
    console.log('Mock fetch called:', url, options);
    
    if (url.includes('mock://')) {
        // Handle mock authentication endpoints
        if (url.includes('/auth/register')) {
            const body = JSON.parse(options.body);
            try {
                const result = await window.mockAuth.register(body.name, body.email, body.password);
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ message: error.message }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        if (url.includes('/auth/login')) {
            const body = JSON.parse(options.body);
            try {
                const result = await window.mockAuth.login(body.email, body.password);
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ message: error.message }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        if (url.includes('/auth/logout')) {
            const result = await window.mockAuth.logout();
            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    
    // For non-mock URLs, use original fetch
    return originalFetch.apply(this, arguments);
};

// For debugging
console.log('Config loaded:', {        
    API_CONFIG,
    getApiUrl: typeof window.getApiUrl,
    currentPath: window.location.pathname,                                        mockAuth: !!window.mockAuth        
});
