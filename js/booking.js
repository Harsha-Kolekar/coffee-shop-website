// Booking functionality
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('bookingName').value.trim();
            const email = document.getElementById('bookingEmail').value.trim();
            const phone = document.getElementById('bookingNumber').value.trim();
            const numberOfGuests = document.getElementById('bookingGuests').value;
            const bookingTime = document.getElementById('bookingTime').value;
            const message = document.getElementById('bookingMessage').value.trim();
            
            // Validation
            if (!name || !email || !phone || !numberOfGuests || !bookingTime) {
                alert('Please fill in all required fields (Name, Email, Phone, Number of Guests, and Booking Time)');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Phone validation (basic)
            if (phone.length < 10) {
                alert('Please enter a valid phone number (at least 10 digits)');
                return;
            }
            
            // Number of guests validation
            const guests = parseInt(numberOfGuests);
            if (isNaN(guests) || guests < 1 || guests > 20) {
                alert('Please enter a valid number of guests (between 1 and 20)');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = bookingForm.querySelector('input[type="submit"]');
                const originalValue = submitBtn.value;
                submitBtn.value = 'Booking...';
                submitBtn.disabled = true;
                
                // Send booking request
                const response = await fetch(window.getApiUrl(window.API_CONFIG.ENDPOINTS.BOOKING.CREATE), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        numberOfGuests: guests,
                        bookingTime,
                        message
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success
                    alert(`✅ ${data.message}\n\nBooking Details:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nGuests: ${guests}\nTime: ${bookingTime}\n\nWe will send a confirmation to your email soon.`);
                    
                    // Reset form
                    bookingForm.reset();
                    
                } else {
                    // Error from server
                    if (data.errors && data.errors.length > 0) {
                        alert(`❌ Booking failed:\n${data.errors.join('\n')}`);
                    } else {
                        alert(`❌ ${data.message || 'Failed to create booking. Please try again.'}`);
                    }
                }
                
            } catch (error) {
                console.error('Booking error:', error);
                alert('❌ Network error. Please check your internet connection and try again.');
            } finally {
                // Reset button state
                const submitBtn = bookingForm.querySelector('input[type="submit"]');
                submitBtn.value = originalValue;
                submitBtn.disabled = false;
            }
        });
    }
});

// Function to format time display (optional helper)
function formatTimeDisplay(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Add to window for global access
if (typeof window !== 'undefined') {
    window.formatTimeDisplay = formatTimeDisplay;
}
