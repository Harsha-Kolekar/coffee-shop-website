// Immediate auth check for initial page load
(function() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isIndexPage = currentPath === 'index.html' || currentPath === '' || window.location.pathname === '/';
    
    console.log('Immediate auth check - Path:', currentPath, 'Has token:', !!token);
    
    if (!token && isIndexPage) {
        console.log('No token and on index page, redirecting to register immediately');
        window.location.href = 'register.html';
        return;
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded and DOM ready');
    
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const guestMenu = document.getElementById('guest-menu');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const profileLink = document.getElementById('profile-link');
    
    console.log('DOM elements found:', {
        loginForm: !!loginForm,
        registerForm: !!registerForm,
        guestMenu: !!guestMenu,
        userMenu: !!userMenu,
        logoutBtn: !!logoutBtn,
        profileLink: !!profileLink
    });

    // Check authentication status on page load
    checkAuthStatus();

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                console.log('Attempting login...');
                const response = await fetch(window.getApiUrl(window.API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });

                const data = await response.json();
                console.log('Login response:', data);

                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }

                // The server sends token in the response body
                if (data.success && data.token) {
                    console.log('Login successful. Token received.');
                    
                    // Store the token in localStorage
                    localStorage.setItem('token', data.token);
                    
                    // Store user data
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    console.log('Stored token:', localStorage.getItem('token'));
                    console.log('User data:', localStorage.getItem('user'));
                    
                    // Force a hard redirect to index.html
                    console.log('Redirecting to index.html...');
                    window.location.href = 'index.html';
                    return; // Stop further execution
                }
                
                throw new Error('No token received from server');
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message || 'Login failed. Please try again.');
            }
        });
    }

    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                const response = await fetch(window.getApiUrl(window.API_CONFIG.ENDPOINTS.AUTH.REGISTER), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password }),
                    credentials: 'include' // Important for cookies
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }

                // Registration successful, redirect to login page
                alert('Registration successful! Please login to continue.');
                window.location.href = 'login.html';
            } catch (error) {
                alert(error.message || 'Registration failed. Please try again.');
            }
        });
    }

    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            console.log('Logout button clicked');
            try {
                const response = await fetch(window.getApiUrl(window.API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
                    method: 'GET',
                    credentials: 'include' // Important for cookies
                });

                // Clear local storage and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                console.log('Logged out successfully, redirecting to login');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                // Still redirect even if there's an error
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        });
    } else {
        console.log('Logout button not found in DOM');
    }

    // Handle profile link
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile link clicked');
            window.location.href = 'profile.html';
        });
    } else {
        console.log('Profile link not found in DOM');
    }

    // Function to check authentication status
    async function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const isAuthPage = currentPath === 'login.html' || currentPath === 'register.html';
        const isIndexPage = currentPath === 'index.html' || currentPath === '' || window.location.pathname === '/';
        
        console.log('Auth check - Path:', currentPath, 'Full path:', window.location.pathname, 'Has token:', !!token);
        
        if (!token) {
            console.log('No token found, showing guest UI');
            updateUIForGuest();

            // If on index page without token, redirect to register
            if (isIndexPage) {
                console.log('On index page without token, redirecting to register');
                window.location.href = 'register.html';
                return false;
            }

            // Only redirect to login if on protected pages
            const protectedPages = ['profile.html', 'dashboard.html', 'my-bookings.html'];
            if (protectedPages.includes(currentPath)) {
                console.log('On protected page, redirecting to login');
                window.location.href = 'login.html';
                return false;
            }
            return false;
        }

        // If we have a token and we're on auth pages, redirect to home
        if (isAuthPage) {
            console.log('Already authenticated, redirecting to index.html');
            window.location.href = 'index.html';
            return;
        }

        try {
            updateUIForUser();
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            updateUIForGuest();
            if (!isAuthPage) {
                window.location.href = 'login.html';
            }
        }
    }

    // Update UI based on authentication status
    function updateUIForUser() {
        console.log('Updating UI for logged in user');
        const userMenu = document.getElementById('user-menu');
        const guestMenu = document.getElementById('guest-menu');
        
        if (userMenu) userMenu.style.display = 'inline-block';
        if (guestMenu) guestMenu.style.display = 'none';
    }

    function updateUIForGuest() {
        console.log('Updating UI for guest');
        const userMenu = document.getElementById('user-menu');
        const guestMenu = document.getElementById('guest-menu');
        
        if (userMenu) userMenu.style.display = 'none';
        if (guestMenu) guestMenu.style.display = 'inline-block';
        
        // If we're on a protected page, redirect to login
        const protectedPages = ['profile.html', 'dashboard.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});
