// 구구단 마스터 - 게임 로직

class GameEngine {
    constructor() {
        this.difficultyLevels = {
            easy: { min: 1, max: 5, timeBonus: 1.2 },
            normal: { min: 1, max: 9, timeBonus: 1.0 },
            hard: { min: 1, max: 12, timeBonus: 0.8 }
        };
        
        this.currentDifficulty = 'normal';
        this.questionStartTime = null;
        this.soundEnabled = true;
        this.achievements = [];
        
        this.initSounds();
    }
    
    // 사운드 초기화 (Web Audio API 사용)
    initSounds() {
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    // 사운드 재생
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch (type) {
            case 'correct':
                // 정답 사운드 (상승하는 음)
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
                
            case 'wrong':
                // 오답 사운드 (하강하는 음)
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
                
            case 'levelup':
                // 레벨업 사운드 (화음)
                for (let i = 0; i < 3; i++) {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.frequency.setValueAtTime([523, 659, 784][i], this.audioContext.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.5);
                    
                    osc.start(this.audioContext.currentTime + i * 0.1);
                    osc.stop(this.audioContext.currentTime + i * 0.1 + 0.5);
                }
                break;
                
            case 'coin':
                // 코인 획득 사운드
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
        }
    }
    
    // 난이도별 문제 생성
    generateQuestionByDifficulty(difficulty = this.currentDifficulty) {
        const level = this.difficultyLevels[difficulty];
        const num1 = Math.floor(Math.random() * level.max) + level.min;
        const num2 = Math.floor(Math.random() * level.max) + level.min;
        
        this.questionStartTime = Date.now();
        
        return {
            num1: num1,
            num2: num2,
            answer: num1 * num2,
            difficulty: difficulty,
            startTime: this.questionStartTime
        };
    }
    
    // 특정 구구단 문제 생성
    generateSpecificTable(tableNumber) {
        const num2 = Math.floor(Math.random() * 9) + 1;
        this.questionStartTime = Date.now();
        
        return {
            num1: tableNumber,
            num2: num2,
            answer: tableNumber * num2,
            difficulty: 'specific',
            startTime: this.questionStartTime
        };
    }
    
    // 약한 부분 집중 문제 생성
    generateWeakAreaQuestion(weakAreas) {
        if (weakAreas.length === 0) {
            return this.generateQuestionByDifficulty();
        }
        
        const randomWeak = weakAreas[Math.floor(Math.random() * weakAreas.length)];
        const [num1, num2] = randomWeak.split('x').map(n => parseInt(n));
        
        this.questionStartTime = Date.now();
        
        return {
            num1: num1,
            num2: num2,
            answer: num1 * num2,
            difficulty: 'weak',
            startTime: this.questionStartTime
        };
    }
    
    // 답 검증 및 점수 계산
    validateAnswer(userAnswer, question, gameSession) {
        const responseTime = Date.now() - question.startTime;
        const isCorrect = userAnswer === question.answer;
        
        let score = 0;
        let timeBonus = 0;
        let streakBonus = 0;
        
        if (isCorrect) {
            // 기본 점수
            score = 10;
            
            // 시간 보너스 (5초 이내)
            if (responseTime < 5000) {
                timeBonus = Math.floor((5000 - responseTime) / 100);
                score += timeBonus;
            }
            
            // 연속 정답 보너스
            if (gameSession.streak >= 3) {
                streakBonus = gameSession.streak * 2;
                score += streakBonus;
            }
            
            // 난이도 보너스
            const difficultyMultiplier = this.difficultyLevels[question.difficulty]?.timeBonus || 1;
            score = Math.floor(score * difficultyMultiplier);
        }
        
        return {
            isCorrect: isCorrect,
            score: score,
            timeBonus: timeBonus,
            streakBonus: streakBonus,
            responseTime: responseTime
        };
    }
    
