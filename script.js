(function() {
    // ---------- CONFIGURAÇÃO DOS QUADRADOS ----------
    // TAMANHOS AUMENTADOS (bem maiores)
    const SQUARE_SIZE_MIN = 35;     // aumentado de 18 para 35
    const SQUARE_SIZE_MAX = 70;     // aumentado de 42 para 70
    
    // Velocidades mais lentas (quadrados grandes se movem mais devagar)
    const SQUARE_SPEED_MIN = 0.25;
    const SQUARE_SPEED_MAX = 0.9;
    
    // Quantidade reduzida para não poluir (quadrados grandes precisam de menos quantidade)
    const SPAWN_RATE = 3.5;         // spawn mais lento
    const MAX_SQUARES = 18;         // máximo de 18 quadrados grandes
    
    // Opacidade mais suave para quadrados grandes
    const BASE_OPACITY = 0.45;
    
    // Configuração da rotação (mais lenta para quadrados grandes)
    const ROTATION_SPEED_MIN = 0.1;
    const ROTATION_SPEED_MAX = 0.7;

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
            if (s.y + s.size / 2 < -150 || s.y - s.size / 2 > canvasHeight + 150) {
                squares.splice(i, 1);
            }
        }
    }
    
    // ---------- SPAWN DE UM NOVO QUADRADO ----------
    function spawnSquare() {
        if (squares.length >= MAX_SQUARES) return;
        
        const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
        const maxX = canvasWidth - size;
        const minX = size;
        const x = Math.random() * (maxX - minX) + minX;
        
        // Posição inicial variada
        let startY;
        const spawnVariant = Math.random();
        if (spawnVariant < 0.5) {
            startY = canvasHeight - size / 2 - (Math.random() * 60);
        } else {
            startY = size / 2 + (Math.random() * canvasHeight * 0.6);
        }
        
        // Velocidade: maioria sobe muito lentamente
        let speedY;
        if (Math.random() < 0.8) {
            speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
        } else {
            speedY = (Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN) * 0.3;
        }
        
        // Opacidade variada e mais sutil para quadrados grandes
        let variedOpacity = BASE_OPACITY * (0.6 + Math.random() * 0.7);
        variedOpacity = Math.min(0.7, Math.max(0.25, variedOpacity));
        
        // Velocidade de rotação mais lenta
        const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
        const rotationOffset = Math.random() * 360;
        
        const square = new RotatingSquare(x, startY, size, speedY, variedOpacity, rotationSpeed, rotationOffset);
        squares.push(square);
    }
    
    // ---------- MANUTENÇÃO SUAVE DO NÚMERO DE QUADRADOS ----------
    function maintainSquareCount() {
        const desiredMinCount = 10;
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
            
            sq.y += sq.speedY;
            sq.rotation += sq.rotationSpeed;
            
            if (sq.rotation > 360) sq.rotation -= 360;
            if (sq.rotation < 0) sq.rotation += 360;
            
            // Remove somente se saiu completamente da tela
            const isOutOfBounds = (sq.y + sq.size / 2 < -120) || (sq.y - sq.size / 2 > canvasHeight + 120);
            if (isOutOfBounds) {
                squares.splice(i, 1);
                continue;
            }
            
            // Efeito de desvanecimento suave nas bordas
            let fadeFactor = 1.0;
            const centerY = sq.y;
            
            if (centerY < sq.size / 2 + 50) {
                fadeFactor = Math.max(0, centerY / (sq.size / 2 + 50));
            } else if (centerY > canvasHeight - sq.size / 2 - 50) {
                fadeFactor = Math.max(0, (canvasHeight - centerY) / (sq.size / 2 + 50));
            }
            
            sq.currentOpacity = sq.opacity * Math.max(0.08, Math.min(1, fadeFactor));
            
            if (sq.currentOpacity <= 0.03) {
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
        
        // Sombra suave para dar profundidade aos quadrados grandes
        ctx.shadowColor = `rgba(255, 255, 255, ${op * 0.25})`;
        ctx.shadowBlur = 6;
        
        // Gradiente sutil para quadrados grandes (efeito mais elegante)
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
        
        // Spawn controlado
        if (SPAWN_RATE > 0 && squares.length < MAX_SQUARES) {
            const spawnInterval = 1.0 / SPAWN_RATE;
            spawnAccumulator += delta;
            while (spawnAccumulator >= spawnInterval && squares.length < MAX_SQUARES + 3) {
                spawnSquare();
                spawnAccumulator -= spawnInterval;
                if (spawnAccumulator > 0.5) spawnAccumulator = spawnInterval * 0.5;
            }
            if (spawnAccumulator > 0.5) spawnAccumulator = 0;
        }
        
        maintainSquareCount();
        updateSquares();
        
        // Limpa canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        drawSquares();
        
        lastFrameTime = currentTime;
        requestAnimationFrame(animate);
    }
    
    // ---------- QUADROS INICIAIS (POUCOS QUADRADOS GRANDES) ----------
    function seedInitialSquares(count = 12) {
        for (let i = 0; i < count; i++) {
            const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
            const maxX = canvasWidth - size;
            const minX = size;
            const x = Math.random() * (maxX - minX) + minX;
            
            // Distribuição por toda a tela
            const y = size / 2 + Math.random() * (canvasHeight - size);
            
            // Velocidades variadas e lentas
            let speedY;
            const speedType = Math.random();
            if (speedType < 0.7) {
                speedY = -(Math.random() * (SQUARE_SPEED_MAX - 0.15) + 0.15);
            } else if (speedType < 0.85) {
                speedY = (Math.random() * (SQUARE_SPEED_MAX - 0.15) + 0.15);
            } else {
                speedY = (Math.random() - 0.5) * 0.2;
            }
            
            const opacity = BASE_OPACITY * (0.6 + Math.random() * 0.6);
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
        seedInitialSquares(12);     // Apenas 12 quadrados grandes
        updateLinesWidth();
        lastFrameTime = 0;
        spawnAccumulator = 0;
        requestAnimationFrame(animate);
    }
    
    init();
})();
