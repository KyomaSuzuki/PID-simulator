//要素の取得と操作
const heading = document.querySelector('h1');
console.log('見出しのテキスト:', heading.textContent);

//クリックイベント
heading.addEventListener('click', () => {
    heading.textContent = 'クリックされました'
    heading.style.color = 'ff6bcb'
})

/*一次遅れ系のシミュレーション*/

class FirstOrderSystem {
    /**
    * @param{number}timeConstant
    * @param{number}gain
    */
    constructor(timeConstant = 0.5, gain = 1.0) {
        this.T = timeConstant;
        this.K = gain;
        this.y = 0;
    }

    //ステップ計算
    update(u, dt) {
        const dydt = (-this.y + this.K * u) / this.T;
        this.y += dydt * dt;
        return this.y;
    }

    reset() {
        this.y = 0;
    }
}

/*
PIDコントローラー
連続時間のPID制御を離散時間で近似*/

class PIDController {
    /**
     * 
     * @param {number} kp 
     * @param {number} ki 
     * @param {number} kd 
     */
    constructor(kp = 1.0, ki = 0.0, kd = 0.0) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;

        this.integral = 0;
        this.prevError = 0;
        this.isFirstStep = true;
    }

    //制御入力の計算
    /**
     * 
     * @param {number} error - 
     * @param {number} dt - 
     * @returns {{total:number,pTerm:number,iTerm:number,dTerm:number}}
     */
    update(error, dt) {
        //p制御
        const pTerm = this.kp * error;

        //I制御
        this.integral += error * dt;
        const iTerm = this.ki * this.integral;

        //D制御
        let dTerm = 0;
        if (!this.isFirstStep) {
            dTerm = this.kd * (error - this.prevError) / dt;
        }
        this.isFirstStep = false;
        this.prevError = error;

        const total = pTerm + iTerm + dTerm;

        return { total, pTerm, iTerm, dTerm };
    }

    //パラメータを変更してリセット
    setGains(kp, ki, kd) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
    }

    //内部状態をリセット
    reset() {
        this.integral = 0;
        this.prevError = 0;
        this.isFirstStep = true;
    }
}

//入力信号の生成
function generateSetpoint(signalType, t) {
    switch (signalType) {
        case 'step':
            return t >= 1.0 ? 1.0 : 0.0;
        case 'ramp':
            if (t < 1.0) return 0.0;
            return Math.min((t - 1.0) * 0.5, 1.0);

        case 'sine':
            return 0.5 * Math.sin(2 * Math.PI * 0.3 * t) + 0.5;

        default:
            return 0.0;
    }
}

//PIDシミュレーション
function runSimulation(kp, ki, kd, signalType, duration = 10, dt = 0.02) {
    const pid = new PIDController(kp, ki, kd);
    const system = new FirstOrderSystem(0.5, 1.0);

    const numSteps = Math.floor(duration / dt);
    const result = {
        time: [],
        setpoint: [],
        output: [],
        pTerm: [],
        iTerm: [],
        dTerm: [],
        control: [],
    };

    for (let i = 0; i < numSteps; i++) {
        const t = i * dt;
        //目標値の生成
        const sp = generateSetpoint(signalType, t);
        //偏差の計算
        const error = sp - system.y;

        //PID制御入力を計算
        const { total, pTerm, iTerm, dTerm } = pid.update(error, dt);

        //制御対象を更新
        const y = system.update(total, dt);

        //結果を記録
        results.time.push(t.toFixed(3));
        results.setpoint.push(sp);
        results.output.push(y);
        results.pTerm.push(pid.kp * error);
        results.iTerm.push(pid.ki * pid.integral);
        results.dTerm.push(!pid.isFirstStep ? pid.kd * (error - pid.prevError) / dt : 0);
        results.control.push(u);
    }
    return results;
}

