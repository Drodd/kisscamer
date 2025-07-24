// Kiss Camera 模拟器 - 游戏逻辑

// 屏幕适配功能
function initResponsiveScale() {
    const gameContainer = document.querySelector('.game-container');
    const viewportContainer = document.querySelector('.viewport-container');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 固定分辨率
    const baseWidth = 720;
    const baseHeight = 1280;
    
    // 计算缩放比例，保持宽高比
    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // 应用缩放并确保不变形
    gameContainer.style.transform = `scale(${scale})`;
    gameContainer.style.transformOrigin = 'center center';
    
    // 设置游戏容器的固定尺寸，防止拉伸
    gameContainer.style.width = baseWidth + 'px';
    gameContainer.style.height = baseHeight + 'px';
    gameContainer.style.flexShrink = '0';
    
    // 确保容器使用flex布局保持居中，不变形
    viewportContainer.style.display = 'flex';
    viewportContainer.style.alignItems = 'center';
    viewportContainer.style.justifyContent = 'center';
    
    // 窗口大小改变时重新计算
    window.addEventListener('resize', initResponsiveScale);
}

class KissCameraGame {
    constructor() {
        this.score = 0; // 任务完成次数
        this.taskTimeLeft = 15; // 任务倒计时
        // 计算取景器初始居中位置
        const viewportWidth = Math.min(window.innerWidth * 0.8, 640);
        const totalScrollRange = viewportWidth * 3;
        this.viewfinderPosition = totalScrollRange / 2; // 初始在中间位置
        this.maxScroll = totalScrollRange; // 设置最大滚动范围
        this.isPushing = false;
        this.gameInterval = null;
        this.taskInterval = null;
        this.audience = [];
        this.currentTask = null;
        this.taskPool = [
            {
                id: 1,
                name: "拍摄欢呼的观众",
                description: "将欢呼的观众放在取景器中央区域",
                validImages: ['imgs/img_man1.png', 'imgs/img_man2.png', 'imgs/img_man4.png', 'imgs/img_man6.png', 'imgs/img_man8.png', 'imgs/img_man10.png']
            },
            {
                id: 2,
                name: "拍摄心不在焉的观众",
                description: "将心不在焉的观众放在取景器中央区域",
                validImages: ['imgs/img_man3.png', 'imgs/img_man5.png', 'imgs/img_man7.png', 'imgs/img_man9.png', 'imgs/img_man11.png']
            },
            {
                id: 3,
                name: "拍摄甜蜜情侣",
                description: "将甜蜜情侣放在取景器中央区域",
                validImages: ['imgs/img_cp1.png', 'imgs/img_cp2.png', 'imgs/img_cp3.png'],
                isCouple: true
            }
        ];
        
        this.init();
    }

    init() {
        // 初始化响应式缩放
        initResponsiveScale();
        
        this.setupElements();
        this.calculateInitialPosition();
        this.generateAudience();
        this.setupEventListeners();
        this.startGame();
    }
    
    calculateInitialPosition() {
        // 使用固定分辨率720x1280
        const viewportWidth = 720;
        const totalScrollRange = viewportWidth * 2.5; // 横向滚动范围
        this.viewfinderPosition = totalScrollRange / 2; // 初始在中间位置
        this.maxScroll = totalScrollRange; // 设置最大滚动范围
        
        // 立即设置初始位置
        if (this.viewfinderContent) {
            this.viewfinderContent.style.transform = `translateX(-${this.viewfinderPosition}px)`;
        }
        if (this.foregroundLayer) {
            this.foregroundLayer.style.transform = `translateX(-${this.viewfinderPosition}px)`;
        }
        if (this.backgroundFar) {
            this.backgroundFar.style.transform = 'translateX(0px)';
        }
        if (this.backgroundNear) {
            this.backgroundNear.style.transform = 'translateX(0px)';
        }
    }

