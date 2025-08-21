// 구구단 마스터 - 데이터베이스 연동

class DatabaseManager {
    constructor() {
        this.baseURL = '';  // 상대 URL 사용
        this.currentUserId = this.generateUserId();
        this.loadUserId();
    }
    
    // 사용자 ID 생성 및 로드
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    loadUserId() {
        const saved = localStorage.getItem('userId');
        if (saved) {
            this.currentUserId = saved;
        } else {
            localStorage.setItem('userId', this.currentUserId);
        }
    }
    
    // API 호출 헬퍼
    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                config.body = JSON.stringify(data);
            }
            
            const response = await fetch(`tables/${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // DELETE 요청은 응답 본문이 없을 수 있음
            if (method === 'DELETE') {
                return { success: true };
            }
            
            return await response.json();
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw error;
        }
    }
    
    // 사용자 진행도 가져오기
    async getUserProgress() {
        try {
            const response = await this.apiCall(`user_progress?search=${this.currentUserId}&limit=1`);
            
            if (response.data && response.data.length > 0) {
                return response.data[0];
            } else {
                // 새 사용자 생성
                return await this.createNewUser();
            }
        } catch (error) {
            console.error('사용자 진행도 로드 오류:', error);
            return this.getDefaultUserData();
        }
    }
    
    // 새 사용자 생성
    async createNewUser() {
        const userData = {
            id: this.currentUserId,
            username: '학습자',
            level: 1,
            exp: 0,
            exp_required: 100,
            coins: 0,
            total_correct: 0,
            total_wrong: 0,
            max_streak: 0,
            current_skin: '🧑‍🎓',
            current_theme: 'default',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        try {
            const response = await this.apiCall('user_progress', 'POST', userData);
            return response;
        } catch (error) {
            console.error('새 사용자 생성 오류:', error);
            return this.getDefaultUserData();
        }
    }
    
    // 기본 사용자 데이터
    getDefaultUserData() {
        return {
            id: this.currentUserId,
            username: '학습자',
            level: 1,
            exp: 0,
            exp_required: 100,
            coins: 0,
            total_correct: 0,
            total_wrong: 0,
            max_streak: 0,
            current_skin: '🧑‍🎓',
            current_theme: 'default',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
    }
    
    // 사용자 진행도 업데이트
    async updateUserProgress(userData) {
        try {
            userData.last_login = new Date().toISOString();
            const response = await this.apiCall(`user_progress/${userData.id}`, 'PUT', userData);
            return response;
        } catch (error) {
            console.error('사용자 진행도 업데이트 오류:', error);
            throw error;
        }
    }
    
    // 게임 세션 저장
    async saveGameSession(sessionData) {
        try {
            const session = {
                id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: this.currentUserId,
                session_type: sessionData.sessionType || 'practice',
                start_time: sessionData.startTime,
                end_time: sessionData.endTime,
                duration_seconds: Math.floor((sessionData.endTime - sessionData.startTime) / 1000),
                total_questions: sessionData.totalQuestions,
                correct_answers: sessionData.correctAnswers,
                wrong_answers: sessionData.wrongAnswers,
                max_streak: sessionData.maxStreak,
                total_score: sessionData.totalScore,
                coins_earned: sessionData.coinsEarned,
                exp_earned: sessionData.expEarned
            };
            
            const response = await this.apiCall('game_sessions', 'POST', session);
            return response;
        } catch (error) {
            console.error('게임 세션 저장 오류:', error);
            throw error;
        }
    }
    
    // 문제 통계 업데이트
    async updateProblemStats(num1, num2, isCorrect, responseTime) {
        const multiplication = `${num1}x${num2}`;
        
        try {
            // 기존 통계 확인
            const existing = await this.apiCall(`problem_stats?search=${multiplication}&limit=1`);
            
            if (existing.data && existing.data.length > 0) {
                // 기존 통계 업데이트
                const stats = existing.data[0];
                stats.total_attempts++;
                
                if (isCorrect) {
                    stats.correct_attempts++;
                } else {
                    stats.wrong_attempts++;
                }
                
                stats.accuracy_rate = Math.round((stats.correct_attempts / stats.total_attempts) * 100);
                
                // 평균 응답 시간 계산
                const totalTime = (stats.avg_response_time * (stats.total_attempts - 1)) + responseTime;
                stats.avg_response_time = Math.round(totalTime / stats.total_attempts);
                
                // 최고 응답 시간 업데이트
                if (isCorrect && (stats.best_response_time === 0 || responseTime < stats.best_response_time)) {
                    stats.best_response_time = responseTime;
                }
                
                stats.last_attempted = new Date().toISOString();
                
                await this.apiCall(`problem_stats/${stats.id}`, 'PUT', stats);
            } else {
                // 새 통계 생성
                const newStats = {
                    id: `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: this.currentUserId,
                    multiplication: multiplication,
                    num1: num1,
                    num2: num2,
                    total_attempts: 1,
                    correct_attempts: isCorrect ? 1 : 0,
                    wrong_attempts: isCorrect ? 0 : 1,
                    accuracy_rate: isCorrect ? 100 : 0,
                    avg_response_time: responseTime,
                    best_response_time: isCorrect ? responseTime : 0,
                    last_attempted: new Date().toISOString()
                };
                
                await this.apiCall('problem_stats', 'POST', newStats);
            }
        } catch (error) {
            console.error('문제 통계 업데이트 오류:', error);
        }
    }
    
    // 일일 퀘스트 가져오기
    async getDailyQuests() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await this.apiCall(`daily_quests?search=${this.currentUserId}&limit=10`);
            
            // 오늘 날짜의 퀘스트만 필터링
            const todayQuests = response.data ? response.data.filter(quest => {
                const questDate = new Date(quest.quest_date).toISOString().split('T')[0];
                return questDate === today;
            }) : [];
            
            if (todayQuests.length === 0) {
                // 새 일일 퀘스트 생성
                return await this.generateDailyQuests();
            }
            
            return todayQuests;
        } catch (error) {
            console.error('일일 퀘스트 로드 오류:', error);
            return [];
        }
    }
    
    // 일일 퀘스트 생성
    async generateDailyQuests() {
        const today = new Date().toISOString();
        const quests = [
            {
                id: `quest_${Date.now()}_1`,
                user_id: this.currentUserId,
                quest_type: 'correct_answers',
                title: '정답 맞히기',
                description: '문제를 5개 맞혀보세요',
                target_value: 5,
                current_progress: 0,
                reward_coins: 20,
                reward_exp: 10,
                is_completed: false,
                quest_date: today,
                completed_at: null
            },
            {
                id: `quest_${Date.now()}_2`,
                user_id: this.currentUserId,
                quest_type: 'total_questions',
                title: '문제 풀기',
                description: '총 10문제를 풀어보세요',
                target_value: 10,
                current_progress: 0,
                reward_coins: 15,
                reward_exp: 8,
                is_completed: false,
                quest_date: today,
                completed_at: null
            },
            {
                id: `quest_${Date.now()}_3`,
                user_id: this.currentUserId,
                quest_type: 'streak',
                title: '연속 정답',
                description: '3문제를 연속으로 맞혀보세요',
                target_value: 3,
                current_progress: 0,
                reward_coins: 30,
                reward_exp: 15,
                is_completed: false,
                quest_date: today,
                completed_at: null
            }
        ];
        
        try {
            const savedQuests = [];
            for (const quest of quests) {
                const response = await this.apiCall('daily_quests', 'POST', quest);
                savedQuests.push(response);
            }
            return savedQuests;
        } catch (error) {
            console.error('일일 퀘스트 생성 오류:', error);
            return quests; // 로컬 버전 반환
        }
    }
    
    // 퀘스트 진행도 업데이트
    async updateQuestProgress(questType, amount, currentStreak = 0) {
        try {
            const quests = await this.getDailyQuests();
            
            for (const quest of quests) {
                if (quest.quest_type === questType && !quest.is_completed) {
                    if (questType === 'streak') {
                        quest.current_progress = Math.max(quest.current_progress, currentStreak);
                    } else {
                        quest.current_progress += amount;
                    }
                    
                    if (quest.current_progress >= quest.target_value && !quest.is_completed) {
                        quest.is_completed = true;
                        quest.completed_at = new Date().toISOString();
                        
                        // 퀘스트 완료 보상 반환
                        await this.apiCall(`daily_quests/${quest.id}`, 'PUT', quest);
                        return {
                            completed: true,
                            quest: quest,
                            rewards: {
                                coins: quest.reward_coins,
                                exp: quest.reward_exp
                            }
                        };
                    } else {
                        await this.apiCall(`daily_quests/${quest.id}`, 'PUT', quest);
                    }
                }
            }
            
            return { completed: false };
        } catch (error) {
            console.error('퀘스트 진행도 업데이트 오류:', error);
            return { completed: false };
        }
    }
    
    // 상점 아이템 가져오기
    async getShopItems() {
        try {
            const response = await this.apiCall('shop_items?limit=50');
            return response.data || [];
        } catch (error) {
            console.error('상점 아이템 로드 오류:', error);
            return [];
        }
    }
    
    // 소유 아이템 가져오기
    async getOwnedItems() {
        try {
            const response = await this.apiCall(`owned_items?search=${this.currentUserId}&limit=100`);
            return response.data || [];
        } catch (error) {
            console.error('소유 아이템 로드 오류:', error);
            return [];
        }
    }
    
    // 아이템 구매
    async purchaseItem(item) {
        try {
            const purchaseRecord = {
                id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: this.currentUserId,
                item_type: item.item_type,
                item_id: item.id,
                item_name: item.name,
                purchase_date: new Date().toISOString(),
                purchase_price: item.price
            };
            
            const response = await this.apiCall('owned_items', 'POST', purchaseRecord);
            return response;
        } catch (error) {
            console.error('아이템 구매 오류:', error);
            throw error;
        }
    }
    
    // 성취 기록
    async recordAchievement(achievementData) {
        try {
            const achievement = {
                id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: this.currentUserId,
                achievement_type: achievementData.type,
                title: achievementData.title,
                description: achievementData.description,
                icon: achievementData.icon,
                reward_coins: achievementData.rewardCoins || 0,
                reward_exp: achievementData.rewardExp || 0,
                unlocked_at: new Date().toISOString(),
                is_rare: achievementData.isRare || false
            };
            
            const response = await this.apiCall('achievements', 'POST', achievement);
            return response;
        } catch (error) {
            console.error('성취 기록 오류:', error);
            throw error;
        }
    }
    
    // 사용자 성취 가져오기
    async getUserAchievements() {
        try {
            const response = await this.apiCall(`achievements?search=${this.currentUserId}&limit=100`);
            return response.data || [];
        } catch (error) {
            console.error('사용자 성취 로드 오류:', error);
            return [];
        }
    }
    
    // 약한 부분 분석
    async getWeakAreas() {
        try {
            const response = await this.apiCall(`problem_stats?search=${this.currentUserId}&limit=81`);
            const stats = response.data || [];
            
            const weakAreas = stats
                .filter(stat => stat.total_attempts >= 3 && stat.accuracy_rate < 70)
                .sort((a, b) => a.accuracy_rate - b.accuracy_rate)
                .map(stat => stat.multiplication);
            
            return weakAreas;
        } catch (error) {
            console.error('약한 부분 분석 오류:', error);
            return [];
        }
    }
    
    // 학습 진도 분석
    async getProgressAnalysis() {
        try {
            const response = await this.apiCall(`problem_stats?search=${this.currentUserId}&limit=81`);
            const stats = response.data || [];
            
            const totalProblems = 81; // 9x9 구구단
            const attemptedProblems = stats.length;
            const masteredProblems = stats.filter(stat => 
                stat.total_attempts >= 3 && stat.accuracy_rate >= 80
            ).length;
            
            return {
                totalProblems,
                attemptedProblems,
                masteredProblems,
                attemptedPercent: Math.round((attemptedProblems / totalProblems) * 100),
                masteredPercent: Math.round((masteredProblems / totalProblems) * 100),
                weakAreas: await this.getWeakAreas()
            };
        } catch (error) {
            console.error('학습 진도 분석 오류:', error);
            return {
                totalProblems: 81,
                attemptedProblems: 0,
                masteredProblems: 0,
                attemptedPercent: 0,
                masteredPercent: 0,
                weakAreas: []
            };
        }
    }
}

// 전역 데이터베이스 매니저 인스턴스
window.dbManager = new DatabaseManager();