    // 성취 시스템
    checkAchievements(gameData, gameSession) {
        const newAchievements = [];
        
        // 첫 정답 성취
        if (gameData.totalCorrect === 1 && !this.hasAchievement('first_correct')) {
            newAchievements.push({
                id: 'first_correct',
                title: '첫 걸음',
                description: '첫 번째 문제를 맞혔습니다!',
                icon: '🎯',
                reward: 10
            });
        }
        
        // 연속 정답 성취들
        if (gameSession.streak === 5 && !this.hasAchievement('streak_5')) {
            newAchievements.push({
                id: 'streak_5',
                title: '연속 공격',
                description: '5문제를 연속으로 맞혔습니다!',
                icon: '🔥',
                reward: 25
            });
        }
        
        if (gameSession.streak === 10 && !this.hasAchievement('streak_10')) {
            newAchievements.push({
                id: 'streak_10',
                title: '완벽한 집중',
                description: '10문제를 연속으로 맞혔습니다!',
                icon: '⚡',
                reward: 50
            });
        }
        
        // 총 정답 수 성취들
        if (gameData.totalCorrect >= 50 && !this.hasAchievement('total_50')) {
            newAchievements.push({
                id: 'total_50',
                title: '구구단 초보자',
                description: '총 50문제를 맞혔습니다!',
                icon: '📚',
                reward: 30
            });
        }
        
        if (gameData.totalCorrect >= 100 && !this.hasAchievement('total_100')) {
            newAchievements.push({
                id: 'total_100',
                title: '구구단 학습자',
                description: '총 100문제를 맞혔습니다!',
                icon: '🎓',
                reward: 60
            });
        }
        
        if (gameData.totalCorrect >= 500 && !this.hasAchievement('total_500')) {
            newAchievements.push({
                id: 'total_500',
                title: '구구단 마스터',
                description: '총 500문제를 맞혔습니다!',
                icon: '👑',
                reward: 150
            });
        }
        
        // 레벨 성취들
        if (gameData.level >= 5 && !this.hasAchievement('level_5')) {
            newAchievements.push({
                id: 'level_5',
                title: '성장하는 학습자',
                description: '레벨 5에 도달했습니다!',
                icon: '🌱',
                reward: 40
            });
        }
        
        if (gameData.level >= 10 && !this.hasAchievement('level_10')) {
            newAchievements.push({
                id: 'level_10',
                title: '숙련된 계산가',
                description: '레벨 10에 도달했습니다!',
                icon: '🔢',
                reward: 80
            });
        }
        
        // 빠른 답변 성취
        const lastResponseTime = gameSession.lastResponseTime;
        if (lastResponseTime && lastResponseTime < 2000 && !this.hasAchievement('speed_demon')) {
            newAchievements.push({
                id: 'speed_demon',
                title: '번개같은 계산',
                description: '2초 이내에 정답을 맞혔습니다!',
                icon: '⚡',
                reward: 20
            });
        }
        
        return newAchievements;
    }
    
    // 성취 확인
    hasAchievement(achievementId) {
        return this.achievements.some(a => a.id === achievementId);
    }
    
    // 약한 부분 분석
    analyzeWeakAreas(gameData) {
        const problemStats = gameData.problemStats || {};
        const weakAreas = [];
        
        // 각 구구단별 정답률 계산
        for (let i = 1; i <= 9; i++) {
            for (let j = 1; j <= 9; j++) {
                const key = `${i}x${j}`;
                const stats = problemStats[key];
                
                if (stats && stats.attempts >= 3) {
                    const accuracy = stats.correct / stats.attempts;
                    if (accuracy < 0.7) { // 정답률 70% 미만
                        weakAreas.push(key);
                    }
                }
            }
        }
        
        return weakAreas.sort((a, b) => {
            const aStats = problemStats[a];
            const bStats = problemStats[b];
            const aAccuracy = aStats.correct / aStats.attempts;
            const bAccuracy = bStats.correct / bStats.attempts;
            return aAccuracy - bAccuracy; // 정답률이 낮은 순으로 정렬
        });
    }
    
    // 문제 통계 업데이트
    updateProblemStats(gameData, question, isCorrect) {
        if (!gameData.problemStats) {
            gameData.problemStats = {};
        }
        
        const key = `${question.num1}x${question.num2}`;
        if (!gameData.problemStats[key]) {
            gameData.problemStats[key] = {
                attempts: 0,
                correct: 0
            };
        }
        
        gameData.problemStats[key].attempts++;
        if (isCorrect) {
            gameData.problemStats[key].correct++;
        }
    }
    
