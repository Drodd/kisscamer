// Kiss Camera 模拟器 - 游戏逻辑

// 屏幕适配功能
function initResponsiveScale() {
    // 获取所有游戏容器，包括标题界面和主游戏
    const allGameContainers = document.querySelectorAll('.game-container');
    const allViewportContainers = document.querySelectorAll('.viewport-container');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 固定分辨率
    const baseWidth = 720;
    const baseHeight = 1280;
    
    // 计算缩放比例，保持宽高比，并确保在所有设备上都能显示完整
    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;
    let scale = Math.min(scaleX, scaleY);
    
    // 确保最小缩放比例，避免内容过小
    const minScale = 0.3;
    const maxScale = 1.0;
    scale = Math.max(minScale, Math.min(maxScale, scale));
    
    console.log('响应式缩放信息:', {
        viewportWidth,
        viewportHeight,
        baseWidth,
        baseHeight,
        scaleX: scaleX.toFixed(3),
        scaleY: scaleY.toFixed(3),
        finalScale: scale.toFixed(3),
        containerCount: allGameContainers.length
    });
    
    // 对所有游戏容器应用相同的缩放
    allGameContainers.forEach((gameContainer, index) => {
        // 应用缩放并确保不变形
        gameContainer.style.transform = `scale(${scale})`;
        gameContainer.style.transformOrigin = 'center center';
        
        // 设置游戏容器的固定尺寸，防止拉伸
        gameContainer.style.width = baseWidth + 'px';
        gameContainer.style.height = baseHeight + 'px';
        gameContainer.style.flexShrink = '0';
        
        console.log(`容器 ${index + 1} 已应用缩放: ${scale.toFixed(3)}`);
    });
    
    // 对所有视口容器设置布局
    allViewportContainers.forEach((viewportContainer) => {
        // 确保容器使用flex布局保持居中，不变形
        viewportContainer.style.display = 'flex';
        viewportContainer.style.alignItems = 'center';
        viewportContainer.style.justifyContent = 'center';
    });
    
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
                name: "双手举起来！",
                description: "将欢呼的观众放在取景器中央区域",
                validImages: ['imgs/img_man4.png', 'imgs/img_man6.png', 'imgs/img_man10.png']
            },
            {
                id: 2,
                name: "忧虑有气质！",
                description: "将心不在焉的观众放在取景器中央区域",
                validImages: ['imgs/img_man3.png', 'imgs/img_man5.png', 'imgs/img_man7.png', 'imgs/img_man9.png', 'imgs/img_man11.png']
            },
            {
                id: 3,
                name: "秀秀恩爱！",
                description: "将甜蜜情侣放在取景器中央区域",
                validImages: ['imgs/img_cp1.png', 'imgs/img_cp2.png', 'imgs/img_cp3.png'],
                isCouple: true
            },
            {
                id: 4,
                name: "上班也要high！",
                description: "将上班族放在取景器中央区域",
                validImages: ['imgs/img_man1.png']
            },
            {
                id: 5,
                name: "对面的女孩看过来！",
                description: "将女性观众放在取景器中央区域",
                validImages: ['imgs/img_man2.png','imgs/img_man3.png','imgs/img_man5.png','imgs/img_man6.png','imgs/img_man7.png','imgs/img_man9.png','imgs/img_man11.png']
            },
            {
                id: 6,
                name: "来点帅哥！",
                description: "将男性观众放在取景器中央区域",
                validImages: ['imgs/img_man1.png','imgs/img_man4.png','imgs/img_man8.png','imgs/img_man10.png']
            },
            {
                id: 7,
                name: "古天乐的皮肤！",
                description: "将古铜色皮肤的观众放在取景器中央区域",
                validImages: ['imgs/img_man5.png','imgs/img_man8.png','imgs/img_man11.png']
            },
            {
                id: 8,
                name: "短发真可爱！",
                description: "将短发的女性观众放在取景器中央区域",
                validImages: ['imgs/img_man3.png','imgs/img_man6.png','imgs/img_man7.png','imgs/img_man11.png']
            },
            {
                id: 9,
                name: "白衣天使在哪里？",
                description: "将穿白衣服的观众放在取景器中央区域",
                validImages: ['imgs/img_man2.png','imgs/img_man3.png','imgs/img_man4.png','imgs/img_man8.png']
            },
            {
                id: 10,
                name: "举起你的左手！",
                description: "将穿白衣服的观众放在取景器中央区域",
                validImages: ['imgs/img_man8.png']
            },
            {
                id: 11,
                name: "举起你的右手！",
                description: "将穿白衣服的观众放在取景器中央区域",
                validImages: ['imgs/img_man1.png','imgs/img_man2.png']
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
        this.foregroundLayer.style.backgroundImage = "url('./imgs/img_cam_bg2.png')";
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

        // 生成观众 - 确保每种观众至少出现1个
        const numAudience = 11;
        const numCouples = 3; // 2对情侣观众
        const allPositions = [];
        
        // 使用固定分辨率确保一致性
        const viewportWidth = 720; // 使用固定的游戏宽度
        const totalScrollRange = this.maxScroll || viewportWidth * 2.5;
        
        // 收集所有可用的观众类型
        const allAudienceTypes = [...audienceImages];
        const allCoupleTypes = [...coupleImages];
        
        // 创建观众类型列表，确保每种类型至少出现1个（如果观众数量允许）
        const requiredAudienceTypes = [];
        const requiredCoupleTypes = [];
        
        // 确保普通观众每种至少1个（最多到观众数量限制）
        const maxUniqueAudience = Math.min(allAudienceTypes.length, numAudience - numCouples);
        for (let i = 0; i < maxUniqueAudience; i++) {
            requiredAudienceTypes.push(allAudienceTypes[i]);
        }
        
        // 确保情侣观众每种至少1个（最多到情侣数量限制）
        const maxUniqueCouples = Math.min(allCoupleTypes.length, numCouples);
        for (let i = 0; i < maxUniqueCouples; i++) {
            requiredCoupleTypes.push(allCoupleTypes[i]);
        }
        
        // 填充剩余的观众（当观众数量超过唯一类型数量时允许重复）
        const remainingAudienceCount = numAudience - numCouples - requiredAudienceTypes.length;
        const remainingCoupleCount = numCouples - requiredCoupleTypes.length;
        
        // 添加剩余的普通观众（允许重复）
        for (let i = 0; i < remainingAudienceCount; i++) {
            const randomIndex = Math.floor(Math.random() * allAudienceTypes.length);
            requiredAudienceTypes.push(allAudienceTypes[randomIndex]);
        }
        
        // 添加剩余的情侣观众（允许重复）
        for (let i = 0; i < remainingCoupleCount; i++) {
            const randomIndex = Math.floor(Math.random() * allCoupleTypes.length);
            requiredCoupleTypes.push(allCoupleTypes[randomIndex]);
        }
        
        // 创建最终的观众列表
        const finalAudienceTypes = [...requiredAudienceTypes, ...requiredCoupleTypes];
        
        // 在整个横向空间均匀分散分布观众
        const spacing = totalScrollRange / (finalAudienceTypes.length + 1);
        for (let i = 0; i < finalAudienceTypes.length; i++) {
            const basePosition = spacing * (i + 1);
            const randomOffset = (Math.random() - 0.5) * spacing * 0.3;
            const position = basePosition + randomOffset;
            allPositions.push(Math.max(100, Math.min(position, totalScrollRange - 200)));
        }
        
        // 打乱位置，确保随机分布
        for (let i = allPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }
        
        // 打乱类型顺序，确保随机分布
        const shuffledTypes = [...finalAudienceTypes];
        for (let i = shuffledTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledTypes[i], shuffledTypes[j]] = [shuffledTypes[j], shuffledTypes[i]];
        }
        
        // 生成所有观众
        for (let i = 0; i < finalAudienceTypes.length; i++) {
            const imageSrc = shuffledTypes[i];
            const isCouple = coupleImages.includes(imageSrc);
            
            const member = this.createAudienceMember(
                allPositions[i],
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
        
        // 添加待机循环动画
        this.addIdleAnimation(element);

        return {
            element: element,
            x: x,
            imageSrc: imageSrc,
            isCouple: isCouple,
            isReacting: false
        };
    }
    
    addIdleAnimation(element) {
        // 为观众添加上下跃动动画，模拟演唱会节奏
        const animationDelay = Math.random() * 1.5; // 0-1.5秒随机延迟
        const animationDuration = 1.5 + Math.random() * 0.5; // 1.5-2秒随机时长
        
        element.style.animation = `idleJump ${animationDuration}s ease-in-out ${animationDelay}s infinite`;
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
            
            // 取景器和背景的循环宽度，确保无缝衔接
            const viewfinderLoopWidth = 560 * 4; // 2240px，与CSS中的400%保持一致
            
            // 计算取景器可视区域的实际宽度
            const viewfinderWidth = 560; // 使用固定的取景器宽度
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
            
            // 游戏背景相对位移动画：只有img_bg1以1/50速度相对移动（与取景器方向相反，创造视差效果）
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
        
        // 隐藏待机动画并切换动画类型
        if (liveAnimationManager) {
            liveAnimationManager.hide();
            liveAnimationManager.switchOnPush(); // 推送时切换动画
        }

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
            
            // 恢复待机动画
            if (liveAnimationManager) {
                liveAnimationManager.show();
            }
            
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
        const liveScreenOuterWidth = 350; // CSS中定义的外径
        const liveScreenWidth = 400; // 使用更大的有效宽度，提供更大的缩放比例 (400/560 ≈ 0.714)
        const viewfinderWidth = 560; // 取景器实际宽度 (对应CSS中的560px)
        const scaleRatio = liveScreenWidth / viewfinderWidth;
        
        // 调试信息：输出缩放计算结果
        console.log('直播画面缩放信息:', {
            liveScreenWidth,
            viewfinderWidth,
            scaleRatio: scaleRatio.toFixed(3),
            viewfinderPosition: this.viewfinderPosition,
            '新缩放比例': `${liveScreenWidth}/${viewfinderWidth} = ${scaleRatio.toFixed(3)}`,
            '前景层宽度': `${2400 * scaleRatio}px`,
            '前景层偏移': `${this.viewfinderPosition * scaleRatio}px`
        });
        
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
            background: #000;
        `;
        
        // 创建背景层，使用取景框当前焦点区域并添加偏移，缩小比例
        const liveViewfinderContent = document.createElement('div');
        liveViewfinderContent.id = 'liveViewfinderContent';
        liveViewfinderContent.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${2400 * scaleRatio}px; /* 使用更大宽度确保完全覆盖圆形区域 */
            height: 100%;
            background-image: url('imgs/img_cam_bg1.png');
            background-size: auto 100%;
            background-position: left center;
            background-repeat: repeat-x;
            transform: translateX(-${this.viewfinderPosition * scaleRatio}px);
            transition: none;
            z-index: 1;
        `;
        
        // 创建前景层，使用取景框当前焦点区域并添加偏移，缩小比例
        const liveForegroundLayer = document.createElement('div');
        liveForegroundLayer.id = 'liveForegroundLayer';
        liveForegroundLayer.className = 'foreground-layer'; // 使用CSS类获得正确的层级
        liveForegroundLayer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: ${2400 * scaleRatio}px; /* 使用更大宽度确保完全覆盖圆形区域 */
            height: 100%; /* 与CSS保持一致，通过background-position控制显示位置 */
            background-image: url('./imgs/img_cam_bg2.png');
            background-size: auto 100%;
            background-position: left bottom;
            background-repeat: repeat-x;
            transform: translateX(-${this.viewfinderPosition * scaleRatio}px);
            z-index: 10 !important; /* 强制确保前景层在所有观众上方 */
            pointer-events: none;
        `;
        
        // 创建观众层，显示取景框当前焦点区域
        const liveAudienceLayer = document.createElement('div');
        liveAudienceLayer.id = 'liveAudienceLayer';
        liveAudienceLayer.className = 'audience-layer'; // 使用CSS类获得正确的层级
        liveAudienceLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${2400 * scaleRatio}px; /* 与背景层同宽 */
            height: 100%;
            pointer-events: none;
            transform: translateX(-${this.viewfinderPosition * scaleRatio}px);
            z-index: 2; /* 在背景层上方，但在前景层下方 */
        `;
        
        // 克隆所有观众成员，按比例缩小位置
        this.audience.forEach(member => {
            const clonedMember = member.element.cloneNode(true);
            const originalX = parseFloat(member.x);
            // 由于观众层有自己的transform，直接使用缩放后的位置
            const scaledX = originalX * scaleRatio;
            
            // 设置缩放后的样式
            clonedMember.style.left = scaledX + 'px';
            clonedMember.style.width = `${parseFloat(window.getComputedStyle(member.element).width || '60') * scaleRatio}px`;
            clonedMember.style.height = `${parseFloat(window.getComputedStyle(member.element).height || '80') * scaleRatio}px`;
            clonedMember.style.aspectRatio = member.element.style.aspectRatio;
            clonedMember.style.backgroundImage = member.element.style.backgroundImage;
            clonedMember.style.backgroundSize = 'contain';
            clonedMember.style.backgroundRepeat = 'no-repeat';
            clonedMember.style.backgroundPosition = 'bottom center';
            clonedMember.style.bottom = member.element.style.bottom;
            clonedMember.style.transformOrigin = 'bottom center';
            clonedMember.style.position = 'absolute';
            clonedMember.style.zIndex = '1'; /* 确保观众在观众层内，但不会覆盖前景层 */
            
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
        // 按正确顺序添加：背景层、观众层、前景层
        liveContainer.appendChild(liveViewfinderContent); // 背景层
        liveContainer.appendChild(liveAudienceLayer); // 观众层
        liveContainer.appendChild(liveForegroundLayer); // 前景层（最上层）
        
        // 调试信息：检查层级设置
        console.log('直播屏幕层级调试:', {
            '背景层z-index': window.getComputedStyle(liveViewfinderContent).zIndex,
            '观众层z-index': window.getComputedStyle(liveAudienceLayer).zIndex,
            '前景层z-index': window.getComputedStyle(liveForegroundLayer).zIndex,
            '前景层className': liveForegroundLayer.className,
            '观众层className': liveAudienceLayer.className
        });
        
        this.liveContent.appendChild(liveContainer);
    }

    syncLiveDisplay() {
        // 如果直播屏幕正在显示，同步移动
        if (this.liveContent.classList.contains('active')) {
            const liveContent = this.liveContent.querySelector('#liveViewfinderContent');
            const liveAudience = this.liveContent.querySelector('#liveAudienceLayer');
            const liveForeground = this.liveContent.querySelector('#liveForegroundLayer');
            
            // 计算比例系数，确保同步移动
            const liveScreenWidth = 400; // 与cloneViewfinderToLive保持一致
            const viewfinderWidth = 560; // 与cloneViewfinderToLive保持一致
            const scaleRatio = liveScreenWidth / viewfinderWidth;
            
            const transformValue = `translateX(-${this.viewfinderPosition * scaleRatio}px)`;
            
            if (liveContent) {
                liveContent.style.transform = transformValue;
            }
            if (liveAudience) {
                liveAudience.style.transform = transformValue;
            }
            if (liveForeground) {
                liveForeground.style.transform = transformValue;
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
            <div class="task-complete-text">干得漂亮！</div>
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
            <div class="task-complete-text" style="background: rgba(255, 0, 0, 0.9);">再找找吧</div>
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
        const completedTasks = this.score;
        const avgTime = Math.max(1, 15 - this.score * 0.5); // 简单计算平均用时
        
        // 获取梯度称号
        const title = this.getTitleByScore(finalScore);
        
        // 隐藏取景器和UI
        this.hideAllUI();
        
        // 滑出取景器
        const viewfinderContainer = document.querySelector('.viewfinder-container');
        viewfinderContainer.classList.add('slide-out');
        
        // 显示结算界面
        setTimeout(() => {
            this.showEndScreen(finalScore, completedTasks, avgTime, title);
        }, 800);
    }

    getTitleByScore(score) {
        const titles = [
            { min: 0, max: 1, title: "新手摄影师", color: "#ccc" },
            { min: 2, max: 3, title: "业余摄影师", color: "#66bb6a" },
            { min: 4, max: 5, title: "熟练摄影师", color: "#42a5f5" },
            { min: 6, max: 8, title: "专业摄影师", color: "#ab47bc" },
            { min: 9, max: 12, title: "明星摄影师", color: "#ffa726" },
            { min: 13, max: 15, title: "传奇摄影师", color: "#ff7043" },
            { min: 16, max: 20, title: "顶级摄影师", color: "#ef5350" },
            { min: 21, max: 999, title: "摄影大师", color: "#ffd700" }
        ];
        
        const matched = titles.find(t => score >= t.min && score <= t.max);
        return matched || titles[0];
    }

    hideAllUI() {
        const elementsToHide = [
            '.score-display',
            '.task-overlay',
            '.arrow-left',
            '.arrow-right',
            '.push-btn'
        ];
        
        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('hidden');
            }
        });
    }

    showEndScreen(score, completedTasks, avgTime, title) {
        const endScreen = document.getElementById('endScreen');
        const finalScoreEl = document.getElementById('finalScore');
        const endTitleEl = document.getElementById('endTitle');
        const completedTasksEl = document.getElementById('completedTasks');
        const avgTimeEl = document.getElementById('avgTime');
        
        // 设置成绩数据
        finalScoreEl.textContent = score;
        endTitleEl.textContent = title.title;
        endTitleEl.style.color = title.color;
        completedTasksEl.textContent = completedTasks;
        avgTimeEl.textContent = avgTime.toFixed(1) + 's';
        
        // 显示结算界面
        endScreen.classList.add('active');
        
        // 绑定重新开始按钮
        document.getElementById('restartBtn').onclick = () => {
            this.restartGameFromEnd();
        };
    }

    restartGameFromEnd() {
        // 隐藏结算界面
        const endScreen = document.getElementById('endScreen');
        endScreen.classList.remove('active');
        
        // 重置取景器位置
        const viewfinderContainer = document.querySelector('.viewfinder-container');
        viewfinderContainer.classList.remove('slide-out');
        viewfinderContainer.classList.add('slide-up');
        
        // 重新初始化游戏
        this.restartGame();
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
        
        // 确保所有UI元素显示出来
        this.showGameElements();
        
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
    
    showGameElements() {
        const elementsToShow = [
            '.score-display',
            '.task-overlay',
            '.arrow-left',
            '.arrow-right',
            '.push-btn'
        ];
        
        elementsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.remove('hidden');
            }
        });
    }
}

