(function() {
    // ---------- CONFIGURAÇÃO DOS QUADRADOS ----------
    const SQUARE_SIZE_MIN = 8;
    const SQUARE_SIZE_MAX = 24;
    const SQUARE_SPEED_MIN = 1.2;
    const SQUARE_SPEED_MAX = 3.8;
    const SPAWN_RATE = 18;
    const MAX_SQUARES = 110;
    const BASE_OPACITY = 0.7;
    
    // Configuração da rotação (ângulo em graus)
    const ROTATION_SPEED_MIN = 0.5;   // graus por frame (~30 graus/segundo a 60fps)
    const ROTATION_SPEED_MAX = 2.5;   // rotação mais rápida

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
        constructor(x, y, size, speedY, opacity, rotationSpeed) {
            this.x = x;              // posição X (centro do quadrado para facilitar rotação)
            this.y = y;              // posição Y (centro)
            this.size = size;        // lado do quadrado
            this.speedY = speedY;    // velocidade vertical (px/frame)
            this.opacity = opacity;  // opacidade base
            this.rotation = 0;       // ângulo atual em graus
            this.rotationSpeed = rotationSpeed; // velocidade de rotação (graus/frame)
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
            if (s.y + s.size / 2 < 0 || s.y - s.size / 2 > canvasHeight) {
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
        
        // Começa na parte inferior (centro do quadrado próximo à borda inferior)
        const startY = canvasHeight - size / 2 - (Math.random() * 20);
        
        // Velocidade para cima (valores negativos)
        const speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
        
        // Opacidade variada
        let variedOpacity = BASE_OPACITY * (0.6 + Math.random() * 0.6);
        variedOpacity = Math.min(0.92, Math.max(0.25, variedOpacity));
        
        // Velocidade de rotação (positiva ou negativa para girar em ambos sentidos)
        const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
        
        const square = new RotatingSquare(x, startY, size, speedY, variedOpacity, rotationSpeed);
        squares.push(square);
    }
    
    // ---------- ATUALIZA POSIÇÕES E ROTAÇÃO ----------
    function updateSquares() {
        for (let i = squares.length - 1; i >= 0; i--) {
            const sq = squares[i];
            
            // Movimento vertical
            sq.y += sq.speedY;
            
            // Atualiza rotação
            sq.rotation += sq.rotationSpeed;
            
            // Remove se saiu completamente da tela (topo ou fundo)
            if (sq.y + sq.size / 2 < 0 || sq.y - sq.size / 2 > canvasHeight) {
                squares.splice(i, 1);
                continue;
            }
            
            // Calcula fator de desvanecimento baseado na posição Y (desaparece no topo)
            const centerY = sq.y;
            let fadeFactor = 1.0;
            
            if (centerY < canvasHeight * 0.3) {
                // Nos primeiros 30% da tela (parte superior), opacidade diminui linearmente
                fadeFactor = Math.max(0, centerY / (canvasHeight * 0.3));
            }
            
            // Calcula opacidade final para desenho
            sq.currentOpacity = sq.opacity * Math.max(0.05, Math.min(1, fadeFactor));
            
            // Remove se ficou muito transparente e está no topo
            if (sq.currentOpacity <= 0.05 && centerY < 30) {
                squares.splice(i, 1);
            }
        }
    }
    
    // ---------- DESENHA UM QUADRADO COM ROTAÇÃO ----------
    function drawRotatedSquare(sq) {
        const op = sq.currentOpacity !== undefined ? sq.currentOpacity : sq.opacity;
        if (op <= 0.01) return;
        
        ctx.save();
        ctx.translate(sq.x, sq.y);
        ctx.rotate(sq.rotation * Math.PI / 180); // converte graus para radianos
        ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
        ctx.fillRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
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
        
        // Spawn baseado em tempo
        if (SPAWN_RATE > 0) {
            const spawnInterval = 1.0 / SPAWN_RATE;
            spawnAccumulator += delta;
            while (spawnAccumulator >= spawnInterval && squares.length < MAX_SQUARES + 5) {
                spawnSquare();
                spawnAccumulator -= spawnInterval;
                if (spawnAccumulator > 1.0) spawnAccumulator = spawnInterval;
            }
            if (spawnAccumulator > 1.0) spawnAccumulator = 0;
        }
        
        // Atualiza física
        updateSquares();
        
        // Limpa canvas com preto
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Desenha quadrados com rotação
        drawSquares();
        
        lastFrameTime = currentTime;
        requestAnimationFrame(animate);
    }
    
    // ---------- QUADROS INICIAIS ----------
    function seedInitialSquares(count = 15) {
        for (let i = 0; i < count; i++) {
            const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
            const maxX = canvasWidth - size;
            const minX = size;
            const x = Math.random() * (maxX - minX) + minX;
            const y = canvasHeight - size / 2 - Math.random() * (canvasHeight * 0.15);
            const speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
            const opacity = BASE_OPACITY * (0.5 + Math.random() * 0.5);
            const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
            
            const square = new RotatingSquare(x, y, size, speedY, opacity, rotationSpeed);
            squares.push(square);
        }
    }
    
    // ---------- OBSERVADOR PARA ATUALIZAR LINHAS QUANDO O TEXTO MUDA DE TAMANHO ----------
    const resizeObserver = new ResizeObserver(() => {
        updateLinesWidth();
    });
    
    if (titleElement) {
        resizeObserver.observe(titleElement);
    }
    
    // ---------- EVENTO DE REDIMENSIONAMENTO DA JANELA ----------
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // ---------- INICIALIZAÇÃO ----------
    function init() {
        resizeCanvas();
        seedInitialSquares(12);
        updateLinesWidth();
        lastFrameTime = 0;
        spawnAccumulator = 0;
        requestAnimationFrame(animate);
    }
    
    init();
})();