    setupElements() {
        // 获取DOM元素
        this.liveScreen = document.getElementById('liveScreen');
        this.liveContent = document.getElementById('liveContent');
        this.viewfinder = document.getElementById('viewfinder');
        this.viewfinderContent = document.getElementById('viewfinderContent');
        this.audienceLayer = document.getElementById('audienceLayer');
        this.foregroundLayer = document.getElementById('foregroundLayer');
        this.backgroundFar = document.getElementById('backgroundFar');
        this.backgroundNear = document.getElementById('backgroundNear');
        this.scoreElement = document.getElementById('score');
        this.moveLeftBtn = document.getElementById('moveLeftBtn');
        this.moveRightBtn = document.getElementById('moveRightBtn');
        this.pushBtn = document.getElementById('pushBtn');
    }

    generateAudience() {
        // 清空现有观众和前景层
        this.audienceLayer.innerHTML = '';
        this.audience = [];

        // 确保前景层可见
        this.foregroundLayer.style.backgroundImage = "url('imgs/img_cam_bg2.png')";
        this.foregroundLayer.style.display = 'block';

        // 普通观众图片列表
        const audienceImages = [
            'imgs/img_man1.png',
            'imgs/img_man2.png',
            'imgs/img_man3.png',
            'imgs/img_man4.png',
            'imgs/img_man5.png',
            'imgs/img_man6.png',
            'imgs/img_man7.png',
            'imgs/img_man8.png',
            'imgs/img_man9.png',
            'imgs/img_man10.png',
            'imgs/img_man11.png'
        ];

        // 情侣观众图片列表
        const coupleImages = [
            'imgs/img_cp1.png',
            'imgs/img_cp2.png',
            'imgs/img_cp3.png'
        ];

        // 生成观众
        const numAudience = 10;
        const numCouples = 2; // 添加3对情侣观众
        const allPositions = [];
        
        // 使用与calculateInitialPosition相同的计算方式确保一致性
        const viewportWidth = Math.min(window.innerWidth * 0.8, 640);
        const totalScrollRange = this.maxScroll || viewportWidth * 3;
        
        // 在整个横向空间均匀分散分布观众
        const spacing = totalScrollRange / (numAudience + 1); // 计算均匀间距
        const margin = 0; // 边缘间距
        for (let i = 0; i < numAudience; i++) {
            // 均匀分布的基础上添加随机偏移，覆盖整个横向空间
            const basePosition = spacing * (i + 1);
            const randomOffset = (Math.random() - 0.5) * spacing * 0.3; // 轻微随机偏移
            const position = basePosition + randomOffset;
            // 完全覆盖从0到totalScrollRange的整个范围
            allPositions.push(Math.max(100, Math.min(position, totalScrollRange - 200)));
        }
        
        // 打乱位置，确保随机分布
        for (let i = allPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }
        
        // 随机选择位置给情侣观众
        const coupleIndices = [];
        while (coupleIndices.length < numCouples) {
            const idx = Math.floor(Math.random() * numAudience);
            if (!coupleIndices.includes(idx)) {
                coupleIndices.push(idx);
            }
        }
        
        // 生成所有观众
        for (let i = 0; i < numAudience; i++) {
            const isCouple = coupleIndices.includes(i);
            const imageSrc = isCouple 
                ? coupleImages[Math.floor(Math.random() * coupleImages.length)]
                : audienceImages[Math.floor(Math.random() * audienceImages.length)];
                
            const member = this.createAudienceMember(
                allPositions[i], // 使用打乱后的位置
                imageSrc,
                isCouple
            );
            this.audience.push(member);
            this.audienceLayer.appendChild(member.element);
        }
    }

    createAudienceMember(x, imageSrc, isCouple = false) {
        const element = document.createElement('div');
        element.className = 'audience-member';
        element.style.left = x + 'px';
        element.style.backgroundImage = `url('${imageSrc}')`;
        element.dataset.x = x;
        element.dataset.imageSrc = imageSrc;
        element.dataset.isCouple = isCouple;
        
        // 存储原始图片和反应图片
        if (isCouple) {
            const baseName = imageSrc.replace('.png', '');
            element.dataset.originalSrc = imageSrc;
            element.dataset.reactSrc = baseName + '_react.png';
        }

        return {
            element: element,
            x: x,
            imageSrc: imageSrc,
            isCouple: isCouple,
            isReacting: false
        };
    }


