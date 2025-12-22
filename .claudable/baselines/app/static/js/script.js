// Header & Mobile Menu Logic
function initMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-links");

  if (hamburger && navMenu) {
    // Remove old listeners to prevent duplicates if any
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    
    newHamburger.addEventListener("click", () => {
      newHamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-links a").forEach((n) =>
      n.addEventListener("click", () => {
        newHamburger.classList.remove("active");
        navMenu.classList.remove("active");
      })
    );
  }
}

function highlightActiveLink() {
  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".nav-links a");
  
  links.forEach(link => {
      if(link.getAttribute("href") === page) {
          link.classList.add("active");
      } else {
          link.classList.remove("active");
      }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize mobile menu (header is already rendered by Flask/Jinja2 templates)
  initMobileMenu();
  
  // Initialize Back to Top Button
  initBackToTop();

  // Initialize Sermons Carousel
  initSermonsCarousel();
});

// Back to Top Button Logic
function initBackToTop() {
    // 1. Create Button
    const btn = document.createElement("button");
    btn.id = "back-to-top-btn";
    btn.innerHTML = "<i class=\"fa-solid fa-angle-up\"></i>"; // Top Arrow
    btn.title = "Go to top";
    btn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(btn);

    // 2. Show/Hide on Scroll
    window.addEventListener("scroll", () => {
        // Show if scrolled more than window height (mobile "first screen")
        if (document.body.scrollTop > window.innerHeight || document.documentElement.scrollTop > window.innerHeight/2) {
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    });

    // 3. Scroll to Top on Click
    btn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// Sermons Carousel Logic
function initSermonsCarousel() {
  const carousel = document.querySelector('.carousel-container');
  if (!carousel) return; // Exit if carousel doesn't exist on the page

  const track = carousel.querySelector('.carousel-track');
  const items = carousel.querySelectorAll('.carousel-item');
  const prevBtn = carousel.querySelector('#prevBtn');
  const nextBtn = carousel.querySelector('#nextBtn');
  const indicators = carousel.querySelectorAll('.carousel-indicator');

  if (!track || items.length === 0) return;

  let currentIndex = 0;
  let autoplayInterval;
  const totalItems = items.length;

  // Calculate how many items are visible based on screen size
  function getVisibleItems() {
    const containerWidth = carousel.offsetWidth;
    if (containerWidth <= 480) return 1;
    if (containerWidth <= 768) return 1;
    if (containerWidth <= 1024) return 2;
    return 3; // Default for desktop
  }

  // Calculate max slide position
  function getMaxSlideIndex() {
    const visibleItems = getVisibleItems();
    return Math.max(0, totalItems - visibleItems);
  }

  // Update carousel position
  function updateCarousel() {
    const maxIndex = getMaxSlideIndex();
    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }

    const visibleItems = getVisibleItems();
    const itemWidth = 100 / visibleItems;
    const translateX = -currentIndex * itemWidth;
    track.style.transform = `translateX(${translateX}%)`;

    // Update item widths dynamically
    items.forEach(item => {
      item.style.flex = `0 0 ${itemWidth}%`;
    });

    // Update indicators
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === currentIndex);
    });
  }

  // Go to specific slide
  function goToSlide(index) {
    const maxIndex = getMaxSlideIndex();
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
    resetAutoplay();
  }

  // Next slide
  function nextSlide() {
    const maxIndex = getMaxSlideIndex();
    if (currentIndex >= maxIndex) {
      currentIndex = 0; // Return to start
    } else {
      currentIndex++;
    }
    updateCarousel();
  }

  // Previous slide
  function prevSlide() {
    if (currentIndex <= 0) {
      currentIndex = getMaxSlideIndex(); // Go to end
    } else {
      currentIndex--;
    }
    updateCarousel();
  }

  // Autoplay functionality
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, 5000); // 5 seconds
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  function resetAutoplay() {
    startAutoplay();
  }

  // Event listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });
  }

  // Indicator clicks
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
    });
  });

  // Pause autoplay on hover
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateCarousel();
    }, 250);
  });

  // Initialize carousel
  updateCarousel();
  startAutoplay();

  // Touch/swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide(); // Swipe left - next
      } else {
        prevSlide(); // Swipe right - previous
      }
      resetAutoplay();
    }
  }
}

