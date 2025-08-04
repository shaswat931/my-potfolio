// bg-animation.js

let scene, camera, renderer, particles;
let particleCount = 2000; // Adjust for performance vs visual density

function initThreeJsBackground() {
    // Check if THREE is loaded
    if (typeof THREE === 'undefined') {
        console.error("Three.js library not found. Background animation will not load.");
        return;
    }

    const canvas = document.getElementById('threeJsCanvas');
    if (!canvas) {
        console.error("Canvas element for Three.js not found.");
        return;
    }

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true // Important: makes background transparent so CSS background shows
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Particles Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        // Random positions within a larger cube to fill more space
        positions[i * 3 + 0] = (Math.random() * 2 - 1) * 20; // x
        positions[i * 3 + 1] = (Math.random() * 2 - 1) * 20; // y
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * 20; // z
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Material (ShaderMaterial for subtle glow/fade)
    const vertexShader = `
        uniform float time;
        attribute vec3 position;
        void main() {
            vec3 newPosition = position;
            // Simple wavy motion
            newPosition.y += sin(newPosition.x * 0.5 + time * 0.5) * 0.5;
            newPosition.x += cos(newPosition.y * 0.5 + time * 0.5) * 0.5;

            // Make particles move towards/away from camera subtly
            newPosition.z += sin(time * 0.1 + newPosition.x) * 0.2;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = (1.0 / length(gl_Position.xyz)) * 50.0; // Size based on distance (perspective effect)
        }
    `;

    const fragmentShader = `
        uniform vec3 color;
        void main() {
            // Radial fade for soft glow effect
            float strength = distance(gl_PointCoord, vec2(0.5, 0.5)) * 2.0;
            strength = 1.0 - strength;
            strength = pow(strength, 2.0); // Make it sharper towards the center

            gl_FragColor = vec4(color, strength * 0.8); // Adjust opacity (0.8)
        }
    `;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            color: { value: new THREE.Color(0x8C52FF) } // Default particle color (will be updated by CSS vars)
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending // For glowing effect
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Initial render call
    renderer.render(scene, camera);

    // Initial update of particle colors based on current theme
    updateThreeJsParticleColors();
}

// Function to update particle colors based on CSS variables
function updateThreeJsParticleColors() {
    if (!particles || !particles.material || !particles.material.uniforms) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const particleColor1 = rootStyles.getPropertyValue('--particle-color-1').trim();
    // const particleColor2 = rootStyles.getPropertyValue('--particle-color-2').trim(); // Not directly used in this shader

    if (particleColor1) {
        particles.material.uniforms.color.value.set(particleColor1);
    }
}


function animateThreeJsBackground() {
    requestAnimationFrame(animateThreeJsBackground);

    if (particles && particles.material.uniforms) {
        particles.material.uniforms.time.value += 0.005; // Adjust animation speed
        particles.rotation.y += 0.0005; // Slow rotation
        particles.rotation.x += 0.0002;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResizeThreeJsBackground() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Expose update function globally or via a pattern for index.js to call
window.updateThreeJsParticleColors = updateThreeJsParticleColors;

// Init and animate on window load
window.addEventListener('load', () => {
    initThreeJsBackground();
    animateThreeJsBackground();
});

// Handle window resize
window.addEventListener('resize', onWindowResizeThreeJsBackground);

// index.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggle');
    const body = document.body;

    // Function to set theme
    const setTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.remove('light-theme');
            themeToggleBtn.querySelector('i').classList.replace('fa-sun', 'fa-moon');
            themeToggleBtn.setAttribute('aria-label', 'Switch to light theme');
        } else {
            body.classList.add('light-theme');
            themeToggleBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
            themeToggleBtn.setAttribute('aria-label', 'Switch to dark theme');
        }
        localStorage.setItem('theme', theme);

        // Update Three.js particle colors if the function exists
        if (window.updateThreeJsParticleColors) {
            window.updateThreeJsParticleColors();
        }
    };

    // Check for saved theme on load
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    // Theme toggle event listener
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // --- Smooth Scrolling for Navigation ---
    document.querySelectorAll('.navigation a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Form Submission Confirmation (for Web3Forms) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default form submission

            const formButton = this.querySelector('button[type="submit"]');
            formButton.disabled = true; // Disable button to prevent multiple submissions
            formButton.textContent = 'Sending...';

            const formData = new FormData(this);
            const response = await fetch(this.action, {
                method: this.method,
                body: formData,
                headers: {
                    'Accept': 'application/json' // Important for Web3Forms to return JSON
                }
            });

            if (response.ok) {
                alert('Thank you for your message! I will get back to you soon.');
                this.reset(); // Clear the form
            } else {
                // Attempt to read error message from Web3Forms response
                const errorData = await response.json().catch(() => ({ message: 'Unknown error.' }));
                alert('Oops! There was a problem sending your message: ' + (errorData.message || 'Please try again.'));
            }
            formButton.disabled = false; // Re-enable button
            formButton.textContent = 'Send';
        });
    }
});