    setupEventListeners() {
        // 连续移动相关变量
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.moveSpeed = 10; // 移动速度
        this.animationFrame = null;

        // 移动按钮事件 - 鼠标
        this.moveLeftBtn.addEventListener('mousedown', () => this.startMoveLeft());
        this.moveLeftBtn.addEventListener('mouseup', () => this.stopMoveLeft());
        this.moveLeftBtn.addEventListener('mouseleave', () => this.stopMoveLeft());

        this.moveRightBtn.addEventListener('mousedown', () => this.startMoveRight());
        this.moveRightBtn.addEventListener('mouseup', () => this.stopMoveRight());
        this.moveRightBtn.addEventListener('mouseleave', () => this.stopMoveRight());

        // 移动按钮事件 - 触摸
        this.moveLeftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startMoveLeft();
        });
        this.moveLeftBtn.addEventListener('touchend', () => this.stopMoveLeft());
        this.moveLeftBtn.addEventListener('touchcancel', () => this.stopMoveLeft());

        this.moveRightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startMoveRight();
        });
        this.moveRightBtn.addEventListener('touchend', () => this.stopMoveRight());
        this.moveRightBtn.addEventListener('touchcancel', () => this.stopMoveRight());

        // 推送按钮事件
        this.pushBtn.addEventListener('click', () => {
            this.pushToLive();
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return; // 防止键盘长按重复触发
            switch(e.key) {
                case 'ArrowLeft':
                    this.startMoveLeft();
                    break;
                case 'ArrowRight':
                    this.startMoveRight();
                    break;
                case ' ':
                    e.preventDefault();
                    this.pushToLive();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.stopMoveLeft();
                    break;
                case 'ArrowRight':
                    this.stopMoveRight();
                    break;
            }
        });

        // 触摸滑动支持
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchEndX = 0;

        this.viewfinder.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.viewfinder.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.moveViewfinder(100);
                } else {
                    this.moveViewfinder(-100);
                }
            }
        });
    }