// Sermon Carousel Logic
function initSermonCarousel() {
  const carouselContainer = document.querySelector('.sermon-carousel-container');
  const carouselTrack = document.querySelector('.sermon-carousel-track');

  if (!carouselContainer || !carouselTrack) {
    return; // Exit if carousel elements don't exist
  }

  // Get all cards including hidden ones
  const allCards = Array.from(carouselTrack.querySelectorAll('.card'));
  const totalCards = allCards.length;

  if (totalCards <= 3) {
    return; // No need for carousel if 3 or fewer cards
  }

  let currentIndex = 0;
  let autoplayInterval;

  // Function to calculate visible cards based on screen width
  function getVisibleCards() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  // Function to update carousel by rearranging DOM elements
  function updateCarousel() {
    const visibleCards = getVisibleCards();

    // Add updating class for transition effect
    carouselTrack.classList.add('updating');

    // Remove all cards from track
    while (carouselTrack.firstChild) {
      carouselTrack.removeChild(carouselTrack.firstChild);
    }

    // Add the visible cards in the correct order
    for (let i = 0; i < visibleCards; i++) {
      const cardIndex = (currentIndex + i) % totalCards;
      const card = allCards[cardIndex];
      card.classList.remove('hidden-sermon');
      carouselTrack.appendChild(card);
    }

    // Reset transform
    carouselTrack.style.transform = 'translateX(0)';

    // Remove updating class after a short delay
    setTimeout(() => {
      carouselTrack.classList.remove('updating');
    }, 100);
  }

  // Function to move to next slide
  function nextSlide() {
    const visibleCards = getVisibleCards();
    currentIndex = (currentIndex + 1) % totalCards;
    updateCarousel();
  }

  // Function to move to previous slide
  function prevSlide() {
    const visibleCards = getVisibleCards();
    currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    updateCarousel();
  }

  // Function to start autoplay
  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000); // 5 seconds
  }

  // Function to stop autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  // Create navigation buttons
  function createNavigationButtons() {
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.setAttribute('aria-label', 'Previous sermon');
    prevBtn.addEventListener('click', () => {
      prevSlide();
      stopAutoplay();
      startAutoplay(); // Restart autoplay after manual navigation
    });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.setAttribute('aria-label', 'Next sermon');
    nextBtn.addEventListener('click', () => {
      nextSlide();
      stopAutoplay();
      startAutoplay(); // Restart autoplay after manual navigation
    });

    carouselContainer.appendChild(prevBtn);
    carouselContainer.appendChild(nextBtn);
  }

  // Pause autoplay on hover
  carouselContainer.addEventListener('mouseenter', stopAutoplay);
  carouselContainer.addEventListener('mouseleave', startAutoplay);

  // Handle window resize
  function handleResize() {
    // Ensure currentIndex is within bounds for new visible count
    const visibleCards = getVisibleCards();
    if (currentIndex >= totalCards) {
      currentIndex = 0;
    }
    updateCarousel();
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
  });

  // Initialize carousel
  createNavigationButtons();
  updateCarousel();
  startAutoplay();

  // Handle visibility change (pause when tab is not visible)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });
}
// AI Editor Mode Logic
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('ai-mode')) {
    sessionStorage.setItem('aiModeEnabled', 'true');
  }

  if (sessionStorage.getItem('aiModeEnabled') === 'true') {
    const script = document.createElement('script');
    script.src = 'js/aiditor.js';
    document.body.appendChild(script);
  }
})();
