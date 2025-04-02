// main.js
import * as THREE from 'three';

// ----- 基本設定 ----- //
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#webgl-canvas'),
    antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor(0x0a0a14, 1); // CSSの背景色と合わせる

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 1.5); // カメラの位置を調整
scene.add(camera);

// ----- 波打つ平面の作成 ----- //

// シェーダー
const vertexShader = `
  uniform float uTime;
  uniform float uFrequency;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // XとZの両方を使って波を生成し、重ね合わせる
    float waveX = sin(pos.x * uFrequency + uTime * 0.5) * uAmplitude;
    float waveZ = sin(pos.z * uFrequency * 0.8 + uTime * 0.3) * uAmplitude * 0.5; // 少し違う周波数と振幅で
    float waveMix = sin(length(pos.xz) * uFrequency * 1.2 + uTime * 0.8) * uAmplitude * 0.7; // 中心からの距離でも波

    pos.y += waveX + waveZ + waveMix;
    vElevation = pos.y; // 高さをフラグメントシェーダーに渡す

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;
  varying float vElevation; // 頂点シェーダーから高さを受け取る

  void main() {
    // 高さとUV座標、時間に基づいて色を滑らかに変化させる
    float colorMix = (vElevation + 0.3) * 0.5 + 0.5; // 高さに応じたミックス係数 (0.0 ~ 1.0 の範囲に調整)
    vec3 dynamicColor = mix(uColor1, uColor2, colorMix);

    // UV座標と時間で微妙な模様を追加（オプション）
    // float pattern = sin(vUv.x * 10.0 + uTime * 0.2) * sin(vUv.y * 10.0 + uTime * 0.3) * 0.1 + 0.95;
    // dynamicColor *= pattern;

    // 時間経過で全体の色相を少し変化させる（オプション）
    // float hueShift = mod(uTime * 0.01, 1.0);
    // vec3 shiftedColor = // ... HSV変換などを使って色相シフト ... ;

    gl_FragColor = vec4(dynamicColor, 1.0);
  }
`;

// ジオメトリ
const planeGeometry = new THREE.PlaneGeometry(5, 5, 128, 128); // 幅、高さ、分割数（多いほど滑らか）
planeGeometry.rotateX(-Math.PI / 2); // 水平になるように回転

// マテリアル
const planeMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: 2.5 }, // 波の細かさ
        uAmplitude: { value: 0.15 }, // 波の高さ
        uColor1: { value: new THREE.Color('#4a90e2') }, // CSSのグラデーションに近い色
        uColor2: { value: new THREE.Color('#7b43ef') }, // CSSのグラデーションに近い色
    },
    side: THREE.DoubleSide, // 裏面も描画
    // wireframe: true // ワイヤーフレーム表示（デバッグ用）
});

// メッシュ
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);

// ----- アニメーション ----- //
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // シェーダーに時間を渡す
    planeMaterial.uniforms.uTime.value = elapsedTime;

    // カメラをゆっくり回転させる（オプション）
    // camera.position.x = Math.sin(elapsedTime * 0.1) * 2;
    // camera.position.z = Math.cos(elapsedTime * 0.1) * 2;
    // camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

// ----- リサイズ対応 ----- //
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// アニメーション開始
tick();