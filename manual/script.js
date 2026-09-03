/* ============================================
   PID制御シミュレータ — アプリケーションロジック
   ============================================ */

// ===========================
// PIDコントローラークラス
// ===========================
class PIDController {
  /**
   * @param {number} kp - 比例ゲイン
   * @param {number} ki - 積分ゲイン
   * @param {number} kd - 微分ゲイン
   */
  constructor(kp = 1.0, ki = 0.0, kd = 0.0) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;

    this.integral = 0;
    this.prevError = 0;
    this.isFirstStep = true;
  }

  /**
   * PID制御入力を計算する
   *
   * u(t) = Kp * e(t) + Ki * ∫e(t)dt + Kd * de(t)/dt
   *
   * 離散化:
   *   積分 → 矩形法 (integral += error * dt)
   *   微分 → 後退差分 ((error - prevError) / dt)
   *
   * @param {number} error - 偏差 e(t) = 目標値 - 現在値
   * @param {number} dt    - 時間刻み幅 [秒]
   * @returns {{ total: number, pTerm: number, iTerm: number, dTerm: number }}
   */
  update(error, dt) {
    // P成分: 現在の偏差に比例
    const pTerm = this.kp * error;

    // I成分: 偏差の時間積分（矩形法で近似）
    this.integral += error * dt;
    const iTerm = this.ki * this.integral;

    // D成分: 偏差の時間微分（後退差分で近似）
    let dTerm = 0;
    if (!this.isFirstStep) {
      dTerm = this.kd * (error - this.prevError) / dt;
    }
    this.isFirstStep = false;
    this.prevError = error;

    const total = pTerm + iTerm + dTerm;
    return { total, pTerm, iTerm, dTerm };
  }

  /** パラメータ変更 */
  setGains(kp, ki, kd) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
  }

  /** 内部状態をリセット */
  reset() {
    this.integral = 0;
    this.prevError = 0;
    this.isFirstStep = true;
  }
}

// ===========================
// 1次遅れ系モデル
// ===========================
class FirstOrderSystem {
  /**
   * dy/dt = (-y + K * u) / T
   *
   * @param {number} timeConstant - 時定数 T
   * @param {number} gain         - 系のゲイン K
   */
  constructor(timeConstant = 0.5, gain = 1.0) {
    this.T = timeConstant;
    this.K = gain;
    this.y = 0;
  }

  /**
   * オイラー法で1ステップ進める
   * y[k+1] = y[k] + (dy/dt) * dt
   */
  update(u, dt) {
    const dydt = (-this.y + this.K * u) / this.T;
    this.y += dydt * dt;
    return this.y;
  }

  reset() {
    this.y = 0;
  }
}

// ===========================
// 入力信号の生成
// ===========================
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

// ===========================
// シミュレーション実行
// ===========================
function runSimulation(kp, ki, kd, signalType, duration = 10, dt = 0.02) {
  const pid = new PIDController(kp, ki, kd);
  const system = new FirstOrderSystem(0.5, 1.0);

  const numSteps = Math.floor(duration / dt);
  const results = {
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

    // 目標値を生成
    const sp = generateSetpoint(signalType, t);

    // 偏差 e(t) = 目標値 - 現在値
    const error = sp - system.y;

    // PID制御入力を計算
    const { total, pTerm, iTerm, dTerm } = pid.update(error, dt);

    // 制御対象を更新
    const y = system.update(total, dt);

    // 結果を記録
    results.time.push(t);
    results.setpoint.push(sp);
    results.output.push(y);
    results.pTerm.push(pTerm);
    results.iTerm.push(iTerm);
    results.dTerm.push(dTerm);
    results.control.push(total);
  }

  return results;
}

// ===========================
// 性能指標の計算
// ===========================
function calculateMetrics(results, signalType) {
  const n = results.output.length;

  if (signalType !== 'step' || n === 0) {
    return {
      overshoot: 'N/A',
      settlingTime: 'N/A',
      riseTime: 'N/A',
      steadyError: 'N/A',
    };
  }

  // ステップ応答の目標値
  const target = 1.0;
  const output = results.output;
  const time = results.time;

  // ステップ開始点を見つける (t >= 1.0)
  const stepIdx = time.findIndex(t => t >= 1.0);
  if (stepIdx < 0) {
    return {
      overshoot: 'N/A',
      settlingTime: 'N/A',
      riseTime: 'N/A',
      steadyError: 'N/A',
    };
  }

  // ステップ後のデータを取り出す
  const stepOutput = output.slice(stepIdx);
  const stepTime = time.slice(stepIdx);

  // オーバーシュート
  const maxVal = Math.max(...stepOutput);
  const overshoot = maxVal > target
    ? ((maxVal - target) / target * 100).toFixed(1)
    : '0.0';

  // 立ち上がり時間 (10% → 90%)
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

  // 整定時間 (±5%以内に収束)
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

  // 定常偏差 (最後の値)
  const finalVal = output[n - 1];
  const steadyError = Math.abs(target - finalVal).toFixed(4);

  return {
    overshoot: overshoot + '%',
    settlingTime: settlingTime + ' s',
    riseTime: riseTime + ' s',
    steadyError: steadyError,
  };
}