startMoveLeft() {
        if (this.isPushing) return;
        this.isMovingLeft = true;
        this.isMovingRight = false;
        this.continuousMove();
    }

    stopMoveLeft() {
        this.stopContinuousMove();
    }

    startMoveRight() {
        if (this.isPushing) return;
        if (this.isMovingLeft || this.isMovingRight) return; // 防止重复启动
        this.isMovingRight = true;
        this.isMovingLeft = false;
        this.continuousMove();
    }

    stopMoveRight() {
        this.stopContinuousMove();
    }

    continuousMove() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        const moveStep = () => {
            // 再次检查移动状态，防止竞态条件
            if (!this.isMovingLeft && !this.isMovingRight) {
                this.animationFrame = null;
                return;
            }

            // 移动方向
            const direction = this.isMovingLeft ? -1 : 1;
            
            // img_cam_bg1和img_cam_bg2的循环宽度，确保无缝衔接
            const bg1LoopWidth = 901 * 4; // 3604px
            const bg2LoopWidth = 458 * 8; // 3664px
            
            // 使用较大的循环宽度确保无缝循环
            const maxLoopWidth = Math.max(bg1LoopWidth, bg2LoopWidth);
            
            // 计算取景器可视区域的实际宽度
            const viewfinderWidth = this.viewfinder.offsetWidth || 640;
            const maxRightDistance = viewfinderWidth * 3; // 最大向右移动距离为可视区域3倍
            
            let newPosition = this.viewfinderPosition + direction * this.moveSpeed;
            console.log(`当前位置: ${this.viewfinderPosition}, 目标位置: ${newPosition}, 最大距离: ${maxRightDistance}`);
            
            // 限制向右移动范围
            if (newPosition > maxRightDistance) {
                newPosition = maxRightDistance;
                // 到达右边界时停止移动
                if (this.isMovingRight) {
                    this.isMovingRight = false;
                }
            }
            // 限制向左移动范围（不能小于0）
            if (newPosition < 0) {
                newPosition = 0;
                // 到达左边界时停止移动
                if (this.isMovingLeft) {
                    this.isMovingLeft = false;
                }
            }
            this.viewfinderPosition = newPosition;
            this.viewfinderContent.style.transform = `translateX(-${newPosition}px)`;
            this.foregroundLayer.style.transform = `translateX(-${newPosition}px)`;
            
            // 游戏背景相对位移动画：只有img_bg1以1/50速度相对移动（反向移动）
            const backgroundMoveSpeed = 0.02; // 1/50 = 0.02
            const maxBackgroundOffset = 500; // 限制最大偏移量，确保不会露出边缘
            const backgroundOffset = Math.max(-maxBackgroundOffset, Math.min(maxBackgroundOffset, -newPosition * backgroundMoveSpeed));
            if (this.backgroundFar) {
                this.backgroundFar.style.transform = `translateX(${backgroundOffset}px)`;
            }
            // img_bg2保持不动，不设置transform
            
            this.highlightVisibleTargets();
            
            // 同步直播屏幕的显示（如果正在显示）
            this.syncLiveDisplay();
            
            if (this.isMovingLeft || this.isMovingRight) {
                this.animationFrame = requestAnimationFrame(moveStep);
            }
        };
        
        this.animationFrame = requestAnimationFrame(moveStep);
    }

    stopContinuousMove() {
        this.isMovingLeft = false;
        this.isMovingRight = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    highlightVisibleTargets() {
        const viewfinderWidth = this.viewfinder.offsetWidth || 640;
        const viewStart = this.viewfinderPosition;
        const viewEnd = viewStart + viewfinderWidth;
        
        // 计算取景器内30%-70%的区间范围
        const targetStart = viewStart + viewfinderWidth * 0.30;
        const targetEnd = viewStart + viewfinderWidth * 0.70;

        // 清除所有高亮
        this.audience.forEach(member => {
            member.element.classList.remove('highlight');
        });

        // 调试信息
        console.log(`取景器位置: ${viewStart}-${viewEnd}, 目标区间: ${targetStart}-${targetEnd}`);

        // 高亮取景器30%-70%区间内的任务目标
        if (this.currentTask) {
            this.audience.forEach((member, index) => {
                if (this.currentTask.validImages.includes(member.imageSrc)) {
                    const memberX = parseFloat(member.x);
                    const isInRange = memberX >= targetStart && memberX <= targetEnd;
                    console.log(`观众${index}: 位置=${memberX}, 是否在区间=${isInRange}`);
                    if (isInRange) {
                        member.element.classList.add('highlight');
                    }
                }
            });
        }
    }

    pushToLive() {
        if (this.isPushing) return;

        this.isPushing = true;
        this.pushBtn.disabled = true;
        this.viewfinder.classList.add('recording');

        // 检查是否包含情侣观众，并触发反应动画
        const reactingCouples = this.getReactingCouples();
        this.triggerCoupleReaction(reactingCouples);

        // 克隆取景器内容到直播屏幕
        this.cloneViewfinderToLive(reactingCouples);
        
        // 显示直播屏幕
        this.liveContent.classList.add('active');

        // 检查是否完成任务
        const taskCompleted = this.checkTaskCompletion();
        
        // 3秒后隐藏并恢复情侣观众原图
        setTimeout(() => {
            this.liveContent.classList.remove('active');
            this.liveContent.innerHTML = ''; // 清除克隆的内容
            this.viewfinder.classList.remove('recording');
            this.pushBtn.disabled = false;
            this.isPushing = false;
            
            // 恢复情侣观众原图
            this.restoreCoupleImages(reactingCouples);
            
            // 任务完成后在隐藏动画结束后切换任务
            if (taskCompleted) {
                this.score++;
                this.updateScore();
                this.showTaskComplete();
                this.nextTask();
            }
        }, 3000);
    }

    cloneViewfinderToLive(reactingCouples) {
        // 清空直播屏幕内容
        this.liveContent.innerHTML = '';
        
        // 计算比例系数：直播屏幕宽度 / 取景器宽度
        const liveScreenWidth = 250; // 直播屏幕实际宽度
        const viewfinderWidth = this.viewfinder.offsetWidth || 640; // 取景器实际宽度
        const scaleRatio = liveScreenWidth / viewfinderWidth;
        
        // 计算偏移量：游戏画面宽度的10%
        const gameContainerWidth = document.querySelector('.game-container').offsetWidth || 360;
        const offsetAmount = gameContainerWidth * 0.1;
        
        // 创建直播屏幕的容器结构，使用取景框焦点模式
        const liveContainer = document.createElement('div');
        liveContainer.className = 'live-viewfinder-container';
        liveContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 50%;
        `;
        
        // 创建背景层，使用取景框当前焦点区域并添加偏移，缩小比例
        const liveViewfinderContent = document.createElement('div');
        liveViewfinderContent.id = 'liveViewfinderContent';
        liveViewfinderContent.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${3604 * scaleRatio}px;
            height: 100%;
            background-image: url('imgs/img_cam_bg1.png');
            background-size: auto 100%;
            background-position: left center;
            background-repeat: repeat-x;
            transform: translateX(-${(this.viewfinderPosition + offsetAmount) * scaleRatio}px);
            transition: none;
            z-index: 1;
        `;
        
        // 创建前景层，使用取景框当前焦点区域并添加偏移，缩小比例
        const liveForegroundLayer = document.createElement('div');
        liveForegroundLayer.id = 'liveForegroundLayer';
        liveForegroundLayer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: ${3604 * scaleRatio}px;
            height: 40%;
            background-image: url('imgs/img_cam_bg2.png');
            background-size: auto 100%;
            background-position: left bottom;
            background-repeat: repeat-x;
            transform: translateX(-${(this.viewfinderPosition + offsetAmount) * scaleRatio}px);
            z-index: 2;
        `;
        
        // 创建观众层，显示取景框当前焦点区域
        const liveAudienceLayer = document.createElement('div');
        liveAudienceLayer.id = 'liveAudienceLayer';
        liveAudienceLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        // 克隆所有观众成员，按比例缩小位置
        this.audience.forEach(member => {
            const clonedMember = member.element.cloneNode(true);
            const originalX = parseFloat(member.x);
            const scaledX = originalX * scaleRatio;
            
            // 设置缩放后的样式
            clonedMember.style.left = scaledX + 'px';
            clonedMember.style.height = member.element.style.height; // 保持相对高度
            clonedMember.style.aspectRatio = member.element.style.aspectRatio;
            clonedMember.style.backgroundImage = member.element.style.backgroundImage;
            clonedMember.style.backgroundSize = 'contain';
            clonedMember.style.backgroundRepeat = 'no-repeat';
            clonedMember.style.backgroundPosition = 'bottom center';
            clonedMember.style.bottom = member.element.style.bottom;
            clonedMember.style.transformOrigin = 'bottom center';
            
            // 确保data属性被正确复制
            clonedMember.dataset.imageSrc = member.imageSrc;
            clonedMember.dataset.isCouple = member.isCouple;
            if (member.isCouple) {
                clonedMember.dataset.originalSrc = member.element.dataset.originalSrc;
                clonedMember.dataset.reactSrc = member.element.dataset.reactSrc;
            }
            
            // 确保直播画面中的情侣显示反应状态
            if (reactingCouples.includes(member)) {
                const reactSrc = member.element.dataset.reactSrc;
                if (reactSrc) {
                    clonedMember.style.backgroundImage = `url('${reactSrc}')`;
                }
            }
            
            liveAudienceLayer.appendChild(clonedMember);
        });
        
        // 组装结构 - 现在直播屏幕将按比例显示取景框当前焦点区域
        liveViewfinderContent.appendChild(liveAudienceLayer);
        liveViewfinderContent.appendChild(liveForegroundLayer);
        liveContainer.appendChild(liveViewfinderContent);
        this.liveContent.appendChild(liveContainer);
    }

    syncLiveDisplay() {
        // 如果直播屏幕正在显示，同步移动
        if (this.liveContent.classList.contains('active')) {
            const liveContent = this.liveContent.querySelector('#liveViewfinderContent');
            const liveForeground = this.liveContent.querySelector('#liveForegroundLayer');
            
            // 计算比例系数和偏移量，确保同步移动
            const liveScreenWidth = 250;
            const viewfinderWidth = this.viewfinder.offsetWidth || 640;
            const scaleRatio = liveScreenWidth / viewfinderWidth;
            
            const gameContainerWidth = document.querySelector('.game-container').offsetWidth || 360;
            const offsetAmount = gameContainerWidth * 0.25;
            
            if (liveContent) {
                liveContent.style.transform = `translateX(-${(this.viewfinderPosition + offsetAmount) * scaleRatio}px)`;
            }
            if (liveForeground) {
                liveForeground.style.transform = `translateX(-${(this.viewfinderPosition + offsetAmount) * scaleRatio}px)`;
            }
        }
    }

    captureViewfinder() {
        // 这个方法现在可以保留作为备用，但不再使用
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 640;
        canvas.height = 480;
        
        // 创建渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4a5568');
        gradient.addColorStop(1, '#2d3748');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制看台背景图案
        ctx.fillStyle = '#1a202c';
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.fillRect(i, canvas.height - 50, 2, 50);
        }
        
        // 绘制观众
        this.audience.forEach(member => {
            const x = parseFloat(member.element.style.left) - this.viewfinderPosition;
            const y = canvas.height - 100;
            
            if (x >= 0 && x <= canvas.width) {
                // 绘制人物轮廓
                ctx.fillStyle = member.isMale ? '#4299e1' : '#ed8936';
                ctx.fillRect(x, y, 60, 80);
                
                // 绘制头部
                ctx.fillStyle = '#fdb99b';
                ctx.beginPath();
                ctx.arc(x + 30, y + 15, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // 标记情侣
                if (member.isCouple) {
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x - 2, y - 2, 64, 84);
                }
            }
        });
        
        return canvas;
    }

    getReactingCouples() {
        const viewfinderRect = this.viewfinder.getBoundingClientRect();
        const viewStart = this.viewfinderPosition;
        const viewEnd = viewStart + viewfinderRect.width;

        return this.audience.filter(member => {
            return member.isCouple && 
                   member.x >= viewStart && member.x <= viewEnd;
        });
    }

    triggerCoupleReaction(couples) {
        couples.forEach(couple => {
            if (couple.isCouple && !couple.isReacting) {
                const reactSrc = couple.element.dataset.reactSrc;
                if (reactSrc) {
                    couple.element.style.backgroundImage = `url('${reactSrc}')`;
                    couple.isReacting = true;
                    couple.element.classList.add('reacting');
                }
            }
        });
    }

    restoreCoupleImages(couples) {
        couples.forEach(couple => {
            if (couple.isCouple && couple.isReacting) {
                const originalSrc = couple.element.dataset.originalSrc;
                couple.element.style.backgroundImage = `url('${originalSrc}')`;
                couple.isReacting = false;
                couple.element.classList.remove('reacting');
            }
        });
    }

    checkTaskCompletion() {
        if (!this.currentTask) {
            console.log('❌ 没有当前任务');
            return false;
        }
        
        // 确保viewfinder已加载
        if (!this.viewfinder.offsetWidth) {
            console.log('❌ 取景器未加载');
            return false;
        }
        
        // 检查取景器内30%-70%区间内的观众
        const viewfinderWidth = this.viewfinder.offsetWidth;
        const viewStart = this.viewfinderPosition;
        const viewEnd = viewStart + viewfinderWidth;
        
        // 计算取景器内10%-50%的区间范围
        const targetStart = viewStart + viewfinderWidth * 0.1;
        const targetEnd = viewStart + viewfinderWidth * 0.5;

        // 调试信息
        console.log(`检测区间: ${targetStart}-${targetEnd}`);

        // 检查是否有任务目标在取景器30%-70%区间内
        let hasValidMember = false;
        for (let member of this.audience) {
            if (this.currentTask.validImages.includes(member.imageSrc)) {
                const memberX = parseFloat(member.x);
                const isInRange = memberX >= targetStart && memberX <= targetEnd;
                console.log(`检测观众: 位置=${memberX}, 是否在区间=${isInRange}, 图片=${member.imageSrc}`);
                if (isInRange) {
                    hasValidMember = true;
                    break;
                }
            }
        }
        
        console.log(`检测结果: ${hasValidMember}`);
        return hasValidMember;
    }

    showTaskComplete() {
        const overlay = document.createElement('div');
        overlay.className = 'task-complete-overlay';
        overlay.innerHTML = `
            <div class="task-complete-text">任务达成！</div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 2000);
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    updateTimer() {
        // 总倒计时已移除
    }

    updateTaskTimer() {
        const taskTimerElement = document.getElementById('taskTimer');
        if (taskTimerElement) {
            taskTimerElement.textContent = this.taskTimeLeft;
            
            // 添加紧张感效果
            if (this.taskTimeLeft <= 5) {
                taskTimerElement.classList.add('urgent');
            } else {
                taskTimerElement.classList.remove('urgent');
            }
        }
    }

    startTask() {
        // 确保随机选择不同任务
        let newTask;
        do {
            newTask = this.taskPool[Math.floor(Math.random() * this.taskPool.length)];
        } while (this.currentTask && newTask.id === this.currentTask.id && this.taskPool.length > 1);
        
        this.currentTask = newTask;
        this.taskTimeLeft = 15;
        this.updateTaskDisplay();
        this.updateTaskTimer();
        
        // 显示当前观众分布
        console.log('=== 当前观众分布 ===');
        this.audience.forEach((member, index) => {
            console.log(`观众${index}: ${member.imageSrc}, 位置: ${member.x}`);
        });
        
        this.taskInterval = setInterval(() => {
            this.taskTimeLeft--;
            this.updateTaskTimer();
            
            // 添加倒计时警告效果
            const taskTimerElement = document.getElementById('taskTimer');
            if (taskTimerElement) {
                if (this.taskTimeLeft <= 5) {
                    taskTimerElement.classList.add('warning');
                } else {
                    taskTimerElement.classList.remove('warning');
                }
            }
            
            if (this.taskTimeLeft <= 0) {
                this.failTask();
            }
        }, 1000);
    }

    failTask() {
        clearInterval(this.taskInterval);
        const overlay = document.createElement('div');
        overlay.className = 'task-complete-overlay';
        overlay.innerHTML = `
            <div class="task-complete-text" style="background: rgba(255, 0, 0, 0.9);">任务失败</div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
            this.endGame();
        }, 2000);
    }

    nextTask() {
        clearInterval(this.taskInterval);
        
        // 延迟生成新任务，让玩家有时间看到成功消息
        setTimeout(() => {
            this.startTask();
        }, 2000);
    }

    updateTaskDisplay() {
        const taskNameElement = document.getElementById('taskName');
        
        if (taskNameElement && this.currentTask) {
            taskNameElement.textContent = this.currentTask.name;
        }
    }

    startGame() {
        // 总倒计时已移除，游戏只会因为任务倒计时为0而结束
        // 开始第一个任务
        this.startTask();
    }

    endGame() {
        clearInterval(this.taskInterval);
        
        const finalScore = this.score;
        const message = `游戏结束！\n完成任务次数: ${finalScore}\n\n点击确定重新开始`;
        
        if (confirm(message)) {
            this.restartGame();
        }
    }

    restartGame() {
        this.score = 0;
        this.taskTimeLeft = 15;
        // 计算取景器初始居中位置
        const viewportWidth = Math.min(window.innerWidth * 0.8, 640);
        const totalScrollRange = viewportWidth * 3;
        this.viewfinderPosition = totalScrollRange / 2; // 初始在中间位置
        this.isPushing = false;
        this.currentTask = null;
        
        this.updateScore();
        this.updateTimer();
        this.viewfinderContent.style.transform = `translateX(-${this.viewfinderPosition}px)`;
        
        // 重置背景位置，只有img_bg1移动，img_bg2保持不动
        if (this.backgroundFar) {
            this.backgroundFar.style.transform = 'translateX(0px)';
        }
        // img_bg2保持不动，不重置transform
        
        this.generateAudience();
        this.startGame();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new KissCameraGame();
    
    // 防止页面滚动
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停游戏
        console.log('游戏暂停');
    } else {
        // 页面显示时恢复游戏
        console.log('游戏恢复');
    }
});