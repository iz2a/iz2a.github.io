document.addEventListener('DOMContentLoaded', function () {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        menuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });

        // Add typing animation effect for section titles
        const sectionTitles = document.querySelectorAll('.section-title');

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        sectionTitles.forEach(title => {
            title.style.opacity = 0;
            title.style.transform = 'translateY(20px)';
            title.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(title);
        });

        // Add reveal effect for cards
        const cards = document.querySelectorAll('.research-card, .project-card, .certification-card');

        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = 1;
                        entry.target.style.transform = 'translateY(0)';
                    }, 100 * Array.from(cards).indexOf(entry.target) % 3);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        cards.forEach(card => {
            card.style.opacity = 0;
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            cardObserver.observe(card);
        });
    });