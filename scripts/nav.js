// 모바일 햄버거 메뉴 기능
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('nav-menu-active');
        navToggle.classList.toggle('toggle-active');
    });
}

// 드롭다운 메뉴 기능 추가
const navDropdown = document.querySelector('.nav-dropdown > .nav-link');

if (navDropdown) {
    navDropdown.addEventListener('click', (e) => {
        // 모바일 환경(768px 이하)에서만 작동하도록 조건 추가
        if (window.innerWidth <= 768) {
            e.preventDefault(); // 링크 이동을 막아 메뉴가 열리도록 함
            const dropdownMenu = navDropdown.nextElementSibling;
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('active');
            }
        }
    });
}