//性能指標の計算
function calculateMetrics(results, signalType) {
    const n = results.output.length;

    if (signalType !== 'step' || n == 0) {
        return {
            overshoot: 'N/A',
            settlingTime: 'N/A',
            riseTime: 'N/A',
            steadyError: 'N/A',
        };
    }

    //ステップ応答の目標値
    const target = 1.0;
    const output = results.output;
    const time = results.time;

    //ステップ開始点
    const stepIdx = time.findIndex(t => t >= 1.0);
    if (stepIdx < 0) {
        return {
            overshoot: 'N/A',
            settlingTime: 'N/A',
            riseTime: 'N/A',
            steadyError: 'N/A',
        };
    }

    //ステップ後のデータを取り出す
    const stepOutput = output.slice(stepIdx);
    const stepTime = time.slice(stepIdx);

    //オーバーシュート
    const maxVal = Math.max(...stepOutput);
    const overshoot = maxVal > target
        ? ((maxVal - target) / target * 100).toFixed(1)
        : '0.0';

    //立ち上がり時間
    const y10 = 0.1 * target;
    const y90 = 0.9 * target;
    let riseStart = -1;
    let riseEnd = -1;
    for (let i = 0; i < stepOutput.length; i++) {
        if (riseStart < 0 && stepOutput[i] >= y10) riseStart = i;
        if (riseEnd < 0 && stepOutput[i] >= y90) { riseEnd = i; break; }
    }

    const riseTime = (riseStart >= 0 && riseEnd >= 0)
        ? (stepTime[riseEnd] - stepTime[riseStart]).toFixed(2)
        : '--';

    //整定時間
    const tolerance = 0.05 * target;
    let settlingIdx = stepOutput.length - 1;
    for (let i = stepOutput.length - 1; i >= 0; i--) {
        if (Math.abs(stepOutput[i] - target) > tolerance) {
            settlingIdx = Math.min(i + 1, stepOutput.length - 1);
            break;
        }
    }

    const settlingTime = settlingIdx < stepOutput.length - 1
        ? (stepTime[settlingIdx] - stepTime[0]).toFixed(2)
        : (stepTime[stepTime.length - 1] - stepTime[0]).toFixed(2);

    //定常偏差
    const finelVal = output[n - 1];
    const steadyError = Math.abs(target - finalVal).toFixed(4);

    return {
        overshoot: overshoot + '%',
        settlingTime: settlingTime + 's',
        riseTime: riseTime + 's',
        steadyError: steadyError,
    };

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

//グラフ初期化
const chartColors = {
    setpoint: '#00d4ff',
    output: '#f59e0b',
    p: '#3b82f6',
    i: '#10b981',
    d: '#ec4899',
};

const commonChartOptions = {
    responsive: true,
    maintainAspectRaito: false,
    animation: {
        duration: 300,
        easing: 'easeOutQuart',
    },
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            titleColor: '#e2e8f0',
            bodycolor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWirth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: { family: "'Inter',sans-serif", size: 12, weight: '600' },
            bodyFont: { family: "'JetBrain Mono',monospace", size: 11 },
            callbacks: {
                label: function (context) {
                    return context.dataset.label + '+' + context.parsed.y.toFixed(4);

                }
            }
        },
    },
    scales: {
        x: {
            type: 'linear',
            title: {
                display: true,
                text: '時間[s]',
                color: '#64748b',
                font: { family: "'Inter',sans-serif", size: 12 },
            },
            ticks: {
                color: '#475569',
                font: { family: "7JetBrains Mono',monospace", size: 10 },
                maxTicksLimit: 12,
            },
            grid: {
                color: 'rgba(255,255,255,255,0.03)',
                lineWidth: 1,
            },
            border: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
            title: {
                display: true,
                text: '値',
                color: '#64748b',
                font: { family: "'Inter',sans-serif", size: 12 },
            },
            ticks: {
                color: '#475569',
                font: { family: "'JetBrains Mono',monospace", size: 10 },
            },
            grid: {
                color: 'rgba(255,255,255,0.03)',
                lineWidth: 1,
            },
            border: { color: 'rgba(255,255,255,0.06)' }
        }
    }
}

//グラフ描画
const mainCtx = document.getElementById('mainChart').getContext('2d');
const mainChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timeLabels,
        datasets: [{
            label: '目標値 r(t)',
            data: [],
            borderColor: chartColors.setpoint,
            backgroundColor: 'rgba(0,212,255,0.05)',
            borderWidth: 2,
            borderDash: [6, 3],
            fill: false,
            pointRadius: 0,
            tension: 0.1,
            order: 2,
        },
        {
            label: '出力y(t)',
            data: [],
            borderColor: chartColors.output,
            backgroundColor: 'rgba(245,  58,11,0.08)',
            borderWidth: 2.5,
            fill: true,
            pointRadius: 0,
            tension: 0.2,
            order: 1,
        }]
    },
    options: {
        ...commonChartOptions,
        scalses: {
            ...commonChartOptions.scales,
            y: {
                ...commonChartOptions.scales.y,
                suggentedMin: -0.3,
                suggestedMax: 1.5,
            },
        },
    },
});

