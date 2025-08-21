// 구구단 마스터 - 메인 애플리케이션 로직 (데이터베이스 연동)

class MultiplicationMaster {
    constructor() {
        this.gameData = null;
        this.dailyQuests = [];
        this.ownedItems = [];
        this.userAchievements = [];
        
        this.currentScreen = 'loading';
        this.gameSession = {
            score: 0,
            streak: 0,
            correct: 0,
            wrong: 0,
            total: 0,
            currentQuestion: null,
            startTime: null,
            coinsEarned: 0,
            expEarned: 0
        };
        
        this.isLoading = false;
        this.init();
    }
    
    async init() {
        this.initializeEventListeners();
        this.showLoadingScreen();
        
        try {
            await this.loadGameData();
            await this.loadDailyQuests();
            await this.loadOwnedItems();
            
            // 3초 후 메인 화면으로 전환
            setTimeout(() => {
                this.showMainScreen();
            }, 3000);
        } catch (error) {
            console.error('초기화 오류:', error);
            this.showMainScreen(); // 오류가 있어도 메인 화면으로
        }
    }
    
    // 데이터베이스에서 게임 데이터 로드
    async loadGameData() {
        try {
            this.gameData = await window.dbManager.getUserProgress();
            this.updateUI();
        } catch (error) {
            console.error('게임 데이터 로드 오류:', error);
            // 기본값 사용
            this.gameData = window.dbManager.getDefaultUserData();
        }
    }
    
    // 게임 데이터 저장
    async saveGameData() {
        try {
            await window.dbManager.updateUserProgress(this.gameData);
        } catch (error) {
            console.error('게임 데이터 저장 오류:', error);
        }
    }
    
    // 일일 퀘스트 로드
    async loadDailyQuests() {
        try {
            // 먼저 데이터베이스에서 시도
            this.dailyQuests = await window.dbManager.getDailyQuests();
            if (this.dailyQuests.length === 0) {
                // 데이터베이스에 퀘스트가 없으면 로컬 퀘스트 생성
                this.dailyQuests = this.generateLocalDailyQuests();
            }
        } catch (error) {
            console.log('데이터베이스 연결 실패, 로컬 퀘스트 사용');
            // 데이터베이스 연결 실패 시 로컬 퀘스트 사용
            this.dailyQuests = this.generateLocalDailyQuests();
        }
        this.updateDailyQuests();
    }
    
    // 로컬 일일 퀘스트 생성
    generateLocalDailyQuests() {
        const today = new Date().toDateString();
        const lastQuestDate = localStorage.getItem('lastQuestDate');
        
        // 오늘 이미 퀘스트가 있다면 로드
        if (lastQuestDate === today) {
            const savedQuests = localStorage.getItem('dailyQuests');
            if (savedQuests) {
                return JSON.parse(savedQuests);
            }
        }
        
        // 새 퀘스트 생성
        const newQuests = [
            {
                id: 'local_quest_1',
                title: '정답 맞히기',
                description: '문제를 5개 맞혀보세요',
                target_value: 5,
                current_progress: 0,
                reward_coins: 20,
                reward_exp: 10,
                is_completed: false,
                quest_type: 'correct_answers'
            },
            {
                id: 'local_quest_2',
                title: '문제 풀기',
                description: '총 10문제를 풀어보세요',
                target_value: 10,
                current_progress: 0,
                reward_coins: 15,
                reward_exp: 8,
                is_completed: false,
                quest_type: 'total_questions'
            },
            {
                id: 'local_quest_3',
                title: '연속 정답',
                description: '3문제를 연속으로 맞혀보세요',
                target_value: 3,
                current_progress: 0,
                reward_coins: 30,
                reward_exp: 15,
                is_completed: false,
                quest_type: 'streak'
            }
        ];
        
        // 로컬 스토리지에 저장
        localStorage.setItem('dailyQuests', JSON.stringify(newQuests));
        localStorage.setItem('lastQuestDate', today);
        
        return newQuests;
    }
    
