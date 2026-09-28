const MAT={Steel:79.3,Copper:45,Brass:38,Aluminium:26},$=id=>document.getElementById(id),PI=Math.PI,LIM=15*PI/180;
const S={mat:'Steel',L:.6,d:1,M:2,R:.09985,scale:5,N:20,th:0,om:0,held:true,rel:false,pause:false,sw:0,swOn:false,cnt:0,sign:1,trials:[],dm:null,Dm:null,lset:0,mset:0};
const ZE=.02,YS=[3e-4,2.2e-4,2.6e-4,2e-4]; /* demo-scaled yield shear strains: steel,copper,brass,aluminium */let phys_show=false,gm=0,warnT=0;
const Gm=()=>MAT[S.mat]*1e9,rr=()=>S.d/2000,Ii=()=>.5*S.M*S.R*S.R,kap=()=>PI*Gm()*rr()**4/(2*S.L);
const Tf=(g,L,r,I)=>Math.sqrt(8*PI*I*L/(g*r**4)),Gf=(I,L,r,T)=>8*PI*I*L/(r**4*T*T);
const e=x=>x.toExponential(3),f=(x,n=2)=>x.toFixed(n);
Object.keys(MAT).forEach(m=>$('mat').add(new Option(m+' ('+MAT[m]+' GPa)',m)));
$('mat').selectedIndex=0;
// ---- 3D scene
const cv=$('c'),rd=new THREE.WebGLRenderer({canvas:cv,antialias:true});rd.setPixelRatio(Math.min(devicePixelRatio,2));rd.shadowMap.enabled=true;
const sc=new THREE.Scene();sc.background=new THREE.Color(0x1a2230);const cam=new THREE.PerspectiveCamera(45,1,.05,50);
sc.add(new THREE.HemisphereLight(0xffffff,0x556677,.5));
/* procedural studio "HDRI" -> PMREM environment map for metal reflections */
const pm=new THREE.PMREMGenerator(rd),es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(10,16,16),new THREE.MeshBasicMaterial({color:0x8899aa,side:THREE.BackSide})));
[[0,8,0,6,.3,6],[8,3,0,.3,4,6],[-8,3,2,.3,4,4]].forEach(a=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a[3],a[4],a[5]),new THREE.MeshBasicMaterial({color:0xffffff}));m.position.set(a[0],a[1],a[2]);es.add(m)});
sc.environment=pm.fromScene(es).texture;
const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(2,3,2);dl.castShadow=true;dl.shadow.mapSize.set(1024,1024);Object.assign(dl.shadow.camera,{left:-2,right:2,top:2,bottom:-2});sc.add(dl);
const MT=(c,m=.5,r=.35)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
function mesh(g,m,x,y,z,p){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;(p||sc).add(o);return o}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),C=(a,b,h,n=24)=>new THREE.CylinderGeometry(a,b,h,n);
mesh(B(3,.08,1.6),MT(0x8a6a4a,.05,.7),0,-.04,0);
[[-1.4,-.7],[1.4,-.7],[-1.4,.7],[1.4,.7]].forEach(p=>mesh(B(.08,.75,.08),MT(0x555b63,.6),p[0],-.45,p[1]));
mesh(B(30,.02,30),MT(0x2b3340,0,1),0,-.83,0);
const steel=MT(0x8f99a6,.7,.28);
mesh(B(.55,.04,.38),steel,.1,.02,0);mesh(C(.015,.015,1.6),steel,0,.82,0);mesh(B(.6,.035,.035),steel,.3,1.6,0);mesh(C(.022,.022,.06),MT(0x333a44,.6),.5,1.55,0);
/* GLSL shear-stress shader: colour by gamma_max/gamma_yield = r*theta/L / gamma_y (blue <30%, yellow/orange 30-70%, red >70%) */
const wm=new THREE.ShaderMaterial({uniforms:{uR:{value:0},uB:{value:new THREE.Color(0x9aa5b1)}},
vertexShader:`varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`uniform float uR;uniform vec3 uB;varying vec3 vN;void main(){vec3 c=mix(vec3(.15,.4,1.),vec3(1.,.8,.15),smoothstep(.3,.5,uR));c=mix(c,vec3(1.,.5,.1),smoothstep(.5,.7,uR));c=mix(c,vec3(1.,.12,.1),smoothstep(.7,1.,uR));c=mix(uB,c,smoothstep(0.,.02,uR));
float d=.55+.45*max(dot(normalize(vN),normalize(vec3(.4,.8,.5))),0.);gl_FragColor=vec4(c*d,1.);}`});
const Y0=1.52,sm=MT(0xff8a3d,.1,.6),wg=new THREE.Group();wg.position.set(.5,Y0,0);sc.add(wg);
const segs=[];for(let i=0;i<10;i++){const s=mesh(C(1,1,1,12),wm,0,0,0,wg);mesh(B(.6,1.02,.6),sm,1,0,0,s);segs.push(s)}
const dg=new THREE.Group();dg.position.x=.5;sc.add(dg);
const disc=mesh(C(S.R,S.R,.03,48),MT(0xb8c0cc,.75,.25),0,0,0,dg);mesh(C(.012,.012,.03),MT(0x333a44,.6),0,.03,0,dg);
mesh(B(.03,.032,.012),MT(0xd33,.1,.5),S.R-.015,.001,0,dg);mesh(B(.03,.032,.012),MT(0x39d,.1,.5),-(S.R-.015),.001,0,dg);
const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(S.R,.04,0),.1,0xff5533,.03,.02);dg.add(arrow);arrow.visible=false;
const stick=mesh(B(.018,1,.004),MT(0xe8d9a0,0,.8),.6,1,0);
/* ---- 3D instruments on the bench (driven by the MEASURE controls; also draggable) ---- */
function tx(w,h,fn,bg){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg||'#eceee8';x.fillRect(0,0,w,h);x.fillStyle='#111';fn(x);const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t}
const pl=(w,h,t)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.rotation.x=-PI/2;return m};
const IM=MT(0xaab3bf,.8,.25),K=.002,FC=.02,xs0=.06; /* K: 1 mm = 0.002 units (caliper), FC: 1 mm = 0.02 units (screw gauge), both enlarged */
// Vernier caliper: beam + fixed jaw, sliding jaw with 10-division vernier (LC 0.1 mm)
const vc=new THREE.Group();vc.position.set(-1.2,.003,.35);sc.add(vc);
mesh(B(.5,.006,.03),IM,.25,0,0,vc);mesh(B(.004,.045,.07),IM,.002,.0225,.05,vc);
const ms=pl(.501,.014,tx(2004,56,x=>{x.font='18px sans-serif';for(let m=0;m<=250;m++){const h=m%10==0?30:m%5==0?22:14;x.fillRect(2+m*8,56-h,1.5,h);if(m%10==0&&m<250)x.fillText(m/10,4+m*8,18)}}));ms.position.set(.2545,.0063,-.0075);vc.add(ms);
const slG=new THREE.Group();vc.add(slG);mesh(B(.05,.014,.017),IM,.025,.005,.0085,slG);mesh(B(.004,.045,.07),IM,.002,.0225,.05,slG);
const vp=pl(.024,.014,tx(96,56,x=>{x.font='16px sans-serif';for(let i=0;i<=10;i++){x.fillRect(2+i*7.2,0,1.5,i%5==0?24:16);if(i%5==0)x.fillText(i,2+i*7.2-4,44)}}));vp.position.set(.0115,.0122,.0085);slG.add(vp);
const vd=mesh(C(S.R*1e3*K,S.R*1e3*K,.008,64),MT(0xb8c0cc,.75,.25),0,.03,.05,vc); // disc sample gripped by the jaws
// Screw gauge: frame, anvil, spindle, sleeve (0.5 mm pitch) and thimble (50 divisions)
const sg=new THREE.Group();sg.position.set(-1,.104,-.25);sc.add(sg);
mesh(B(.3,.008,.05),IM,.08,-.1,0,sg);mesh(B(.076,.01,.02),IM,.012,-.06,0,sg);mesh(B(.012,.11,.02),IM,-.02,-.04,0,sg);mesh(B(.012,.11,.02),IM,.044,-.04,0,sg);
mesh(C(.012,.012,.014),IM,-.007,0,0,sg).rotation.z=PI/2;mesh(C(.014,.014,.13),IM,xs0+.055,0,0,sg).rotation.z=PI/2;
const sp=mesh(C(.006,.006,.2),IM,0,0,0,sg);sp.rotation.z=PI/2;
const ssc=pl(.12,.008,tx(1200,80,x=>{x.font='22px sans-serif';x.fillRect(0,39,1200,2);for(let i=0;i<6;i++){x.fillRect(i*200+2,12,2,27);x.fillRect(i*200+102,41,2,20);x.fillText(i,i*200+8,10)}}));ssc.position.set(xs0+.06,.0145,0);sg.add(ssc);
const thG=new THREE.Group();sg.add(thG);
const tm=new THREE.MeshStandardMaterial({map:tx(1024,480,x=>{x.font='44px sans-serif';for(let i=0;i<50;i++){x.fillRect(i*20.48,i%5==0?390:410,3,i%5==0?90:70);if(i%5==0)x.fillText(i,i*20.48+5,370)}},'#c9ced6'),metalness:.4,roughness:.4});
mesh(C(.024,.024,.07,64),tm,0,0,0,thG).rotation.z=-PI/2;
const wS=mesh(C(1,1,.05,16),MT(0xb87333,.7,.3),0,0,0,sg);wS.rotation.x=PI/2; // wire sample between the jaws
function upd3(){const v=vr_(),r=sr_().r,gap=Math.max(0,r-ZE)*FC; /* ZE: +0.02 mm zero error */
 slG.position.x=.004+v.x*K;vd.visible=$('vin').checked;vd.position.x=.004+S.R*1e3*K;
 sp.position.x=gap+.1;thG.position.x=xs0+r*FC+.035;thG.rotation.x=-PI/2-2*PI*r/.5;
 wS.visible=$('sin').checked&&gap>5e-4;wS.position.x=gap/2;wS.scale.set(gap/2,1,gap/2)}
// orbit camera
let az=.6,el=.2,dist=2.6,goal=null;const tgt=new THREE.Vector3(.4,.85,0);
function setCam(){cam.position.set(tgt.x+dist*Math.cos(el)*Math.sin(az),tgt.y+dist*Math.sin(el),tgt.z+dist*Math.cos(el)*Math.cos(az));cam.lookAt(tgt)}
function rs(){rd.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',rs);rs();setCam();
const rc=new THREE.Raycaster();let drag=0,lx=0,ly=0,acc=0;
cv.addEventListener('pointerdown',ev=>{cv.setPointerCapture(ev.pointerId);goal=null;lx=ev.clientX;ly=ev.clientY;
 rc.setFromCamera({x:ev.clientX/innerWidth*2-1,y:-(ev.clientY/innerHeight)*2+1},cam);
 if(rc.intersectObject(dg,true).length){drag=2;S.held=true;S.rel=false;S.om=0;S.cnt=0}else if(rc.intersectObject(slG,true).length)drag=3;else if(rc.intersectObject(thG,true).length)drag=4;else drag=1});
cv.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-lx,dy=ev.clientY-ly;lx=ev.clientX;ly=ev.clientY;
 if(drag>=3){const q=$(drag==3?'vs':'ss');acc+=dx*dist*(drag==3?1.2:.5)*(Math.cos(az)>=0?1:-1);const w=Math.trunc(acc);acc-=w;q.value=+q.value+w;ui()}else if(drag==2)setAng(S.th-dx*.004*(Math.cos(az)>=0?1:-1));else{az=Math.max(-1.3,Math.min(1.3,az-dx*.007));el=Math.max(0,Math.min(1.3,el+dy*.005));setCam()}});
cv.addEventListener('pointerup',()=>{if(drag==2)release();drag=0});
cv.addEventListener('wheel',ev=>{ev.preventDefault();goal=null;dist=Math.max(.3,Math.min(6,dist*(1+ev.deltaY*.001)));setCam()},{passive:false});
// ---- state helpers
function warn(t){$('warn').textContent=t;warnT=performance.now()+2500}
function setAng(v){if(Math.abs(v)>LIM){warn('Angular displacement is too large. Return to the mean position.');v=Math.sign(v)*LIM}S.th=v;S.om=0;$('as').value=(v*180/PI).toFixed(1)}
function release(){if(Math.abs(S.th)<.005)return warn('Twist the disc a bit more first.');S.held=false;S.rel=true;S.cnt=0;S.sign=Math.sign(S.th);S.om=0}
function mean(){S.th=0;S.om=0;S.held=true;S.rel=false;S.cnt=0;$('as').value=0}
function swR(){S.sw=0;S.swOn=false;S.laps=[];$('laps').textContent=''}
function lap(){if(S.sw>0){(S.laps=S.laps||[]).push(S.sw);$('laps').textContent=S.laps.map((t,i)=>'Split '+(i+1)+': '+f(t)+' s').join('\n')}}function swS(){if(S.cnt<S.N)S.swOn=true}
function newTrial(){mean();swR()}
function pause(){S.pause=!S.pause;$('bp').textContent=S.pause?'RESUME':'PAUSE'}
function clearData(){S.trials=[];tbl();gdraw()}
function resetAll(){mean();swR();S.dm=S.Dm=null;S.lset=S.mset=0;S.cnt=0;S.pause=false;$('bp').textContent='PAUSE'}
function theme(){const d=document.documentElement,l=getComputedStyle(d).getPropertyValue('--bg').trim()=='#dfe6ee';d.dataset.theme=l?'dark':'light';sc.background.setHex(l?0x1a2230:0xc9d3df);gdraw()}
function sync(){wm.uniforms.uB.value.setHex([0x9aa5b1,0xb87333,0xd4b04a,0xd0d4d8][Object.keys(MAT).indexOf(S.mat)]);const vr=.002+.0035*S.d;
 segs.forEach((s,i)=>{s.scale.set(vr,S.L/10,vr);s.position.y=-(i+.5)*S.L/10});dg.position.y=Y0-S.L-.015;stick.scale.y=S.L;stick.position.y=Y0-S.L/2;
 $('Lv').textContent=(S.L*100).toFixed(0);$('dv').textContent=S.d.toFixed(2);$('Mv').textContent=S.M.toFixed(1);$('gth').value=MAT[S.mat]}
// ---- physics (velocity integration of I*th'' = -kappa*th - damping)
function step(dt){const T=dt*S.scale;if(S.held||!S.rel){if(S.swOn)S.sw+=T;return}
 const n=Math.ceil(T/.005),h=T/n,k=kap()/Ii(),g=.0005/Ii(),ac=(x,v)=>-k*x-g*v; /* c = 0.0005 N·m·s/rad */
 for(let i=0;i<n;i++){const po=S.om,x=S.th,v=S.om,k1v=ac(x,v),k2v=ac(x+h/2*v,v+h/2*k1v),k3v=ac(x+h/2*(v+h/2*k1v),v+h/2*k2v),k4v=ac(x+h*(v+h/2*k2v),v+h*k3v); /* RK4 */
  S.th+=h/6*(v+2*(v+h/2*k1v)+2*(v+h/2*k2v)+(v+h*k3v));S.om+=h/6*(k1v+2*k2v+2*k3v+k4v);if(S.swOn)S.sw+=h;
  if(po*S.om<0&&S.th*S.sign>0){S.cnt++;const o=$('oc');o.classList.add('fl');setTimeout(()=>o.classList.remove('fl'),400);
   if(S.cnt>=S.N&&S.swOn){S.swOn=false;warn(S.N+' oscillations completed.')}}}}
// ---- measuring instruments
function vr_(){const D=Math.round(S.R*2e4)/10,x=$('vin').checked?Math.max($('vs').value/10,D):$('vs').value/10,xi=Math.round(x*10),msr=Math.floor(xi/10),v=xi%10;return{x:xi/10,msr,v,closed:$('vin').checked&&$('vs').value/10<=D}}
function sr_(){const dz=Math.round((S.d+ZE)*100),xi=$('sin').checked?Math.max(+$('ss').value,dz):+$('ss').value,msr=Math.floor(xi/50)*.5,c=xi%50;return{xi,msr,c,r:xi/100,closed:$('sin').checked&&+$('ss').value<=dz}}
function recV(){const v=vr_();if(!v.closed)return warn('Close the jaws on the disc first.');S.Dm=v.x}
function recS(){const s=sr_();if(!s.closed)return warn('Close the jaws on the wire first.');S.dm=+(s.r-ZE).toFixed(2)}
// ---- notebook / calc
const dUse=()=>S.dm??S.d,DUse=()=>S.Dm??S.R*2e3,IUse=()=>.5*S.M*(DUse()/2000)**2;
function record(){if(S.swOn||S.sw<=0||S.cnt<S.N)return warn('Complete '+S.N+' oscillations and stop the stopwatch first.');
 if(S.trials.length>=6)return warn('Clear data to record more trials.');const T=S.sw/S.N;
 S.trials.push({m:S.mat,L:S.L,d:dUse(),t:S.sw,N:S.N,T,G:Gf(IUse(),S.L,dUse()/2000,T),Gt:Gm()});tbl();gdraw();newTrial()}
function tbl(){$('tb').innerHTML='<table><tr><th>#</th><th>L cm</th><th>d mm</th><th>t(N) s</th><th>T s</th><th>G GPa</th></tr>'+S.trials.map((t,i)=>`<tr><td>${i+1}</td><td>${f(t.L*100,1)}</td><td>${f(t.d)}</td><td>${f(t.t)}</td><td>${f(t.T,3)}</td><td>${f(t.G/1e9,1)}</td></tr>`).join('')+'</table>'}
function fill(){$('cL').value=S.L;$('cr').value=dUse()/2;$('cI').value=IUse().toExponential(4);$('cT').value=S.sw>0&&S.cnt>=S.N?f(S.sw/S.N,4):f(Tf(Gm(),S.L,rr(),Ii()),4);calc()}
function calc(){const L=+$('cL').value,r=+$('cr').value/1e3,I=+$('cI').value,T=+$('cT').value;if(!(L&&r&&I&&T))return $('co').textContent='Enter L, r, I and T.';
 const g=Gf(I,L,r,T);$('co').textContent=`G = 8πIL / (r⁴T²)\nNumerator = 8π × ${e(I)} × ${L} = ${e(8*PI*I*L)}\nr⁴ = ${e(r**4)} m⁴,  T² = ${f(T*T,4)} s²\nDenominator = ${e(r**4*T*T)}\n\nG = ${e(g)} Pa\n  = ${f(g/1e6,1)} MPa\n  = ${f(g/1e9,2)} GPa\n\nStandard (${S.mat}): ${MAT[S.mat]} GPa → error ${f(Math.abs(g/1e9-MAT[S.mat])/MAT[S.mat]*100,2)} %`}
// ---- graph
function draw(c,m){const x=c.getContext('2d'),W=c.width,H=c.height,cs=getComputedStyle(document.documentElement),tx=cs.getPropertyValue('--tx').trim(),ac=cs.getPropertyValue('--ac').trim();x.clearRect(0,0,W,H);
 const k=8*PI*Ii()/Gm(),pts=S.trials.map(t=>[m?1/(t.d/2)**4:t.L*100,t.T*t.T]),cur=m?1/(S.d/2)**4:S.L*100,th=X=>m?k*S.L*1e12*X:k*(X/100)/rr()**4;
 const xm=Math.max(m?0:100,cur,...pts.map(p=>p[0]))*1.2,ym=Math.max(th(xm),...pts.map(p=>p[1]))*1.1,px=X=>45+X/xm*(W-60),py=Y=>H-32-Y/ym*(H-48);
 x.strokeStyle=tx;x.fillStyle=tx;x.font='11px sans-serif';x.globalAlpha=.6;x.beginPath();x.moveTo(45,10);x.lineTo(45,H-32);x.lineTo(W-10,H-32);x.stroke();
 for(let i=0;i<=4;i++){x.fillText((xm*i/4).toFixed(m?0:0),px(xm*i/4)-8,H-18);x.fillText((ym*i/4).toFixed(1),4,py(ym*i/4)+4)}
 x.globalAlpha=1;x.fillText(m?'1/r⁴ (mm⁻⁴)':'L (cm)',W/2-20,H-3);x.fillText('T² (s²)',4,10);
 x.strokeStyle='#f0883e';x.lineWidth=2;x.beginPath();x.moveTo(px(0),py(0));x.lineTo(px(xm),py(th(xm)));x.stroke();
 x.fillStyle=ac;pts.forEach(p=>{x.beginPath();x.arc(px(p[0]),py(p[1]),5,0,7);x.fill()})}
const gdraw=()=>{draw($('gc'),gm);draw($('rc'),0)};
// ---- UI refresh
const tabs=['LAB','MEASURE','OSCILLATE','STOPWATCH','DATA','CALCULATOR','GRAPH','COMPARE','RESULT','LEARN'];let cur='LAB';
tabs.forEach(t=>{const b=document.createElement('button');b.textContent=t;b.id='t-'+t;b.onclick=()=>show(t);$('tabs').appendChild(b)});
function show(t){cur=t;tabs.forEach(n=>{$('p-'+n).classList.toggle('on',n==t);$('t-'+n).classList.toggle('on',n==t)});if(t=='GRAPH'||t=='RESULT')gdraw();if(t=='CALCULATOR'&&!$('cL').value)fill()}
function ui(){const v=vr_(),s=sr_();
 $('vo').textContent=`Main scale: ${v.msr} mm\nVernier: ${v.v} × 0.1 = ${f(v.v/10,1)} mm\nLeast count: 0.1 mm  Zero error: 0\nDiameter = ${f(v.x,1)} mm ${v.closed?'(jaws closed)':''}`+(S.Dm?`\nRecorded: ${f(S.Dm,1)} mm`:'');
 $('so').textContent=`Main scale: ${f(s.msr,1)} mm\nCircular: ${s.c} × 0.01 = ${f(s.c/100,2)} mm\nLeast count: 0.01 mm  Zero error: +${ZE} mm\nReading ${f(s.r)} − ${ZE} = ${f(s.r-ZE)} mm ${s.closed?'(jaws closed)':''}`+(S.dm?`\nRecorded: ${f(S.dm)} mm`:'');
 $('ml').textContent=f(S.L*100,1)+' cm';
 const m=S.sw,mm=Math.floor(m/60),ss=m-mm*60;$('swd').textContent=String(mm).padStart(2,'0')+':'+(ss<10?'0':'')+ss.toFixed(2);
 $('swT').textContent=S.sw>0&&S.cnt>=S.N&&!S.swOn?f(S.sw/S.N,3):'--';
 $('oi').textContent=`θ = ${f(S.th*180/PI,1)}°\nElastic limit ±15°\nτ = −κθ = ${e(-kap()*S.th)} N·m`;
 const T=S.sw>0&&S.cnt>=S.N?S.sw/S.N:null,d=dUse();
 $('kv').textContent=`Material: ${S.mat}\nLength L: ${f(S.L*100,1)} cm\nDiameter d: ${f(d)} mm\nRadius r: ${f(d/2,3)} mm\nDisc mass: ${f(S.M,1)} kg\nDisc diameter: ${f(DUse(),1)} mm\nI = ½MR² = ${e(IUse())} kg·m²\nOscillations: ${S.N}\nTotal time: ${f(S.sw)} s\nT: ${T?f(T,3):'--'} s\nG: ${T?e(Gf(IUse(),S.L,d/2000,T))+' Pa':'--'}`;
 if(cur=='COMPARE')cmp();if(cur=='RESULT')res()}
const sel={};Object.keys(MAT).forEach(k=>sel[k]=true);
function cmp(){if($('cmp').dataset.b!=1){$('cmp').dataset.b=1;$('cmp').innerHTML='<table id="ct"></table>'}
 const h='<tr><th></th><th>Material</th><th>G GPa</th><th>T s</th><th>L cm</th><th>r mm</th></tr>';let b='';for(const k in MAT)b+=`<tr><td><input type=checkbox ${sel[k]?'checked':''} onchange="sel['${k}']=this.checked"></td><td>${k}</td><td>${MAT[k]}</td><td>${sel[k]?f(Tf(MAT[k]*1e9,S.L,rr(),Ii()),3):'-'}</td><td>${f(S.L*100,1)}</td><td>${f(S.d/2,3)}</td></tr>`;
 if(!$('ct').dataset.k||$('ct').dataset.k!=JSON.stringify(sel)+S.L+S.d+S.M){$('ct').dataset.k=JSON.stringify(sel)+S.L+S.d+S.M;$('ct').innerHTML=h+b}}
function res(){const n=S.trials.length;if(n<3){$('res').innerHTML=`<p>Record at least 3 trials (${n}/3 done).</p>`;return}
 const aT=S.trials.reduce((a,t)=>a+t.T,0)/n,aG=S.trials.reduce((a,t)=>a+t.G,0)/n,gt=+$('gth').value*1e9,er=Math.abs(aG-gt)/gt*100;
 $('res').innerHTML=`<h3 style="color:var(--ok);margin:8px 0">Experiment Completed</h3><p>Average Time Period = <b>${f(aT,3)} s</b></p><p>Experimental Modulus of Rigidity = <b>${e(aG)} Pa</b></p><p>Theoretical Modulus of Rigidity = <b>${e(gt)} Pa</b></p><p>Percentage Error = <b>${f(er,2)} %</b></p>`}
// ---- hints & loop
function hint(){const q=[[S.Dm,'STEP 1: Measure the disc diameter with the Vernier caliper (MEASURE).'],[S.dm,'STEP 2: Measure the wire diameter with the screw gauge (MEASURE).'],[S.lset&&S.mset,'STEPS 3–4: Set the wire length and choose the material (LAB).'],[Math.abs(S.th)>.005||S.rel,'STEPS 5–6: I = ½MR² is computed for you. Twist the disc a small angle (drag it, max ±15°).'],[S.rel,'STEP 7: Release the disc (drag release or RELEASE).'],[S.swOn||S.sw>0,'STEPS 8–9: Start the stopwatch and count the oscillations.'],[S.cnt>=S.N&&S.sw>0,'STEP 10: Wait until '+S.N+' oscillations are counted.'],[S.trials.length>0,'STEPS 11–12: Record the trial in DATA (computes T and G).'],[S.trials.length>=3,'STEP 13: Repeat with a NEW TRIAL until you have 3 trials.']];
 for(const [c,t] of q)if(!c)return t;return 'STEP 14: Open RESULT for average G and percentage error.'}
function camF(i){const V=THREE.Vector3;goal=[{a:.6,e:.2,d:2.6,t:new V(.4,.85,0)},{a:.35,e:.05,d:.45,t:new V(.5,Y0-S.L/2,0)},{a:.5,e:.3,d:.8,t:new V(.5,dg.position.y,0)},{a:.1,e:.9,d:.8,t:new V(-.95,.03,.4)},{a:.15,e:.8,d:.4,t:new V(-.93,.09,-.25)}][i]}
const clk=new THREE.Clock();let fr=0;
function tick(){requestAnimationFrame(tick);const dt=Math.min(clk.getDelta(),.05);if(!S.pause)step(dt);if(goal){az+=(goal.a-az)*.08;el+=(goal.e-el)*.08;dist+=(goal.d-dist)*.08;tgt.lerp(goal.t,.08);setCam()}
 dg.rotation.y=S.th;segs.forEach((s,i)=>s.rotation.y=S.th*(i+.5)/10);wm.uniforms.uR.value=rr()*Math.abs(S.th)/S.L/YS[Object.keys(MAT).indexOf(S.mat)];
 arrow.visible=phys_show;if(phys_show){arrow.setDirection(new THREE.Vector3(0,0,Math.sign(S.th)||1));arrow.setLength(.02+.4*Math.abs(S.th),.03,.02)}
 $('ang').textContent='Angular displacement: '+f(S.th*180/PI,1)+'°';$('dir').textContent=S.held?'Holding / at rest':Math.abs(S.om)<1e-4?'Turning point':(S.om>0?'↺ counter-clockwise (from above)':'↻ clockwise (from above)');
 $('oc').textContent=Math.min(S.cnt,S.N)+' / '+S.N;if(warnT&&performance.now()>warnT){$('warn').textContent='';warnT=0}
 $('phy').textContent=phys_show?`Restoring torque = ${e(-kap()*S.th)} N·m\nAngular displacement = ${f(S.th*180/PI,2)}°\nTime period (theory) = ${f(Tf(Gm(),S.L,rr(),Ii()),3)} s\nMoment of inertia = ${e(Ii())}\nTorsional constant κ = ${e(kap())} N·m/rad`:'';
 if(++fr%6==0){$('rdo').textContent=`L ${f(S.L*100,1)} cm   r ${f(rr()*1e3,3)} mm\nM ${f(S.M,1)} kg   R ${f(S.R*100,2)} cm\nf = ${f(1/Tf(Gm(),S.L,rr(),Ii()),3)} Hz`;ui();$('hint').textContent=hint()}upd3();rd.render(sc,cam)}
sync();show('LAB');tick();