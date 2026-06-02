// Utility Functions
const Utils = {
    // DOM Helper Functions
    getElementById(id) {
        return document.getElementById(id);
    },

    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    },

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    },

    hasHTMLChars(value) {
        return /[<>&"'`]/.test(String(value ?? ''));
    },

    setSafeHTML(element, html) {
        if (element) element.innerHTML = html;
    },

    // Animation Helpers
    fadeIn(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    },

    slideUp(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(40px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    },

    popIn(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        }, delay);
    },

    bounce(element) {
        element.style.animation = 'bounce 0.6s ease-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 600);
    },

    wiggle(element) {
        element.style.animation = 'wiggle 0.8s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 800);
    },

    pulse(element, duration = 2000) {
        element.style.animation = `pulse ${duration / 1000}s ease-in-out infinite`;
    },

    stopPulse(element) {
        element.style.animation = '';
    },

    // Screen Transition Functions
    showScreen(screenId, direction = 'fade') {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = this.getElementById(screenId);
        if (targetScreen) {
            if (direction === 'slide') {
                targetScreen.style.transform = 'translateX(100px)';
                targetScreen.classList.add('active');
                
                setTimeout(() => {
                    targetScreen.style.transform = 'translateX(0)';
                }, 50);
            } else {
                targetScreen.classList.add('active');
            }
        }
    },

    // Form Validation
    validatePlayerName(name) {
        const trimmed = name.trim();
        return trimmed.length >= 2 && trimmed.length <= 20 && !this.hasHTMLChars(trimmed);
    },

    validateRoomId(roomId) {
        const trimmed = roomId.trim();
  return /^[A-Z]+-[A-Z0-9]{4}$/.test(trimmed);
    },

    // String Utilities
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Random Utilities
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Copy to Clipboard
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    },

    // Notification System
    showNotification(message, type = 'info', duration = 3000) {
        // Supprimer les notifications existantes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = this.createElement('div', `notification ${type}`);
        
        // Ajouter l'icône et le contenu
        const icon = this.createElement('div', 'notification-icon');
        icon.textContent = type === 'success' ? '✅' : 
                          type === 'error' ? '❌' : 
                          type === 'warning' ? '⚠️' : 'ℹ️';
        
        const content = this.createElement('div', 'notification-content');
        content.textContent = message;
        
        notification.appendChild(icon);
        notification.appendChild(content);
        
        document.body.appendChild(notification);

        // Animate out and remove
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.4s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, duration);
    },

    // Loading States
    setLoading(element, isLoading = true) {
        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
        }
    },

    // Debounce Function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Time Formatting
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Sound Effects (DISABLED)
    playSound(frequency = 800, duration = 150, type = 'sine') {
        // Sounds disabled
        return;
    },

    playClickSound() {
        // Sounds disabled
        return;
    },

    playSuccessSound() {
        // Sounds disabled
        return;
    },

    playErrorSound() {
        // Sounds disabled
        return;
    }
};
