// 一轮规则：四张随机后隐藏款压轴
const HIDDEN = "assets/card1.jpg";
const REGULARS = ["assets/card2.jpg","assets/card3.jpg","assets/card4.jpg","assets/card5.jpg"];
let roundQueue = [];
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function makeNewRound(){ roundQueue = shuffle(REGULARS.slice()); roundQueue.push(HIDDEN); }

const bucket   = document.getElementById('bucket');
const shakeBtn = document.getElementById('shakeBtn');
const dlg      = document.getElementById('resultDlg');
const imgWrap  = document.getElementById('imgWrap');

// —— 预加载，避免切换卡顿 —— //
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
preloadAll();

// —— 仅用于弹窗按钮的自动配色 —— //
const tmp = document.createElement('canvas');
const ctx = tmp.getContext('2d');
function themeButtonFrom(img){
  const S=80; tmp.width=S; tmp.height=S;
  ctx.drawImage(img,0,0,S,S);
  const data=ctx.getImageData(0,0,S,S).data;
  let r=0,g=0,b=0,c=0;
  for(let i=0;i<data.length;i+=16){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; c++; }
  r=Math.round(r/c); g=Math.round(g/c); b=Math.round(b/c);
  const lum=0.2126*(r/255)+0.7152*(g/255)+0.0722*(b/255);
  const text = lum>0.6 ? '#222' : '#fff';
  const btnBg = `rgb(${Math.max(0,r-20)},${Math.max(0,g-10)},${Math.max(0,b-10)})`;
  document.querySelectorAll('.close').forEach(btn=>{ btn.style.background=btnBg; btn.style.color=text; });
}

// —— 无闪烁抽卡：先解码、再换 DOM、再开窗 —— //
async function loadImageDecoded(src){
  let im = IMG_CACHE.get(src);
  if(!im){ im = new Image(); im.src = src; IMG_CACHE.set(src, im); }
  if(!im.complete){
    await new Promise(res => { im.onload = res; im.onerror = res; });
  }
  if(im.decode){ try{ await im.decode(); }catch(e){} }
  return im;
}

async function draw(){
  if(roundQueue.length===0) makeNewRound();

  // 防止连点 + 摇动动画
  shakeBtn.disabled = true;
  bucket.classList.remove('shake'); void bucket.offsetWidth; bucket.classList.add('shake');

  const pick = roundQueue.shift();

  // 先解码新图（内存就绪）
  const decoded = await loadImageDecoded(pick);

  // 替换容器里的 <img>，避免旧图残留
  imgWrap.innerHTML = "";
  const img = document.createElement('img');
  img.alt = "抽到的祝福卡";
  img.loading = "eager";
  img.decoding = "sync"; // 直接显示已解码像素
  img.src = decoded.src; // 复用缓存地址
  imgWrap.appendChild(img);

  // 设置按钮主题色
  themeButtonFrom(decoded);

  // 先开窗，再在下一帧显示图，避免布局闪动
  dlg.showModal();
  requestAnimationFrame(()=> { img.classList.add('ready'); });

  // 放开按钮
  setTimeout(()=> { shakeBtn.disabled = false; }, 400);
}

shakeBtn.addEventListener('click', draw);
// 空格触发
window.addEventListener('keydown', e=>{ if(e.code==='Space'){ e.preventDefault(); draw(); } });
