//要素の取得と操作
const heading = document.querySelector('h1');
console.log('見出しのテキスト:', heading.textContent);

//クリックイベント
heading.addEventListener('click', () => {
    heading.textContent = 'クリックされました'
    heading.style.color = 'ff6bcb'
})

//信号データの生成

//ステップ信号を生成する関数
function generateStepSignal(length, stepTime, amplitude) {
    const data = [];
    for (let i = 0; i < length; i++) {
        data.push(i >= stepTime ? amplitude : 0);
    }
    return data;
}

//サイン波を生成する関数
function generateSineSignal(length, frequency, amplitude) {
    const data = [];
    for (let i = 0; i < length; i++) {
        data.push(amplitude * Math.sin(2 * Math.PI * frequency * i / length));
    }
    return data;
}

//時間軸ラベル
const timeLabels = [];
const numPoints = 200;

for (let i = 0; i < numPoints; i++) {
    timeLabels.push((i * 0.05).toFixed(2));
}

//ステップ信号データの生成
const stepData = generateStepSignal(numPoints, 20, 1.0);
const sineData = generateSineSignal(numPoints, 3, 0.5);

//グラフ描画
const ctx = document.getElementById('mainChart').getContext('2d');
const mainChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timeLabels,
        datasets: [{
            label: '目標値 r(t)',
            data: stepData,
            borderColor: '#00d4ff',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0,
        },
        {
            label: 'サイン波',
            data: sineData,
            borderColor: '#ff6bcb',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: { display: true, text: '時間[s]', color: '#aaa' },
                ticks: { color: '#888', maxTicksLimit: 10 },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                title: { display: true, text: '値', color: '#aaa' },
                ticks: { color: '#888' },
                grid: { color: 'rgba(255,255,255,0.05)' },
                min: -0.5,
                max: 1.5
            }
        },
        plugins: {
            legend: {
                labels: { color: '#e0e0e0' }
            }
        }
    }
});