(function() {
    // ---------- CONFIGURAÇÃO DOS QUADRADOS ----------
    // Quadrados MAIORES (tamanhos aumentados)
    const SQUARE_SIZE_MIN = 18;     // aumentado de 8 para 18
    const SQUARE_SIZE_MAX = 42;     // aumentado de 24 para 42
    const SQUARE_SPEED_MIN = 0.6;   // mais lentos para parecerem mais suaves
    const SQUARE_SPEED_MAX = 2.2;
    const SPAWN_RATE = 12;          // menos quadrados por segundo para não sobrecarregar
    const MAX_SQUARES = 80;         // limite máximo de quadrados simultâneos
    
    // Opacidade base mais sutil para parecerem já existentes
    const BASE_OPACITY = 0.55;
    
    // Configuração da rotação (ângulo em graus)
    const ROTATION_SPEED_MIN = 0.3;
    const ROTATION_SPEED_MAX = 1.6;

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
    
    // Flag para garantir que sempre haja quadrados suficientes
    let initialSeedDone = false;
    
    // ---------- CLASSE DO QUADRADO COM ROTAÇÃO ----------
    class RotatingSquare {
        constructor(x, y, size, speedY, opacity, rotationSpeed, rotationOffset = 0) {
            this.x = x;              // posição X (centro do quadrado)
            this.y = y;              // posição Y (centro)
            this.size = size;        // lado do quadrado
            this.speedY = speedY;    // velocidade vertical (px/frame)
            this.opacity = opacity;  // opacidade base
            this.rotation = rotationOffset; // ângulo atual em graus (começa com offset aleatório)
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
            if (s.y + s.size / 2 < -50 || s.y - s.size / 2 > canvasHeight + 50) {
                squares.splice(i, 1);
            }
        }
    }
    
    // ---------- SPAWN DE UM NOVO QUADRADO (SUAVE) ----------
    function spawnSquare() {
        if (squares.length >= MAX_SQUARES) return;
        
        const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
        const maxX = canvasWidth - size;
        const minX = size;
        const x = Math.random() * (maxX - minX) + minX;
        
        // Posição inicial: pode ser um pouco acima da borda inferior para não parecer que "estão surgindo"
        // Variedade maior nas posições Y iniciais para dar sensação de já estarem em movimento
        let startY;
        const spawnVariant = Math.random();
        if (spawnVariant < 0.4) {
            // Parte inferior da tela
            startY = canvasHeight - size / 2 - (Math.random() * 30);
        } else if (spawnVariant < 0.7) {
            // Meio da tela (já existentes)
            startY = canvasHeight * (0.3 + Math.random() * 0.4);
        } else {
            // Parte superior da tela (como se já estivessem descendo ou subindo)
            startY = size / 2 + (Math.random() * canvasHeight * 0.3);
        }
        
        // Velocidade: maioria sobe, alguns descem para dar sensação de movimento orgânico
        let speedY;
        if (Math.random() < 0.85) {
            // Sobe (negativo)
            speedY = -(Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN);
        } else {
            // Desce (positivo) - pequena minoria para movimento mais natural
            speedY = (Math.random() * (SQUARE_SPEED_MAX - SQUARE_SPEED_MIN) + SQUARE_SPEED_MIN) * 0.5;
        }
        
        // Opacidade variada e mais sutil
        let variedOpacity = BASE_OPACITY * (0.7 + Math.random() * 0.6);
        variedOpacity = Math.min(0.85, Math.max(0.3, variedOpacity));
        
        // Velocidade de rotação
        const rotationSpeed = (Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN) + ROTATION_SPEED_MIN) * (Math.random() > 0.5 ? 1 : -1);
        
        // Ângulo inicial aleatório para parecer que já estão girando há algum tempo
        const rotationOffset = Math.random() * 360;
        
        const square = new RotatingSquare(x, startY, size, speedY, variedOpacity, rotationSpeed, rotationOffset);
        squares.push(square);
    }
    
    // ---------- MANUTENÇÃO SUAVE DO NÚMERO DE QUADRADOS ----------
    function maintainSquareCount() {
        // Mantém uma quantidade mínima de quadrados para nunca ficar vazio
        const desiredMinCount = 35;
        if (squares.length < desiredMinCount) {
            const toSpawn = Math.min(8, desiredMinCount - squares.length);
            for (let i = 0; i < toSpawn; i++) {
                spawnSquare();
            }
        }
    }
    
    // ---------- ATUALIZA POSIÇÕES E ROTAÇÃO ----------
    function updateSquares() {
        for (let i = squares.length - 1; i >= 0; i--) {
            const sq = squares[i];
            
            // Movimento vertical
            sq.y += sq.speedY;
            
            // Atualiza rotação
            sq.rotation += sq.rotationSpeed;
            
            // Normaliza rotação para evitar números muito grandes
            if (sq.rotation > 360) sq.rotation -= 360;
            if (sq.rotation < 0) sq.rotation += 360;
            
            // Remove somente se saiu completamente da tela com margem generosa
            const isOutOfBounds = (sq.y + sq.size / 2 < -100) || (sq.y - sq.size / 2 > canvasHeight + 100);
            if (isOutOfBounds) {
                squares.splice(i, 1);
                continue;
            }
            
            // Efeito de desvanecimento suave baseado na posição Y
            // O desaparecimento ocorre apenas quando está muito próximo das bordas
            let fadeFactor = 1.0;
            const centerY = sq.y;
            
            // Desaparece apenas no topo extremo ou fundo extremo (para quadrados que estão saindo)
            if (centerY < sq.size / 2 + 40) {
                // Topo da tela - desaparece suavemente
                fadeFactor = Math.max(0, centerY / (sq.size / 2 + 40));
            } else if (centerY > canvasHeight - sq.size / 2 - 40) {
                // Fundo da tela - desaparece suavemente
                fadeFactor = Math.max(0, (canvasHeight - centerY) / (sq.size / 2 + 40));
            }
            
            // Calcula opacidade final
            sq.currentOpacity = sq.opacity * Math.max(0.08, Math.min(1, fadeFactor));
            
            // Remove se ficou extremamente transparente
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
        
        // Sombra suave para dar profundidade
        ctx.shadowColor = `rgba(255, 255, 255, ${op * 0.3})`;
        ctx.shadowBlur = 4;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
        ctx.fillRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        
        // Pequeno brilho interno para quadrados maiores
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
        
        // Spawn suave baseado em tempo (menos frequente)
        if (SPAWN_RATE > 0 && squares.length < MAX_SQUARES) {
            const spawnInterval = 1.0 / SPAWN_RATE;
            spawnAccumulator += delta;
            while (spawnAccumulator >= spawnInterval && squares.length < MAX_SQUARES + 5) {
                spawnSquare();
                spawnAccumulator -= spawnInterval;
                if (spawnAccumulator > 0.5) spawnAccumulator = spawnInterval * 0.5;
            }
            if (spawnAccumulator > 0.5) spawnAccumulator = 0;
        }
        
        // Mantém número mínimo de quadrados para nunca parecer vazio
        maintainSquareCount();
        
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
    
    // ---------- QUADROS INICIAIS (PARA PARECER QUE JÁ EXISTIAM) ----------
    function seedInitialSquares(count = 55) {
        for (let i = 0; i < count; i++) {
            const size = Math.floor(Math.random() * (SQUARE_SIZE_MAX - SQUARE_SIZE_MIN + 1) + SQUARE_SIZE_MIN);
            const maxX = canvasWidth - size;
            const minX = size;
            const x = Math.random() * (maxX - minX) + minX;
            
            // Distribuição por toda a tela para parecer que já estão lá
            const y = size / 2 + Math.random() * (canvasHeight - size);
            
            // Velocidades variadas: alguns sobem, alguns descem, alguns quase parados
            let speedY;
            const speedType = Math.random();
            if (speedType < 0.7) {
                // Sobe lentamente
                speedY = -(Math.random() * (SQUARE_SPEED_MAX - 0.3) + 0.3);
            } else if (speedType < 0.9) {
                // Desce lentamente
                speedY = (Math.random() * (SQUARE_SPEED_MAX - 0.3) + 0.3);
            } else {
                // Quase parado
                speedY = (Math.random() - 0.5) * 0.4;
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
    
    // ---------- EVENTO DE REDIMENSIONAMENTO DA JANELA ----------
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // ---------- INICIALIZAÇÃO ----------
    function init() {
        resizeCanvas();
        seedInitialSquares(55); // Muitos quadrados já existentes desde o início
        updateLinesWidth();
        lastFrameTime = 0;
        spawnAccumulator = 0;
        requestAnimationFrame(animate);
    }
    
    init();
})();
