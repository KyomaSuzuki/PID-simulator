//要素の取得と操作
const heading = document.querySelector('h1');
console.log('見出しのテキスト:', heading.textContent);

//クリックイベント
heading.addEventListener('click', () => {
    heading.textContent = 'クリックされました'
    heading.style.color = 'ff6bcb'
})