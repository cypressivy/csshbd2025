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

// —— 预加载 —— //
const ALL_SRCS = [HIDDEN, ...REGULARS];
const IMG_CACHE = new Map();
function preloadAll(){
  return Promise.all(ALL_SRCS.map(src => new Promise((resolve)=>{
    const im = new Image();
    im.src = src;
    im.onload = () => { IMG_CACHE.set(src, im); resolve(); };
    im.onerror= () => { IMG_CACHE.set(src, im); resolve(); };
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

// —— 彩带（canvas） —— //
(function(){
  const cvs = document.getElementById('confetti');
  const c = cvs.getContext('2d');
  let W=0,H=0, raf=null, parts=[];
  function resize(){ W=cvs.width=window.innerWidth; H=cvs.height=window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function spawn(n=140){
    parts.length=0;
    for(let i=0;i<n;i++){
      const ang = rnd(-Math.PI, Math.PI);
      const spd = rnd(3,8);
      parts.push({
        x: W/2, y: H*0.35,
        vx: Math.cos(ang)*spd,
        vy: Math.sin(ang)*spd - 2,
        g: rnd(0.05,0.12),
        rot: rnd(0,Math.PI*2),
        vr: rnd(-0.2,0.2),
        w: rnd(6,12),
        h: rnd(8,16),
        color: `hsl(${Math.floor(rnd(0,360))} 90% 55%)`,
        life: 60 + Math.random()*30
      });
    }
    if(!raf) tick();
  }
  function tick(){
    raf = requestAnimationFrame(tick);
    c.clearRect(0,0,W,H);
    let alive=0;
    for(const p of parts){
      p.vy += p.g;
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot+= p.vr;
      p.life -= 1;
      if(p.life>0 && p.y < H+50){
        alive++;
        c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
        c.fillStyle=p.color; c.fillRect(-p.w/2,-p.h/2,p.w,p.h); c.restore();
      }
    }
    if(alive===0){ cancelAnimationFrame(raf); raf=null; c.clearRect(0,0,W,H); }
  }
  window.shootConfetti = ()=> spawn(140);
})();

// —— 加载并 decode 图片 —— //
async function loadDecoded(src){
  let im = IMG_CACHE.get(src);
  if(!im){ im = new Image(); im.src = src; IMG_CACHE.set(src, im); }
  if(!im.complete){
    await new Promise(res => { im.onload = res; im.onerror = res; });
  }
  if(im.decode){ try{ await im.decode(); }catch(e){} }
  return im;
}

// —— 等待摇动动画结束（更稳比 setTimeout） —— //
function waitForShake(el, timeout = 1200){
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done){ done = true; el.removeEventListener('animationend', finish); resolve(); } };
    el.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, timeout); // 兜底
  });
}

async function draw(){
  if(roundQueue.length===0) makeNewRound();

  // 禁止连点，开始摇动
  shakeBtn.disabled = true;
  bucket.classList.remove('shake'); void bucket.offsetWidth; bucket.classList.add('shake');

  // 抽签 & 并行加载图片 + 等摇动结束
  const pick = roundQueue.shift();
  const decodedPromise = loadDecoded(pick);
  const shakePromise   = waitForShake(bucket);

  // 两者完成后再展示
  const decoded = await Promise.all([decodedPromise, shakePromise]).then(r => r[0]);

  // 替换容器中的图片元素，避免旧图残影
  imgWrap.innerHTML = "";
  const img = document.createElement('img');
  img.alt = "抽到的祝福卡";
  img.loading = "eager";
  img.decoding = "sync";
  img.src = decoded.src;
  imgWrap.appendChild(img);

  // 只改变弹窗按钮颜色
  themeButtonFrom(decoded);

  // 展示弹窗 & 在下一帧渐显图片
  dlg.showModal();
  requestAnimationFrame(()=> { img.classList.add('ready'); });

  // 仅隐藏款触发彩带
  if(pick === HIDDEN){ shootConfetti(); }

  // 释放按钮
  setTimeout(()=> { shakeBtn.disabled = false; }, 200);
}

shakeBtn.addEventListener('click', draw);
// 空格触发
window.addEventListener('keydown', e=>{ if(e.code==='Space'){ e.preventDefault(); draw(); } });
