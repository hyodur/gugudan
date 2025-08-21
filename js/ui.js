// 구구단 마스터 - UI 관리

class UIManager {
    constructor() {
        this.animations = {
            fadeIn: 'animate__fadeIn',
            fadeOut: 'animate__fadeOut',
            bounceIn: 'animate__bounceIn',
            slideInUp: 'animate__slideInUp',
            pulse: 'animate__pulse',
            shake: 'animate__shakeX'
        };
        
        this.currentTheme = 'default';
        this.themes = {
            default: {
                name: '기본',
                background: 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500',
                primary: 'bg-blue-500',
                secondary: 'bg-purple-500',
                accent: 'bg-yellow-400'
            },
            forest: {
                name: '숲',
                background: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500',
                primary: 'bg-green-500',
                secondary: 'bg-emerald-500',
                accent: 'bg-orange-400'
            },
            ocean: {
                name: '바다',
                background: 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500',
                primary: 'bg-cyan-500',
                secondary: 'bg-blue-500',
                accent: 'bg-yellow-400'
            },
            sunset: {
                name: '노을',
                background: 'bg-gradient-to-br from-orange-400 via-pink-500 to-red-500',
                primary: 'bg-orange-500',
                secondary: 'bg-pink-500',
                accent: 'bg-yellow-400'
            }
        };
        
        this.confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        this.init();
    }
    
    init() {
        this.setupResponsiveDesign();
        this.setupAccessibility();
        this.setupTouchFeedback();
    }
    
    // 반응형 디자인 설정
    setupResponsiveDesign() {
        // 뷰포트 높이 기반 조정
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        setVH();
        
        // 터치 디바이스 감지
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
    }
    
    // 접근성 설정
    setupAccessibility() {
        // 키보드 네비게이션 지원
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // 고대비 모드 감지
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // 애니메이션 감소 모드 감지
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }
    
