const HIDDEN = "assets/card1.jpg";
const REGULARS = ["assets/card2.jpg","assets/card3.jpg","assets/card4.jpg","assets/card5.jpg"];
let roundQueue = [];
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function makeNewRound(){ roundQueue = shuffle(REGULARS.slice()); roundQueue.push(HIDDEN); }

const bucket   = document.getElementById('bucket');
const shakeBtn = document.getElementById('shakeBtn');
const dlg      = document.getElementById('resultDlg');
const resultImg= document.getElementById('resultImg');

// —— 预加载所有图片，减少切换卡顿 —— //
const ALL_SRCS = [HIDDEN, ...REGULARS];
const IMG_CACHE = new Map();

function preloadAll(){
  return Promise.all(ALL_SRCS.map(src => new Promise((resolve)=>{
    const im = new Image();
    im.src = src;
    im.onload = () => { IMG_CACHE.set(src, im); resolve(); };
    im.onerror= () => { IMG_CACHE.set(src, im); resolve(); }; // 出错也不阻塞
  })));
}
preloadAll(); // 背景预加载

// —— 仅用于弹窗按钮的自动配色 —— //
const tmpCanvas = document.createElement('canvas');
const ctx = tmpCanvas.getContext('2d');
function themeButtonFrom(img){
  const S=80;
  tmpCanvas.width=S; tmpCanvas.height=S;
  ctx.drawImage(img,0,0,S,S);
  const data=ctx.getImageData(0,0,S,S).data;
  let r=0,g=0,b=0,c=0;
  for(let i=0;i<data.length;i+=16){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; c++; }
  r=Math.round(r/c); g=Math.round(g/c); b=Math.round(b/c);
  const lum=0.2126*(r/255)+0.7152*(g/255)+0.0722*(b/255);
  const textColor = lum>0.6 ? '#222' : '#fff';
  const btnBg = `rgb(${Math.max(0,r-20)},${Math.max(0,g-10)},${Math.max(0,b-10)})`;
  document.querySelectorAll('.close').forEach(btn=>{ btn.style.background=btnBg; btn.style.color=textColor; });
}

// —— 抽卡逻辑（避免闪回上一张） —— //
async function draw(){
  if(roundQueue.length===0) makeNewRound();

  // 摇动动画 & 防止连点
  shakeBtn.disabled = true;
  bucket.classList.remove('shake'); void bucket.offsetWidth; bucket.classList.add('shake');

  const pick = roundQueue.shift();

  // 拿到缓存对象；若还没缓存，现场创建
  let im = IMG_CACHE.get(pick);
  if(!im){ im = new Image(); im.src = pick; IMG_CACHE.set(pick, im); }

  // 等待加载 & 尝试解码，保证像素就绪再展示
  if(!im.complete){
    await new Promise(res => { im.onload = res; im.onerror = res; });
  }
  if (im.decode) { try { await im.decode(); } catch(e){} }

  // 先隐藏再换图，避免上一帧残影
  resultImg.style.visibility = 'hidden';
  resultImg.src = pick;

  // 设置按钮主题色
  themeButtonFrom(im);

  // 打开弹窗后再让图片可见（下一帧）
  dlg.showModal();
  requestAnimationFrame(()=> { resultImg.style.visibility = 'visible'; });

  // 放开按钮
  setTimeout(()=> { shakeBtn.disabled = false; }, 400);
}

shakeBtn.addEventListener('click', draw);
// 空格触发
window.addEventListener('keydown', e=>{ if(e.code==='Space'){ e.preventDefault(); draw(); } });
