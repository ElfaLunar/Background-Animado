class ParticleCanvas {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 12;
        this.titleElement = document.querySelector('.title');
        
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
    
    getTitlePosition() {
        if (!this.titleElement) return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        
        const rect = this.titleElement.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.bottom + 50 // Posição abaixo da frase
        };
    }
    
    createParticles() {
        const startPos = this.getTitlePosition();
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle(startPos));
        }
    }
    
    createParticle(startPos) {
        return {
            x: startPos.x + (Math.random() - 0.5) * 100,
            y: startPos.y + Math.random() * 30,
            size: 25 + Math.random() * 15,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            opacity: 0.3 + Math.random() * 0.4,
            speedY: -0.5 - Math.random() * 0.8,
            speedX: (Math.random() - 0.5) * 0.3,
            life: 1,
            fadeSpeed: 0.003 + Math.random() * 0.005
        };
    }
    
    drawSquare(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        this.ctx.globalAlpha = particle.opacity * particle.life;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * particle.life})`;
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        this.ctx.restore();
    }
    
    updateParticle(particle) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        particle.life -= particle.fadeSpeed;
        
        return particle.life > 0;
    }
    
    updateParticles() {
        const startPos = this.getTitlePosition();
        
        // Atualizar partículas existentes e remover as mortas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.updateParticle(this.particles[i])) {
                this.particles.splice(i, 1);
            }
        }
        
        // Criar novas partículas para manter o número
        while (this.particles.length < this.particleCount) {
            this.particles.push(this.createParticle(startPos));
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
