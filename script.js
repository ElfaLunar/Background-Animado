(function() {
    // ---------- CONFIGURAÇÃO DOS QUADRADOS ----------
    // Tamanhos grandes
    const SQUARE_SIZE_MIN = 35;
    const SQUARE_SIZE_MAX = 70;
    
    // Velocidades lentas para subir
    const SQUARE_SPEED_MIN = 0.3;
    const SQUARE_SPEED_MAX = 0.9;
    
    // Quantidade controlada
    const SPAWN_RATE = 3;           // 3 quadrados por segundo
    const MAX_SQUARES = 16;         // máximo de 16 quadrados simultâneos
    
    // Opacidade
    const BASE_OPACITY = 0.5;
    
    // Configuração da rotação
    const ROTATION_SPEED_MIN = 0.15;
    const ROTATION_SPEED_MAX = 0.8;

    // Elementos DOM
    const canvas = document.getElementById('particle-canvas');
    let ctx = canvas.getContext('2d');
    
    // Arrays dos quadrados
    let squares = [];
    
    // Controle de animação
    let lastFrameTime = 0;
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    
    // Elementos das linhas
    const titleElement = document.getElementById('mainTitle');
    const lineTop = document.getElementById('lineTop');
    const lineBottom = document.getElementById('lineBottom');
    
    // Timer para spawn
    let spawnAccumulator = 0;
    
    // ---------- CLASSE DO QUADRADO COM ROTAÇÃO ----------
    class RotatingSquare {
        constructor(x, y, size, speedY, opacity, rotationSpeed, rotationOffset = 0) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.speedY = speedY;
            this.opacity = opacity;
            this.rotation = rotationOffset;
            this.rotationSpeed = rotationSpeed;
        }
    }
    
    // ---------- FUNÇÃO PARA ATUALIZAR LARGURA DAS LINHAS ----------
    function updateLinesWidth() {
        if (!titleElement || !lineTop || !lineBottom) return;
        const titleWidth = titleElement.offsetWidth;
        if (titleWidth > 0) {
            lineTop.style.width = titleWidth + 'px';
            lineBottom.style.width = titleWidth + 'px';
        } else {
            lineTop.style.width = '280px';
            lineBottom.style.width = '280px';
        }
    }
    
    // ---------- REDIMENSIONAMENTO DO CANVAS ----------
    function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        updateLinesWidth();
        
        // Remove quadrados que ficaram fora dos limites
        for (let i = squares.length - 1; i >= 0; i--) {
            const s = squares[i];
            if (s.y + s.size / 2 < -100 || s.y - s.size / 2 > canvasHeight + 200) {
                squares.splice(i, 1);
            }
        }
    }
    
    // ---------- SPAWN DE UM NOVO QUADRADO (SEMPRE NA PARTE INFERIOR) ----------
    function spawnSquare() {
        if (squares.length >= MAX_SQUARES) return;
        
        const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
        const maxX = canvasWidth - size;
        const minX = size;
        const x = Math.random() * (maxX - minX) + minX;
        
        // SEMPRE NA PARTE INFERIOR DA TELA
        // O quadrado começa logo abaixo da borda inferior (fora da tela) ou bem no limite
        // Para dar a sensação que está surgindo de baixo
        const startY = canvasHeight + (Math.random() * 30) - 10;
        
        // Velocidade: TODOS sobem (valores negativos)
        const speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
        
        // Opacidade começa baixa e aumenta conforme sobe (efeito fade-in)
        let variedOpacity = BASE_OPACITY * (0.5 + Math.random() * 0.6);
        variedOpacity = Math.min(0.75, Math.max(0.3, variedOpacity));
        
        // Velocidade de rotação aleatória
        const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
        const rotationOffset = Math.random() * 360;
        
        const square = new RotatingSquare(x, startY, size, speedY, variedOpacity, rotationSpeed, rotationOffset);
        squares.push(square);
    }
    
    // ---------- MANUTENÇÃO DO NÚMERO DE QUADRADOS ----------
    function maintainSquareCount() {
        const desiredMinCount = 6;
        if (squares.length < desiredMinCount) {
            const toSpawn = Math.min(2, desiredMinCount - squares.length);
            for (let i = 0; i < toSpawn; i++) {
                spawnSquare();
            }
        }
    }
    
    // ---------- ATUALIZA POSIÇÕES E ROTAÇÃO ----------
    function updateSquares() {
        for (let i = squares.length - 1; i >= 0; i--) {
            const sq = squares[i];
            
            // Movimento vertical (subindo)
            sq.y += sq.speedY;
            
            // Atualiza rotação
            sq.rotation += sq.rotationSpeed;
            
            if (sq.rotation > 360) sq.rotation -= 360;
            if (sq.rotation < 0) sq.rotation += 360;
            
            // Remove se saiu completamente do topo da tela
            if (sq.y + sq.size / 2 < -80) {
                squares.splice(i, 1);
                continue;
            }
            
            // Calcula opacidade baseada na posição Y (fade-in ao surgir, fade-out ao sumir)
            let fadeFactor = 1.0;
            const centerY = sq.y;
            
            // Fade-in: quando está surgindo da parte inferior
            if (centerY > canvasHeight - sq.size / 2 - 40) {
                const distanceFromBottom = canvasHeight - centerY;
                fadeFactor = Math.min(1, distanceFromBottom / 50);
                fadeFactor = Math.max(0.15, fadeFactor);
            }
            // Fade-out: quando está próximo do topo
            else if (centerY < sq.size / 2 + 50) {
                fadeFactor = Math.max(0, centerY / (sq.size / 2 + 50));
            }
            
            // Aplica a opacidade com fade
            sq.currentOpacity = sq.opacity * Math.max(0.08, Math.min(1, fadeFactor));
            
            // Remove se ficou extremamente transparente
            if (sq.currentOpacity <= 0.05 && centerY < 40) {
                squares.splice(i, 1);
            }
        }
    }
    
    // ---------- DESENHA UM QUADRADO COM ROTAÇÃO ----------
    function drawRotatedSquare(sq) {
        const op = sq.currentOpacity !== undefined ? sq.currentOpacity : sq.opacity;
        if (op <= 0.02) return;
        
        ctx.save();
        ctx.translate(sq.x, sq.y);
        ctx.rotate(sq.rotation * Math.PI / 180);
        
        // Sombra suave
        ctx.shadowColor = `rgba(255, 255, 255, ${op * 0.25})`;
        ctx.shadowBlur = 6;
        
        // Gradiente sutil
        const gradient = ctx.createLinearGradient(-sq.size/2, -sq.size/2, sq.size/2, sq.size/2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${op})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${op * 0.7})`);
        ctx.fillStyle = gradient;
        
        ctx.fillRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        
        // Borda sutil
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.2})`;
        ctx.strokeRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        
        ctx.restore();
    }
    
    // ---------- DESENHA TODOS OS QUADRADOS ----------
    function drawSquares() {
        for (let sq of squares) {
            drawRotatedSquare(sq);
        }
    }
    
    // ---------- LOOP PRINCIPAL DE ANIMAÇÃO ----------
    function animate(currentTime) {
        if (!canvas.isConnected) return;
        
        if (lastFrameTime === 0) {
            lastFrameTime = currentTime;
            requestAnimationFrame(animate);
            return;
        }
        
        let delta = Math.min(0.033, (currentTime - lastFrameTime) / 1000);
        if (delta <= 0) {
            lastFrameTime = currentTime;
            requestAnimationFrame(animate);
            return;
        }
        
        // Spawn controlado (surgindo da parte inferior)
        if (SPAWN_RATE > 0 && squares.length < MAX_SQUARES) {
            const spawnInterval = 1.0 / SPAWN_RATE;
            spawnAccumulator += delta;
            while (spawnAccumulator >= spawnInterval && squares.length < MAX_SQUARES + 3) {
                spawnSquare();
                spawnAccumulator -= spawnInterval;
                if (spawnAccumulator > 0.5) spawnAccumulator = 0;
            }
            if (spawnAccumulator > 0.5) spawnAccumulator = 0;
        }
        
        // Mantém quantidade mínima
        maintainSquareCount();
        
        // Atualiza física
        updateSquares();
        
        // Limpa canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Desenha quadrados
        drawSquares();
        
        lastFrameTime = currentTime;
        requestAnimationFrame(animate);
    }
    
    // ---------- QUADROS INICIAIS ----------
    function seedInitialSquares(count = 8) {
        for (let i = 0; i < count; i++) {
            const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
            const maxX = canvasWidth - size;
            const minX = size;
            const x = Math.random() * (maxX - minX) + minX;
            
            // Posição inicial: na parte inferior ou já subindo um pouco
            const y = canvasHeight - size / 2 - (Math.random() * 80);
            
            // Todos sobem
            const speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
            
            const opacity = BASE_OPACITY * (0.5 + Math.random() * 0.5);
            const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
            const rotationOffset = Math.random() * 360;
            
            const square = new RotatingSquare(x, y, size, speedY, opacity, rotationSpeed, rotationOffset);
            squares.push(square);
        }
    }
    
    // ---------- OBSERVADOR PARA ATUALIZAR LINHAS ----------
    const resizeObserver = new ResizeObserver(() => {
        updateLinesWidth();
    });
    
    if (titleElement) {
        resizeObserver.observe(titleElement);
    }
    
    // ---------- EVENTO DE REDIMENSIONAMENTO ----------
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // ---------- INICIALIZAÇÃO ----------
    function init() {
        resizeCanvas();
        seedInitialSquares(8);
        updateLinesWidth();
        lastFrameTime = 0;
        spawnAccumulator = 0;
        requestAnimationFrame(animate);
    }
    
    init();
})();
