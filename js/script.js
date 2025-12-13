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
  // Inject Header
  const headerElement = document.querySelector("#main-header");
  if (headerElement) {
    fetch("header.html")
      .then(response => response.text())
      .then(html => {
        headerElement.innerHTML = html;
        highlightActiveLink();
        initMobileMenu();
      })
      .catch(err => console.error("Error loading header:", err));
  } else {
     // If header is already there (static), just init menu
     initMobileMenu();
  }

  // Inject Footer
  const footerElement = document.querySelector("#main-footer");
  if (footerElement) {
    fetch("footer.html")
      .then(response => response.text())
      .then(html => {
        footerElement.innerHTML = html;
      })
      .catch(err => console.error("Error loading footer:", err));
  }
});

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
