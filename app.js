// 一轮规则：四张随机后隐藏款
const HIDDEN = "assets/card1.jpg";
const REGULARS = ["assets/card2.jpg","assets/card3.jpg","assets/card4.jpg","assets/card5.jpg"];
let roundQueue=[];
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;}
function makeNewRound(){ roundQueue = shuffle(REGULARS.slice()); roundQueue.push(HIDDEN); }

const bucket=document.getElementById('bucket');
const shakeBtn=document.getElementById('shakeBtn');
const dlg=document.getElementById('resultDlg');
const resultImg=document.getElementById('resultImg');

// 自动取主色，仅用于弹窗按钮
const tmp=document.createElement('canvas'); const ctx=tmp.getContext('2d');
function themeButtonFrom(img){
  const S=80; tmp.width=S; tmp.height=S;
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

function draw(){
  if(roundQueue.length===0) makeNewRound();
  bucket.classList.remove('shake'); void bucket.offsetWidth; bucket.classList.add('shake');
  setTimeout(()=>{
    const pick=roundQueue.shift();
    resultImg.onload=()=> themeButtonFrom(resultImg);
    resultImg.src=pick+'?t='+Date.now();
    dlg.showModal();
  },520);
}

shakeBtn.addEventListener('click', draw);
// 空格触发
window.addEventListener('keydown', e=>{ if(e.code==='Space'){ e.preventDefault(); draw(); } });
