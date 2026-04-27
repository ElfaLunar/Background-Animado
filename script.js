(function() {
    // ---------- CONFIGURAÇÃO DOS QUADRADOS ----------
    // Tamanhos dos quadrados (maiores)
    const SQUARE_SIZE_MIN = 18;
    const SQUARE_SIZE_MAX = 42;
    
    // Velocidades mais lentas
    const SQUARE_SPEED_MIN = 0.4;
    const SQUARE_SPEED_MAX = 1.5;
    
    // QUANTIDADES REDUZIDAS
    const SPAWN_RATE = 5;           // MUITO MENOS quadrados por segundo
    const MAX_SQUARES = 28;         // LIMITE MÁXIMO reduzido para 28
    
    // Opacidade mais sutil
    const BASE_OPACITY = 0.5;
    
    // Configuração da rotação
    const ROTATION_SPEED_MIN = 0.2;
    const ROTATION_SPEED_MAX = 1.2;

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
            if (s.y + s.size / 2 < -100 || s.y - s.size / 2 > canvasHeight + 100) {
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
        
        // Posição inicial variada para parecer natural
        let startY;
        const spawnVariant = Math.random();
        if (spawnVariant < 0.5) {
            startY = canvasHeight - size / 2 - (Math.random() * 40);
        } else {
            startY = size / 2 + (Math.random() * canvasHeight * 0.6);
        }
        
        // Velocidade: maioria sobe lentamente
        let speedY;
        if (Math.random() < 0.8) {
            speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
        } else {
            speedY = (Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN) * 0.4;
        }
        
        // Opacidade variada
        let variedOpacity = BASE_OPACITY * (0.7 + Math.random() * 0.6);
        variedOpacity = Math.min(0.8, Math.max(0.3, variedOpacity));
        
        // Velocidade de rotação
        const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
        const rotationOffset = Math.random() * 360;
        
        const square = new RotatingSquare(x, startY, size, speedY, variedOpacity, rotationSpeed, rotationOffset);
        squares.push(square);
    }
    
    // ---------- MANUTENÇÃO SUAVE DO NÚMERO DE QUADRADOS ----------
    function maintainSquareCount() {
        // Mantém quantidade mínima bem menor
        const desiredMinCount = 15;
        if (squares.length < desiredMinCount) {
            const toSpawn = Math.min(3, desiredMinCount - squares.length);
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
            const isOutOfBounds = (sq.y + sq.size / 2 < -80) || (sq.y - sq.size / 2 > canvasHeight + 80);
            if (isOutOfBounds) {
                squares.splice(i, 1);
                continue;
            }
            
            // Efeito de desvanecimento suave nas bordas
            let fadeFactor = 1.0;
            const centerY = sq.y;
            
            if (centerY < sq.size / 2 + 30) {
                fadeFactor = Math.max(0, centerY / (sq.size / 2 + 30));
            } else if (centerY > canvasHeight - sq.size / 2 - 30) {
                fadeFactor = Math.max(0, (canvasHeight - centerY) / (sq.size / 2 + 30));
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
        
        ctx.shadowColor = `rgba(255, 255, 255, ${op * 0.2})`;
        ctx.shadowBlur = 3;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
        ctx.fillRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.15})`;
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
        
        // Spawn reduzido
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
    
    // ---------- QUADROS INICIAIS (QUANTIDADE REDUZIDA) ----------
    function seedInitialSquares(count = 20) {
        for (let i = 0; i < count; i++) {
            const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
            const maxX = canvasWidth - size;
            const minX = size;
            const x = Math.random() * (maxX - minX) + minX;
            
            // Distribuição por toda a tela
            const y = size / 2 + Math.random() * (canvasHeight - size);
            
            // Velocidades variadas
            let speedY;
            const speedType = Math.random();
            if (speedType < 0.7) {
                speedY = -(Math.random() * (SQUARE_SPEED_MAX - 0.2) + 0.2);
            } else if (speedType < 0.85) {
                speedY = (Math.random() * (SQUARE_SPEED_MAX - 0.2) + 0.2);
            } else {
                speedY = (Math.random() - 0.5) * 0.3;
            }
            
            const opacity = BASE_OPACITY * (0.6 + Math.random() * 0.5);
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
        seedInitialSquares(20);     // QUANTIDADE INICIAL REDUZIDA para 20
        updateLinesWidth();
        lastFrameTime = 0;
        spawnAccumulator = 0;
        requestAnimationFrame(animate);
    }
    
    init();
})();
