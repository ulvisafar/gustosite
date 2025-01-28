import * as PIXI from 'https://cdn.skypack.dev/pixi.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize PIXI Application
    const app = new PIXI.Application();
    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1B2B5B,
        resolution: window.devicePixelRatio || 1,
    });

    const canvas = document.querySelector('.hero-canvas');
    if (canvas) {
        canvas.appendChild(app.canvas);

        // Create a container for particles
        const container = new PIXI.Container();
        app.stage.addChild(container);

        // Create a simple circle texture
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFB800); // Golden color
        graphics.drawCircle(0, 0, 4);
        graphics.endFill();
        const texture = app.renderer.generateTexture(graphics);

        const particleList = [];
        const particleCount = 50;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Sprite(texture);
            
            // Random position
            particle.x = Math.random() * app.screen.width;
            particle.y = Math.random() * app.screen.height;
            
            // Random scale
            const scale = 0.5 + Math.random() * 1;
            particle.scale.set(scale);
            
            // Random speed
            particle.velocity = {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            };
            
            particle.alpha = 0.6;
            
            container.addChild(particle);
            particleList.push(particle);
        }

        // Add some larger particles for variety
        for (let i = 0; i < 20; i++) {
            const bigParticle = new PIXI.Graphics();
            bigParticle.beginFill(0xFFB800, 0.3);
            bigParticle.drawCircle(0, 0, 8);
            bigParticle.endFill();
            
            bigParticle.x = Math.random() * app.screen.width;
            bigParticle.y = Math.random() * app.screen.height;
            
            bigParticle.velocity = {
                x: (Math.random() - 0.5) * 1,
                y: (Math.random() - 0.5) * 1
            };
            
            container.addChild(bigParticle);
            particleList.push(bigParticle);
        }

        // Mouse interaction
        let mouseX = app.screen.width / 2;
        let mouseY = app.screen.height / 2;

        app.canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Animation loop
        app.ticker.add(() => {
            particleList.forEach(particle => {
                // Move particles
                particle.x += particle.velocity.x;
                particle.y += particle.velocity.y;

                // Mouse interaction
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    particle.alpha = 1;
                    const angle = Math.atan2(dy, dx);
                    particle.velocity.x -= Math.cos(angle) * 0.2;
                    particle.velocity.y -= Math.sin(angle) * 0.2;
                } else {
                    particle.alpha = 0.6;
                }

                // Bounce off edges
                if (particle.x < 0 || particle.x > app.screen.width) {
                    particle.velocity.x *= -1;
                }
                if (particle.y < 0 || particle.y > app.screen.height) {
                    particle.velocity.y *= -1;
                }

                // Apply damping
                particle.velocity.x *= 0.99;
                particle.velocity.y *= 0.99;
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
        });

        // Add background gradient
        const gradient = new PIXI.Graphics();
        gradient.beginFill(0x1B2B5B);
        gradient.drawRect(0, 0, app.screen.width, app.screen.height);
        gradient.endFill();
        gradient.alpha = 0.7;
        app.stage.addChildAt(gradient, 0);
    }
}); 