//コンポーネントチャート
const compCtx = document.getElementById('componentChart').getContext('2d');
const componentChart = new Chart(compCtx, {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'P成分',
                data: [],
                borderColor: chartColors.p,
                backgroundColor: 'rgba(59,130,246,0.05)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.2,
            },
            {
                label: 'I成分',
                data: [],
                borderColor: chartColors.i,
                backgroundColor: 'rgba(16,185,129,0.05)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.2,
            },
            {
                label: 'D成分',
                data: [],
                borderColor: chartColors.d,
                backgroundColor: 'rgba(236,72,153,0.05)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.2,
            },
        ],
    },
    options: {
        ...commonChartOptions,
    },
});

//UI要素の取得
const kpSlider = document.getElementById('kpSlider');
const kiSlider = document.getElementById('kiSlider');
const kdSlider = document.getElementById('kdSlider');
const kpValueEl = document.getElementById('kpValue');
const kiValueEl = document.getElementById('kiValue');
const kdValueEl = document.getElementById('kdValue');

const signalButtons = document.querySelectorAll('.signal-btn');
const presetButtons = document.querySelectorAll('.preset-btn');

const overshootEl = document.getElementById('overshootEl');
const seelingTimeEl = document.getElementById('settlingTime');
const riseTimeEl = document.getElementById('riseTime');
const steadyErrorEl = document.getElementById('steadyError');

//現在の信号タイプ
let currentSignal = 'step';

//シミュレーション更新
function updateSimulation() {
    const kp = parseFloat(kpSlider.value);
    const ki = parseFloat(kiSlider.value);
    const kd = parseFloat(kiSlider.value);

    //スライダー値を表示更新
    kpValueEl.textContent = kp.toFixed(2);
    kiValueEl.textContent = ki.toFixed(2);
    kdValueEl.textContent = kd.toFixed(2);

    //シミュレーション実行
    const results = runSimulation(kp, ki, kd, currentSignal, 10, 0.02);

    //XYデータ形式に変換
    const setpointData = results.time.map((t, i) => ({ x: t, y: results.setpoint[i] }));
    const outputData = results.time.map((t, i) => ({ x: t, y: results.output[i] }));
    const pData = results.time.map((t, i) => ({ x: t, y: results.pTerm[i] }));
    const iData = results.time.map((t, i) => ({ x: t, y: results.iTerm[i] }));
    const dData = results.time.map((t, i) => ({ x: t, y: results.dTerm[i] }));

    //メインチャート更新
    mainChart.data.datasets[0].data = setpointData;
    mainChart.data.datasets[1].data = outputData;
    mainChart.updata();

    //コンポーネント更新
    componentChart.data.datasets[0].data = pData;
    componentChart.data.datasets[1].data = iData;
    componentChart.data.datasets[2].data = dData;
    componentChart.updata();

    //性能指標を更新
    const metrics = calculateMetrics(results, surrentSignal);
    overshootEl.textContent = metrics.overshoot;
    settlingTimeEl.textContent = metrics.seettlingTime;
    riseTimeEl.textContent = metrics.riseTime;
    steadyErrorEl.textContent = metrics.ateadyError;

}

//イベントリスナー
kpSlider.addEventListener('input', updateSimulation);
kiSlider.addEventListener('input', updateSimulation);
kdSlider.addEventListener('input', updateSimulation);

//信号タイプ切り替え
signalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        signalButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSignal = btn.dataset.signal;
        updateSimulation();
    });
});

//プリセットボタン
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const kp = parseFloat(btn.dataset.kp);
        const ki = parseFloat(btn.dataset.ki);
        const kd = parseFloat(btn.dataset.kd);

        //スライダーの値を更新
        kpSlider.value = kp;
        kiSlider.value = ki;
        kdSlider.value = kd;

        //アニメーション
        btn.style.transform = 'translateX(8px) scale(1.02)';
        btn.style.boxShadow = '0 0 20px rgba(139,92,246,0.3)';
        setTimeout(() => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        }, 300);

        updateSimulation();
    });
});

//初期化
updateSimulation();

