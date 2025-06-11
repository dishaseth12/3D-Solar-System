// Scene setup
let scene, camera, renderer, clock;
let sun, planets = [];
let stars = [];
let isAnimating = true;
let isDarkMode = true;

// Planet data 
const planetData = [
    { name: 'Mercury', size: 0.4, distance: 4, speed: 4.15, color: '#FFC649' },
    { name: 'Venus', size: 0.7, distance: 6, speed: 1.62, color: '#FF6B47' },
    { name: 'Earth', size: 0.8, distance: 8, speed: 1.0, color: '#4F94CD' },
    { name: 'Mars', size: 0.6, distance: 10, speed: 0.53, color: '#CD5C5C' },
    { name: 'Jupiter', size: 2.2, distance: 15, speed: 0.084, color: '#DAA520' },
    { name: 'Saturn', size: 1.8, distance: 19, speed: 0.034, color: '#FAD5A5' },
    { name: 'Uranus', size: 1.2, distance: 23, speed: 0.012, color: '#4FD0E3' },
    { name: 'Neptune', size: 1.1, distance: 27, speed: 0.006, color: '#4169E1' }
];

// Controls state
let controlsOpen = false;
let planetSpeeds = {};

function initializeScene() {
    // Create scene
    scene = new THREE.Scene();
    
    // Setup camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 40, 50); 

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Initialize clock
    clock = new THREE.Clock();
    
    // Setup controls
    setupOrbitControls();
    
    // Create solar system
    createSun();
    createPlanets();
    createStars();
    setupLighting();
    
    // Initialize planet speeds
    planetData.forEach(planet => {
        planetSpeeds[planet.name] = planet.speed;
    });
    
    // Create UI controls
    createPlanetControls();
    
    // Start animation
    animate();
}

function setupOrbitControls() {
    // Simple orbit controls implementation
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0.4, targetRotationY = 0.8;
    let currentRotationX = 0, currentRotationY = 0;

    renderer.domElement.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
        camera.position.multiplyScalar(1 + e.deltaY * 0.001);
        camera.position.clampLength(10, 100);
    });

    // Update camera rotation smoothly
    function updateCamera() {
        currentRotationX += (targetRotationX - currentRotationX) * 0.1;
        currentRotationY += (targetRotationY - currentRotationY) * 0.1;
        
        const radius = camera.position.length();
        camera.position.x = radius * Math.sin(currentRotationY) * Math.cos(currentRotationX);
        camera.position.y = radius * Math.sin(currentRotationX);
        camera.position.z = radius * Math.cos(currentRotationY) * Math.cos(currentRotationX);
        camera.lookAt(0, 0, 0);
        
        requestAnimationFrame(updateCamera);
    }
    updateCamera();
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.3
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
}

function createPlanets() {
    planetData.forEach((planetInfo, index) => {
        const geometry = new THREE.SphereGeometry(planetInfo.size, 32, 32);
        const material = new THREE.MeshLambertMaterial({ 
            color: planetInfo.color,
            emissive: planetInfo.color,
            emissiveIntensity: 0.1
        });
        
        const planet = new THREE.Mesh(geometry, material);
        planet.position.x = planetInfo.distance;
        planet.castShadow = true;
        planet.receiveShadow = true;
        
        // Add planet data for reference
        planet.userData = {
            name: planetInfo.name,
            distance: planetInfo.distance,
            speed: planetInfo.speed,
            angle: Math.random() * Math.PI * 2 
        };
        
        scene.add(planet);
        planets.push(planet);

        // Create orbit line
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(angle) * planetInfo.distance,
                0,
                Math.sin(angle) * planetInfo.distance
            );
        }
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.5
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
    });
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    stars.push(starField);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // Point light from sun
    const sunLight = new THREE.PointLight(0xFFFFFF, 1.5, 100);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
}