// 游戏状态管理
let gameInstance = null;
let isGameStarted = false;

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 初始化响应式缩放，适用于标题界面
    initResponsiveScale();
    
    // 隐藏游戏元素，显示标题界面
    hideGameElements();
    
    // 绑定开始按钮事件
    document.getElementById('startBtn').addEventListener('click', startGame);
    
    // 防止页面滚动
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 禁止页面元素被选中和拖拽
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    });
    
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });
    
    // 禁止右键菜单
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // 禁止图片拖拽
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
    
    // 禁用F12等开发者工具快捷键（可选）
    document.addEventListener('keydown', (e) => {
        // 禁用F12, Ctrl+Shift+I, Ctrl+U等
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            return false;
        }
    });
});

function hideGameElements() {
    // 隐藏取景器和控制按钮
    const elementsToHide = [
        '.viewfinder-container',
        '.score-display',
        '.task-overlay',
        '.arrow-left',
        '.arrow-right',
        '.push-btn'
    ];
    
    elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

function showGameElements() {
    // 显示游戏元素
    const elementsToShow = [
        '.viewfinder-container',
        '.score-display',
        '.task-overlay',
        '.arrow-left',
        '.arrow-right',
        '.push-btn'
    ];
    
    elementsToShow.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.remove('hidden');
        }
    });
}

