// --- 一轮顺序规则 ---
// 假设 card1.jpg 是“隐藏款”，其余四张为常规卡
const HIDDEN = "assets/card1.jpg";
const REGULARS = [
  "assets/card2.jpg",
  "assets/card3.jpg",
  "assets/card4.jpg",
  "assets/card5.jpg",
];

let roundQueue = []; // 当前轮的队列
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function makeNewRound(){
  roundQueue = shuffle(REGULARS.slice());
  roundQueue.push(HIDDEN); // 隐藏款结尾
}

// --- DOM ---
const bucket = document.getElementById('bucket');
const shakeBtn = document.getElementById('shakeBtn');
const dlg = document.getElementById('resultDlg');
const resultImg = document.getElementById('resultImg');

// --- 主题色：从图片自动采样平均色 → 柔和化（与白色混合） → 字色对比 ---
const tmpCanvas = document.createElement('canvas');
const ctx = tmpCanvas.getContext('2d');

function setThemeFromImage(imgEl){
  try{
    const w = imgEl.naturalWidth || imgEl.width;
    const h = imgEl.naturalHeight || imgEl.height;
    const S = 80; // 缩放采样，避免太大
    const sw = Math.min(S, w), sh = Math.min(S, h);
    tmpCanvas.width = sw; tmpCanvas.height = sh;
    ctx.drawImage(imgEl, 0, 0, sw, sh);
    const data = ctx.getImageData(0,0,sw,sh).data;

    let r=0,g=0,b=0,count=0;
    for(let i=0;i<data.length;i+=16){ // 步长采样
      const rr=data[i], gg=data[i+1], bb=data[i+2], aa=data[i+3];
      if(aa>10){
        r+=rr; g+=gg; b+=bb; count++;
      }
    }
    if(count===0) return;
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);

    // 与白色混合得到柔色（pastel）
    const mix = (c)=> Math.round(0.55*255 + 0.45*c); // 更偏暖亮
    const pr=mix(r), pg=mix(g), pb=mix(b);

   // 计算相对亮度选择字色（黑或白）
const sr = pr/255, sg = pg/255, sb = pb/255;
const lum = 0.2126*sr + 0.7152*sg + 0.0722*sb;
const textDark = lum > 0.6 ? '#222' : '#fff';

// ✅ 只改变弹窗里的按钮（.close）的背景与文字颜色
const btnBg = `rgb(${pr-20},${pg-10},${pb-10})`;
document.querySelectorAll('.close').forEach(b => {
  b.style.background = btnBg;
  b.style.color = textDark;
});


// --- 抽卡逻辑 ---
function draw(){
  if(roundQueue.length === 0) makeNewRound();

  // 先让桶摇一摇
  bucket.classList.remove('shake');
  void bucket.offsetWidth; // 重新触发动画
  bucket.classList.add('shake');

  setTimeout(()=>{
    const pick = roundQueue.shift();
    resultImg.onload = () => setThemeFromImage(resultImg);
    resultImg.src = pick + '?t=' + Date.now();

    dlg.showModal();
  }, 520);
}

shakeBtn.addEventListener('click', draw);

// 空格键也能抽
window.addEventListener('keydown', e => {
  if(e.code === 'Space'){ e.preventDefault(); draw(); }
});

// 移动端“摇一摇”
let lastShake = 0;
if('DeviceMotionEvent' in window){
  window.addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity || {};
    const mag = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
    const now = Date.now();
    if(mag > 20 && (now - lastShake) > 1200){
      lastShake = now;
      draw();
    }
  });
}