    // 학습 진도 계산
    calculateProgress(gameData) {
        const totalProblems = 81; // 9x9 구구단
        const problemStats = gameData.problemStats || {};
        
        let masteredCount = 0;
        let attemptedCount = 0;
        
        for (let i = 1; i <= 9; i++) {
            for (let j = 1; j <= 9; j++) {
                const key = `${i}x${j}`;
                const stats = problemStats[key];
                
                if (stats && stats.attempts > 0) {
                    attemptedCount++;
                    
                    // 3번 이상 시도하고 80% 이상 정답률이면 마스터로 간주
                    if (stats.attempts >= 3 && (stats.correct / stats.attempts) >= 0.8) {
                        masteredCount++;
                    }
                }
            }
        }
        
        return {
            totalProblems: totalProblems,
            attemptedProblems: attemptedCount,
            masteredProblems: masteredCount,
            attemptedPercent: Math.round((attemptedCount / totalProblems) * 100),
            masteredPercent: Math.round((masteredCount / totalProblems) * 100)
        };
    }
    
    // 난이도 조정 추천
    recommendDifficulty(gameData, gameSession) {
        const recentAccuracy = gameSession.total > 0 ? (gameSession.correct / gameSession.total) : 0;
        const overallAccuracy = gameData.totalCorrect + gameData.totalWrong > 0 ? 
            (gameData.totalCorrect / (gameData.totalCorrect + gameData.totalWrong)) : 0;
        
        if (recentAccuracy >= 0.9 && overallAccuracy >= 0.8) {
            return 'hard';
        } else if (recentAccuracy >= 0.7 && overallAccuracy >= 0.6) {
            return 'normal';
        } else {
            return 'easy';
        }
    }
    
    // 게임 모드별 설정
    getGameModeSettings(mode) {
        const modes = {
            practice: {
                name: '연습 모드',
                description: '자유롭게 연습하세요',
                timeLimit: null,
                questionLimit: null
            },
            challenge: {
                name: '도전 모드',
                description: '2분 안에 최대한 많은 문제를 풀어보세요',
                timeLimit: 120000, // 2분
                questionLimit: null
            },
            sprint: {
                name: '스프린트 모드',
                description: '20문제를 빠르게 풀어보세요',
                timeLimit: null,
                questionLimit: 20
            },
            exam: {
                name: '시험 모드',
                description: '30문제, 5분 제한시간',
                timeLimit: 300000, // 5분
                questionLimit: 30
            }
        };
        
        return modes[mode] || modes.practice;
    }
}

// 게임 통계 클래스
class GameStats {
    constructor() {
        this.sessionStats = {
            startTime: null,
            endTime: null,
            totalTime: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            averageResponseTime: 0,
            bestStreak: 0,
            totalScore: 0
        };
    }
    
    startSession() {
        this.sessionStats.startTime = Date.now();
    }
    
    endSession() {
        this.sessionStats.endTime = Date.now();
        this.sessionStats.totalTime = this.sessionStats.endTime - this.sessionStats.startTime;
    }
    
    recordAnswer(isCorrect, responseTime, streak, score) {
        this.sessionStats.questionsAnswered++;
        
        if (isCorrect) {
            this.sessionStats.correctAnswers++;
        } else {
            this.sessionStats.wrongAnswers++;
        }
        
        // 평균 응답 시간 계산
        const totalResponseTime = (this.sessionStats.averageResponseTime * (this.sessionStats.questionsAnswered - 1)) + responseTime;
        this.sessionStats.averageResponseTime = Math.round(totalResponseTime / this.sessionStats.questionsAnswered);
        
        // 최고 연속 기록 업데이트
        if (streak > this.sessionStats.bestStreak) {
            this.sessionStats.bestStreak = streak;
        }
        
        this.sessionStats.totalScore += score;
    }
    
    getSessionSummary() {
        const accuracy = this.sessionStats.questionsAnswered > 0 ? 
            Math.round((this.sessionStats.correctAnswers / this.sessionStats.questionsAnswered) * 100) : 0;
        
        return {
            ...this.sessionStats,
            accuracy: accuracy,
            totalTimeFormatted: this.formatTime(this.sessionStats.totalTime),
            averageResponseTimeFormatted: this.formatTime(this.sessionStats.averageResponseTime)
        };
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}분 ${remainingSeconds}초`;
        } else {
            return `${remainingSeconds}초`;
        }
    }
}

// 전역 게임 엔진 인스턴스
window.gameEngine = new GameEngine();