    // 소유 아이템 로드
    async loadOwnedItems() {
        try {
            this.ownedItems = await window.dbManager.getOwnedItems();
        } catch (error) {
            console.error('소유 아이템 로드 오류:', error);
            this.ownedItems = [];
        }
    }
    
    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 메인 메뉴 버튼들
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('shop-btn').addEventListener('click', () => this.showShop());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        
        // 뒤로가기 버튼들
        document.getElementById('back-to-menu').addEventListener('click', () => this.endGameSession());
        document.getElementById('back-to-menu-shop').addEventListener('click', () => this.showMainScreen());
        
        // 게임 버튼들
        document.getElementById('submit-answer').addEventListener('click', () => this.checkAnswer());
        document.getElementById('skip-question').addEventListener('click', () => this.skipQuestion());
        
        // 답 입력창 엔터 키 처리
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
        
        // 알림 모달 닫기
        document.getElementById('close-notification').addEventListener('click', () => {
            document.getElementById('notification-modal').classList.add('hidden');
        });
    }
    
    // 화면 전환 함수들
    showLoadingScreen() {
        this.hideAllScreens();
        document.getElementById('loading-screen').classList.remove('hidden');
        this.currentScreen = 'loading';
    }
    
    showMainScreen() {
        this.hideAllScreens();
        document.getElementById('main-screen').classList.remove('hidden');
        this.currentScreen = 'main';
        this.updateUI();
    }
    
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('game-screen').classList.remove('hidden');
        this.currentScreen = 'game';
        this.resetGameSession();
        this.generateQuestion();
    }
    
    showShop() {
        this.hideAllScreens();
        document.getElementById('shop-screen').classList.remove('hidden');
        this.currentScreen = 'shop';
        this.loadShopItems();
    }
    
    hideAllScreens() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('shop-screen').classList.add('hidden');
    }
    
    // UI 업데이트
    updateUI() {
        if (!this.gameData) return;
        
        // 코인 수 업데이트
        document.getElementById('coin-count').textContent = this.gameData.coins;
        document.getElementById('shop-coin-count').textContent = this.gameData.coins;
        
        // 레벨 업데이트
        document.getElementById('level-display').textContent = `Lv.${this.gameData.level}`;
        document.getElementById('character-level').textContent = this.gameData.level;
        
        // 경험치 바 업데이트
        const expPercent = (this.gameData.exp / this.gameData.exp_required) * 100;
        document.getElementById('exp-bar').style.width = `${expPercent}%`;
        document.getElementById('exp-text').textContent = `${this.gameData.exp}/${this.gameData.exp_required}`;
        
        // 캐릭터 스킨 업데이트
        document.getElementById('character-sprite').textContent = this.gameData.current_skin;
    }
    
    // 게임 시작
    startGame() {
        this.showGameScreen();
    }
    
    // 게임 세션 리셋
    resetGameSession() {
        this.gameSession = {
            score: 0,
            streak: 0,
            correct: 0,
            wrong: 0,
            total: 0,
            currentQuestion: null,
            startTime: Date.now(),
            coinsEarned: 0,
            expEarned: 0
        };
        this.updateGameUI();
    }
    
    // 게임 세션 종료
    async endGameSession() {
        if (this.gameSession.total > 0) {
            // 게임 세션 저장
            try {
                await window.dbManager.saveGameSession({
                    sessionType: 'practice',
                    startTime: this.gameSession.startTime,
                    endTime: Date.now(),
                    totalQuestions: this.gameSession.total,
                    correctAnswers: this.gameSession.correct,
                    wrongAnswers: this.gameSession.wrong,
                    maxStreak: this.gameSession.streak,
                    totalScore: this.gameSession.score,
                    coinsEarned: this.gameSession.coinsEarned,
                    expEarned: this.gameSession.expEarned
                });
            } catch (error) {
                console.error('게임 세션 저장 오류:', error);
            }
        }
        
        this.showMainScreen();
    }
    
    // 게임 UI 업데이트
    updateGameUI() {
        document.getElementById('game-score').textContent = this.gameSession.score;
        document.getElementById('streak-count').textContent = this.gameSession.streak;
        document.getElementById('correct-count').textContent = this.gameSession.correct;
        document.getElementById('wrong-count').textContent = this.gameSession.wrong;
        document.getElementById('total-questions').textContent = this.gameSession.total;
    }
    
    // 문제 생성
    generateQuestion() {
        const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
        const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
        
        this.gameSession.currentQuestion = {
            num1: num1,
            num2: num2,
            answer: num1 * num2,
            startTime: Date.now()
        };
        
        document.getElementById('question-display').textContent = `${num1} × ${num2} = ?`;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('feedback-area').textContent = '';
    }
    
    // 답 확인
    async checkAnswer() {
        const userAnswer = parseInt(document.getElementById('answer-input').value);
        const correctAnswer = this.gameSession.currentQuestion.answer;
        const feedbackArea = document.getElementById('feedback-area');
        const responseTime = Date.now() - this.gameSession.currentQuestion.startTime;
        
        this.gameSession.total++;
        
        if (userAnswer === correctAnswer) {
            // 정답 처리
            this.gameSession.correct++;
            this.gameSession.streak++;
            this.gameData.total_correct++;
            
            // 점수 계산 (연속 정답 보너스 포함)
            let points = 10;
            if (this.gameSession.streak >= 5) points *= 2;
            if (this.gameSession.streak >= 10) points *= 3;
            
            this.gameSession.score += points;
            
            // 코인 획득
            const coinReward = Math.floor(points / 10);
            await this.addCoins(coinReward);
            this.gameSession.coinsEarned += coinReward;
            
            // 경험치 획득
            const expReward = 5;
            await this.addExp(expReward);
            this.gameSession.expEarned += expReward;
            
            // 피드백 표시
            feedbackArea.textContent = `🎉 정답! +${points}점, +${coinReward}코인`;
            feedbackArea.className = 'text-xl font-bold h-8 text-green-600';
            
            // 문제 통계 업데이트
            await window.dbManager.updateProblemStats(
                this.gameSession.currentQuestion.num1,
                this.gameSession.currentQuestion.num2,
                true,
                Math.floor(responseTime / 1000)
            );
            
            // 퀘스트 진행도 업데이트
            this.updateQuestProgress('correct_answers', 1);
            this.updateQuestProgress('total_questions', 1);
            this.updateQuestProgress('streak', 0, this.gameSession.streak);
            
            // 최대 연속 정답 기록 업데이트
            if (this.gameSession.streak > this.gameData.max_streak) {
                this.gameData.max_streak = this.gameSession.streak;
            }
            
            // 사운드 재생
            if (window.gameEngine) {
                window.gameEngine.playSound('correct');
            }
            
        } else {
            // 오답 처리
            this.gameSession.wrong++;
            this.gameSession.streak = 0;
            this.gameData.total_wrong++;
            
            feedbackArea.textContent = `❌ 틀렸어요! 정답: ${correctAnswer}`;
            feedbackArea.className = 'text-xl font-bold h-8 text-red-600';
            
            // 문제 통계 업데이트
            await window.dbManager.updateProblemStats(
                this.gameSession.currentQuestion.num1,
                this.gameSession.currentQuestion.num2,
                false,
                Math.floor(responseTime / 1000)
            );
            
            // 사운드 재생
            if (window.gameEngine) {
                window.gameEngine.playSound('wrong');
            }
        }
        
        // 오답도 총 문제 수에 포함
        this.updateQuestProgress('total_questions', 1);
        
        this.updateGameUI();
        await this.saveGameData();
        
        // 1.5초 후 다음 문제
        setTimeout(() => {
            this.generateQuestion();
        }, 1500);
    }
    
    // 문제 건너뛰기
    skipQuestion() {
        this.gameSession.total++;
        this.gameSession.streak = 0;
        this.updateGameUI();
        this.generateQuestion();
    }
    
    // 코인 추가
    async addCoins(amount) {
        this.gameData.coins += amount;
        this.updateUI();
        
        // 코인 획득 애니메이션
        const coinElement = document.getElementById('coin-count');
        coinElement.classList.add('coin-earned');
        setTimeout(() => {
            coinElement.classList.remove('coin-earned');
        }, 800);
        
        // 사운드 재생
        if (window.gameEngine) {
            window.gameEngine.playSound('coin');
        }
    }
    
    // 경험치 추가
    async addExp(amount) {
        this.gameData.exp += amount;
        
        // 레벨업 체크
        while (this.gameData.exp >= this.gameData.exp_required) {
            this.gameData.exp -= this.gameData.exp_required;
            this.gameData.level++;
            this.gameData.exp_required = Math.floor(this.gameData.exp_required * 1.2);
            
            // 레벨업 보상
            const levelBonus = this.gameData.level * 10;
            await this.addCoins(levelBonus);
            this.showNotification('🎊', `레벨 ${this.gameData.level}로 올랐어요!\\n보상: ${levelBonus} 코인`);
            
            // 레벨업 애니메이션
            const levelElement = document.getElementById('level-display');
            levelElement.classList.add('level-up');
            setTimeout(() => {
                levelElement.classList.remove('level-up');
            }, 1000);
            
            // 사운드 재생
            if (window.gameEngine) {
                window.gameEngine.playSound('levelup');
            }
        }
        
        this.updateUI();
    }
    
    // 퀘스트 진행도 업데이트
    async updateQuestProgress(questType, amount, currentStreak = 0) {
        try {
            // 먼저 데이터베이스 시도
            const result = await window.dbManager.updateQuestProgress(questType, amount, currentStreak);
            
            if (result.completed) {
                // 퀘스트 완료 보상
                await this.addCoins(result.rewards.coins);
                await this.addExp(result.rewards.exp);
                
                this.showNotification('🎯', 
                    `퀘스트 완료!\\n"${result.quest.title}"\\n보상: ${result.rewards.coins} 코인, ${result.rewards.exp} 경험치`
                );
                
                // 퀘스트 목록 새로고침
                await this.loadDailyQuests();
            }
        } catch (error) {
            // 데이터베이스 실패 시 로컬 퀘스트 업데이트
            console.log('데이터베이스 연결 실패, 로컬 퀘스트 업데이트');
            this.updateLocalQuestProgress(questType, amount, currentStreak);
        }
    }
    
    // 로컬 퀘스트 진행도 업데이트
    updateLocalQuestProgress(questType, amount, currentStreak = 0) {
        let questCompleted = false;
        let completedQuest = null;
        
        this.dailyQuests.forEach(quest => {
            if (quest.quest_type === questType && !quest.is_completed) {
                if (questType === 'streak') {
                    quest.current_progress = Math.max(quest.current_progress, currentStreak);
                } else {
                    quest.current_progress += amount;
                }
                
                // 퀘스트 완료 체크
                if (quest.current_progress >= quest.target_value && !quest.is_completed) {
                    quest.is_completed = true;
                    questCompleted = true;
                    completedQuest = quest;
                }
            }
        });
        
        // 로컬 스토리지에 저장
        localStorage.setItem('dailyQuests', JSON.stringify(this.dailyQuests));
        
        // 퀘스트 완료 시 보상 지급
        if (questCompleted && completedQuest) {
            this.addCoins(completedQuest.reward_coins);
            this.addExp(completedQuest.reward_exp);
            
            this.showNotification('🎯', 
                `퀘스트 완료!\\n"${completedQuest.title}"\\n보상: ${completedQuest.reward_coins} 코인, ${completedQuest.reward_exp} 경험치`
            );
        }
        
        // UI 업데이트
        this.updateDailyQuests();
    }
    
    // 알림 표시
    showNotification(icon, message) {
        document.getElementById('notification-icon').textContent = icon;
        document.getElementById('notification-message').innerHTML = message.replace(/\\n/g, '<br>');
        document.getElementById('notification-modal').classList.remove('hidden');
    }
    
    // 일일 퀘스트 UI 업데이트
    updateDailyQuests() {
        const questContainer = document.getElementById('daily-quests');
        questContainer.innerHTML = '';
        
        if (!this.dailyQuests || this.dailyQuests.length === 0) {
            questContainer.innerHTML = '<p class="text-white opacity-60 text-center">퀘스트를 불러오는 중...</p>';
            return;
        }
        
        this.dailyQuests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = `quest-item flex justify-between items-center ${
                quest.is_completed ? 'quest-completed' : ''
            }`;
            
            const progress = Math.min(quest.current_progress, quest.target_value);
            const progressPercent = (progress / quest.target_value) * 100;
            
            questElement.innerHTML = `
                <div class="flex-1">
                    <h4 class="font-bold ${quest.is_completed ? 'text-white' : 'text-gray-800'} text-lg">${quest.title}</h4>
                    <p class="text-sm ${quest.is_completed ? 'text-white opacity-90' : 'text-gray-600'} mb-2">${quest.description}</p>
                    <div class="mt-2">
                        <div class="progress-fun h-3">
                            <div class="progress-fill h-3 transition-all duration-500" 
                                 style="width: ${progressPercent}%"></div>
                        </div>
                        <p class="text-xs ${quest.is_completed ? 'text-white opacity-80' : 'text-gray-500'} mt-1">${progress}/${quest.target_value}</p>
                    </div>
                </div>
                <div class="ml-4 text-center">
                    ${quest.is_completed ? 
                        '<div class="text-3xl animate-bounce">✅</div>' : 
                        `<div class="btn-fun btn-warning text-sm px-3 py-2">
                            <i class="fas fa-coins"></i>
                            ${quest.reward_coins}
                        </div>`
                    }
                </div>
            `;
            
            questContainer.appendChild(questElement);
        });
    }
    
    // 상점 아이템 로드
    async loadShopItems() {
        this.loadCharacterSkins();
        this.loadBackgroundThemes();
    }
    
    // 캐릭터 스킨 로드
    async loadCharacterSkins() {
        const skinsContainer = document.getElementById('character-skins');
        
        try {
            // 로컬 스킨 데이터 (데이터베이스 연결 실패 시 사용)
            const localSkins = [
                { id: 'skin_1', icon: '🧑‍🎓', name: '학생', price: 0, level_required: 1, item_type: 'skin' },
                { id: 'skin_2', icon: '👨‍🏫', name: '선생님', price: 50, level_required: 3, item_type: 'skin' },
                { id: 'skin_3', icon: '🧙‍♂️', name: '마법사', price: 100, level_required: 5, item_type: 'skin' },
                { id: 'skin_4', icon: '🦸‍♂️', name: '슈퍼히어로', price: 150, level_required: 8, item_type: 'skin' },
                { id: 'skin_5', icon: '👨‍🚀', name: '우주비행사', price: 200, level_required: 10, item_type: 'skin' },
                { id: 'skin_6', icon: '🤖', name: '로봇', price: 250, level_required: 15, item_type: 'skin' }
            ];
            
            let skins = [];
            try {
                // 데이터베이스에서 가져오기 시도
                const allItems = await window.dbManager.getShopItems();
                skins = allItems.filter(item => item.item_type === 'skin');
                if (skins.length === 0) {
                    skins = localSkins; // 빈 배열이면 로컬 데이터 사용
                }
            } catch (error) {
                console.log('데이터베이스 연결 실패, 로컬 데이터 사용');
                skins = localSkins; // 오류 시 로컬 데이터 사용
            }
            
            // 소유한 스킨들 확인 (로컬 스토리지에서)
            const ownedSkinsLocal = localStorage.getItem('ownedSkins');
            let ownedSkinIds = ownedSkinsLocal ? JSON.parse(ownedSkinsLocal) : ['skin_1']; // 기본 스킨은 항상 소유
            
            skinsContainer.innerHTML = '';
            
            skins.forEach(skin => {
                const owned = ownedSkinIds.includes(skin.id);
                const selected = this.gameData.current_skin === skin.icon;
                const canAfford = this.gameData.coins >= skin.price;
                const levelMet = this.gameData.level >= skin.level_required;
                
                const skinElement = document.createElement('div');
                skinElement.className = `skin-item ${
                    selected ? 'skin-selected' : ''
                } ${!owned && (!canAfford || !levelMet) ? 'skin-locked' : ''}`;
                
                skinElement.innerHTML = `
                    <div class="text-4xl mb-2">${skin.icon}</div>
                    <h4 class="font-bold text-gray-800 text-sm">${skin.name}</h4>
                    ${!levelMet && !owned ? 
                        `<p class="text-red-500 text-xs">레벨 ${skin.level_required} 필요</p>` :
                        owned ? 
                            (selected ? '<p class="text-green-500 text-xs">착용중</p>' : '<p class="text-blue-500 text-xs cursor-pointer">착용하기</p>') :
                            `<p class="text-yellow-600 text-xs">${canAfford ? '구매하기' : '잠김'}</p>
                             <p class="text-yellow-600 text-xs font-bold">${skin.price} 코인</p>`
                    }
                `;
                
                if (owned && !selected && levelMet) {
                    skinElement.addEventListener('click', () => this.equipSkin(skin.icon));
                } else if (!owned && canAfford && levelMet) {
                    skinElement.addEventListener('click', () => this.buySkinLocal(skin));
                }
                
                skinsContainer.appendChild(skinElement);
            });
        } catch (error) {
            console.error('캐릭터 스킨 로드 오류:', error);
            skinsContainer.innerHTML = '<p class="text-gray-600 text-center">스킨을 불러올 수 없습니다.</p>';
        }
    }
    
    // 로컬 스킨 구매 (데이터베이스 없이)
    async buySkinLocal(skin) {
        if (this.gameData.coins >= skin.price) {
            try {
                // 코인 차감
                this.gameData.coins -= skin.price;
                
                // 로컬 스토리지에 소유 스킨 추가
                const ownedSkinsLocal = localStorage.getItem('ownedSkins');
                let ownedSkinIds = ownedSkinsLocal ? JSON.parse(ownedSkinsLocal) : ['skin_1'];
                ownedSkinIds.push(skin.id);
                localStorage.setItem('ownedSkins', JSON.stringify(ownedSkinIds));
                
                // UI 업데이트
                await this.saveGameData();
                this.updateUI();
                this.loadCharacterSkins();
                
                this.showNotification('🛍️', `새 스킨 "${skin.name}"을 구매했어요!`);
            } catch (error) {
                console.error('스킨 구매 오류:', error);
                this.showNotification('❌', '구매 중 오류가 발생했습니다.');
            }
        }
    }
    
    // 스킨 구매
    async buySkin(skin) {
        if (this.gameData.coins >= skin.price) {
            try {
                // 코인 차감
                this.gameData.coins -= skin.price;
                
                // 구매 기록
                await window.dbManager.purchaseItem(skin);
                
                // 소유 아이템 목록 새로고침
                await this.loadOwnedItems();
                
                // UI 업데이트
                await this.saveGameData();
                this.updateUI();
                this.loadCharacterSkins();
                
                this.showNotification('🛍️', `새 스킨 "${skin.name}"을 구매했어요!`);
            } catch (error) {
                console.error('스킨 구매 오류:', error);
                this.showNotification('❌', '구매 중 오류가 발생했습니다.');
            }
        }
    }
    
    // 스킨 착용
    async equipSkin(skinIcon) {
        this.gameData.current_skin = skinIcon;
        await this.saveGameData();
        this.updateUI();
        this.loadCharacterSkins();
    }
    
    // 배경 테마 로드
    async loadBackgroundThemes() {
        const themesContainer = document.getElementById('background-themes');
        themesContainer.innerHTML = '<p class="text-white opacity-60 text-center">테마 기능은 곧 추가될 예정입니다!</p>';
    }
    
    // 설정 화면 표시
    showSettings() {
        this.showNotification('⚙️', '설정 기능은 곧 추가될 예정입니다!');
    }
}

// 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MultiplicationMaster();
});