function createPlanetControls() {
    const controlsContainer = document.getElementById('planet-controls');
    
    planetData.forEach(planet => {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        
        const planetName = document.createElement('div');
        planetName.className = 'planet-name';
        planetName.textContent = planet.name;
        planetName.style.color = planet.color;
        
        const speedControl = document.createElement('div');
        speedControl.className = 'speed-control';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'speed-slider';
        slider.min = '0';
        slider.max = '5';
        slider.step = '0.1';
        slider.value = planet.speed;
        
        const speedValue = document.createElement('span');
        speedValue.className = 'speed-value';
        speedValue.textContent = planet.speed.toFixed(1) + 'x';
        
        slider.addEventListener('input', (e) => {
            const newSpeed = parseFloat(e.target.value);
            planetSpeeds[planet.name] = newSpeed;
            speedValue.textContent = newSpeed.toFixed(1) + 'x';
        });
        
        speedControl.appendChild(slider);
        speedControl.appendChild(speedValue);
        
        controlGroup.appendChild(planetName);
        controlGroup.appendChild(speedControl);
        
        controlsContainer.appendChild(controlGroup);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isAnimating) {
        const deltaTime = clock.getDelta();
        
        // Rotate sun
        sun.rotation.y += deltaTime * 0.5;
        
        // Animate planets
        planets.forEach(planet => {
            const userData = planet.userData;
            const currentSpeed = planetSpeeds[userData.name] || userData.speed;
            
            // Update angle based on speed
            userData.angle += deltaTime * currentSpeed * 0.5;
            
            // Calculate new position
            planet.position.x = Math.cos(userData.angle) * userData.distance;
            planet.position.z = Math.sin(userData.angle) * userData.distance;
            
            // Rotate planet on its axis
            planet.rotation.y += deltaTime * 2;
        });
        
        // Animate stars
        stars.forEach(starField => {
            starField.rotation.y += deltaTime * 0.1;
        });
    }
    
    renderer.render(scene, camera);
}

// Event handlers
document.getElementById('control-toggle').addEventListener('click', () => {
    controlsOpen = !controlsOpen;
    const controls = document.getElementById('controls');
    const toggle = document.getElementById('control-toggle');
    
    if (controlsOpen) {
        controls.classList.add('open');
        toggle.textContent = '✕ Close';
    } else {
        controls.classList.remove('open');
        toggle.textContent = '⚙️ Controls';
    }
});

document.getElementById('play-pause').addEventListener('click', (e) => {
    isAnimating = !isAnimating;
    const btn = e.target;
    
    if (isAnimating) {
        btn.textContent = '⏸️ Pause';
        btn.classList.add('active');
    } else {
        btn.textContent = '▶️ Play';
        btn.classList.remove('active');
    }
});

document.getElementById('reset-btn').addEventListener('click', () => {
    // Reset all planet speeds
    planetData.forEach(planet => {
        planetSpeeds[planet.name] = planet.speed;
    });
    
    // Reset sliders
    const sliders = document.querySelectorAll('.speed-slider');
    const values = document.querySelectorAll('.speed-value');
    
    sliders.forEach((slider, index) => {
        slider.value = planetData[index].speed;
        values[index].textContent = planetData[index].speed.toFixed(1) + 'x';
    });
    
    // Reset camera position
    camera.position.set(0, 15, 30);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    const body = document.body;
    const btn = document.getElementById('theme-toggle');
    
    if (isDarkMode) {
        body.classList.remove('light-mode');
        btn.textContent = '🌞 Light Mode';
        renderer.setClearColor(0x000000, 0);
    } else {
        body.classList.add('light-mode');
        btn.textContent = '🌙 Dark Mode';
        renderer.setClearColor(0x87CEEB, 1);
    }
});

// Tooltip functionality
function setupTooltip() {
    const tooltip = document.getElementById('tooltip');
    let currentHoveredPlanet = null;

    renderer.domElement.addEventListener('mousemove', (event) => {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(planets);

        if (intersects.length > 0) {
            const planet = intersects[0].object;
            if (planet !== currentHoveredPlanet) {
                currentHoveredPlanet = planet;
                tooltip.textContent = `${planet.userData.name} - Distance: ${planet.userData.distance}AU`;
                tooltip.style.opacity = '1';
            }
            tooltip.style.left = event.clientX + 10 + 'px';
            tooltip.style.top = event.clientY - 30 + 'px';
        } else {
            currentHoveredPlanet = null;
            tooltip.style.opacity = '0';
        }
    });
}


// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the application
initializeScene();
setupTooltip();