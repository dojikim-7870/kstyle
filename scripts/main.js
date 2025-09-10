// 모바일 햄버거 메뉴 토글
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("active");
      toggle.classList.toggle("active");
    });
  }
});

// 오디오 재생 함수
function playAudio(src) {
  const audio = new Audio(src);
  audio.play();
}
