# PID制御 可視化Webサイト ステップバイステップ学習マニュアル

> **目的**: PID制御の理論を学びながら、Web技術（HTML/CSS/JavaScript）を使って  
> インタラクティブな可視化サイトを自力で構築できるようになること。

---

## 目次

1. [Chapter 1: PID制御の基礎理論](#chapter-1-pid制御の基礎理論)
2. [Chapter 2: Web開発の基礎](#chapter-2-web開発の基礎htmlcssjavascript)
3. [Chapter 3: グラフ描画とChart.js](#chapter-3-グラフ描画とchartjs)
4. [Chapter 4: PID制御をJavaScriptで実装する](#chapter-4-pid制御をjavascriptで実装する)
5. [Chapter 5: インタラクティブUIの構築](#chapter-5-インタラクティブuiの構築)
6. [Chapter 6: 周波数領域と安定性解析](#chapter-6-周波数領域と安定性解析)
7. [Chapter 7: 実験・チューニング・応用](#chapter-7-実験チューニング応用)

---

## Chapter 1: PID制御の基礎理論

### 🎯 学習目標

- フィードバック制御の考え方を理解する
- P（比例）、I（積分）、D（微分）それぞれの役割を説明できる
- PID制御の数式を理解する

---

### 1-1. フィードバック制御とは？

**日常の例**: エアコンの温度制御を考えてみましょう。

1. 目標温度を25℃に設定する（**目標値 / 設定値: r(t)**）
2. 現在の室温を測る（**現在値 / 出力: y(t)**）
3. 差を計算する（**偏差: e(t) = r(t) - y(t)**）
4. 偏差に基づいて冷房の強さを調整する（**制御入力: u(t)**）

```
目標値 r(t) ──→ [+] ──→ [PIDコントローラ] ──→ [制御対象] ──→ 出力 y(t)
               [-]↑                                           │
                  └───────────────────────────────────────────┘
                              フィードバック
```

このように、出力を測定して入力にフィードバック（帰還）する仕組みを **フィードバック制御（閉ループ制御）** といいます。

---

### 1-2. P制御（比例制御）

偏差 e(t) に**比例**した制御入力を出す。

```
u_P(t) = Kp × e(t)
```

| パラメータ | 意味 |
|---|---|
| **Kp（比例ゲイン）** | 偏差にどれだけ強く反応するか |

**特徴:**

- ✅ Kpを大きくすると応答が速くなる
- ❌ Kpを大きくしすぎると振動（不安定）になる
- ❌ **定常偏差**（目標に完全には到達しない）が残る

**イメージ**: 「目標まで遠ければ強く、近ければ弱く」押す。でも目標ぴったりには止まれない。

---

### 1-3. I制御（積分制御）

偏差の**時間積分**に比例した制御入力を出す。

```
u_I(t) = Ki × ∫₀ᵗ e(τ) dτ
```

| パラメータ | 意味 |
|---|---|
| **Ki（積分ゲイン）** | 過去の偏差の蓄積にどれだけ反応するか |

**特徴:**

- ✅ 定常偏差を解消できる（偏差が残る限り積分が増え続ける）
- ❌ 応答が遅くなりがち
- ❌ 大きすぎると積分の蓄積でオーバーシュートが増加（**ワインドアップ**）

**イメージ**: 「ずっと目標に届いてないから、もっと頑張ろう」と過去の不足を補う。

---

### 1-4. D制御（微分制御）

偏差の**時間微分**（変化速度）に比例した制御入力を出す。

```
u_D(t) = Kd × de(t)/dt
```

| パラメータ | 意味 |
|---|---|
| **Kd（微分ゲイン）** | 偏差の変化速度にどれだけ反応するか |

**特徴:**

- ✅ 急激な変化を予測して抑制（ダンパーの役割）
- ✅ オーバーシュートを抑える
- ❌ ノイズに敏感（微分はノイズを増幅する）

**イメージ**: 「目標に近づくスピードが速すぎるから、ブレーキをかけよう」

---

### 1-5. PID制御（3つの合成）

P, I, D を組み合わせた制御入力:

```
u(t) = Kp × e(t) + Ki × ∫₀ᵗ e(τ) dτ + Kd × de(t)/dt
```

各成分の役割まとめ:

| 成分 | 役割 | 増やすと | 減らすと |
|---|---|---|---|
| **P** | 現在の偏差に反応 | 応答↑, 振動↑ | 応答↓, 安定↑ |
| **I** | 過去の偏差を蓄積して補正 | 定常偏差↓, オーバーシュート↑ | 定常偏差が残る |
| **D** | 偏差の変化を予測して抑制 | 安定↑, ノイズ感度↑ | オーバーシュート↑ |

---

### 1-6. 制御対象（プラント）のモデル

今回のシミュレーションでは **1次遅れ系** を使います。

```
dy/dt = (-y + u) / T
```

- `T`: 時定数（応答の遅さ）
- `u`: 制御入力
- `y`: 出力

これは、例えばRC回路や温度制御系など、多くの実システムの近似として使えます。

---

### ✅ 確認問題

1. P制御だけでは解決できない問題は何ですか？
2. I制御は定常偏差をなぜ解消できるのですか？
3. D制御がノイズに弱い理由を説明してください。
4. Kpを大きくしすぎるとどうなりますか？

<details>
<summary>解答例</summary>

1. **定常偏差**が残る。偏差がゼロに近づくとP制御の出力も小さくなり、ぴったり目標に到達しない。
2. 偏差が残っている限り積分値が増え続け、制御出力が徐々に大きくなるため、最終的に偏差がゼロになる。
3. 微分は信号の変化率を計算するため、高周波のノイズ成分が増幅されてしまう。
4. 応答は速くなるが、制御系が振動的になり、最終的には不安定（発散）になる。

</details>

---

## Chapter 2: Web開発の基礎（HTML/CSS/JavaScript）

### 🎯 学習目標

- HTMLでページの構造を作れるようになる
- CSSでスタイルを適用できる
- JavaScriptで動的な処理を書ける

---

### 2-1. HTMLの基本

HTMLはWebページの**骨格**です。

**演習**: `index.html` ファイルを作成し、以下を入力してください。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PID制御シミュレータ</title>
</head>
<body>
  <h1>PID制御シミュレータ</h1>
  <p>ここにシミュレータを作ります。</p>
</body>
</html>
```

**ポイント:**

| タグ | 役割 |
|---|---|
| `<!DOCTYPE html>` | HTML5文書であることを宣言 |
| `<html lang="ja">` | 日本語のページ |
| `<head>` | メタ情報（タイトル、文字コードなど） |
| `<body>` | 表示される内容 |
| `<h1>` | 見出し（heading 1 = 最も重要） |
| `<p>` | 段落（paragraph） |

**確認方法**: ファイルをブラウザにドラッグ＆ドロップして開いてみましょう。

---

### 2-2. CSSの基本

CSSはページの**見た目**を制御します。

**演習**: `styles.css` ファイルを作成し、以下を入力してください。

```css
/* CSS変数でカラーパレットを定義 */
:root {
  --bg-primary: #0a0e1a;
  --bg-card: rgba(255, 255, 255, 0.05);
  --text-primary: #e0e0e0;
  --accent: #00d4ff;
}

/* ページ全体のスタイル */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 20px;
}

/* 見出し */
h1 {
  color: var(--accent);
  text-align: center;
}
```

そして `index.html` の `<head>` 内に次の行を追加します:

```html
<link rel="stylesheet" href="styles.css">
```

**ポイント:**

- `var(--名前)` でCSS変数を使うと、色の一括変更が容易
- `rgba()` で半透明の色を指定できる（グラスモーフィズムに活用）
- `margin: 0` でブラウザのデフォルト余白をリセット

**ブラウザで確認**: ページが暗い背景にシアンの見出しで表示されるはずです。

---

### 2-3. JavaScriptの基本

JavaScriptはページに**動き**を与えます。

**演習**: `script.js` ファイルを作成し、以下を入力してください。

```javascript
// 要素の取得と操作
const heading = document.querySelector('h1');
console.log('見出しのテキスト:', heading.textContent);

// クリックイベント
heading.addEventListener('click', () => {
  heading.textContent = 'クリックされました！';
  heading.style.color = '#ff6bcb';
});
```

`index.html` の `</body>` の直前に追加:

```html
<script src="script.js"></script>
```

**ポイント:**

| 概念 | 説明 |
|---|---|
| `document.querySelector()` | CSSセレクタでHTML要素を取得 |
| `.textContent` | 要素のテキストを取得/変更 |
| `.addEventListener()` | イベント（クリック等）を検知して処理を実行 |
| `console.log()` | 開発者コンソールにメッセージを出力（デバッグ用） |

**動作確認**: ブラウザでF12キー→Console タブを確認。見出しをクリックすると変わる。

---

### ✅ 確認問題

1. CSSの `var(--accent)` は何を参照していますか？
2. `document.querySelector('h1')` で何が取得されますか？
3. `addEventListener` の第1引数 `'click'` を `'mouseover'` に変えると動作はどう変わりますか？

---

## Chapter 3: グラフ描画とChart.js

### 🎯 学習目標

- Chart.jsを使ってグラフを描画できる
- JavaScriptで信号データを生成してグラフに渡せる
- リアルタイムでグラフを更新できる

---

### 3-1. Chart.jsのセットアップ

Chart.jsはオープンソースのグラフ描画ライブラリです。

**演習**: `index.html` を以下のように更新してください。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PID制御シミュレータ</title>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>📊 PID制御シミュレータ</h1>

  <!-- グラフを表示するキャンバス -->
  <div class="chart-container">
    <canvas id="mainChart"></canvas>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

---

### 3-2. 最初のグラフを描く

**演習**: `script.js` を以下に書き換えてください。

```javascript
// === Step 1: 信号データの生成 ===

// ステップ信号を生成する関数
function generateStepSignal(length, stepTime, amplitude) {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(i >= stepTime ? amplitude : 0);
  }
  return data;
}

// サイン波を生成する関数
function generateSineSignal(length, frequency, amplitude) {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(amplitude * Math.sin(2 * Math.PI * frequency * i / length));
  }
  return data;
}

// 時間軸ラベル（0.0, 0.1, 0.2, ...）
const timeLabels = [];
const numPoints = 200;
for (let i = 0; i < numPoints; i++) {
  timeLabels.push((i * 0.05).toFixed(2));
}

// ステップ信号データを生成
const stepData = generateStepSignal(numPoints, 20, 1.0);

// === Step 2: Chart.jsでグラフ描画 ===
const ctx = document.getElementById('mainChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',              // 折れ線グラフ
  data: {
    labels: timeLabels,      // X軸のラベル
    datasets: [{
      label: '目標値 r(t)',
      data: stepData,
      borderColor: '#00d4ff',
      borderWidth: 2,
      fill: false,
      pointRadius: 0,        // データ点を非表示
      tension: 0,             // 直線で結ぶ
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        title: { display: true, text: '時間 [s]', color: '#aaa' },
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
```

**ポイント:**

- `new Chart(ctx, config)` でグラフを作成
- `datasets` 配列に複数のデータ系列を追加できる
- `options` でグラフの見た目を細かく制御

**ブラウザで確認**: ステップ信号のグラフが表示されるはずです。

---

### 3-3. `styles.css` にグラフのスタイルを追加

```css
.chart-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

### ✅ 確認演習

1. `generateSineSignal` を使ってサイン波のデータセットをグラフに追加してみましょう。
2. `datasets` 配列に新しいオブジェクトを追加すれば、同じグラフに複数の線を描けます。

**ヒント**:

```javascript
// datasets 配列に追加
{
  label: 'サイン波',
  data: generateSineSignal(numPoints, 3, 0.5),
  borderColor: '#ff6bcb',
  borderWidth: 2,
  fill: false,
  pointRadius: 0,
}
```

---

## Chapter 4: PID制御をJavaScriptで実装する

### 🎯 学習目標

- PID制御のアルゴリズムをコードで実装できる
- 制御対象（1次遅れ系）のシミュレーションを理解する
- 数値シミュレーションの基本（オイラー法）を理解する

---

### 4-1. PIDコントローラークラスの実装

Chapter 1で学んだPID制御の式をコードにします。

```
u(t) = Kp × e(t) + Ki × ∫e(t)dt + Kd × de(t)/dt
```

**演習**: `script.js` の先頭に以下のクラスを追加してください。

```javascript
/**
 * PIDコントローラー
 * 
 * 連続時間のPID制御を離散時間で近似する:
 *   積分 ∫e(t)dt  →  Σ e[k] × dt  （矩形法）
 *   微分 de(t)/dt →  (e[k] - e[k-1]) / dt  （後退差分）
 */
class PIDController {
  constructor(kp = 1.0, ki = 0.0, kd = 0.0) {
    this.kp = kp;  // 比例ゲイン
    this.ki = ki;  // 積分ゲイン
    this.kd = kd;  // 微分ゲイン
    
    this.integral = 0;     // 積分値の蓄積
    this.prevError = 0;    // 前回の偏差（微分計算用）
    this.isFirstStep = true;
  }

  /**
   * 制御入力を計算
   * @param {number} error - 偏差 e(t) = 目標値 - 現在値
   * @param {number} dt    - 時間刻み幅
   * @returns {number} 制御入力 u(t)
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

    return pTerm + iTerm + dTerm;
  }

  /** パラメータを変更してリセット */
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
```

**コード解説:**

- `integral += error * dt` → 偏差を少しずつ足し合わせ（積分の近似）
- `(error - prevError) / dt` → 偏差の変化率（微分の近似）
- `isFirstStep` → 最初のステップでは微分計算しない（前回値がないため）

---

### 4-2. 制御対象（1次遅れ系）の実装

制御対象のモデルを実装します。

```
dy/dt = (-y + K × u) / T

y: 出力, u: 入力, T: 時定数, K: ゲイン
```

```javascript
/**
 * 1次遅れ系のシミュレーション
 * 
 * オイラー法（前進差分法）で微分方程式を数値的に解く:
 *   y[k+1] = y[k] + dy/dt × dt
 */
class FirstOrderSystem {
  constructor(timeConstant = 1.0, gain = 1.0) {
    this.T = timeConstant;  // 時定数
    this.K = gain;          // 系のゲイン
    this.y = 0;             // 現在の出力
  }

  /**
   * 1ステップ計算
   * @param {number} u  - 入力（制御入力）
   * @param {number} dt - 時間刻み幅
   * @returns {number} 出力 y
   */
  update(u, dt) {
    // オイラー法: y[k+1] = y[k] + (dy/dt) × dt
    const dydt = (-this.y + this.K * u) / this.T;
    this.y += dydt * dt;
    return this.y;
  }

  reset() {
    this.y = 0;
  }
}
```

**オイラー法の説明:**

- 微分方程式 `dy/dt = f(y, u)` を直接解くのは難しい
- 代わりに小さな時間刻み `dt` ごとに `y = y + f(y,u) × dt` で近似
- `dt` が小さいほど精度が高い

---

### 4-3. シミュレーションを実行する

PIDコントローラーと制御対象を組み合わせてシミュレーションします。

```javascript
/**
 * PID制御シミュレーションを実行
 */
function runSimulation(kp, ki, kd, signalType, duration, dt) {
  const pid = new PIDController(kp, ki, kd);
  const system = new FirstOrderSystem(1.0, 1.0);
  
  const numSteps = Math.floor(duration / dt);
  const results = {
    time: [],
    setpoint: [],    // 目標値
    output: [],      // 制御出力
    pTerm: [],       // P成分
    iTerm: [],       // I成分
    dTerm: [],       // D成分
    control: [],     // 制御入力
  };

  for (let i = 0; i < numSteps; i++) {
    const t = i * dt;
    
    // 目標値（設定値）を生成
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

    // 偏差を計算
    const error = sp - system.y;

    // PID制御入力を計算
    const u = pid.update(error, dt);

    // 制御対象を更新
    const y = system.update(u, dt);

    // 結果を記録
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
```

---

### ✅ 確認演習

1. `kp=1.0, ki=0, kd=0` で実行した場合、定常偏差は残りますか？理論と一致しますか？
2. `ki` を 0.5 に変えると結果はどう変わりますか？
3. `dt` を 0.01 と 0.1 に変えた場合の違いを観察してみましょう。

---

## Chapter 5: インタラクティブUIの構築

### 🎯 学習目標

- スライダーでパラメータをリアルタイムに調整できるUIを作る
- PIDシミュレーション結果をChart.jsで動的に表示する
- プリセット機能で典型的な設定を素早く試せるようにする

---

### 5-1. HTMLにコントロールパネルを追加

**演習**: `index.html` の `<body>` を以下のように更新してください。

```html
<body>
  <!-- ヘッダー -->
  <header class="header">
    <h1>⚡ PID制御シミュレータ</h1>
    <p class="subtitle">パラメータを調整して制御応答を観察しよう</p>
  </header>

  <main class="main-grid">
    <!-- 左: コントロールパネル -->
    <aside class="control-panel">
      <div class="card">
        <h2>🎛️ PIDパラメータ</h2>

        <div class="slider-group">
          <label>
            <span>Kp（比例ゲイン）</span>
            <span class="value-display" id="kpValue">1.00</span>
          </label>
          <input type="range" id="kpSlider" min="0" max="10" step="0.1" value="1.0">
          <p class="hint">偏差に比例した制御。大→速い応答、振動↑</p>
        </div>

        <div class="slider-group">
          <label>
            <span>Ki（積分ゲイン）</span>
            <span class="value-display" id="kiValue">0.00</span>
          </label>
          <input type="range" id="kiSlider" min="0" max="5" step="0.1" value="0.0">
          <p class="hint">過去の偏差を蓄積。定常偏差を解消</p>
        </div>

        <div class="slider-group">
          <label>
            <span>Kd（微分ゲイン）</span>
            <span class="value-display" id="kdValue">0.00</span>
          </label>
          <input type="range" id="kdSlider" min="0" max="5" step="0.1" value="0.0">
          <p class="hint">変化速度に反応。オーバーシュートを抑制</p>
        </div>
      </div>

      <!-- 信号タイプ選択 -->
      <div class="card">
        <h2>📡 入力信号</h2>
        <div class="signal-buttons">
          <button class="signal-btn active" data-signal="step">ステップ</button>
          <button class="signal-btn" data-signal="ramp">ランプ</button>
          <button class="signal-btn" data-signal="sine">サイン波</button>
        </div>
      </div>

      <!-- プリセット -->
      <div class="card">
        <h2>🔧 プリセット</h2>
        <div class="preset-buttons">
          <button class="preset-btn" data-kp="1.0" data-ki="0" data-kd="0">P制御のみ</button>
          <button class="preset-btn" data-kp="1.0" data-ki="0.5" data-kd="0">PI制御</button>
          <button class="preset-btn" data-kp="2.0" data-ki="1.0" data-kd="0.5">PID（最適）</button>
          <button class="preset-btn" data-kp="5.0" data-ki="0" data-kd="0">P（振動的）</button>
          <button class="preset-btn" data-kp="10.0" data-ki="3.0" data-kd="0">不安定</button>
        </div>
      </div>

      <!-- 性能指標 -->
      <div class="card">
        <h2>📊 性能指標</h2>
        <div class="metrics">
          <div class="metric">
            <span class="metric-label">オーバーシュート</span>
            <span class="metric-value" id="overshoot">--%</span>
          </div>
          <div class="metric">
            <span class="metric-label">整定時間</span>
            <span class="metric-value" id="settlingTime">-- s</span>
          </div>
          <div class="metric">
            <span class="metric-label">定常偏差</span>
            <span class="metric-value" id="steadyError">--</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右: グラフエリア -->
    <section class="chart-area">
      <div class="card chart-card">
        <h2>📈 システム応答</h2>
        <div class="chart-container">
          <canvas id="mainChart"></canvas>
        </div>
      </div>
      <div class="card chart-card">
        <h2>📉 PID各成分</h2>
        <div class="chart-container">
          <canvas id="componentChart"></canvas>
        </div>
      </div>
    </section>
  </main>

  <script src="script.js"></script>
</body>
```

**HTMLのポイント:**

- `data-*` 属性: カスタムデータ属性。JSからアクセスできる
- `id` 属性: JSで要素を一意に特定するために使う
- `<aside>` と `<section>`: セマンティックHTMLで意味を明確にする

---

### 5-2. CSSの完成版

**演習**: `styles.css` を完成版に更新してください（詳細はプロジェクトの `styles.css` を参照）。

重要なCSS概念:

```css
/* グラスモーフィズム: 半透明 + ぼかし */
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

/* CSS Grid: 2カラムレイアウト */
.main-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
}

/* カスタムスライダー */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: grab;
}
```

---

### 5-3. JavaScriptでインタラクティブに

**演習**: `script.js` を完成版に更新してください（詳細はプロジェクトの `script.js` を参照）。

重要なJavaScript概念:

```javascript
// 1. スライダーの値変更を検知
document.getElementById('kpSlider').addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  document.getElementById('kpValue').textContent = value.toFixed(2);
  updateSimulation();  // グラフを再描画
});

// 2. Chart.jsのデータを更新
function updateChart(chart, newData) {
  chart.data.datasets[0].data = newData.setpoint;
  chart.data.datasets[1].data = newData.output;
  chart.update();  // 再描画
}

// 3. 性能指標の計算
function calculateMetrics(results) {
  const setpoint = results.setpoint[results.setpoint.length - 1];
  const output = results.output;
  
  // オーバーシュート = (最大値 - 目標値) / 目標値 × 100%
  const maxOutput = Math.max(...output);
  const overshoot = setpoint > 0 ? ((maxOutput - setpoint) / setpoint * 100) : 0;
  
  return { overshoot: overshoot.toFixed(1) + '%' };
}
```

---

### ✅ 確認演習

1. 新しいプリセットボタンを追加してみましょう（例: `Kp=3, Ki=2, Kd=1`）。
2. スライダーの最大値を変えて、極端なパラメータでの動作を観察してみましょう。
3. 新しい入力信号タイプ（例: 矩形波）を追加してみましょう。

---

## Chapter 6: 周波数領域と安定性解析

### 🎯 学習目標

- 極配置（Pole-Zero Plot）の見方と安定性の関係を理解する
- ボード線図（Bode Plot）を用いて周波数領域での特性を評価する

---

### 6-1. 極配置（Pole-Zero Plot）とは？

システムの動特性は、伝達関数（入出力をラプラス変換したものの比）の**極（Pole）**と**零点（Zero）**によって決まります。

- **極（×マーク）**: 伝達関数の分母が0になる点。システムが勝手に動き出す（発散や振動）要因。
- **零点（○マーク）**: 伝達関数の分子が0になる点。特定の動きを打ち消す役割。

#### 安定性の判別
極が複素平面上のどこにあるかで、システムの安定性が決まります。

- **左半平面（実部 < 0）**: 安定。時間が経つと目標値に収束します。
- **虚軸上（実部 = 0）**: 持続振動。ずっと同じ大きさで揺れ続けます。
- **右半平面（実部 > 0）**: 不安定。時間が経つと発散します。

**観察ポイント**:
シミュレータでパラメータを変えて、極（×）がどこに動くか見てみましょう。
- 比例ゲイン（Kp）を上げすぎると極が右半平面に移動し、システムが不安定（発散）になります。

---

### 6-2. ボード線図（Bode Plot）とは？

システムに様々な周波数（速さ）のサイン波を入力したとき、出力がどう変化するかを表すグラフです。

- **ゲイン線図（Gain）**: 入力に対する出力の振幅比（dB単位）。0dBなら入力と同じ大きさ、正なら増幅、負なら減衰。
- **位相線図（Phase）**: 入力に対する出力のズレ（deg単位）。

#### なぜ重要なのか？
フィードバック制御では、「出力が入力に対して逆位相（-180度ズレ）になり、かつゲインが1（0dB）より大きい」状態になると、制御が逆効果に働きシステムが発散します。

**観察ポイント**:
- 位相が-180度になる周波数で、ゲインが0dBをどれくらい下回っているか（**ゲイン余裕**）。
- ゲインが0dBになる周波数で、位相が-180度からどれくらい離れているか（**位相余裕**）。

シミュレータの「ボード線図」で、ゲインが0dBを横切る付近の位相を確認してみてください。

---

## Chapter 7: 実験・チューニング・応用

### 🎯 学習目標

- 完成したシミュレータを使ってPID制御の特性を体験的に理解する
- チューニング手法（ジーグラ・ニコルス法など）の概念を知る

---

### 7-1. 実験: P制御の特性

| 実験 | Kp | Ki | Kd | 信号 | 観察ポイント |
|---|---|---|---|---|---|
| 1 | 0.5 | 0 | 0 | ステップ | 応答が遅い、大きな定常偏差 |
| 2 | 1.0 | 0 | 0 | ステップ | 応答が改善、定常偏差あり |
| 3 | 3.0 | 0 | 0 | ステップ | 速い応答、振動的 |
| 4 | 8.0 | 0 | 0 | ステップ | 激しい振動 |

**考察**: Kpを大きくすると応答速度は上がるが、安定性が低下する。

---

### 7-2. 実験: I制御の効果

| 実験 | Kp | Ki | Kd | 信号 | 観察ポイント |
|---|---|---|---|---|---|
| 5 | 1.0 | 0.2 | 0 | ステップ | 定常偏差が徐々に減少 |
| 6 | 1.0 | 1.0 | 0 | ステップ | 偏差消えるが長めの振動 |
| 7 | 1.0 | 3.0 | 0 | ステップ | 大きなオーバーシュート |

**考察**: Ki追加で定常偏差が解消するが、大きすぎるとオーバーシュートが増加する。

---

### 7-3. 実験: D制御の効果

| 実験 | Kp | Ki | Kd | 信号 | 観察ポイント |
|---|---|---|---|---|---|
| 8 | 3.0 | 1.0 | 0 | ステップ | 振動的な応答 |
| 9 | 3.0 | 1.0 | 0.5 | ステップ | 振動が減少、安定化 |
| 10 | 3.0 | 1.0 | 2.0 | ステップ | さらに安定、応答がやや遅く |

**考察**: Kdは振動を抑制するダンパーの役割。ただし大きすぎると応答が鈍くなる。

---

### 7-4. チューニング手法の概要

実際のPID制御では、最適なKp, Ki, Kdをどう決めるかが重要です。

**手動チューニングの手順:**

1. Ki=0, Kd=0 にしてKpだけ増やす
2. 持続振動が起きるKpを見つける（**限界ゲイン Ku**）
3. 振動の周期を測る（**限界周期 Tu**）
4. 以下の表でパラメータを決定（ジーグラ・ニコルス法）

| 制御種別 | Kp | Ki | Kd |
|---|---|---|---|
| P制御 | 0.5 × Ku | - | - |
| PI制御 | 0.45 × Ku | 0.54 × Ku / Tu | - |
| PID制御 | 0.6 × Ku | 1.2 × Ku / Tu | 0.075 × Ku × Tu |

**演習**: シミュレータで限界ゲインを見つけ、ジーグラ・ニコルス法でチューニングしてみましょう。

---

### 7-5. 異なる入力信号での実験

ステップ信号だけでなく、他の信号でも動作を確認しましょう。

- **ランプ信号**: PID制御は傾斜のある目標値にどれだけ追従できるか？
- **サイン波**: 周期的な目標値への追従性は？位相遅れは？

---

### 7-6. 応用課題

1. **2次振動系への変更**: 制御対象をバネ-マス-ダンパー系に変更してみましょう。
2. **外乱の追加**: シミュレーション途中でランダムな外乱を加えてみましょう。
3. **不感帯の実装**: 制御入力に不感帯（小さい入力では動かない）を追加してみましょう。

---

## 付録: 数学のまとめ

### 離散時間PIDの定式化

連続時間のPID制御式を離散時間（プログラム）に変換する:

| 連続時間 | 離散時間近似 | 方法名 |
|---|---|---|
| `∫₀ᵗ e(τ)dτ` | `Σₖ e[k] × Δt` | 矩形法（前進オイラー） |
| `de/dt` | `(e[k] - e[k-1]) / Δt` | 後退差分法 |

### オイラー法（常微分方程式の数値解法）

```
y[k+1] = y[k] + f(y[k], t[k]) × Δt
```

- Δtが小さいほど精度が高い（ただし計算量は増加）
- 安定性条件: Δt < 2T（時定数）

---

## 📖 参考資料

- [Wikipedia: PID制御](https://ja.wikipedia.org/wiki/PID%E5%88%B6%E5%BE%A1)
- [Chart.js公式ドキュメント](https://www.chartjs.org/docs/latest/)
- [MDN Web Docs: JavaScript](https://developer.mozilla.org/ja/docs/Web/JavaScript)