// ===========================
// 極配置とボード線図の計算
// ===========================
function computePoleZero(kp, ki, kd) {
  const T = 0.5; // プラント時定数
  let poles = [];
  let zeros = [];

  if (ki > 0) {
    // 閉ループ特性方程式: (T + Kd)s^2 + (1 + Kp)s + Ki = 0
    const A = T + kd;
    const B = 1 + kp;
    const C = ki;
    const D = B * B - 4 * A * C;
    
    if (D >= 0) {
      poles.push({ re: (-B + Math.sqrt(D)) / (2 * A), im: 0 });
      poles.push({ re: (-B - Math.sqrt(D)) / (2 * A), im: 0 });
    } else {
      const re = -B / (2 * A);
      const im = Math.sqrt(-D) / (2 * A);
      poles.push({ re, im });
      poles.push({ re, im: -im });
    }

    // 零点: Kd*s^2 + Kp*s + Ki = 0
    if (kd > 0) {
      const Dz = kp * kp - 4 * kd * ki;
      if (Dz >= 0) {
        zeros.push({ re: (-kp + Math.sqrt(Dz)) / (2 * kd), im: 0 });
        zeros.push({ re: (-kp - Math.sqrt(Dz)) / (2 * kd), im: 0 });
      } else {
        const re = -kp / (2 * kd);
        const im = Math.sqrt(-Dz) / (2 * kd);
        zeros.push({ re, im });
        zeros.push({ re, im: -im });
      }
    } else {
      // Kp*s + Ki = 0
      zeros.push({ re: -ki / kp, im: 0 });
    }
  } else {
    // Ki = 0 の場合
    // 特性方程式: (T + Kd)s + (1 + Kp) = 0
    const A = T + kd;
    const B = 1 + kp;
    poles.push({ re: -B / A, im: 0 });

    // 零点: Kd*s + Kp = 0
    if (kd > 0) {
      zeros.push({ re: -kp / kd, im: 0 });
    }
  }
  return { poles, zeros };
}

function computeBode(kp, ki, kd) {
  const T = 0.5;
  const w = [];
  const gain = [];
  const phase = [];
  
  // ω を 0.01 から 100 まで対数スケールで生成
  for (let i = -2; i <= 2; i += 0.05) {
    const omega = Math.pow(10, i);
    w.push(omega);

    // L(jω) = (Kp + Ki/(jω) + Kd*(jω)) * (1 / (jωT + 1))
    // C(jω) = Kp + j(Kd*ω - Ki/ω)
    let cRe = kp;
    let cIm = kd * omega - (omega === 0 ? 0 : ki / omega);
    if (ki > 0 && omega < 1e-5) { cIm = -1e6; } // 積分器の低周波極限

    // G(jω) = 1 / (1 + jωT) = (1 - jωT) / (1 + ω^2 T^2)
    const den = 1 + omega * omega * T * T;
    const gRe = 1 / den;
    const gIm = -omega * T / den;

    // L(jω) = C(jω) * G(jω)
    const lRe = cRe * gRe - cIm * gIm;
    const lIm = cRe * gIm + cIm * gRe;

    const mag = Math.sqrt(lRe * lRe + lIm * lIm);
    let deg = Math.atan2(lIm, lRe) * (180 / Math.PI);
    
    // 位相を滑らかにするための簡易処理（-180度付近のジャンプ防止等）
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;

    gain.push({ x: omega, y: 20 * Math.log10(mag) });
    phase.push({ x: omega, y: deg });
  }

  return { gain, phase };
}

