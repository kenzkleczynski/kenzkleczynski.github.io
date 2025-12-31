// Helper function to format dates nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
}

// Load projects from JSON and initialize gallery
fetch('projects.json')
    .then(response => response.json())
    .then(projects => {
        // Sort projects by date (newest first)
        projects.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Create lookup object for slideshow functionality
        const projectImages = {};
        projects.forEach(project => {
            projectImages[project.id] = project.images;
        });

        // Generate gallery HTML
        const galleryContainer = document.getElementById('gallery-container');
        
        projects.forEach(project => {
            const numDots = project.images.length;
            
            // Create dots HTML
            let dotsHTML = '';
            for (let i = 0; i < numDots; i++) {
                dotsHTML += `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`;
            }
            
            // Create the project HTML
            const projectHTML = `
                <div class="gallery-item" data-project="${project.id}">
                    <div class="image-container">
                        <img src="${project.images[0]}" alt="${project.title}" class="current-image">
                        
                        <button class="nav-arrow prev" aria-label="Previous image">‹</button>
                        <button class="nav-arrow next" aria-label="Next image">›</button>
                        
                        <div class="dots">
                            ${dotsHTML}
                        </div>
                    </div>
                    ${project.link ? `<a href="${project.link}">` : ''}
                        <h3>${project.title}</h3>
                    ${project.link ? `</a>` : ''}
                    <p class="project-date">${formatDate(project.date)}</p>
                </div>
            `;
            
            galleryContainer.innerHTML += projectHTML;
        });

        // Initialize slideshow functionality for all gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            const projectName = item.dataset.project;
            const images = projectImages[projectName];
            
            if (!images) return;
            
            let currentIndex = 0;
            let autoPlayInterval;
            let isAnimating = false;

            const container = item.querySelector('.image-container');
            const imgElement = item.querySelector('.current-image');
            const prevBtn = item.querySelector('.prev');
            const nextBtn = item.querySelector('.next');
            const dots = item.querySelectorAll('.dot');

            // Create a second image element for transitions
            const imgElement2 = document.createElement('img');
            imgElement2.className = 'transition-image';
            imgElement2.style.position = 'absolute';
            imgElement2.style.top = '0';
            imgElement2.style.left = '0';
            imgElement2.style.width = '100%';
            imgElement2.style.height = '100%';
            imgElement2.style.objectFit = 'cover';
            imgElement2.style.opacity = '0';
            imgElement2.style.pointerEvents = 'none';
            container.insertBefore(imgElement2, container.firstChild);

            function showImage(index, direction) {
                if (isAnimating) return;
                
                const oldIndex = currentIndex;
                if (oldIndex === index && direction) return;
                
                currentIndex = index;
                
                // Update dots
                dots.forEach((dot, i) => {
                    if (i === currentIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });

                // If no direction, just swap
                if (!direction) {
                    imgElement.src = images[currentIndex];
                    return;
                }

                isAnimating = true;

                // Load new image in hidden element
                imgElement2.src = images[currentIndex];
                imgElement2.style.opacity = '1';
                imgElement2.style.zIndex = '1';
                
                // Apply slide animations
                if (direction === 'next') {
                    imgElement.style.transform = 'translateX(0)';
                    imgElement2.style.transform = 'translateX(100%)';
                    
                    setTimeout(() => {
                        imgElement.style.transition = 'transform 0.4s ease-in-out';
                        imgElement2.style.transition = 'transform 0.4s ease-in-out';
                        imgElement.style.transform = 'translateX(-100%)';
                        imgElement2.style.transform = 'translateX(0)';
                    }, 10);
                } else {
                    imgElement.style.transform = 'translateX(0)';
                    imgElement2.style.transform = 'translateX(-100%)';
                    
                    setTimeout(() => {
                        imgElement.style.transition = 'transform 0.4s ease-in-out';
                        imgElement2.style.transition = 'transform 0.4s ease-in-out';
                        imgElement.style.transform = 'translateX(100%)';
                        imgElement2.style.transform = 'translateX(0)';
                    }, 10);
                }

                // After animation, swap images
                setTimeout(() => {
                    imgElement.src = images[currentIndex];
                    imgElement.style.transform = 'translateX(0)';
                    imgElement.style.transition = 'none';
                    imgElement2.style.opacity = '0';
                    imgElement2.style.transform = 'translateX(0)';
                    imgElement2.style.transition = 'none';
                    imgElement2.style.zIndex = '0';
                    isAnimating = false;
                }, 450);
            }

            function nextImage() {
                const newIndex = (currentIndex + 1) % images.length;
                showImage(newIndex, 'next');
            }

            function prevImage() {
                const newIndex = (currentIndex - 1 + images.length) % images.length;
                showImage(newIndex, 'prev');
            }

            function startAutoPlay() {
                if (autoPlayInterval) {
                    clearInterval(autoPlayInterval);
                }
                autoPlayInterval = setInterval(nextImage, 3000);
            }

            function stopAutoPlay() {
                if (autoPlayInterval) {
                    clearInterval(autoPlayInterval);
                    autoPlayInterval = null;
                }
            }

            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!isAnimating) {
                    stopAutoPlay();
                    prevImage();
                    startAutoPlay();
                }
            });

            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!isAnimating) {
                    stopAutoPlay();
                    nextImage();
                    startAutoPlay();
                }
            });

            dots.forEach((dot, index) => {
                dot.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!isAnimating && index !== currentIndex) {
                        stopAutoPlay();
                        const direction = index > currentIndex ? 'next' : 'prev';
                        showImage(index, direction);
                        startAutoPlay();
                    }
                });
            });

            container.addEventListener('mouseenter', startAutoPlay);
            
            container.addEventListener('mouseleave', function() {
                stopAutoPlay();
                if (currentIndex !== 0) {
                    showImage(0);
                }
            });
        });
    })
    .catch(error => {
        console.error('Error loading projects:', error);
        document.getElementById('gallery-container').innerHTML = '<p>Error loading gallery. Please refresh the page.</p>';
    });