function startGame() {
    if (isGameStarted) return;
    
    isGameStarted = true;
    
    // 隐藏标题界面
    const titleScreen = document.getElementById('titleScreen');
    titleScreen.style.opacity = '0';
    
    // 显示游戏元素
    showGameElements();
    
    // 触发取景器滑入动画
    const viewfinderContainer = document.querySelector('.viewfinder-container');
    viewfinderContainer.classList.add('slide-up');
    
    // 重新计算缩放，确保游戏界面正确显示
    initResponsiveScale();
    
    // 延迟初始化游戏，等待动画完成
    setTimeout(() => {
        titleScreen.style.display = 'none';
        gameInstance = new KissCameraGame();
    }, 1000);
}


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

// 原始粒子待机动画（粒子扩散）
class LiveIdleAnimation {
    constructor() {
        this.canvas = document.getElementById('liveCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.particles = [];
        this.frameCount = 0;
        
        this.init();
    }
    
    init() {
        this.createParticles();
        this.startAnimation();
    }
    
    createParticles() {
        // 扩大粒子范围至整个250x250直播屏幕
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 在整个canvas范围内创建粒子
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                size: Math.random() * 4 + 2.5,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                color: this.getOptimizedColor(),
                alpha: Math.random() * 0.7 + 0.2,
                pulseSpeed: 0.1,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    getOptimizedColor() {
        const colors = ['#ff0040', '#ff8000', '#ff0000', '#ff4080'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    startAnimation() {
        // 防止重复启动动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.animate();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.frameCount++;
        
        const pulse = Math.sin(this.frameCount * 0.21);
        const beatIntensity = Math.abs(pulse);
        
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 140
        );
        gradient.addColorStop(0, `rgba(255, 0, 64, ${0.1 + beatIntensity * 0.1})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX *= -0.8;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY *= -0.8;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
            
            const currentAlpha = particle.alpha * (0.5 + pulse * 0.3);
            const currentSize = particle.size * (1 + pulse * 0.5);
            
            this.ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        if (beatIntensity > 0.5) {
            this.ctx.globalAlpha = beatIntensity * 0.3;
            this.ctx.fillStyle = '#ff0040';
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 12 + beatIntensity * 16, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        if (typeof document !== 'undefined') {
            const liveText = document.querySelector('.live-text');
            if (liveText) {
                const scale = 1 + pulse * 0.15;
                liveText.style.setProperty('--scale', scale);
            }
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    show() {
        // 先停止现有动画，防止重复启动
        this.stop();
        this.frameCount = 0;
        const idleElement = document.getElementById('liveIdleAnimation');
        if (idleElement) {
            idleElement.classList.remove('hidden');
        }
        this.startAnimation();
    }
    
    hide() {
        const idleElement = document.getElementById('liveIdleAnimation');
        if (idleElement) {
            idleElement.classList.add('hidden');
        }
        this.stop();
    }
}

// 圆环扩散待机动画（新增）
class LiveRingAnimation {
    constructor() {
        this.canvas = document.getElementById('liveCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.frameCount = 0;
        this.rings = [];
        this.colors = ['#ff0040', '#ff8000', '#ff0000', '#ff4080', '#ff00ff', '#ffff00', '#00ffff'];
        
        this.init();
    }
    
    init() {
        this.startAnimation();
    }
    
    startAnimation() {
        // 防止重复启动动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.animate();
    }
    
    createRing() {
        return {
            radius: 0,
            maxRadius: 125, // 匹配250px圆形屏幕
            thickness: 3 + Math.random() * 4,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            alpha: 1,
            speed: 3 + Math.random() * 3,
            glowIntensity: 0.8 + Math.random() * 0.4
        };
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.frameCount++;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 每30帧创建新圆环，降低频率增加节奏感
        if (this.frameCount % 30 === 0) {
            this.rings.push(this.createRing());
        }
        
        // 添加音乐节拍效果
        const beat = Math.sin(this.frameCount * 0.08);
        const beatIntensity = Math.abs(beat);
        
        // 更新和绘制圆环
        this.rings = this.rings.filter(ring => {
            ring.radius += ring.speed * (0.5 + beatIntensity * 0.5); // 速度随节拍变化
            ring.alpha = 1 - (ring.radius / ring.maxRadius);
            
            if (ring.alpha > 0) {
                // 绘制发光圆环 - 随节拍变化
                this.ctx.globalAlpha = ring.alpha * (0.2 + beatIntensity * 0.3);
                this.ctx.shadowColor = ring.color;
                this.ctx.shadowBlur = ring.glowIntensity * (15 + beatIntensity * 10);
                this.ctx.strokeStyle = ring.color;
                this.ctx.lineWidth = ring.thickness * (1 + beatIntensity * 0.5);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // 绘制内部亮环 - 随节拍变化
                this.ctx.globalAlpha = ring.alpha * (0.6 + beatIntensity * 0.4);
                this.ctx.shadowBlur = 5 + beatIntensity * 5;
                this.ctx.lineWidth = ring.thickness * (0.8 + beatIntensity * 0.3);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.shadowBlur = 0;
                return true;
            }
            return false;
        });
        
        // 添加中心脉冲光效 - 更强的节拍感
        const pulse = Math.sin(this.frameCount * 0.08);
        const centerGlow = Math.abs(pulse);
        if (centerGlow > 0.2) {
            this.ctx.globalAlpha = centerGlow * 0.6;
            this.ctx.fillStyle = '#ff0040';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 5 + centerGlow * 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        // 同步文字动画 - 更强的节拍感
        if (typeof document !== 'undefined') {
            const liveText = document.querySelector('.live-text');
            if (liveText) {
                const scale = 1 + Math.sin(this.frameCount * 0.08) * 0.2;
                liveText.style.setProperty('--scale', scale);
            }
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    show() {
        // 先停止现有动画，防止重复启动
        this.stop();
        this.frameCount = 0;
        const idleElement = document.getElementById('liveIdleAnimation');
        if (idleElement) {
            idleElement.classList.remove('hidden');
        }
        this.startAnimation();
    }
    
    hide() {
        const idleElement = document.getElementById('liveIdleAnimation');
        if (idleElement) {
            idleElement.classList.add('hidden');
        }
        this.stop();
    }
}

// 全局直播待机动画实例和切换系统
let currentAnimation = null;
let animationType = 'particles'; // 'particles' 或 'rings'
let animationSwitchInterval = null;

// 动画切换管理器
class AnimationManager {
    constructor() {
        this.particleAnimation = null;
        this.ringAnimation = null;
        this.currentAnimation = null;
        this.animationType = 'rings'; // 默认使用圆环动画
        this.switchInterval = null;
        
        this.init();
    }
    
    init() {
        this.particleAnimation = new LiveIdleAnimation();
        this.ringAnimation = new LiveRingAnimation();
        
        // 默认显示圆环动画
        this.showAnimation('rings');
        
        // 每15秒切换一次动画
        this.startAutoSwitch();
    }
    
    showAnimation(type) {
        // 确保所有动画都先停止
        if (this.particleAnimation) {
            this.particleAnimation.hide();
        }
        if (this.ringAnimation) {
            this.ringAnimation.hide();
        }
        
        // 显示新动画
        if (type === 'particles') {
            this.currentAnimation = this.particleAnimation;
        } else {
            this.currentAnimation = this.ringAnimation;
        }
        
        // 添加小延迟确保之前的动画完全停止
        setTimeout(() => {
            if (this.currentAnimation) {
                this.currentAnimation.show();
            }
        }, 50);
        
        this.animationType = type;
    }
    
    switchAnimation() {
        const newType = this.animationType === 'particles' ? 'rings' : 'particles';
        this.showAnimation(newType);
    }
    
    startAutoSwitch() {
        // 移除自动切换机制，改为手动切换
        // this.switchInterval = setInterval(() => {
        //     this.switchAnimation();
        // }, 15000); // 每15秒切换一次
    }
    
    stopAutoSwitch() {
        if (this.switchInterval) {
            clearInterval(this.switchInterval);
            this.switchInterval = null;
        }
    }
    
    switchOnPush() {
        // 每次推送时切换动画
        console.log('动画切换：从', this.animationType, '切换到', this.animationType === 'particles' ? 'rings' : 'particles');
        this.switchAnimation();
    }
    
    show() {
        if (this.currentAnimation) {
            this.currentAnimation.show();
        }
    }
    
    hide() {
        if (this.currentAnimation) {
            this.currentAnimation.hide();
        }
        this.stopAutoSwitch();
    }
    
    getCurrentType() {
        return this.animationType;
    }
}

// 全局动画管理器
let liveAnimationManager = null;

// 初始化结束界面和动画系统
document.addEventListener('DOMContentLoaded', () => {
    const endScreen = document.getElementById('endScreen');
    if (endScreen) {
        endScreen.style.display = 'block';
    }
    
    // 初始化动画管理器
    liveAnimationManager = new AnimationManager();
});