    // 터치 피드백 설정
    setupTouchFeedback() {
        // 버튼 터치 시 햅틱 피드백 (지원하는 디바이스에서)
        const buttons = document.querySelectorAll('button, .cursor-pointer');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                if (navigator.vibrate) {
                    navigator.vibrate(50); // 50ms 진동
                }
            });
        });
    }
    
    // 화면 전환 애니메이션
    transitionToScreen(fromScreen, toScreen, animationType = 'fade') {
        const fromElement = document.getElementById(fromScreen);
        const toElement = document.getElementById(toScreen);
        
        if (!fromElement || !toElement) return;
        
        // 나가는 애니메이션
        fromElement.classList.add('animate__animated', 'animate__fadeOut');
        
        setTimeout(() => {
            fromElement.classList.add('hidden');
            fromElement.classList.remove('animate__animated', 'animate__fadeOut');
            
            // 들어오는 애니메이션
            toElement.classList.remove('hidden');
            toElement.classList.add('animate__animated', 'animate__fadeIn');
            
            setTimeout(() => {
                toElement.classList.remove('animate__animated', 'animate__fadeIn');
            }, 500);
        }, 250);
    }
    
    // 요소 애니메이션
    animateElement(element, animationType, duration = 500) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        element.classList.add('animate__animated', `animate__${animationType}`);
        
        setTimeout(() => {
            element.classList.remove('animate__animated', `animate__${animationType}`);
        }, duration);
    }
    
    // 카운터 애니메이션
    animateCounter(element, targetValue, duration = 1000) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        const startValue = parseInt(element.textContent) || 0;
        const increment = (targetValue - startValue) / (duration / 16);
        let currentValue = startValue;
        
        const updateCounter = () => {
            currentValue += increment;
            
            if ((increment > 0 && currentValue >= targetValue) || 
                (increment < 0 && currentValue <= targetValue)) {
                element.textContent = targetValue;
            } else {
                element.textContent = Math.floor(currentValue);
                requestAnimationFrame(updateCounter);
            }
        };
        
        updateCounter();
    }
    
    // 진행 바 애니메이션
    animateProgressBar(element, percentage, duration = 800) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        element.style.transition = `width ${duration}ms ease-out`;
        element.style.width = `${percentage}%`;
    }
    
    // 토스트 알림 표시
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-medium transform translate-x-full transition-transform duration-300`;
        
        // 타입별 색상 설정
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        toast.classList.add(colors[type] || colors.info);
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 애니메이션으로 토스트 표시
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
    
    // confetti 효과
    createConfetti(count = 50) {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'fixed inset-0 pointer-events-none z-50';
        document.body.appendChild(confettiContainer);
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'absolute w-2 h-2 rounded';
            confetti.style.backgroundColor = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            confettiContainer.appendChild(confetti);
            
            // 애니메이션
            const duration = Math.random() * 2000 + 3000;
            const endX = (Math.random() - 0.5) * 200;
            const endY = window.innerHeight + 50;
            
            confetti.animate([
                { transform: `translateY(0px) translateX(0px) rotate(0deg)`, opacity: 1 },
                { transform: `translateY(${endY}px) translateX(${endX}px) rotate(720deg)`, opacity: 0 }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
        }
        
        // 5초 후 컨테이너 제거
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 5000);
    }
    
    // 파티클 효과 (정답 시)
    createParticleEffect(element, type = 'stars') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const particles = type === 'stars' ? ['⭐', '✨', '💫'] : ['🎉', '🎊', '✨'];
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'fixed pointer-events-none z-50 text-2xl';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            
            document.body.appendChild(particle);
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            
            particle.animate([
                { 
                    transform: 'scale(0) rotate(0deg)',
                    opacity: 1,
                    left: centerX + 'px',
                    top: centerY + 'px'
                },
                { 
                    transform: 'scale(1.5) rotate(180deg)',
                    opacity: 0,
                    left: endX + 'px',
                    top: endY + 'px'
                }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            setTimeout(() => {
                document.body.removeChild(particle);
            }, 1000);
        }
    }
    
    // 로딩 스피너 표시
    showLoadingSpinner(container, message = '로딩 중...') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        const spinner = document.createElement('div');
        spinner.className = 'flex flex-col items-center justify-center p-8';
        spinner.innerHTML = `
            <div class="loading-spinner mb-4"></div>
            <p class="text-white opacity-80">${message}</p>
        `;
        
        container.innerHTML = '';
        container.appendChild(spinner);
    }
    
    // 에러 메시지 표시
    showError(container, message, retry = null) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        const error = document.createElement('div');
        error.className = 'flex flex-col items-center justify-center p-8 text-center';
        error.innerHTML = `
            <div class="text-6xl mb-4">❌</div>
            <h3 class="text-xl font-bold text-white mb-2">오류가 발생했습니다</h3>
            <p class="text-white opacity-80 mb-4">${message}</p>
            ${retry ? '<button id="retry-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">다시 시도</button>' : ''}
        `;
        
        container.innerHTML = '';
        container.appendChild(error);
        
        if (retry) {
            document.getElementById('retry-btn').addEventListener('click', retry);
        }
    }
    
    // 테마 변경
    changeTheme(themeName) {
        if (!this.themes[themeName]) return;
        
        const theme = this.themes[themeName];
        this.currentTheme = themeName;
        
        // 배경 변경
        document.body.className = document.body.className.replace(/bg-gradient-to-br from-\w+-\d+ via-\w+-\d+ to-\w+-\d+/, theme.background);
        
        // 테마 적용 애니메이션
        this.animateElement(document.body, 'fadeIn', 300);
        
        // 테마 변경 저장
        localStorage.setItem('selectedTheme', themeName);
    }
    
    // 반응형 텍스트 크기 조정
    adjustTextSize() {
        const screenWidth = window.innerWidth;
        const root = document.documentElement;
        
        if (screenWidth < 768) {
            // 모바일
            root.style.setProperty('--text-scale', '0.9');
        } else if (screenWidth < 1024) {
            // 태블릿
            root.style.setProperty('--text-scale', '1.0');
        } else {
            // 데스크톱
            root.style.setProperty('--text-scale', '1.1');
        }
    }
    
    // 다크모드 토글
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark.toString());
    }
    
    // 접근성 개선: 고대비 모드 토글
    toggleHighContrast() {
        document.body.classList.toggle('high-contrast');
        const isHighContrast = document.body.classList.contains('high-contrast');
        localStorage.setItem('highContrast', isHighContrast.toString());
    }
    
    // 폰트 크기 조정
    adjustFontSize(scale) {
        document.documentElement.style.setProperty('--font-scale', scale);
        localStorage.setItem('fontSize', scale.toString());
    }
    
    // 모달 표시
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4 transform animate__animated animate__bounceIn">
                <h3 class="text-xl font-bold text-gray-800 mb-4">${title}</h3>
                <div class="text-gray-600 mb-6">${content}</div>
                <div class="flex justify-end space-x-2">
                    ${buttons.map((btn, index) => 
                        `<button class="modal-btn-${index} px-4 py-2 rounded-lg font-medium ${btn.className || 'bg-gray-500 hover:bg-gray-600 text-white'} transition-colors">${btn.text}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 버튼 이벤트 연결
        buttons.forEach((btn, index) => {
            const buttonElement = modal.querySelector(`.modal-btn-${index}`);
            if (btn.onClick) {
                buttonElement.addEventListener('click', () => {
                    btn.onClick();
                    this.closeModal(modal);
                });
            }
        });
        
        // 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        return modal;
    }
    
    // 모달 닫기
    closeModal(modal) {
        modal.querySelector('div').classList.add('animate__bounceOut');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 500);
    }
    
    // 초기 설정 로드
    loadSettings() {
        // 테마 로드
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && this.themes[savedTheme]) {
            this.changeTheme(savedTheme);
        }
        
        // 다크모드 로드
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
        
        // 고대비 모드 로드
        const highContrast = localStorage.getItem('highContrast') === 'true';
        if (highContrast) {
            document.body.classList.add('high-contrast');
        }
        
        // 폰트 크기 로드
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize) {
            document.documentElement.style.setProperty('--font-scale', fontSize);
        }
    }
}

// 전역 UI 매니저 인스턴스
window.uiManager = new UIManager();

// 페이지 로드 시 설정 로드
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager.loadSettings();
    window.uiManager.adjustTextSize();
});

// 윈도우 리사이즈 시 텍스트 크기 조정
window.addEventListener('resize', () => {
    window.uiManager.adjustTextSize();
});