// ===========================
// Chart.js 初期化
// ===========================
const chartColors = {
  setpoint: '#00d4ff',
  output: '#f59e0b',
  p: '#3b82f6',
  i: '#10b981',
  d: '#ec4899',
};

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
      callbacks: {
        label: function(context) {
          return context.dataset.label + ': ' + context.parsed.y.toFixed(4);
        }
      }
    },
  },
  scales: {
    x: {
      type: 'linear',
      title: {
        display: true,
        text: '時間 [s]',
        color: '#64748b',
        font: { family: "'Inter', sans-serif", size: 12 },
      },
      ticks: {
        color: '#475569',
        font: { family: "'JetBrains Mono', monospace", size: 10 },
        maxTicksLimit: 12,
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
        lineWidth: 1,
      },
      border: { color: 'rgba(255, 255, 255, 0.06)' },
    },
    y: {
      title: {
        display: true,
        text: '値',
        color: '#64748b',
        font: { family: "'Inter', sans-serif", size: 12 },
      },
      ticks: {
        color: '#475569',
        font: { family: "'JetBrains Mono', monospace", size: 10 },
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
        lineWidth: 1,
      },
      border: { color: 'rgba(255, 255, 255, 0.06)' },
    },
  },
};

// メインチャート（システム応答）
const mainCtx = document.getElementById('mainChart').getContext('2d');
const mainChart = new Chart(mainCtx, {
  type: 'line',
  data: {
    datasets: [
      {
        label: '目標値 r(t)',
        data: [],
        borderColor: chartColors.setpoint,
        backgroundColor: 'rgba(0, 212, 255, 0.05)',
        borderWidth: 2,
        borderDash: [6, 3],
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        order: 2,
      },
      {
        label: '出力 y(t)',
        data: [],
        borderColor: chartColors.output,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderWidth: 2.5,
        fill: true,
        pointRadius: 0,
        tension: 0.2,
        order: 1,
      },
    ],
  },
  options: {
    ...commonChartOptions,
    scales: {
      ...commonChartOptions.scales,
      y: {
        ...commonChartOptions.scales.y,
        suggestedMin: -0.3,
        suggestedMax: 1.5,
      },
    },
  },
});

// コンポーネントチャート（P, I, D 各成分）
const compCtx = document.getElementById('componentChart').getContext('2d');
const componentChart = new Chart(compCtx, {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'P成分',
        data: [],
        borderColor: chartColors.p,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: 'I成分',
        data: [],
        borderColor: chartColors.i,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: 'D成分',
        data: [],
        borderColor: chartColors.d,
        backgroundColor: 'rgba(236, 72, 153, 0.05)',
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

// 極配置チャート
const pzCtx = document.getElementById('pzChart').getContext('2d');
const pzChart = new Chart(pzCtx, {
  type: 'scatter',
  data: {
    datasets: [
      {
        label: '極 (Pole)',
        data: [],
        backgroundColor: '#ef4444',
        pointStyle: 'crossRot',
        pointRadius: 8,
        pointHoverRadius: 10,
        borderWidth: 2,
        borderColor: '#ef4444'
      },
      {
        label: '零点 (Zero)',
        data: [],
        backgroundColor: 'transparent',
        pointStyle: 'circle',
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 2,
        borderColor: '#10b981'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        title: { display: true, text: '実軸 (Re)', color: '#64748b' },
        grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.03)' },
        min: -15, max: 5
      },
      y: {
        title: { display: true, text: '虚軸 (Im)', color: '#64748b' },
        grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.03)' },
        min: -10, max: 10
      }
    }
  }
});

// ボード線図（ゲイン）
const bodeGainCtx = document.getElementById('bodeGainChart').getContext('2d');
const bodeGainChart = new Chart(bodeGainCtx, {
  type: 'line',
  data: {
    datasets: [{
      label: 'ゲイン',
      data: [],
      borderColor: '#8b5cf6',
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        type: 'logarithmic',
        title: { display: false },
        grid: { color: 'rgba(255,255,255,0.03)' },
        min: 0.01, max: 100
      },
      y: {
        title: { display: true, text: 'Gain [dB]', color: '#64748b' },
        grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)' }
      }
    }
  }
});

// ボード線図（位相）
const bodePhaseCtx = document.getElementById('bodePhaseChart').getContext('2d');
const bodePhaseChart = new Chart(bodePhaseCtx, {
  type: 'line',
  data: {
    datasets: [{
      label: '位相',
      data: [],
      borderColor: '#f59e0b',
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        type: 'logarithmic',
        title: { display: true, text: '周波数 [rad/s]', color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.03)' },
        min: 0.01, max: 100
      },
      y: {
        title: { display: true, text: 'Phase [deg]', color: '#64748b' },
        grid: { color: (ctx) => ctx.tick.value === -180 ? 'rgba(255,100,100,0.2)' : 'rgba(255,255,255,0.03)' },
        min: -270, max: 90,
        ticks: { stepSize: 90 }
      }
    }
  }
});

// ===========================
// UI要素の取得
// ===========================
const kpSlider = document.getElementById('kpSlider');
const kiSlider = document.getElementById('kiSlider');
const kdSlider = document.getElementById('kdSlider');
const kpValueEl = document.getElementById('kpValue');
const kiValueEl = document.getElementById('kiValue');
const kdValueEl = document.getElementById('kdValue');

