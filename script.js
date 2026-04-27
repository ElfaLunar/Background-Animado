class ParticleCanvas {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 8;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height - 50 + Math.random() * 30,
            size: 30 + Math.random() * 20,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            opacity: 0.7 + Math.random() * 0.3,
            speedY: -1.5 - Math.random() * 1.5,
            speedX: (Math.random() - 0.5) * 0.5,
            life: 1
        };
    }
    
    drawSquare(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        // Calcular opacidade baseada na posição Y (desaparece no topo)
        let opacity = particle.opacity;
        if (particle.y < this.canvas.height * 0.3) {
            // Começa a desaparecer nos 30% superiores da tela
            const fadeProgress = 1 - (particle.y / (this.canvas.height * 0.3));
            opacity = particle.opacity * (1 - fadeProgress);
        }
        
        this.ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        this.ctx.restore();
    }
    
    updateParticle(particle) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        
        // Remove o quadrado quando chegar ao topo da tela
        if (particle.y + particle.size / 2 < 0) {
            return false;
        }
        
        return true;
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.updateParticle(this.particles[i])) {
                this.particles.splice(i, 1);
            }
        }
        
        while (this.particles.length < this.particleCount) {
            this.particles.push(this.createParticle());
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const particle of this.particles) {
            this.drawSquare(particle);
        }
    }
    
    animate() {
        this.updateParticles();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Inicializar a animação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new ParticleCanvas();
});
