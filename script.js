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
    constructor(timeConstant = 1.0, gain = 1.0) {
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
    constructor(kp = 1.0, ki = 0.0, kd = 0.0) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;

        this.integral = 0;
        this.prevError = 0;
        this.isFirstStep = true;
    }

    //制御入力の計算
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

        return pTerm + iTerm + dTerm;
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

//PIDシミュレーション
function runSimulation(kp, ki, kd, signalType, duration, dt) {
    const pid = new PIDController(kp, ki, kd);
    const system = new FirstOrderSystem();

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
        let sp = 0;
        switch (signalType) {
            case 'step':
                sp = t >= 1.0 ? 1.0 : 0.0;
                break;
            case 'ramp':
                sp = t >= 1.0 ? Math.min((t - 1.0) * 0.5, 1.0) : 0.0;
                break;
            case 'sine':
                sp = 0.5 * Math.sin(2 * Math.PI * 0.5 * t) + 0.5;
                break;
        }
        //偏差の軽さ
        const error = sp - system.y;

        //PID制御入力を計算
        const u = pid.update(error, dt);

        //制御対象を更新
        const y = system.update(u, dt);

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