const signalButtons = document.querySelectorAll('.signal-btn');
const presetButtons = document.querySelectorAll('.preset-btn');

const overshootEl = document.getElementById('overshoot');
const settlingTimeEl = document.getElementById('settlingTime');
const riseTimeEl = document.getElementById('riseTime');
const steadyErrorEl = document.getElementById('steadyError');

// 現在の信号タイプ
let currentSignal = 'step';

// ===========================
// シミュレーション更新
// ===========================
function updateSimulation() {
  const kp = parseFloat(kpSlider.value);
  const ki = parseFloat(kiSlider.value);
  const kd = parseFloat(kdSlider.value);

  // スライダー値を表示更新
  kpValueEl.textContent = kp.toFixed(2);
  kiValueEl.textContent = ki.toFixed(2);
  kdValueEl.textContent = kd.toFixed(2);

  // シミュレーション実行
  const results = runSimulation(kp, ki, kd, currentSignal, 10, 0.02);

  // XYデータに変換（Chart.jsの{x, y}形式）
  const setpointData = results.time.map((t, i) => ({ x: t, y: results.setpoint[i] }));
  const outputData = results.time.map((t, i) => ({ x: t, y: results.output[i] }));
  const pData = results.time.map((t, i) => ({ x: t, y: results.pTerm[i] }));
  const iData = results.time.map((t, i) => ({ x: t, y: results.iTerm[i] }));
  const dData = results.time.map((t, i) => ({ x: t, y: results.dTerm[i] }));

  // メインチャート更新
  mainChart.data.datasets[0].data = setpointData;
  mainChart.data.datasets[1].data = outputData;
  mainChart.update();

  // コンポーネントチャート更新
  componentChart.data.datasets[0].data = pData;
  componentChart.data.datasets[1].data = iData;
  componentChart.data.datasets[2].data = dData;
  componentChart.update();

  // 性能指標を更新
  const metrics = calculateMetrics(results, currentSignal);
  overshootEl.textContent = metrics.overshoot;
  settlingTimeEl.textContent = metrics.settlingTime;
  riseTimeEl.textContent = metrics.riseTime;
  steadyErrorEl.textContent = metrics.steadyError;

  // 極配置を更新
  const pz = computePoleZero(kp, ki, kd);
  pzChart.data.datasets[0].data = pz.poles.map(p => ({ x: p.re, y: p.im }));
  pzChart.data.datasets[1].data = pz.zeros.map(z => ({ x: z.re, y: z.im }));
  
  // 極のスケールを動的に調整（すべてが収まるように）
  let maxRe = 2, minRe = -5, maxIm = 5;
  pz.poles.concat(pz.zeros).forEach(pt => {
    if (pt.re > maxRe) maxRe = pt.re + 2;
    if (pt.re < minRe) minRe = pt.re - 2;
    if (Math.abs(pt.im) > maxIm) maxIm = Math.abs(pt.im) + 2;
  });
  pzChart.options.scales.x.min = Math.min(-5, minRe);
  pzChart.options.scales.x.max = Math.max(2, maxRe);
  pzChart.options.scales.y.min = -maxIm;
  pzChart.options.scales.y.max = maxIm;
  pzChart.update();

  // ボード線図を更新
  const bode = computeBode(kp, ki, kd);
  bodeGainChart.data.datasets[0].data = bode.gain;
  bodePhaseChart.data.datasets[0].data = bode.phase;
  bodeGainChart.update();
  bodePhaseChart.update();
}

// ===========================
// イベントリスナー
// ===========================

// スライダー変更イベント
kpSlider.addEventListener('input', updateSimulation);
kiSlider.addEventListener('input', updateSimulation);
kdSlider.addEventListener('input', updateSimulation);

// 信号タイプ切り替え
signalButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    signalButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSignal = btn.dataset.signal;
    updateSimulation();
  });
});

// プリセットボタン
presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const kp = parseFloat(btn.dataset.kp);
    const ki = parseFloat(btn.dataset.ki);
    const kd = parseFloat(btn.dataset.kd);

    // スライダーの値を更新
    kpSlider.value = kp;
    kiSlider.value = ki;
    kdSlider.value = kd;

    // アニメーション効果
    btn.style.transform = 'translateX(8px) scale(1.02)';
    btn.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.3)';
    setTimeout(() => {
      btn.style.transform = '';
      btn.style.boxShadow = '';
    }, 300);

    updateSimulation();
  });
});

// ===========================
// 初期化
// ===========================
updateSimulation();
