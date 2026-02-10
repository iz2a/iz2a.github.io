// Translation functionality for the website
function changeLanguage(lang) {
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update button states
    document.getElementById('en-btn').classList.remove('active');
    document.getElementById('ar-btn').classList.remove('active');
    
    if (lang === 'en') {
        document.getElementById('en-btn').classList.add('active');
    } else {
        document.getElementById('ar-btn').classList.add('active');
    }
    
    // Update text direction
    if (lang === 'ar') {
        document.body.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.body.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('dir', 'ltr');
    }
    
    // Translate all elements with data attributes
    const elements = document.querySelectorAll('[data-en][data-ar]');
    elements.forEach(element => {
        const translation = lang === 'en' ? element.getAttribute('data-en') : element.getAttribute('data-ar');
        
        // For elements that might contain HTML or just text
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            // Check if element has child nodes that aren't text
            const hasComplexContent = Array.from(element.childNodes).some(node => 
                node.nodeType === 1 && !node.hasAttribute('data-en')
            );
            
            if (hasComplexContent) {
                // Find and update only the text nodes
                element.childNodes.forEach(node => {
                    if (node.nodeType === 3) { // Text node
                        node.textContent = translation;
                    }
                });
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Store preference
    localStorage.setItem('preferredLanguage', lang);
}

// Load saved language preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    changeLanguage(savedLang);
});

// Make function globally available
window.changeLanguage = changeLanguage;
