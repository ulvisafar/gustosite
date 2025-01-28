import * as THREE from 'three';

class PizzaBackground {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.init();
    }

    init() {
        // Canvas setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.querySelector('.hero-canvas').appendChild(this.renderer.domElement);

        // Pizza texture
        const textureLoader = new THREE.TextureLoader();
        const pizzaTexture = textureLoader.load('/assets/images/pizza-texture.jpg');

        // Create floating pizza slices
        this.pizzaSlices = [];
        for(let i = 0; i < 5; i++) {
            const geometry = new THREE.CircleGeometry(2, 32);
            const material = new THREE.MeshBasicMaterial({ 
                map: pizzaTexture,
                transparent: true,
                opacity: 0.8
            });
            const slice = new THREE.Mesh(geometry, material);
            
            // Random positions
            slice.position.set(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
            
            this.pizzaSlices.push(slice);
            this.scene.add(slice);
        }

        this.camera.position.z = 5;
        
        // Start animation
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Rotate pizza slices
        this.pizzaSlices.forEach(slice => {
            slice.rotation.x += 0.01;
            slice.rotation.y += 0.01;
        });

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize
const pizzaBackground = new PizzaBackground();
window.addEventListener('resize', () => pizzaBackground.onResize());