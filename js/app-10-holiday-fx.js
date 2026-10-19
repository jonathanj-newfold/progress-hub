// ═══════════════════════════════════════════════════════════════════════════
// Holiday themes — animated overlay.
// A click-through <canvas> sits over the whole Progress Hub window (below
// popups) and draws a seasonal effect while a holiday theme is active:
//   hol-christmas → snowfall        hol-halloween → bats, ghosts, pumpkins, corner spider webs + spiders, embers
//   hol-newyear   → Hong Kong harbour skyline + fireworks over the water   hol-cny → dancing dragons + fireworks + lanterns + red envelopes
//   hol-valentine → hearts + Cupids firing arrows, doves, balloons       hol-holyweek → soft light + motes
//   hol-easter → Easter Bunny + hatching chicks + painted eggs + meadow   hol-autumn → falling leaves   hol-diwali → diyas + sparks
//   hol-stpat → shamrocks + gold   hol-parol → giant Pampanga-style stained-glass lanterns w/ chasing lights + garland
//   hol-allsaints → Philippine cemetery at night (Undas): candles, tarp tents, families, church bell   hol-rain → rainfall
//   hol-haunted → graveyard scene   hol-xmasvillage → Christmas village + Santa's sleigh
//   hol-ramadan → crescent + fanous lanterns   hol-eid → gold/emerald fireworks
//   hol-holi → colour-powder bursts   hol-hanukkah → menorah + silver stars
//   hol-midautumn → harvest moon + lanterns   hol-july4 → red/white/blue fireworks
//   hol-phindep → Katipuneros with bolos, flags, doves & fireworks   hol-dayofdead → papel picado, ofrenda (sugar skulls, candles, marigolds), monarch butterflies, petals + sparks
//   hol-sinulog → banderitas + sunburst glow + confetti + queen/Santo Niño procession + fluvial parade (boats on a water strip)
//   img-fuji → drifting sakura petals + breeze/gusts (photo theme "Sakura & Fuji")
//   (effects flagged `behind:true` draw under the UI instead of over it)
// It follows the <html> theme class, so it needs no hook into _applyTheme,
// pauses when the window is hidden, and is skipped if the OS asks for
// reduced motion.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const pick=a=>a[(Math.random()*a.length)|0];
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cv=null,ctx=null,W=0,H=0,raf=0,last=0,fx=null,cur=null;

  // Draw decorations onto an offscreen layer, then composite once at `alpha` so overlapping shapes
  // fade evenly and the dashboard tiles stay clearly visible underneath.
  let _fadeCv=null,_fadeCx=null;
  function fade(c,alpha,fn){
    if(!_fadeCv||_fadeCv.width!==cv.width||_fadeCv.height!==cv.height){_fadeCv=document.createElement('canvas');_fadeCv.width=cv.width;_fadeCv.height=cv.height;_fadeCx=_fadeCv.getContext('2d');}
    const dpr=cv.width/W,o=_fadeCx;o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,_fadeCv.width,_fadeCv.height);o.setTransform(dpr,0,0,dpr,0,0);
    fn(o);
    c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=alpha;c.drawImage(_fadeCv,0,0);c.restore();
  }

  function heart(c,x,y,s){
    c.beginPath();c.moveTo(x,y+s*.35);
    c.bezierCurveTo(x-s*.9,y-s*.3,x-s*.5,y-s*.95,x,y-s*.45);
    c.bezierCurveTo(x+s*.5,y-s*.95,x+s*.9,y-s*.3,x,y+s*.35);c.fill();
  }

  // ── Chinese New Year helpers (dancing dragons, pearl, fireworks palette) ──
  const FC=['#fbbf24','#ef4444','#fb923c','#fff7ed','#f472b6','#fde047'];
  const PAL0={body:'#dc2626',edge:'#fbbf24',spine:'#f59e0b',scale:'rgba(253,224,71,.55)',hi:'#fca5a5',mane:['#fbbf24','#f97316'],horn:'#fde68a'};
  const PAL1={body:'#f59e0b',edge:'#b91c1c',spine:'#dc2626',scale:'rgba(127,29,29,.5)',hi:'#fef3c7',mane:['#ef4444','#fff7ed'],horn:'#fff7ed'};
  // dragon head, drawn facing +x with the top at -y
  function drawDragonHead(c,P,t,ph){
    const w=Math.sin(t*6+ph);
    c.lineCap='round';
    for(let k=0;k<5;k++){                                   // flowing mane
      c.strokeStyle=P.mane[k&1];c.lineWidth=3.4-k*.3;
      c.beginPath();c.moveTo(-8,-10+k*4.4);
      c.quadraticCurveTo(-26,-16+k*9+Math.sin(t*6+k+ph)*6,-46,-8+k*8+Math.sin(t*5+k*1.3+ph)*8);c.stroke();
    }
    c.strokeStyle=P.horn;c.lineWidth=3.4;                   // horns
    c.beginPath();c.moveTo(-2,-13);c.quadraticCurveTo(-10,-30,-26,-31);c.stroke();
    c.lineWidth=2.4;c.beginPath();c.moveTo(-9,-11);c.quadraticCurveTo(-18,-24,-33,-24);c.stroke();
    c.strokeStyle='rgba(255,247,237,.9)';c.lineWidth=1.7;   // whiskers
    c.beginPath();c.moveTo(26,-2);c.bezierCurveTo(46,-16+w*4,32,-36,4,-39+w*7);c.stroke();
    c.beginPath();c.moveTo(26,3);c.bezierCurveTo(46,17-w*4,32,36,4,39-w*7);c.stroke();
    const jaw=.14+(.5+.5*Math.sin(t*2.6+ph))*.25;           // lower jaw opens and closes
    c.save();c.translate(-6,3);c.rotate(jaw);
    c.fillStyle='#7f1d1d';c.strokeStyle=P.edge;c.lineWidth=1.4;
    c.beginPath();c.moveTo(-5,0);c.quadraticCurveTo(14,2,34,0);c.quadraticCurveTo(30,10,14,12);c.quadraticCurveTo(0,13,-6,8);c.closePath();c.fill();c.stroke();
    c.strokeStyle=P.mane[0];c.lineWidth=2.4;c.beginPath();c.moveTo(8,11);c.quadraticCurveTo(2,20,-8+w*3,24);c.stroke(); // beard
    c.restore();
    c.fillStyle='#450a0a';c.beginPath();c.moveTo(-8,2);c.lineTo(30,0);c.lineTo(24,8);c.closePath();c.fill();
    c.fillStyle=P.body;c.strokeStyle=P.edge;c.lineWidth=1.4;
    c.beginPath();c.moveTo(-16,-12);c.quadraticCurveTo(0,-19,22,-10);c.quadraticCurveTo(36,-9,36,-2);c.quadraticCurveTo(30,3,10,2);c.lineTo(-16,5);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff';[12,19,26].forEach(x=>{c.beginPath();c.moveTo(x,1.6);c.lineTo(x+2.2,6);c.lineTo(x+4,1.2);c.fill();});
    c.fillStyle=P.edge;c.beginPath();c.arc(31,-6,1.8,0,6.283);c.fill();                     // nostril
    c.fillStyle='#fde68a';c.beginPath();c.arc(7,-8,4.3,0,6.283);c.fill();                   // eye
    c.fillStyle='#450a0a';c.beginPath();c.arc(8.2,-8,2.1,0,6.283);c.fill();
    c.strokeStyle=P.edge;c.lineWidth=2.4;c.beginPath();c.moveTo(-1,-15);c.quadraticCurveTo(7,-16,13,-10);c.stroke(); // brow
  }
  // whole dragon: d.S = samples along its path, index 0 = head
  function drawDragon(c,d,t){
    const S=d.S,n=S.length;if(n<8)return;
    const s=d.s,P=d.pal,ang=i=>Math.atan2(S[Math.max(i-1,0)].y-S[Math.min(i+1,n-1)].y,S[Math.max(i-1,0)].x-S[Math.min(i+1,n-1)].x);
    const rad=i=>s*(2.5+11*Math.pow(1-i/(n-1),.75));
    c.save();c.lineCap='round';c.lineJoin='round';c.globalAlpha=1;
    c.fillStyle=P.spine;                                    // dorsal spines
    for(let i=n-2;i>=4;i-=4){
      const a=ang(i),r=rad(i),p=S[i],nx=Math.sin(a),ny=-Math.cos(a),cx=Math.cos(a),cy=Math.sin(a),sl=(5+6*(1-i/n))*s;
      c.beginPath();c.moveTo(p.x+nx*(r-1)-cx*3*s,p.y+ny*(r-1)-cy*3*s);
      c.lineTo(p.x+nx*(r+sl)-cx*5*s,p.y+ny*(r+sl)-cy*5*s);
      c.lineTo(p.x+nx*(r-1)+cx*3*s,p.y+ny*(r-1)+cy*3*s);c.fill();
    }
    [.2,.58].forEach((u,k)=>{                               // legs with claws
      const i=Math.floor((n-1)*u),a=ang(i),r=rad(i),p=S[i];
      [-1,1].forEach(sd=>{
        const nx=Math.sin(a)*sd,ny=-Math.cos(a)*sd,cx=Math.cos(a),cy=Math.sin(a),sw=-7*s+Math.sin(t*5+k*2+sd)*6*s;
        const fx=p.x+nx*(r+13*s)+cx*sw,fy=p.y+ny*(r+13*s)+cy*sw;
        c.strokeStyle=P.body;c.lineWidth=5*s;c.beginPath();c.moveTo(p.x+nx*r*.6,p.y+ny*r*.6);c.lineTo(fx,fy);c.stroke();
        c.strokeStyle=P.edge;c.lineWidth=1.6*s;
        for(let q=-1;q<=1;q++){c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+nx*5*s+cx*(q*4*s+3*s),fy+ny*5*s+cy*(q*4*s+3*s));c.stroke();}
      });
    });
    const ta=ang(n-1)+Math.PI,tp=S[n-1];                    // tail tuft
    for(let k=-1;k<=1;k++){
      c.strokeStyle=P.mane[(k+1)&1];c.lineWidth=3*s;c.beginPath();c.moveTo(tp.x,tp.y);
      c.quadraticCurveTo(tp.x+Math.cos(ta+k*.5)*14*s+Math.sin(t*6+k)*4,tp.y+Math.sin(ta+k*.5)*14*s,tp.x+Math.cos(ta+k*.9)*28*s,tp.y+Math.sin(ta+k*.9)*28*s+Math.sin(t*5+k)*5);c.stroke();
    }
    c.fillStyle=P.edge;                                     // gold outline, then red body, then back highlight
    for(let i=n-1;i>=0;i--){c.beginPath();c.arc(S[i].x,S[i].y,rad(i)+1.7*s,0,6.283);c.fill();}
    c.fillStyle=P.body;
    for(let i=n-1;i>=0;i--){c.beginPath();c.arc(S[i].x,S[i].y,rad(i),0,6.283);c.fill();}
    c.globalAlpha=.35;c.fillStyle=P.hi;
    for(let i=n-1;i>=0;i--){const a=ang(i),r=rad(i);c.beginPath();c.arc(S[i].x+Math.sin(a)*r*.35,S[i].y-Math.cos(a)*r*.35,r*.4,0,6.283);c.fill();}
    c.globalAlpha=1;c.strokeStyle=P.scale;c.lineWidth=1.3*s;  // scale chevrons
    for(let i=n-2;i>=2;i-=3){const a=ang(i),r=rad(i);c.beginPath();c.arc(S[i].x-Math.cos(a)*r*.6,S[i].y-Math.sin(a)*r*.6,r*.9,a-.8,a+.8);c.stroke();}
    c.save();c.translate(S[0].x,S[0].y);c.rotate(ang(0));c.scale(s*1.15,s*1.15*d.flip);drawDragonHead(c,P,t,d.ph);c.restore();
    c.restore();
  }
  // the flaming pearl each dragon chases
  function drawPearl(c,d,t){
    const S=d.S;if(S.length<6)return;
    const a=Math.atan2(S[0].y-S[4].y,S[0].x-S[4].x),s=d.s;
    const x=S[0].x+Math.cos(a)*92*s,y=S[0].y+Math.sin(a)*92*s+Math.sin(t*3+d.ph)*7;
    const g=c.createRadialGradient(x,y,2,x,y,38*s);g.addColorStop(0,'rgba(255,248,200,.95)');g.addColorStop(.35,'rgba(251,191,36,.45)');g.addColorStop(1,'rgba(251,146,60,0)');
    c.globalAlpha=1;c.fillStyle=g;c.beginPath();c.arc(x,y,38*s,0,6.283);c.fill();
    c.fillStyle='#fffbeb';c.beginPath();c.arc(x,y,8*s,0,6.283);c.fill();
    c.fillStyle='rgba(251,191,36,.85)';
    for(let k=0;k<6;k++){const an=t*2.4+k*1.047,r0=9*s,r1=(20+4*Math.sin(t*7+k))*s;
      c.beginPath();c.moveTo(x+Math.cos(an-.22)*r0,y+Math.sin(an-.22)*r0);c.lineTo(x+Math.cos(an)*r1,y+Math.sin(an)*r1);c.lineTo(x+Math.cos(an+.22)*r0,y+Math.sin(an+.22)*r0);c.closePath();c.fill();}
  }

  // ── Valentine helpers (Cupid, doves, arrows, sparkles) ──────────────────
  const VC=['#f472b6','#fb7185','#ef4444','#fda4af','#ec4899'];
  function spark4(c,x,y,r){
    c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x,y,x+r,y);c.quadraticCurveTo(x,y,x,y+r);
    c.quadraticCurveTo(x,y,x-r,y);c.quadraticCurveTo(x,y,x,y-r);c.fill();
  }
  // arrow with its tip at the origin, pointing +x
  function arrowShape(c,L){
    c.strokeStyle='#fde68a';c.lineWidth=2;c.lineCap='round';
    c.beginPath();c.moveTo(-L,0);c.lineTo(-2,0);c.stroke();
    c.fillStyle='#f43f5e';c.beginPath();c.moveTo(-3,-3.6);c.lineTo(7,0);c.lineTo(-3,3.6);c.closePath();c.fill();
    c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();
    c.moveTo(-L,0);c.lineTo(-L-5,-4);c.moveTo(-L+4,0);c.lineTo(-L-1,-4);
    c.moveTo(-L,0);c.lineTo(-L-5,4);c.moveTo(-L+4,0);c.lineTo(-L-1,4);c.stroke();
  }
  function drawDove(c,x,y,dir,s,t,ph){
    c.save();c.translate(x,y);c.scale(dir*s,s);
    const fl=Math.sin(t*8+ph)*.8+.2;
    const wing=al=>{
      c.save();c.translate(1,-3);c.scale(1,fl);c.globalAlpha=al;
      c.fillStyle='#fff';c.strokeStyle='rgba(244,114,182,.5)';c.lineWidth=.8;
      c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-4,-12,-14,-22,-24,-22);c.bezierCurveTo(-19,-14,-13,-6,-9,2);c.closePath();c.fill();c.stroke();
      c.restore();
    };
    wing(.6);
    c.fillStyle='#fff';
    c.beginPath();c.moveTo(-9,-1);c.lineTo(-22,-5);c.lineTo(-21,2);c.lineTo(-9,3);c.closePath();c.fill();
    c.beginPath();c.ellipse(0,0,11,6.4,0,0,6.283);c.fill();
    c.beginPath();c.arc(10,-4.5,4.3,0,6.283);c.fill();
    c.fillStyle='#fb923c';c.beginPath();c.moveTo(13.8,-5.2);c.lineTo(18.2,-3.8);c.lineTo(13.8,-2.8);c.closePath();c.fill();
    c.fillStyle='#4a1d33';c.beginPath();c.arc(11.6,-5.4,.9,0,6.283);c.fill();
    wing(1);
    c.restore();
  }
  // Cupid, drawn facing +x and mirrored by q.dir. Bow arm aims by q.aim and the string pulls by q.pull.
  function drawCupid(c,q,t){
    const fl=Math.sin(t*9+q.ph),pull=q.pull;
    c.save();c.translate(q.x,q.y);c.scale(q.dir*q.s,q.s);
    const gl=c.createRadialGradient(0,-4,2,0,-4,36);gl.addColorStop(0,'rgba(255,214,235,.30)');gl.addColorStop(1,'rgba(255,214,235,0)');
    c.fillStyle=gl;c.beginPath();c.arc(0,-4,36,0,6.283);c.fill();
    // wings (flapping)
    for(let k=1;k>=0;k--){
      c.save();c.translate(-3,-6);c.rotate(-.15-(fl*.5+.5)*1.1-k*.2);
      c.globalAlpha=k?.6:1;
      const g=c.createLinearGradient(0,0,-6,-34);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#f9a8d4');
      c.fillStyle=g;c.strokeStyle='rgba(236,72,153,.45)';c.lineWidth=.9;
      c.beginPath();c.moveTo(0,0);
      c.bezierCurveTo(-9,-4,-12,-20,-4,-33);c.bezierCurveTo(-1,-36,2,-34,3,-30);
      c.bezierCurveTo(4,-33,8,-31,8,-26);c.bezierCurveTo(9,-27,12,-23,11,-17);
      c.bezierCurveTo(14,-15,14,-9,9,-4);c.bezierCurveTo(7,-1,3,0,0,0);
      c.fill();c.stroke();c.restore();
    }
    c.globalAlpha=1;
    // quiver with spare arrows
    c.save();c.translate(-8,-4);c.rotate(-.35);
    c.fillStyle='#be185d';c.fillRect(-3,-9,6,14);c.strokeStyle='#fde68a';c.lineWidth=1;c.strokeRect(-3,-9,6,14);
    c.strokeStyle='#fff';c.lineWidth=1.2;c.beginPath();c.moveTo(-1,-9);c.lineTo(-2,-15);c.moveTo(1.2,-9);c.lineTo(2.4,-14);c.stroke();
    c.restore();
    // dangling legs
    const lg=Math.sin(t*6+q.ph);
    c.strokeStyle='#ffd3bd';c.lineCap='round';c.lineWidth=3.8;
    c.beginPath();c.moveTo(-1,7);c.quadraticCurveTo(3,11,3+lg*2.5,15+lg*1.2);c.moveTo(2,7);c.quadraticCurveTo(7,10,8-lg*2.5,14-lg*1.2);c.stroke();
    // torso + cloth
    c.fillStyle='#ffd3bd';c.beginPath();c.ellipse(1,0,6.2,8.4,0,0,6.283);c.fill();
    c.fillStyle='#f472b6';c.beginPath();c.moveTo(-5.4,4.4);c.quadraticCurveTo(1,13,7.4,4.4);c.lineTo(6.4,1.8);c.lineTo(-4.4,1.8);c.closePath();c.fill();
    // head, golden curls, face
    c.fillStyle='#ffdcc8';c.beginPath();c.arc(3,-12,7.6,0,6.283);c.fill();
    c.fillStyle='#fcd34d';
    [[-2.2,-14.2,3.4],[0.8,-18,3.6],[5.2,-19,3.6],[9,-16.5,3.2],[-3,-10.3,2.8]].forEach(k=>{c.beginPath();c.arc(k[0],k[1],k[2],0,6.283);c.fill();});
    c.fillStyle='#5b2a3a';c.beginPath();c.arc(6.4,-12,1.05,0,6.283);c.fill();
    c.fillStyle='rgba(244,63,94,.38)';c.beginPath();c.arc(6.6,-9,1.9,0,6.283);c.fill();
    c.strokeStyle='#b4505f';c.lineWidth=.8;c.lineCap='round';c.beginPath();c.arc(6,-9.6,1.7,.15,1.3);c.stroke();
    // bow arm (rotates to aim)
    c.save();c.translate(3,-5);c.rotate(q.aim);
    const nx=11-pull*11;
    c.strokeStyle='#ffd3bd';c.lineWidth=3.4;c.lineCap='round';
    c.beginPath();c.moveTo(0,0);c.lineTo(17,-1);c.stroke();                 // front arm
    c.beginPath();c.moveTo(0,0);if(q.nock)c.lineTo(nx+1,-1);else c.lineTo(3,7);c.stroke(); // string hand
    c.strokeStyle='#f59e0b';c.lineWidth=2.3;c.beginPath();c.moveTo(11,-17);c.quadraticCurveTo(24,-1,11,15);c.stroke();
    c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=.9;
    c.beginPath();c.moveTo(11,-17);c.lineTo(q.nock?nx:11,-1);c.lineTo(11,15);c.stroke();
    if(q.nock){c.save();c.translate(nx+26,-1);arrowShape(c,26);c.restore();}
    c.fillStyle='#ffd3bd';c.beginPath();c.arc(17.5,-1,2.2,0,6.283);c.fill();
    c.restore();
    c.restore();
  }

  const EFFECTS={
    'hol-christmas':{
      init(){this.p=Array.from({length:Math.round(Math.min(220,W*H/9000))},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(1,3.6),vy:rnd(25,70),ph:rnd(0,6.28),sw:rnd(.4,1.2),a:rnd(.45,.95)}));},
      step(dt,t){for(const f of this.p){f.y+=f.vy*dt*(f.r/2.2);f.x+=Math.sin(t*f.sw+f.ph)*18*dt;if(f.y>H+5){f.y=-5;f.x=rnd(0,W);}if(f.x>W+5)f.x=-5;if(f.x<-5)f.x=W+5;}},
      draw(c){for(const f of this.p){c.globalAlpha=f.a;c.fillStyle='#fff';c.beginPath();c.arc(f.x,f.y,f.r,0,6.283);c.fill();}}
    },
    'hol-halloween':{
      init(){
        this.bats=Array.from({length:9},()=>this.bat(true));
        this.em=Array.from({length:50},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2.2),vy:rnd(12,34),ph:rnd(0,6.28),a:rnd(.3,.8)}));
        // corner spider webs (painted once) with spiders dangling from them
        const dpr=Math.min(window.devicePixelRatio||1,2),wr=Math.max(150,Math.min(300,W*.2,H*.38));
        const off=this.off=document.createElement('canvas');off.width=Math.round(W*dpr);off.height=Math.round(H*dpr);
        const o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
        const web=(cx,cy,sx,sy,R,rays)=>{
          o.save();o.translate(cx,cy);o.scale(sx,sy);o.strokeStyle='rgba(235,235,250,.42)';o.lineWidth=1.1;o.lineCap='round';
          for(let k=0;k<=rays;k++){const a=k/rays*Math.PI/2;o.beginPath();o.moveTo(0,0);o.lineTo(Math.cos(a)*R,Math.sin(a)*R);o.stroke();}
          for(let r=R*.14;r<=R;r+=R*.14){o.beginPath();
            for(let k=0;k<=rays;k++){const a=k/rays*Math.PI/2,px=Math.cos(a)*r,py=Math.sin(a)*r;
              if(!k)o.moveTo(px,py);else{const am=(k-.5)/rays*Math.PI/2,mr=r*.86;o.quadraticCurveTo(Math.cos(am)*mr,Math.sin(am)*mr,px,py);}}
            o.stroke();}
          o.restore();};
        web(0,0,1,1,wr,7);web(W,0,-1,1,wr*.85,7);web(0,H,1,-1,wr*.6,6);web(W,H,-1,-1,wr*.6,6);
        this.wr=wr;
        this.sp=[{x:wr*.5,top:wr*.55,len:wr*.55,ph:0,s:1},{x:W-wr*.4,top:wr*.5,len:wr*.4,ph:2,s:.85}];
        // jack-o'-lanterns & pumpkins along the bottom edge, plus drifting ghosts
        const pu=Math.max(.8,Math.min(1.3,H/800));let px=rnd(10,50);this.pk=[];
        while(px<W){const r=rnd(22,40)*pu,face=Math.random()<.65;this.pk.push({x:px+r,r,face,ph:rnd(0,6.28),k:(Math.random()*3)|0,y:H+r*.18});
          if(Math.random()<.35)this.pk.push({x:px+r*1.9,r:r*.55,face:Math.random()<.5,ph:rnd(0,6.28),k:(Math.random()*3)|0,y:H+r*.1});
          px+=r*2+rnd(W*.04,W*.16);}
        this.gh=Array.from({length:4},()=>({x:rnd(0,W),y:rnd(H*.15,H*.7),s:rnd(26,40),vx:rnd(10,22)*(Math.random()<.5?1:-1),ph:rnd(0,6.28)}));
      },
      bat(first){const dir=Math.random()<.5?1:-1;return{x:first?rnd(0,W):(dir>0?-40:W+40),y:rnd(30,H*.6),vx:dir*rnd(45,110),s:rnd(.7,1.35),ph:rnd(0,6.28),wob:rnd(.6,1.6),by:0};},
      step(dt,t){
        for(let i=0;i<this.bats.length;i++){const b=this.bats[i];b.x+=b.vx*dt;b.by=Math.sin(t*b.wob+b.ph)*34;if(b.x<-60||b.x>W+60)this.bats[i]=this.bat(false);}
        for(const e of this.em){e.y-=e.vy*dt;e.x+=Math.sin(t+e.ph)*10*dt;if(e.y<-5){e.y=H+5;e.x=rnd(0,W);}}
        for(const g of this.gh){g.x+=g.vx*dt;if(g.x>W+60)g.x=-60;if(g.x<-60)g.x=W+60;}
      },
      draw(c,t){
        c.globalAlpha=1;c.drawImage(this.off,0,0,W,H);
        // spiders dangling on silk threads
        for(const sp of this.sp){
          const L=sp.len*(.75+.25*Math.sin(t*.9+sp.ph)),sy=sp.top+L,sx=sp.x+Math.sin(t*1.3+sp.ph)*5,s=sp.s;
          c.globalAlpha=.7;c.strokeStyle='#e5e7f5';c.lineWidth=1;c.beginPath();c.moveTo(sp.x,0);c.lineTo(sx,sy);c.stroke();
          c.globalAlpha=1;c.fillStyle='#3b2257';c.strokeStyle='#4a2d6b';c.lineWidth=2*s;
          for(let k=0;k<4;k++){const lg=Math.sin(t*3+k+sp.ph)*3;[-1,1].forEach(d=>{c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(sx+d*14*s,sy-8*s+k*4*s+lg,sx+d*18*s,sy+8*s+k*5*s);c.stroke();});}
          c.beginPath();c.arc(sx,sy,8*s,0,6.283);c.fill();c.beginPath();c.arc(sx,sy-9*s,5*s,0,6.283);c.fill();
          c.fillStyle='#ef4444';c.beginPath();c.arc(sx-2*s,sy-10*s,1.2*s,0,6.283);c.arc(sx+2*s,sy-10*s,1.2*s,0,6.283);c.fill();
          c.fillStyle='#b91c1c';c.beginPath();c.moveTo(sx-2*s,sy+2*s);c.lineTo(sx,sy+6*s);c.lineTo(sx+2*s,sy+2*s);c.fill();
        }
        // ghosts
        for(const g of this.gh){
          const x=g.x,y=g.y+Math.sin(t*1.1+g.ph)*14,s=g.s,d=g.vx>0?1:-1;
          c.globalAlpha=.26;c.fillStyle='#f3f4ff';c.beginPath();c.arc(x,y-s*.1,s*.55,Math.PI,0);
          c.lineTo(x+s*.55,y+s*.7);
          for(let k=0;k<4;k++){const wx=x+s*.55-(k+.5)*s*.275;c.quadraticCurveTo(wx+s*.07,y+s*(.95+Math.sin(t*4+k+g.ph)*.12),wx-s*.0,y+s*.7);}
          c.lineTo(x-s*.55,y+s*.7);c.closePath();c.fill();
          c.globalAlpha=.5;c.fillStyle='#1b1030';c.beginPath();c.ellipse(x-s*.2+d*s*.06,y-s*.12,s*.08,s*.12,0,0,6.283);c.ellipse(x+s*.2+d*s*.06,y-s*.12,s*.08,s*.12,0,0,6.283);c.fill();
          c.beginPath();c.ellipse(x+d*s*.06,y+s*.16,s*.07,s*.1,0,0,6.283);c.fill();
        }
        // pumpkins (faded so tiles stay visible)
        fade(c,.42,c=>{for(const p of this.pk){
          const r=p.r,x=p.x,y=p.y,fl=.75+.25*Math.sin(t*7+p.ph)*Math.sin(t*3.1+p.ph*2);
          if(p.face){const gg=c.createRadialGradient(x,y-r*.5,2,x,y-r*.5,r*2.6);gg.addColorStop(0,'rgba(255,170,40,'+(.34*fl)+')');gg.addColorStop(1,'rgba(255,120,0,0)');c.globalAlpha=1;c.fillStyle=gg;c.beginPath();c.arc(x,y-r*.5,r*2.6,0,6.283);c.fill();}
          c.globalAlpha=1;
          const bg=c.createRadialGradient(x-r*.3,y-r*1.1,r*.1,x,y-r*.8,r*1.3);bg.addColorStop(0,'#fb923c');bg.addColorStop(.6,'#ea580c');bg.addColorStop(1,'#9a3412');
          c.fillStyle=bg;                                         // lobed body
          [-.62,.62,-.3,.3,0].forEach(k=>{c.beginPath();c.ellipse(x+k*r,y-r*.8,r*(k?.52:.62),r*.82,0,0,6.283);c.fill();});
          c.strokeStyle='rgba(124,45,18,.55)';c.lineWidth=1.4;
          [-.35,0,.35].forEach(k=>{c.beginPath();c.moveTo(x+k*r*1.1,y-r*1.55);c.quadraticCurveTo(x+k*r*1.5,y-r*.8,x+k*r*1.1,y-r*.05);c.stroke();});
          c.fillStyle='#4d7c0f';c.beginPath();c.moveTo(x-r*.1,y-r*1.55);c.quadraticCurveTo(x-r*.05,y-r*1.9,x+r*.22,y-r*2.0);c.lineTo(x+r*.28,y-r*1.88);c.quadraticCurveTo(x+r*.1,y-r*1.8,x+r*.12,y-r*1.55);c.closePath();c.fill();
          if(p.face){
            c.fillStyle='rgba(255,224,102,'+(.8+.2*fl)+')';
            const eye=(ex)=>{c.beginPath();c.moveTo(x+ex-r*.2,y-r*.85);c.lineTo(x+ex+r*.2,y-r*.85);c.lineTo(x+ex,y-r*1.2);c.closePath();c.fill();};
            if(p.k===1){c.beginPath();c.ellipse(x-r*.36,y-r*.95,r*.14,r*.19,0,0,6.283);c.ellipse(x+r*.36,y-r*.95,r*.14,r*.19,0,0,6.283);c.fill();}
            else{eye(-r*.38);eye(r*.38);}
            c.beginPath();c.moveTo(x,y-r*.72);c.lineTo(x-r*.1,y-r*.58);c.lineTo(x+r*.1,y-r*.58);c.closePath();c.fill();  // nose
            c.beginPath();c.moveTo(x-r*.62,y-r*.5);
            const n=p.k===2?4:5;                                   // jagged grin
            for(let k=0;k<=n;k++){const mx=x-r*.62+k*(r*1.24/n);c.lineTo(mx,y-r*.5+(k%2?r*.2:r*.02)+Math.abs(k-n/2)*r*.05);}
            for(let k=n;k>=0;k--){const mx=x-r*.62+k*(r*1.24/n);c.lineTo(mx,y-r*.34+(k%2?r*.18:0)+Math.abs(k-n/2)*r*.05);}
            c.closePath();c.fill();
          }
        }});
        for(const e of this.em){c.globalAlpha=e.a*(.6+.4*Math.sin(t*3+e.ph));c.fillStyle='#fb923c';c.beginPath();c.arc(e.x,e.y,e.r,0,6.283);c.fill();}
        c.fillStyle='#0b0612';c.globalAlpha=.92;
        for(const b of this.bats){
          const flap=Math.sin(t*14+b.ph)*.55+.1,s=b.s*14,x=b.x,y=b.y+b.by,d=b.vx>0?1:-1;
          c.beginPath();c.moveTo(x,y);
          c.quadraticCurveTo(x-d*s*.8,y-s*(1.1+flap),x-d*s*1.9,y-s*(.2+flap*.8));
          c.quadraticCurveTo(x-d*s*1.3,y+s*.2,x-d*s*.9,y+s*.25);
          c.quadraticCurveTo(x-d*s*.5,y+s*.55,x,y+s*.35);
          c.quadraticCurveTo(x+d*s*.5,y+s*.55,x+d*s*.9,y+s*.25);
          c.quadraticCurveTo(x+d*s*1.3,y+s*.2,x+d*s*1.9,y-s*(.2+flap*.8));
          c.quadraticCurveTo(x+d*s*.8,y-s*(1.1+flap),x,y);c.fill();
          c.beginPath();c.arc(x,y-s*.15,s*.32,0,6.283);c.fill();
        }
      }
    },
    'hol-newyear':{
      // Hong Kong-style harbour at night: Victoria Peak, a dense skyline of tall towers with lit windows,
      // and a harbour with reflections, a ferry and junk. Fireworks launch from a barge and the rooftops,
      // burst high over the water and glow in its reflection. Static scenery is painted once offscreen.
      behind:true,
      init(){
        const dpr=Math.min(window.devicePixelRatio||1,2);
        let seed=20260101;const sr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
        const wh=this.wh=Math.max(70,Math.min(150,H*.13)),wy=this.wy=H-wh;      // waterline
        const maxH=Math.min(H*.42,430),u=this.u=Math.max(.8,Math.min(1.3,H/800));
        const off=this.off=document.createElement('canvas');off.width=Math.round(W*dpr);off.height=Math.round(H*dpr);
        const o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
        // horizon glow
        let g=o.createLinearGradient(0,wy-maxH*1.3,0,wy);g.addColorStop(0,'rgba(60,40,120,0)');g.addColorStop(1,'rgba(120,70,150,.38)');
        o.fillStyle=g;o.fillRect(0,wy-maxH*1.3,W,maxH*1.3);
        // Victoria Peak ridge
        o.fillStyle='rgba(20,26,56,.95)';o.beginPath();o.moveTo(0,wy);
        for(let x=0;x<=W+10;x+=10){const k=x/W;o.lineTo(x,wy-maxH*(.34+.30*Math.exp(-Math.pow((k-.22)/.2,2))+.06*Math.sin(k*9)));}
        o.lineTo(W+10,wy);o.closePath();o.fill();
        this.wins=[];
        const tower=(x,w,h,col,top,lit)=>{
          o.fillStyle=col;o.fillRect(x,wy-h,w,h);
          if(top==='spire'){o.fillRect(x+w/2-1,wy-h-h*.16,2,h*.16);o.fillRect(x+w*.25,wy-h-5,w*.5,5);}
          else if(top==='pyramid'){o.beginPath();o.moveTo(x,wy-h);o.lineTo(x+w/2,wy-h-w*.7);o.lineTo(x+w,wy-h);o.fill();o.fillRect(x+w/2-1,wy-h-w*.7-14,2,14);}
          else if(top==='step'){o.fillRect(x+w*.15,wy-h-8,w*.7,8);o.fillRect(x+w*.3,wy-h-14,w*.4,6);}
          else if(top==='round'){o.beginPath();o.ellipse(x+w/2,wy-h,w/2,w*.22,0,Math.PI,0);o.fill();}
          else if(top==='mast'){o.fillRect(x+w/2-1,wy-h-h*.12,2,h*.12);}
          if(lit){const cw=3.4,ch=5.2;
            for(let yy=wy-h+8;yy<wy-6;yy+=ch*2)for(let xx=x+3;xx<x+w-cw-2;xx+=cw*2){
              const r=sr();if(r<.52){o.fillStyle=r<.07?'rgba(255,228,150,.95)':r<.2?'rgba(190,225,255,.70)':'rgba(255,214,130,.60)';o.fillRect(xx,yy,cw,ch);
                if(r<.03)this.wins.push({x:xx,y:yy,w:cw,h:ch,ph:sr()*6.28});}}}
          if(lit&&top==='pyramid'){o.fillStyle='rgba(255,90,70,.9)';o.fillRect(x+w/2-1,wy-h-w*.7-14,2,3);}
        };
        const tops=['flat','flat','spire','step','round','mast','pyramid','flat'];
        // far layer (hazy, shorter), then main skyline
        for(let x=-10;x<W+10;){const w=(14+sr()*26)*u,h=maxH*(.18+sr()*.30);tower(x,w,h,'rgba(34,40,84,.88)',tops[(sr()*8)|0],false);x+=w*(.55+sr()*.35);}
        let landmark=0;
        for(let x=-6;x<W+10;){
          const w=(16+sr()*30)*u;let h=maxH*(.22+Math.pow(sr(),1.6)*.78);let top=tops[(sr()*8)|0];
          if(landmark<3&&x>W*(.25+landmark*.25)){h=maxH*(.92+sr()*.1);top=landmark===0?'spire':landmark===1?'pyramid':'mast';landmark++;}
          tower(x,w,h,sr()<.5?'rgba(14,19,46,.97)':'rgba(18,24,56,.97)',top,true);
          x+=w*(.80+sr()*.20);
        }
        // quay
        o.fillStyle='rgba(8,11,28,1)';o.fillRect(0,wy-3,W,3);
        for(let x=0;x<W;x+=26){o.fillStyle='rgba(255,230,160,.8)';o.fillRect(x,wy-6,2,3);}
        // reflections: mirror the skyline into the water, fade with depth
        o.save();o.beginPath();o.rect(0,wy,W,wh);o.clip();o.translate(0,wy*2);o.scale(1,-1);o.globalAlpha=.30;o.drawImage(off,0,0,W,H);o.restore();
        g=o.createLinearGradient(0,wy,0,H);g.addColorStop(0,'rgba(8,14,40,.55)');g.addColorStop(1,'rgba(4,8,24,.95)');
        o.fillStyle=g;o.fillRect(0,wy+1,W,wh);
        this.rk=[];this.pt=[];this.fl=[];this.next=.3;this.fin=18+Math.random()*10;
        this.sk=Array.from({length:70},()=>({x:rnd(0,W),y:rnd(0,wy-maxH*.6),r:rnd(.5,1.3),ph:rnd(0,6.28),sp:rnd(1,3)}));
        this.bt=[{k:'ferry',x:rnd(0,W),y:wy+wh*.38,v:22,s:1},{k:'junk',x:rnd(0,W),y:wy+wh*.66,v:-13,s:1.25}];
        this.cf=Array.from({length:40},()=>({x:rnd(0,W),y:rnd(0,H),w:rnd(4,8),h:rnd(2,4),vy:rnd(25,60),rot:rnd(0,6.28),vr:rnd(-4,4),sw:rnd(.5,1.5),ph:rnd(0,6.28),c:pick(['#fbbf24','#f472b6','#60a5fa','#34d399','#fff'])}));
      },
      colors:['#fbbf24','#f472b6','#60a5fa','#34d399','#f87171','#c084fc','#fde68a','#fb923c'],
      launch(x,fromBarge){
        const wy=this.wy;
        this.rk.push({x:x==null?rnd(W*.06,W*.94):x,y:fromBarge?wy+this.wh*.5:wy-rnd(0,40),ty:rnd(H*.07,Math.min(H*.5,wy-80)),vx:rnd(-12,12),c:pick(this.colors),k:pick(['peony','peony','ring','willow','double','palm','heart'])});
      },
      emit(o){if(this.pt.length<1400)this.pt.push(o);},
      burst(r){
        const x=r.x,y=r.y,c=r.c,E=this.colors;this.fl.push({x,y,l:1,c});
        const ball=(n,lo,hi,col,o)=>{for(let j=0;j<n;j++){const a=rnd(0,6.283),v=rnd(lo,hi);this.emit(Object.assign({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,dr:1.2,g:60,l:rnd(1.4,1.9),m:1.9,r:2.2,c:col},o||{}));}};
        const ring=(n,sp,col,o)=>{for(let j=0;j<n;j++){const a=j/n*6.283;this.emit(Object.assign({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dr:1.2,g:60,l:1.7,m:1.7,r:2.4,c:col},o||{}));}};
        if(r.k==='ring'){ring(54,190,c);ring(34,105,pick(E));}
        else if(r.k==='willow')ball(90,60,170,'#fcd34d',{dr:.85,g:85,l:3.2,m:3.2,tw:1});
        else if(r.k==='double'){ball(100,120,240,c);ball(60,40,110,pick(E));}
        else if(r.k==='palm'){for(let s=0;s<7;s++){const a=s/7*6.283+rnd(-.1,.1);for(let j=0;j<14;j++){const v=120+j*12;this.emit({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,dr:1.5,g:70,l:rnd(2,2.6),m:2.6,r:2.2,c:j>9?'#fff':c});}}}
        else if(r.k==='heart'){for(let j=0;j<60;j++){const a=j/60*6.283,hx=16*Math.pow(Math.sin(a),3),hy=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));this.emit({x,y,vx:hx*9.5,vy:hy*9.5,dr:1.6,g:40,l:1.9,m:1.9,r:2.4,c:'#f472b6'});}}
        else ball(140,110,250,c);
      },
      step(dt,t){
        this.next-=dt;
        if(this.next<=0){this.next=rnd(.22,.65);this.launch(null,Math.random()<.5);}
        this.fin-=dt;
        if(this.fin<=0){this.fin=rnd(22,34);for(let i=0;i<7;i++)setTimeout(()=>{if(this.rk)this.launch(W*(.12+i*.12),i%2===0);},i*160);}
        for(let i=this.rk.length-1;i>=0;i--){const r=this.rk[i];r.y-=380*dt;r.x+=r.vx*dt;if(r.y<=r.ty){this.burst(r);this.rk.splice(i,1);}}
        for(let i=this.pt.length-1;i>=0;i--){const p=this.pt[i];p.vy+=p.g*dt;p.vx*=1-p.dr*dt;p.vy*=1-p.dr*dt*.6;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.l<=0||p.y>this.wy+this.wh)this.pt.splice(i,1);}
        for(let i=this.fl.length-1;i>=0;i--){this.fl[i].l-=dt*2.4;if(this.fl[i].l<=0)this.fl.splice(i,1);}
        for(const f of this.cf){f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*20*dt;f.rot+=f.vr*dt;if(f.y>H+8){f.y=-8;f.x=rnd(0,W);}}
        for(const b of this.bt){b.x+=b.v*dt;if(b.x>W+80)b.x=-80;if(b.x<-80)b.x=W+80;}
      },
      draw(c,t){
        const wy=this.wy,wh=this.wh;
        for(const s of this.sk){c.globalAlpha=.25+.6*Math.abs(Math.sin(t*s.sp+s.ph));c.fillStyle='#fff';c.fillRect(s.x,s.y,s.r*1.6,s.r*1.6);}
        c.globalAlpha=1;c.drawImage(this.off,0,0,W,H);
        for(const w of this.wins){c.globalAlpha=.35+.65*Math.abs(Math.sin(t*1.3+w.ph));c.fillStyle='#fff3c4';c.fillRect(w.x,w.y,w.w,w.h);}
        // boats
        for(const b of this.bt){
          c.save();c.translate(b.x,b.y);c.scale(b.v<0?-b.s:b.s,b.s);c.globalAlpha=1;c.fillStyle='#2a3566';c.strokeStyle='rgba(255,226,154,.55)';c.lineWidth=1;
          if(b.k==='ferry'){c.beginPath();c.moveTo(-26,0);c.lineTo(26,0);c.lineTo(20,8);c.lineTo(-22,8);c.closePath();c.fill();c.stroke();c.fillRect(-16,-8,30,8);c.fillRect(-8,-13,14,5);
            c.fillStyle='#ffe29a';for(let k=-14;k<14;k+=5)c.fillRect(k,-6,3,3);}
          else{c.beginPath();c.moveTo(-22,2);c.lineTo(22,0);c.lineTo(15,9);c.lineTo(-17,9);c.closePath();c.fill();c.stroke();c.fillRect(-1,-30,2,30);
            c.fillStyle='#b91c1c';c.beginPath();c.moveTo(1,-29);c.lineTo(20,-20);c.lineTo(17,-4);c.lineTo(1,-4);c.closePath();c.fill();}
          c.restore();
          c.globalAlpha=.35;c.fillStyle='#ffe29a';c.fillRect(b.x-18,b.y+14,36,1.5);
        }
        // water shimmer
        c.globalAlpha=.14;c.fillStyle='#bcd2ff';
        for(let i=0;i<42;i++){const yy=wy+6+((i*37)%(wh-8)),xx=((i*173+t*(8+i%5*3))%(W+80))-40;c.fillRect(xx,yy,18+(i%4)*14,1);}
        // fireworks
        c.save();c.globalCompositeOperation='lighter';
        for(const f of this.fl){
          const gr=c.createRadialGradient(f.x,f.y,2,f.x,f.y,170);gr.addColorStop(0,'rgba(255,230,170,'+(.5*f.l)+')');gr.addColorStop(1,'rgba(255,200,120,0)');
          c.globalAlpha=1;c.fillStyle=gr;c.beginPath();c.arc(f.x,f.y,170,0,6.283);c.fill();
          // reflected glow on the water
          const ry=wy+(wy-f.y)*.18,g2=c.createRadialGradient(f.x,ry,2,f.x,ry,110);g2.addColorStop(0,f.c+'');g2.globalAlpha=1;
          c.globalAlpha=.35*f.l;c.fillStyle=f.c;c.save();c.beginPath();c.rect(0,wy,W,wh);c.clip();c.beginPath();c.ellipse(f.x,ry,110,14,0,0,6.283);c.fill();c.restore();
        }
        for(const r of this.rk){c.globalAlpha=1;c.fillStyle='#ffe9b0';c.fillRect(r.x-1,r.y,2,14);c.globalAlpha=.4;c.fillRect(r.x-.5,r.y+14,1,24);}
        for(const p of this.pt){
          const a=Math.max(0,p.l/p.m);c.globalAlpha=a*(p.tw?.6+.4*Math.sin(t*40+p.x):1);c.strokeStyle=p.c;c.fillStyle=p.c;
          c.lineWidth=p.r*.9;c.lineCap='round';c.beginPath();c.moveTo(p.x-p.vx*.045,p.y-p.vy*.045);c.lineTo(p.x,p.y);c.stroke();
          c.beginPath();c.arc(p.x,p.y,p.r*.8,0,6.283);c.fill();
          if(p.y<wy-4){const ry=wy+(wy-p.y)*.18;if(ry<H){c.globalAlpha=a*.22;c.fillRect(p.x-1,ry,2,1.5);}}
        }
        c.restore();
        for(const f of this.cf){c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=.6;c.fillStyle=f.c;c.fillRect(-f.w/2,-f.h/2,f.w,f.h);c.restore();}
      }
    },
    'hol-cny':{
      // Rising lanterns + falling red envelopes, two dancing dragons chasing flaming pearls,
      // and a near-constant barrage of fireworks (peony, ring, willow, double, crackle).
      init(){
        this.ln=Array.from({length:Math.max(5,Math.round(W/170))},()=>this.lantern(true));
        this.sp=Array.from({length:60},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2.4),ph:rnd(0,6.28),sp:rnd(1,3)}));
        this.ev=Array.from({length:Math.max(4,Math.round(W/260))},()=>this.envP(true));
        this.rk=[];this.pt=[];this.fl=[];this.fwT=.5;
        const t0=performance.now()/1000,sc=Math.max(.7,Math.min(1.25,Math.min(W,H*1.6)/1100));
        const mk=k=>({k,s:sc*(k?.92:1),ph:k*2.1,ax:W*(k?.4:.36),ay:H*(k?.3:.27),cx:W*.5,cy:H*(k?.5:.52),fx:k?.30:.40,fy:k?.49:.80,px:k?1.3:0,py:k?.4:.7,
          pal:k?PAL1:PAL0,trail:[],S:[],flip:1,n:Math.round(Math.min(700,Math.max(380,W*.42))/(5*sc))});
        this.dr=[mk(0),mk(1)];
        for(const d of this.dr){for(let j=0;j<420;j++)d.trail.push(this.dpos(d,t0-j*.012));this.sample(d);}
      },
      lantern(first){return{x:rnd(0,W),y:first?rnd(0,H):H+60,s:rnd(.7,1.3),vy:rnd(14,30),ph:rnd(0,6.28),a:rnd(.7,.95)};},
      envP(first){return{x:rnd(0,W),y:first?rnd(0,H):rnd(-30,-10),s:rnd(8,13),vy:rnd(28,58),sw:rnd(.5,1.2),ph:rnd(0,6.28),rot:rnd(-.5,.5),vr:rnd(-.8,.8)};},
      emit(o){if(this.pt.length<900)this.pt.push(o);},
      dpos(d,t){return{x:d.cx+d.ax*Math.sin(d.fx*t+d.px)+Math.sin(t*1.9+d.ph)*26,y:d.cy+d.ay*Math.sin(d.fy*t+d.py)+Math.cos(t*2.3+d.ph)*20};},
      sample(d){          // evenly spaced points along the dragon's trail; S[0] is the head
        const T=d.trail,sp=5*d.s,S=[T[0]];let acc=0,next=sp,i=1;
        for(;i<T.length&&S.length<d.n;i++){
          const dx=T[i].x-T[i-1].x,dy=T[i].y-T[i-1].y,seg=Math.hypot(dx,dy);if(!seg)continue;
          const a2=acc+seg;
          while(next<=a2&&S.length<d.n){const f=(next-acc)/seg;S.push({x:T[i-1].x+dx*f,y:T[i-1].y+dy*f});next+=sp;}
          acc=a2;
        }
        d.S=S;if(S.length>=d.n&&i+2<T.length)T.length=i+2;
      },
      burst(r){
        const x=r.x,y=r.y,c=r.c;
        this.fl.push({x,y,l:1});
        const ring=(n,sp,col,o)=>{for(let j=0;j<n;j++){const a=j/n*6.283;this.emit(Object.assign({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dr:1.2,g:55,l:1.7,m:1.7,r:2.7,c:col,tr:1},o||{}));}};
        const ball=(n,lo,hi,col,o)=>{for(let j=0;j<n;j++){const a=rnd(0,6.283),v=rnd(lo,hi);this.emit(Object.assign({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,dr:1.2,g:55,l:rnd(1.4,1.9),m:1.9,r:2.7,c:col,tr:1},o||{}));}};
        if(r.k==='ring'){ring(48,170,c);ring(30,95,pick(FC));}
        else if(r.k==='willow')ball(70,60,150,'#fbbf24',{dr:.9,g:75,l:3,m:3,tw:1});
        else if(r.k==='double'){ball(90,110,210,c);ball(50,40,100,pick(FC));}
        else if(r.k==='crackle')ball(90,110,220,c,{cr:1});
        else ball(120,120,230,c);
      },
      step(dt,t){
        for(let i=0;i<this.ln.length;i++){const l=this.ln[i];l.y-=l.vy*dt;if(l.y<-80)this.ln[i]=this.lantern(false);}
        for(const e of this.ev){e.y+=e.vy*dt;e.x+=Math.sin(t*e.sw+e.ph)*20*dt;e.rot+=e.vr*dt;if(e.y>H+20)Object.assign(e,this.envP(false));}
        // dancing dragons
        for(const d of this.dr){
          const h=this.dpos(d,t),T=d.trail,l=T[0],dist=l?Math.hypot(h.x-l.x,h.y-l.y):0;
          if(!l||dist>160){T.length=0;T.push(h);}else if(dist>=2.5)T.unshift(h);
          this.sample(d);
          const S=d.S;
          if(S.length>5){const a=Math.atan2(S[0].y-S[4].y,S[0].x-S[4].x);d.flip+=((Math.cos(a)<0?-1:1)-d.flip)*Math.min(1,5*dt);}
          if(S.length&&Math.random()<dt*24){const p=S[(Math.random()*S.length)|0];this.emit({x:p.x+rnd(-8,8),y:p.y+rnd(-8,8),vx:rnd(-30,30),vy:rnd(-30,30),g:25,l:.8,m:.8,r:rnd(1.2,2.4),c:pick(FC),tw:1});}
        }
        // fireworks
        this.fwT-=dt;
        if(this.fwT<=0){
          this.fwT=rnd(.45,1.2);
          for(let k=Math.random()<.3?2:1;k>0;k--)this.rk.push({x:rnd(W*.08,W*.92),y:H+6,ty:rnd(H*.12,H*.5),vy:rnd(380,480),c:pick(FC),k:pick(['peony','peony','ring','willow','double','crackle'])});
        }
        for(let i=this.rk.length-1;i>=0;i--){
          const r=this.rk[i];r.y-=r.vy*dt;
          this.emit({x:r.x+rnd(-2,2),y:r.y+6,vx:rnd(-10,10),vy:rnd(20,60),l:.45,m:.45,r:1.6,c:'#fde68a'});
          if(r.y<=r.ty){this.burst(r);this.rk.splice(i,1);}
        }
        for(let i=this.fl.length-1;i>=0;i--){this.fl[i].l-=dt*3;if(this.fl[i].l<=0)this.fl.splice(i,1);}
        for(let i=this.pt.length-1;i>=0;i--){
          const p=this.pt[i];
          if(p.dr){const f=Math.max(0,1-p.dr*dt);p.vx*=f;p.vy*=f;}
          if(p.g)p.vy+=p.g*dt;
          p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;
          if(p.l<=0){
            if(p.cr)for(let k=0;k<3;k++)this.emit({x:p.x,y:p.y,vx:rnd(-50,50),vy:rnd(-50,50),l:.35,m:.35,r:1.4,c:'#fff7ed'});
            this.pt.splice(i,1);
          }
        }
      },
      draw(c,t){
        for(const s of this.sp){c.globalAlpha=.25+.75*Math.abs(Math.sin(t*s.sp+s.ph));c.fillStyle='#fde68a';c.beginPath();c.arc(s.x,s.y,s.r,0,6.283);c.fill();}
        // fireworks (additive glow), under everything else
        c.save();c.globalCompositeOperation='lighter';
        for(const f of this.fl){const g=c.createRadialGradient(f.x,f.y,2,f.x,f.y,120);g.addColorStop(0,'rgba(255,230,160,'+(.45*f.l)+')');g.addColorStop(1,'rgba(255,200,100,0)');c.globalAlpha=1;c.fillStyle=g;c.beginPath();c.arc(f.x,f.y,120,0,6.283);c.fill();}
        for(const p of this.pt){
          const a=Math.max(0,p.l/p.m);c.globalAlpha=a*(p.tw?.6+.4*Math.sin(t*40+p.x):1);
          if(p.tr){c.strokeStyle=p.c;c.lineWidth=p.r;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);c.stroke();}
          c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r*(.6+.4*a),0,6.283);c.fill();
        }
        c.restore();
        for(const r of this.rk){c.globalAlpha=1;c.fillStyle=r.c;c.fillRect(r.x-1,r.y,2,12);}
        // lanterns
        for(const l of this.ln){
          const x=l.x+Math.sin(t*.8+l.ph)*10,y=l.y,w=26*l.s,h=34*l.s;
          c.globalAlpha=l.a;
          c.fillStyle='#fbbf24';c.fillRect(x-w*.22,y-h*.62,w*.44,h*.1);c.fillRect(x-w*.22,y+h*.52,w*.44,h*.1);
          const g=c.createRadialGradient(x,y,2,x,y,w);g.addColorStop(0,'#ef4444');g.addColorStop(1,'#991b1b');
          c.fillStyle=g;c.beginPath();c.ellipse(x,y,w*.55,h*.52,0,0,6.283);c.fill();
          c.strokeStyle='rgba(251,191,36,.55)';c.lineWidth=1;c.beginPath();c.ellipse(x,y,w*.2,h*.52,0,0,6.283);c.stroke();
          c.strokeStyle='#fbbf24';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y+h*.62);c.lineTo(x,y+h*.62+14*l.s);c.stroke();
          c.fillStyle='#fbbf24';c.beginPath();c.arc(x,y+h*.62+16*l.s,2.2*l.s,0,6.283);c.fill();
        }
        // falling red envelopes
        for(const e of this.ev){
          c.save();c.translate(e.x,e.y);c.rotate(e.rot);c.globalAlpha=.92;const s=e.s;
          c.fillStyle='#dc2626';c.fillRect(-s*.6,-s*.8,s*1.2,s*1.6);
          c.fillStyle='#b91c1c';c.beginPath();c.moveTo(-s*.6,-s*.8);c.lineTo(s*.6,-s*.8);c.lineTo(0,-s*.1);c.closePath();c.fill();
          c.fillStyle='#fbbf24';c.beginPath();c.arc(0,-s*.1,s*.24,0,6.283);c.fill();
          c.strokeStyle='#fbbf24';c.lineWidth=1;c.strokeRect(-s*.6,-s*.8,s*1.2,s*1.6);c.restore();
        }
        // dancing dragons chasing their pearls
        // Draw dragons + pearls onto an offscreen layer, then composite once at low alpha so
        // overlapping body segments stay uniform (no dark seams) and the tiles show through.
        const dpr=cv?cv.width/W:1;
        if(!this.dl||this.dl.width!==cv.width||this.dl.height!==cv.height){
          this.dl=document.createElement('canvas');this.dl.width=cv.width;this.dl.height=cv.height;this.dc=this.dl.getContext('2d');
        }
        const o=this.dc;o.setTransform(dpr,0,0,dpr,0,0);o.clearRect(0,0,W,H);
        for(const d of this.dr)drawDragon(o,d,t);
        for(const d of this.dr)drawPearl(o,d,t);
        c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=.32;c.drawImage(this.dl,0,0);c.restore();
      }
    },
    'hol-valentine':{
      // Hearts + rose petals + balloons, with Cupids that stop, take aim and shoot the hearts,
      // love-dove pairs towing a ribbon of hearts, and the odd heart-shaped firework.
      init(){
        this.h=Array.from({length:Math.round(Math.min(46,W*H/26000))},()=>this.heartP(true));
        this.tw=Array.from({length:Math.round(Math.min(34,W*H/42000))},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(2,5),ph:rnd(0,6.28),sp:rnd(1.2,3.2),c:pick(['#fff','#ffe4ef','#fde68a'])}));
        this.rp=Array.from({length:Math.round(Math.min(26,W*H/38000))},()=>this.petalP(true));
        this.bl=Array.from({length:Math.max(3,Math.min(7,Math.round(W/240)))},()=>this.balloonP(true));
        this.cu=Array.from({length:W>1500?3:2},(_,i)=>this.cupidP(i===0));
        this.ar=[];this.pt=[];this.pk=[];this.rg=[];this.rk=[];
        this.dv=null;this.dvT=5;this.fwT=4;
      },
      heartP(first){return{x:rnd(0,W),y:first?rnd(0,H):H+30,s:rnd(7,20),vy:rnd(20,55),ph:rnd(0,6.28),sw:rnd(.5,1.3),a:rnd(.35,.8),c:pick(VC),tg:false};},
      petalP(first){return{x:rnd(0,W),y:first?rnd(0,H):rnd(-30,-8),s:rnd(5,10),vy:rnd(24,52),sw:rnd(.5,1.3),ph:rnd(0,6.28),rot:rnd(0,6.28),vr:rnd(-2,2),fp:rnd(0,6.28),fs:rnd(1.5,3.5),a:rnd(.6,.9),c:pick(['#be123c','#e11d48','#fb7185','#f43f5e'])};},
      balloonP(first){return{x:rnd(W*.04,W*.96),y:first?rnd(H*.2,H+60):H+60+rnd(0,140),s:rnd(15,24),vy:rnd(26,46),ph:rnd(0,6.28),sw:rnd(.5,1),c:pick(['#f43f5e','#ec4899','#ef4444','#fb7185','#d946ef']),a:.8};},
      cupidP(start){
        const dir=start?1:(Math.random()<.5?1:-1),by=start?H*.3:rnd(H*.15,H*.62);
        return{x:start?W*.15:(dir>0?-70:W+70),by,y:by,dir,s:rnd(1.05,1.4),vx:rnd(70,105),ph:rnd(0,6.28),state:'fly',cd:start?1.2:rnd(1.5,4),at:0,pull:0,aim:.12,nock:false,fired:false,tgt:null};
      },
      emit(o){if(this.pt.length<420)this.pt.push(o);},
      dust(x,y,n,cols){for(let k=0;k<n;k++)this.emit({k:'s',x:x+rnd(-4,4),y:y+rnd(-4,4),vx:rnd(-30,30),vy:rnd(-30,30),l:.6,m:.6,r:rnd(1.6,3.4),c:pick(cols||['#fde68a','#fbcfe8','#fff'])});},
      pickTarget(q){
        let best=null,bd=1e9;
        for(const p of this.h){
          if(p.tg||p.s<10||p.y<70||p.y>H-70||p.x<50||p.x>W-50)continue;
          const dx=(p.x-q.x)*q.dir;if(dx<140||dx>W*.7)continue;
          const d=dx+Math.abs(p.y-q.y)*.6;if(d<bd){bd=d;best=p;}
        }
        return best;
      },
      fire(q){
        const a=q.aim,sx=q.x+q.dir*q.s*3,sy=q.y-q.s*5;
        const ox=20*Math.cos(a)+Math.sin(a),oy=20*Math.sin(a)-Math.cos(a);
        const x=sx+q.dir*q.s*ox,y=sy+q.s*oy;
        this.ar.push({x,y,vx:q.dir*Math.cos(a)*560,vy:Math.sin(a)*560,tgt:q.tgt,l:3});
        this.dust(x,y,7,['#fde68a','#fff']);
        q.fired=true;q.nock=false;
      },
      hit(a){
        const T=a.tgt,i=this.h.indexOf(T);
        if(i>=0)this.h[i]=this.heartP(false);
        this.pk.push({x:T.x,y:T.y,s:T.s*1.1,c:T.c,ang:Math.atan2(a.vy,a.vx),l:2.6,m:2.6,ph:rnd(0,6.28)});
        this.rg.push({x:T.x,y:T.y,r:T.s*.6,l:1});
        for(let k=0;k<14;k++){const an=rnd(0,6.283),v=rnd(50,170);this.emit({k:'h',x:T.x,y:T.y,vx:Math.cos(an)*v,vy:Math.sin(an)*v-30,g:90,l:rnd(.8,1.5),m:1.5,r:rnd(3.5,7),c:pick(VC)});}
        this.dust(T.x,T.y,12);
      },
      burst(x,y,c){
        const n=40;
        for(let k=0;k<n;k++){const u=k/n*6.283,hx=16*Math.pow(Math.sin(u),3),hy=-(13*Math.cos(u)-5*Math.cos(2*u)-2*Math.cos(3*u)-Math.cos(4*u));
          this.emit({k:'c',x,y,vx:hx*8,vy:hy*8,dr:1.3,g:30,l:1.8,m:1.8,r:2.4,c});
          if(k%2)this.emit({k:'c',x,y,vx:hx*4.5,vy:hy*4.5,dr:1.3,g:30,l:1.6,m:1.6,r:1.8,c:'#fff'});}
        for(let k=0;k<8;k++){const an=rnd(0,6.283),v=rnd(30,90);this.emit({k:'h',x,y,vx:Math.cos(an)*v,vy:Math.sin(an)*v,g:40,l:rnd(1,1.7),m:1.7,r:rnd(3,5),c:pick(VC)});}
      },
      step(dt,t){
        for(let i=0;i<this.h.length;i++){const p=this.h[i];p.y-=p.vy*dt;p.x+=Math.sin(t*p.sw+p.ph)*14*dt;if(p.y<-30){this.h[i]=this.heartP(false);}}
        for(const f of this.rp){f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*22*dt;f.rot+=f.vr*dt;f.fp+=f.fs*dt;if(f.y>H+12)Object.assign(f,this.petalP(false));}
        for(let i=0;i<this.bl.length;i++){const b=this.bl[i];b.y-=b.vy*dt;if(b.y<-b.s*2)this.bl[i]=this.balloonP(false);}
        // Cupids
        for(let i=0;i<this.cu.length;i++){
          const q=this.cu[i];
          q.x+=q.dir*q.vx*(q.state==='aim'?.18:1)*dt;
          q.y=q.by+Math.sin(t*1.7+q.ph)*(q.state==='aim'?5:20);
          if(q.state==='fly'){
            q.pull=Math.max(0,q.pull-dt*5);q.aim+=(.12-q.aim)*Math.min(1,6*dt);
            if(Math.random()<dt*26)this.emit({k:'s',x:q.x-q.dir*q.s*12+rnd(-4,4),y:q.y+rnd(-6,10),vx:-q.dir*rnd(5,20),vy:rnd(5,25),l:.9,m:.9,r:rnd(1.6,3.4),c:pick(['#fde68a','#fbcfe8','#fff'])});
            q.cd-=dt;
            if(q.cd<=0&&q.x>60&&q.x<W-60){q.tgt=this.pickTarget(q);if(q.tgt)q.tgt.tg=true;q.state='aim';q.at=0;q.nock=true;q.fired=false;}
          }else{
            q.at+=dt;
            const sx=q.x+q.dir*q.s*3,sy=q.y-q.s*5,tx=q.tgt?q.tgt.x:q.x+q.dir*420,ty=q.tgt?q.tgt.y:q.y-40;
            let a=Math.atan2(ty-sy,(tx-sx)*q.dir);a=Math.max(-.85,Math.min(.85,a));
            q.aim+=(a-q.aim)*Math.min(1,10*dt);
            if(!q.fired){q.pull=Math.min(1,q.at/.7);if(q.at>=.8){this.fire(q);}}
            else q.pull=Math.max(0,q.pull-dt*8);
            if(q.at>=1.2){q.state='fly';q.cd=rnd(2.5,5.5);q.tgt=null;q.nock=false;}
          }
          if((q.dir>0&&q.x>W+90)||(q.dir<0&&q.x<-90)){if(q.tgt&&!q.fired)q.tgt.tg=false;const n=this.cupidP(false);n.cd=rnd(1,3);this.cu[i]=n;}
        }
        // arrows (soft-homing so they land on their heart)
        for(let i=this.ar.length-1;i>=0;i--){
          const a=this.ar[i];
          if(a.tgt&&this.h.indexOf(a.tgt)<0)a.tgt=null;
          if(a.tgt){
            const dx=a.tgt.x-a.x,dy=a.tgt.y-a.y,d=Math.hypot(dx,dy)||1,sp=Math.hypot(a.vx,a.vy),k=Math.min(1,7*dt);
            a.vx+=(dx/d*sp-a.vx)*k;a.vy+=(dy/d*sp-a.vy)*k;
            if(d<a.tgt.s*.9+8){this.hit(a);this.ar.splice(i,1);continue;}
          }
          a.x+=a.vx*dt;a.y+=a.vy*dt;a.l-=dt;
          this.emit({k:'s',x:a.x-a.vx*.02,y:a.y-a.vy*.02,vx:rnd(-12,12),vy:rnd(-12,12),l:.55,m:.55,r:rnd(1.4,3),c:pick(['#fde68a','#fbcfe8','#fff'])});
          if(a.l<=0||a.x<-60||a.x>W+60||a.y<-60||a.y>H+60){if(a.tgt)a.tgt.tg=false;this.ar.splice(i,1);}
        }
        for(let i=this.pk.length-1;i>=0;i--){const p=this.pk[i];p.l-=dt;p.y-=22*dt;p.x+=Math.sin(t*1.4+p.ph)*8*dt;if(Math.random()<dt*6)this.dust(p.x,p.y,1);if(p.l<=0)this.pk.splice(i,1);}
        for(let i=this.rg.length-1;i>=0;i--){const r=this.rg[i];r.r+=140*dt;r.l-=dt*1.6;if(r.l<=0)this.rg.splice(i,1);}
        // love doves towing a ribbon of hearts
        this.dvT-=dt;
        if(!this.dv&&this.dvT<=0){const dir=Math.random()<.5?1:-1;this.dv={x:dir>0?-130:W+130,by:rnd(H*.14,H*.4),y:0,dir,vx:rnd(60,85),ph:rnd(0,6.28),s:rnd(1,1.25)};}
        if(this.dv){const d=this.dv;d.x+=d.dir*d.vx*dt;d.y=d.by+Math.sin(t*1.1+d.ph)*14;if((d.dir>0&&d.x>W+260)||(d.dir<0&&d.x<-260)){this.dv=null;this.dvT=rnd(14,24);}}
        // heart-shaped fireworks
        this.fwT-=dt;
        if(this.fwT<=0){this.fwT=rnd(6,11);this.rk.push({x:rnd(W*.2,W*.85),y:H+8,ty:rnd(H*.2,H*.45),c:pick(VC)});}
        for(let i=this.rk.length-1;i>=0;i--){const r=this.rk[i];r.y-=360*dt;this.emit({k:'s',x:r.x+rnd(-2,2),y:r.y+6,vx:rnd(-8,8),vy:rnd(10,30),l:.5,m:.5,r:rnd(1.2,2.4),c:'#fde68a'});if(r.y<=r.ty){this.burst(r.x,r.y,r.c);this.rk.splice(i,1);}}
        // particles
        for(let i=this.pt.length-1;i>=0;i--){
          const p=this.pt[i];
          if(p.dr){const f=Math.max(0,1-p.dr*dt);p.vx*=f;p.vy*=f;}
          if(p.g)p.vy+=p.g*dt;
          p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;
          if(p.l<=0)this.pt.splice(i,1);
        }
      },
      draw(c,t){
        for(const w of this.tw){c.globalAlpha=.15+.85*Math.abs(Math.sin(t*w.sp+w.ph));c.fillStyle=w.c;spark4(c,w.x,w.y,w.r);}
        // balloons on strings
        for(const b of this.bl){
          const x=b.x+Math.sin(t*b.sw+b.ph)*12,y=b.y,ky=y+b.s*.36;
          c.globalAlpha=b.a*.7;c.strokeStyle='#fecdd3';c.lineWidth=1;
          c.beginPath();c.moveTo(x,ky+4);c.bezierCurveTo(x-8,ky+30,x+9,ky+52,x+Math.sin(t*1.3+b.ph)*5,ky+80);c.stroke();
          c.globalAlpha=b.a;c.fillStyle=b.c;heart(c,x,y,b.s);
          c.beginPath();c.moveTo(x,ky);c.lineTo(x-3,ky+5);c.lineTo(x+3,ky+5);c.fill();
          c.globalAlpha=b.a*.4;c.fillStyle='#fff';c.beginPath();c.ellipse(x-b.s*.38,y-b.s*.4,b.s*.2,b.s*.11,-.6,0,6.283);c.fill();
        }
        // rose petals
        for(const f of this.rp){
          c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.scale(.25+.75*Math.abs(Math.cos(f.fp)),1);
          c.globalAlpha=f.a;c.fillStyle=f.c;const s=f.s;
          c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(s*.95,-s*.2,0,s);c.quadraticCurveTo(-s*.95,-s*.2,0,-s);c.fill();c.restore();
        }
        // hearts (pulsing; the one a Cupid is aiming at gets a target ring)
        for(const p of this.h){
          c.globalAlpha=p.a;c.fillStyle=p.c;heart(c,p.x,p.y,p.s*(1+.07*Math.sin(t*4+p.ph)));
          if(p.tg){c.globalAlpha=.6;c.strokeStyle='#fff';c.lineWidth=1.2;c.beginPath();c.arc(p.x,p.y-p.s*.1,p.s*1.2+3*Math.sin(t*10),0,6.283);c.stroke();}
        }
        for(const r of this.rg){c.globalAlpha=Math.max(0,r.l)*.8;c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(r.x,r.y,r.r,0,6.283);c.stroke();}
        // doves + ribbon of hearts
        if(this.dv){
          const d=this.dv,dir=d.dir,s=d.s;
          const rp=u=>[d.x-dir*(14*s+u*170),d.y+4*s+Math.sin(t*4-u*6+d.ph)*8*u];
          c.globalAlpha=.9;c.strokeStyle='#fda4af';c.lineWidth=2;c.beginPath();
          for(let k=0;k<=16;k++){const p=rp(k/16);if(k)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);}c.stroke();
          [.25,.5,.75,1].forEach((u,i)=>{const p=rp(u);c.globalAlpha=.95;c.fillStyle=VC[i%VC.length];heart(c,p[0],p[1]+9,7+(i%2)*2);});
          c.globalAlpha=1;
          drawDove(c,d.x-dir*40*s,d.y-22*s,dir,s*.9,t,d.ph+1.7);
          drawDove(c,d.x,d.y,dir,s,t,d.ph);
        }
        // hearts pierced by an arrow
        for(const p of this.pk){
          c.globalAlpha=Math.min(1,p.l/.7)*.95;c.fillStyle=p.c;
          c.save();c.translate(p.x,p.y);c.rotate(Math.sin(t*5+p.ph)*.08);heart(c,0,0,p.s);c.restore();
          c.save();c.translate(p.x,p.y);c.rotate(p.ang);c.translate(p.s*.95,0);arrowShape(c,p.s*2.1);c.restore();
        }
        // arrows in flight, then Cupids
        for(const a of this.ar){c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(a.vy,a.vx));arrowShape(c,26);c.restore();}
        for(const q of this.cu){c.globalAlpha=1;drawCupid(c,q,t);}
        for(const r of this.rk){c.globalAlpha=1;c.fillStyle=r.c;c.fillRect(r.x-1,r.y,2,12);}
        // sparkles, mini hearts and firework particles on top
        for(const p of this.pt){
          const a=Math.max(0,p.l/p.m);c.globalAlpha=a;c.fillStyle=p.c;
          if(p.k==='h')heart(c,p.x,p.y,p.r*(.6+.4*a));
          else if(p.k==='s')spark4(c,p.x,p.y,p.r*(.5+.5*a));
          else{c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();}
        }
      }
    },
    'hol-holyweek':{
      init(){this.m=Array.from({length:Math.round(Math.min(90,W*H/16000))},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2.6),vy:rnd(6,18),ph:rnd(0,6.28),sp:rnd(.5,1.6)}));},
      step(dt,t){for(const m of this.m){m.y-=m.vy*dt;m.x+=Math.sin(t*.5+m.ph)*6*dt;if(m.y<-5){m.y=H+5;m.x=rnd(0,W);}}},
      draw(c,t){
        for(let i=0;i<3;i++){
          const x0=W*(.25+i*.25),a=.05+.04*Math.sin(t*.35+i*2);
          const g=c.createLinearGradient(x0,0,x0,H*.9);g.addColorStop(0,'rgba(253,230,138,'+a*2+')');g.addColorStop(1,'rgba(253,230,138,0)');
          c.globalAlpha=1;c.fillStyle=g;c.beginPath();c.moveTo(x0-18,0);c.lineTo(x0+18,0);c.lineTo(x0+W*.12*(i-1)+90,H*.9);c.lineTo(x0+W*.12*(i-1)-90,H*.9);c.fill();
        }
        for(const m of this.m){c.globalAlpha=.2+.6*Math.abs(Math.sin(t*m.sp+m.ph));c.fillStyle='#fde68a';c.beginPath();c.arc(m.x,m.y,m.r,0,6.283);c.fill();}
      }
    }
  };

  // ── Easter: painted eggs, the Easter Bunny, hatching chicks, meadow ──────
  const EGGC=[['#f9a8d4','#fde68a'],['#a5f3fc','#c4b5fd'],['#fde68a','#f9a8d4'],['#c4b5fd','#86efac'],['#86efac','#a5f3fc'],['#fda4af','#fff1f2']];
  const EGGSP=['#fff','#fde68a','#fbcfe8','#a5f3fc','#c4b5fd'];
  function eggPath(c,s){
    c.beginPath();c.moveTo(0,-s*1.2);
    c.bezierCurveTo(s*.8,-s*1.2,s*.95,-s*.1,s*.95,s*.25);
    c.bezierCurveTo(s*.95,s*.85,s*.5,s*1.1,0,s*1.1);
    c.bezierCurveTo(-s*.5,s*1.1,-s*.95,s*.85,-s*.95,s*.25);
    c.bezierCurveTo(-s*.95,-s*.1,-s*.8,-s*1.2,0,-s*1.2);c.closePath();
  }
  // painted egg (pattern chosen by k): stripes, zigzag, dots or waves
  function eggPaint(c,x,y,s,k,rot,a){
    const P=EGGC[k%EGGC.length],m=k%4;
    c.save();c.translate(x,y);c.rotate(rot||0);c.globalAlpha*=(a==null?1:a);
    eggPath(c,s);c.fillStyle=P[0];c.fill();c.save();c.clip();
    c.fillStyle=P[1];c.strokeStyle=P[1];c.lineWidth=s*.22;
    if(m===0){c.fillRect(-s,-s*.35,s*2,s*.4);c.fillRect(-s,s*.35,s*2,s*.25);}
    else if(m===1){c.beginPath();for(let i=-5;i<=5;i++)c.lineTo(i*s*.22,s*.1+(i&1?-1:1)*s*.18);c.stroke();}
    else if(m===2){for(let i=0;i<7;i++){c.beginPath();c.arc(((i*37)%9-4)*s*.2,((i*53)%9-4)*s*.22,s*.15,0,6.283);c.fill();}}
    else{for(const o of [-.2,.45]){c.beginPath();for(let i=-6;i<=6;i++)c.lineTo(i*s*.18,o*s+Math.sin(i*1.1)*s*.2);c.stroke();}}
    c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(-s*.35,-s*.45,s*.2,s*.38,.35,0,6.283);c.fill();
    c.restore();c.restore();
  }
  // one half of a cracked egg (zig-zag break line)
  function eggShell(c,s,k,top){
    c.save();eggPath(c,s);c.clip();
    const y0=-s*.1,e=top?-s*3:s*3;
    c.beginPath();c.moveTo(-s*2,e);c.lineTo(-s*2,y0);
    for(let i=-4;i<=4;i++)c.lineTo(i*s*.25,y0+(i&1?-1:1)*s*.2);
    c.lineTo(s*2,y0);c.lineTo(s*2,e);c.closePath();c.clip();
    eggPaint(c,0,0,s,k);c.restore();
  }
  function bnEar(c,x,y,ang,L,col,inner){
    c.save();c.translate(x,y);c.rotate(ang);
    c.fillStyle=col;c.beginPath();c.ellipse(0,-L*.5,3.6,L*.5,0,0,6.283);c.fill();
    c.fillStyle=inner;c.beginPath();c.ellipse(0,-L*.5+1,1.9,L*.5-3,0,0,6.283);c.fill();c.restore();
  }
  // little egg basket, origin = bottom centre
  function drawBasket(c){
    c.strokeStyle='#a8723a';c.lineWidth=1.5;c.beginPath();c.moveTo(-5,-8);c.quadraticCurveTo(0,-22,5,-8);c.stroke();
    c.fillStyle='#4ade80';
    for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*1.7-1,-8);c.lineTo(i*1.7,-12.5);c.lineTo(i*1.7+1,-8);c.fill();}
    [['#f9a8d4',-3,-9.6],['#a5f3fc',1,-10.2],['#fde68a',4.2,-8.8]].forEach(e=>{c.fillStyle=e[0];c.beginPath();c.ellipse(e[1],e[2],2,2.5,0,0,6.283);c.fill();});
    c.fillStyle='#c8924f';c.beginPath();c.moveTo(-6.5,-8);c.lineTo(6.5,-8);c.lineTo(5,0);c.lineTo(-5,0);c.closePath();c.fill();
    c.strokeStyle='rgba(120,70,20,.45)';c.lineWidth=.7;
    c.beginPath();for(const y of [-5.5,-3,-.6]){c.moveTo(-6,y);c.lineTo(6,y);}c.stroke();
    c.fillStyle='#a8723a';c.fillRect(-7,-9,14,2);
  }
  // the Easter Bunny, facing +x, feet on the origin
  function drawBunny(c,b,t){
    const a=b.air,P=b.pal,sn=b.mode==='sniff',zm=b.mode==='zoom',ly=b.mode==='lay';
    const sit=sn?Math.min(1,b.st*2.5,Math.max(0,(b.dur-b.st)*2.5)):0;          // eases up onto hind legs while sniffing
    const sq=ly?Math.min(1,b.st*4,Math.max(0,(b.dur-b.st)*4))*.1:0;            // crouch while laying an egg
    c.save();
    c.globalAlpha=.16;c.fillStyle='#000';c.beginPath();c.ellipse(b.x,b.y+1,17*b.sc*(1-.3*a),3.4*b.sc,0,0,6.283);c.fill();c.globalAlpha=1;
    c.translate(b.x,b.y-a*b.hh);
    c.scale(b.dir*b.sc*(1.04-.07*a+sq*.5),b.sc*(.93+.13*a-sq));
    if(sit){c.translate(-9,0);c.rotate(-.55*sit);c.translate(9,0);}
    c.rotate(-Math.cos(Math.PI*b.h)*.28*a);
    c.lineCap='round';
    const bob=sn?Math.sin(t*6+b.ph)*1.1:0,ea=-.18-a*.55-(zm?.3:0)+Math.sin(t*14+b.ph)*.04*a,
          tw=sn&&Math.sin(t*1.7+b.ph)>.5?Math.sin(t*26)*.14:0;
    bnEar(c,9,-33,ea+.3,13,P.shade,P.inner);                                          // far ear
    c.fillStyle='#fff';c.beginPath();c.arc(-17,-19+Math.sin(t*(sn?14:4)+b.ph)*(sn?1.5:.5),5,0,6.283);c.fill();   // tail
    c.strokeStyle=P.shade;c.lineWidth=3.6;c.beginPath();c.moveTo(8,-10);c.lineTo(13+a*8,-3-a*7);c.stroke();     // far paw
    c.fillStyle=P.col;c.beginPath();c.ellipse(0,-17,16+a*2,11.5-a*1.2,0,0,6.283);c.fill();                       // body
    c.globalAlpha=.7;c.fillStyle=P.belly;c.beginPath();c.ellipse(3,-12.5,10,6,0,0,6.283);c.fill();c.globalAlpha=1;
    c.fillStyle=P.col;c.beginPath();c.ellipse(-8,-14,8.5,8,0,0,6.283);c.fill();                                   // haunch
    c.strokeStyle='rgba(0,0,0,.08)';c.lineWidth=1;c.stroke();
    c.beginPath();c.ellipse(-9-a*8,-2.8-a*6,9,3.4,a*.5,0,6.283);c.fill();                                         // hind foot
    c.strokeStyle=P.col;c.lineWidth=4;c.beginPath();c.moveTo(9,-10);                                              // near paw
    if(b.basket)c.lineTo(17,-14.5-a);else c.lineTo(14+a*8,-3-a*7);
    c.stroke();
    if(b.basket){c.save();c.translate(17,-14.5-a);c.rotate(Math.sin(t*(sn?3:9)+b.ph)*.12*(.3+a));c.translate(0,14.5);drawBasket(c);c.restore();}
    c.fillStyle=P.col;c.beginPath();c.arc(16,-27+bob,8.2,0,6.283);c.fill();                                       // head
    c.beginPath();c.ellipse(22,-25+bob,5.5,4.4,.1,0,6.283);c.fill();
    c.fillStyle='rgba(244,114,182,.35)';c.beginPath();c.arc(19.5,-23.5+bob,2.4,0,6.283);c.fill();
    c.fillStyle='#2b1b3d';c.beginPath();c.arc(18.8,-28.6+bob,1.9,0,6.283);c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(19.4,-29.3+bob,.65,0,6.283);c.fill();
    c.fillStyle='#f472b6';c.beginPath();c.ellipse(26.6,-26+bob,1.6*(sn?1+.5*Math.sin(t*24):1),1.3,0,0,6.283);c.fill();
    c.strokeStyle='rgba(110,85,140,.55)';c.lineWidth=.8;c.beginPath();c.moveTo(26.2,-24.6+bob);c.quadraticCurveTo(24.8,-22.4+bob,22.4,-23.2+bob);c.stroke();
    c.lineWidth=.6;c.beginPath();c.moveTo(24,-25+bob);c.lineTo(31,-27.2+bob);c.moveTo(24,-24+bob);c.lineTo(31,-23+bob);c.stroke();
    c.fillStyle='#f472b6';c.beginPath();c.moveTo(11,-20);c.lineTo(5.5,-23.5);c.lineTo(5.5,-16.5);c.closePath();      // bow tie
    c.moveTo(11,-20);c.lineTo(16.5,-23.5);c.lineTo(16.5,-16.5);c.closePath();c.fill();
    c.fillStyle='#ec4899';c.beginPath();c.arc(11,-20,2,0,6.283);c.fill();
    bnEar(c,14,-33.5+bob,ea+tw,13,P.col,P.inner);                                                                 // near ear
    c.restore();
  }
  function drawChick(c,x,y,dir,k,t,ph,run,beak){
    const bob=run?-Math.abs(Math.sin(t*11+ph))*2:Math.sin(t*5+ph)*.5,sw=run?Math.sin(t*22+ph)*2.6:0;
    c.save();c.translate(x,y+bob);c.scale(dir*k,k);c.lineCap='round';
    c.strokeStyle='#fb923c';c.lineWidth=1.4;c.beginPath();c.moveTo(-1,-2);c.lineTo(-1+sw,0);c.moveTo(2,-2);c.lineTo(2-sw,0);c.stroke();
    c.fillStyle='#fde047';c.beginPath();c.arc(0,-7,6,0,6.283);c.fill();
    c.fillStyle='#facc15';c.beginPath();c.moveTo(-5,-9);c.lineTo(-9,-11);c.lineTo(-6,-6);c.closePath();c.fill();
    c.beginPath();c.ellipse(-1.2,-6.5,3.2,2.2,.4+Math.sin(t*(run?20:6)+ph)*.35,0,6.283);c.fill();
    c.fillStyle='#fde047';c.beginPath();c.arc(3,-13.5,4.6,0,6.283);c.fill();
    c.strokeStyle='#facc15';c.lineWidth=1;c.beginPath();c.moveTo(2.5,-18);c.lineTo(1.5,-20.5);c.moveTo(3.5,-18);c.lineTo(4.5,-20.2);c.stroke();
    c.fillStyle='#fb923c';c.beginPath();c.moveTo(7,-14.4);c.lineTo(10.6,-13.8);c.lineTo(7,-12.9);c.closePath();c.fill();
    if(beak){c.beginPath();c.moveTo(7,-12.9);c.lineTo(10,-11.6);c.lineTo(7,-12);c.closePath();c.fill();}
    c.fillStyle='#2b1b3d';c.beginPath();c.arc(4.6,-14.4,.95,0,6.283);c.fill();
    c.fillStyle='rgba(249,168,212,.5)';c.beginPath();c.arc(4,-12,1.3,0,6.283);c.fill();
    c.restore();
  }

  // ── Parol: Pampanga-style giant lanterns (stained-glass star, chasing lights) ──
  function plStar(c,x,y,n,r1,r2){
    c.beginPath();
    for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i&1?r2:r1;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}
    c.closePath();
  }
  function plGlow(c,x,y,r,h,a){
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'hsla('+h+',100%,62%,'+a+')');g.addColorStop(1,'hsla('+h+',100%,62%,0)');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();
  }
  // small garland lantern
  function miniParol(c,x,y,R,t,ph){
    const h=(ph*57+t*40)%360,v=.5+.5*Math.sin(t*3+ph);
    c.save();c.globalCompositeOperation='lighter';plGlow(c,x,y,R*2.8,h,.2+.14*v);c.restore();
    c.strokeStyle='hsla('+((h+120)%360)+',90%,60%,.85)';c.lineWidth=1.6;c.beginPath();
    c.moveTo(x-R*.3,y+R*.8);c.lineTo(x-R*.5,y+R*2);c.moveTo(x+R*.3,y+R*.8);c.lineTo(x+R*.5,y+R*2);c.stroke();
    plStar(c,x,y,5,R,R*.45);c.fillStyle='hsla('+h+',95%,'+(45+25*v)+'%,.95)';c.fill();
    c.strokeStyle='rgba(250,204,21,.85)';c.lineWidth=1;c.stroke();
  }
  // giant lantern: a star of stained-glass panels in rings; light patterns chase around
  // and switch every few seconds, like the Giant Lantern Festival in San Fernando.
  // L = {n points, ph, h0 hue offset, dir, sp light speed}
  function giantParol(c,x,y,R,t,L){
    const n=L.n,st=2*Math.PI/n,hs=Math.PI/n,md=Math.floor((t+L.ph*3)/5.5)%4,
          fl=.93+.05*Math.sin(t*23+L.ph)+.03*Math.sin(t*37+L.ph*2);
    const P=(a,r)=>[x+Math.cos(a)*r*R,y+Math.sin(a)*r*R];
    const lit=(r,i)=>{
      if(md===0)return .5+.5*Math.sin(t*L.sp*(r&1?-1:1)*L.dir-i*st*2+L.ph);   // chase around the ring
      if(md===1)return .5+.5*Math.sin(t*L.sp*1.3+(i&1?Math.PI:0)+r*.6);       // alternate blink
      if(md===2)return .5+.5*Math.sin(t*L.sp*1.2-r*1.4+L.ph);                  // ripple out to the tips
      return .5+.5*Math.sin(t*L.sp*.9*L.dir-i*st+r*1.1);                       // spiral
    };
    const hue=(r,i)=>(L.h0+i*360/n*2+r*55+t*16)%360;
    const col=(r,i)=>{const v=lit(r,i)*fl;return 'hsla('+hue(r,i)+',95%,'+(30+36*v)+'%,'+(.66+.32*v)+')';};
    const poly=(pts,fill)=>{c.beginPath();for(let k=0;k<pts.length;k++)c[k?'lineTo':'moveTo'](pts[k][0],pts[k][1]);c.closePath();c.fillStyle=fill;c.fill();c.stroke();};
    // glow spilling onto the sky
    c.save();c.globalCompositeOperation='lighter';plGlow(c,x,y,R*2.3,hue(1,0),.22*fl);c.restore();
    // streamers / tails
    c.lineCap='round';
    for(let k=0;k<5;k++){
      const sx=x+(k-2)*R*.2,sy=y+R*.7,len=R*(.7+.35*((k+1)%3));
      c.strokeStyle='hsla('+hue(0,k*3)+',90%,62%,.85)';c.lineWidth=R*.05;
      c.beginPath();c.moveTo(sx,sy);
      c.quadraticCurveTo(sx+Math.sin(t*2+k)*R*.1,sy+len*.5,sx+Math.sin(t*2.4+k*1.7)*R*.16,sy+len);c.stroke();
      c.fillStyle='hsla('+hue(0,k*3+1)+',95%,66%,.95)';c.beginPath();c.arc(sx+Math.sin(t*2.4+k*1.7)*R*.16,sy+len,R*.04,0,6.283);c.fill();
    }
    // dark backing + panels
    plStar(c,x,y,n,R,R*.66);c.fillStyle='rgba(14,8,30,.88)';c.fill();
    c.lineJoin='round';c.lineWidth=Math.max(1,R*.011);c.strokeStyle='rgba(12,6,28,.8)';
    const cs=Math.cos(hs);
    for(let i=0;i<n;i++){
      const a=-Math.PI/2+i*st,M=P(a,.66*cs),Mi=P(a,.42*cs);
      poly([P(a-hs,.66),P(a,1),P(a+hs,.66)],col(3,i));                         // outer petal
      poly([P(a-hs,.66),M,Mi,P(a-hs,.42)],col(2,i*2));                         // middle band, left/right halves
      poly([M,P(a+hs,.66),P(a+hs,.42),Mi],col(2,i*2+1));
      poly([P(a-hs,.42),P(a+hs,.42),P(a,.22)],col(1,i));                       // inner zig-zag band
      poly([P(a,.22),P(a+st,.22),P(a+hs,.42)],col(0,i));
    }
    // gold frame
    plStar(c,x,y,n,R,R*.66);c.strokeStyle='rgba(250,204,21,.92)';c.lineWidth=Math.max(1.5,R*.03);c.stroke();
    // rosette core: turning petals around a bulb
    c.fillStyle='rgba(14,8,30,.92)';c.beginPath();c.arc(x,y,R*.22,0,6.283);c.fill();
    c.strokeStyle='rgba(250,204,21,.9)';c.lineWidth=Math.max(1,R*.018);c.stroke();
    c.save();c.translate(x,y);c.rotate(t*.55*L.dir);
    for(let k=0;k<8;k++){c.save();c.rotate(k*Math.PI/4);c.fillStyle='hsla('+hue(0,k*2)+',100%,'+(48+22*lit(0,k*2))+'%,.95)';c.beginPath();c.ellipse(0,-R*.115,R*.04,R*.095,0,0,6.283);c.fill();c.restore();}
    c.restore();
    c.save();c.globalCompositeOperation='lighter';
    plGlow(c,x,y,R*.28,50,.9*fl);plGlow(c,x,y,R*.95,hue(2,0),.13*fl);       // bulb + light from within
    // chasing marquee bulbs along the outline
    for(let k=0;k<n*2;k++){
      const p=P(-Math.PI/2+k*hs,k&1?.66:1),v=.5+.5*Math.sin(t*L.sp*3*L.dir-k*.9);
      plGlow(c,p[0],p[1],R*.07,hue(3,k),.25+.6*v);
    }
    c.restore();
    c.fillStyle='#fffbe6';c.beginPath();c.arc(x,y,R*.04,0,6.283);c.fill();
  }

  // ── Undas: a Philippine cemetery on All Saints' Day (candles, families, tents) ──
  // walker silhouette carrying a candle; returns the candle-flame position
  function undasWalker(c,x,y,sc,dir,t,ph,adult){
    const sw=Math.sin(t*3.2+ph),bob=Math.abs(sw)*.8*sc;
    c.save();c.translate(x,y-bob);c.scale(dir*sc,sc);c.lineCap='round';
    c.strokeStyle='#17142e';c.fillStyle='#17142e';c.lineWidth=2.8;
    c.beginPath();c.moveTo(-2,-11);c.lineTo(-2+sw*4,0);c.moveTo(2,-11);c.lineTo(2-sw*4,0);c.stroke();
    c.beginPath();c.moveTo(-5,-27);c.lineTo(5,-27);c.lineTo(adult?8:7,-9);c.lineTo(adult?-8:-7,-9);c.closePath();c.fill();
    c.strokeStyle='rgba(255,200,130,.28)';c.lineWidth=.8;c.stroke();
    c.fillStyle='#17142e';c.beginPath();c.arc(0,-31,4.2,0,6.283);c.fill();c.stroke();
    c.strokeStyle='#17142e';c.lineWidth=2.4;c.beginPath();c.moveTo(3,-25);c.lineTo(9,-19);c.stroke();
    c.fillStyle='#f5ecd0';c.fillRect(8,-21,2.4,5);
    c.restore();
    return [x+dir*9.2*sc,y-bob-21.5*sc];
  }
  // seated relative: mode 0 fans herself, 1 nods along to the stories, 2 is a restless child
  function undasSeat(c,x,y,sc,dir,t,ph,mode){
    const nod=mode===1?Math.sin(t*1.4+ph)*.8:mode===2?Math.abs(Math.sin(t*3+ph))*-1.6:0;
    c.save();c.translate(x,y);c.scale(dir*sc,sc);c.lineCap='round';
    c.fillStyle='#17142e';c.strokeStyle='rgba(255,200,130,.28)';c.lineWidth=.8;
    c.beginPath();c.moveTo(-5,-9);c.lineTo(-4.5,-22);c.quadraticCurveTo(0,-25,4.5,-22);c.lineTo(5,-9);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#17142e';c.lineWidth=4;c.beginPath();c.moveTo(0,-8);c.lineTo(9,-8);c.lineTo(9,0);c.stroke();
    c.fillStyle='#17142e';c.beginPath();c.arc(0,-28+nod,4,0,6.283);c.fill();
    if(mode===0){
      const a=Math.sin(t*6+ph)*.5,fx=12+Math.cos(a)*3,fy=-23+Math.sin(a)*4;
      c.strokeStyle='#17142e';c.lineWidth=2.4;c.beginPath();c.moveTo(3,-20);c.lineTo(fx-2,fy+1);c.stroke();
      c.fillStyle='rgba(250,204,21,.75)';c.beginPath();c.ellipse(fx+1,fy,3.2,2.4,a,0,6.283);c.fill();
    }
    c.restore();
  }
  // one candle flame (teardrop, leans with the wind, flickers); glow is a separate sprite pass
  function undasFlame(c,x,y,fs,fl,lean){
    const h=fs*2.6*fl,tx=x+lean*h*.35;
    c.fillStyle='#ffb347';c.beginPath();c.moveTo(tx,y-h);c.quadraticCurveTo(x+fs*.95,y-h*.25,x,y+fs*.2);c.quadraticCurveTo(x-fs*.95,y-h*.25,tx,y-h);c.fill();
    c.fillStyle='#fff3c4';c.beginPath();c.moveTo(x+lean*h*.15,y-h*.55);c.quadraticCurveTo(x+fs*.4,y-h*.1,x,y+fs*.05);c.quadraticCurveTo(x-fs*.4,y-h*.1,x+lean*h*.15,y-h*.55);c.fill();
  }
  function undasPalm(o,x,yb,h){
    o.strokeStyle='rgba(14,16,40,.85)';o.lineCap='round';o.lineWidth=Math.max(2,h*.04);
    o.beginPath();o.moveTo(x,yb);o.quadraticCurveTo(x+h*.12,yb-h*.5,x+h*.05,yb-h);o.stroke();
    const px=x+h*.05,py=yb-h;o.lineWidth=Math.max(1.6,h*.03);
    for(let k=0;k<7;k++){
      const a=-Math.PI/2+(k-3)*.52;
      o.beginPath();o.moveTo(px,py);o.quadraticCurveTo(px+Math.cos(a)*h*.22,py+Math.sin(a)*h*.22-h*.06,px+Math.cos(a)*h*.4,py+Math.sin(a)*h*.28+h*.16);o.stroke();
    }
  }

  // ── Round 2 ────────────────────────────────────────────────────────────
  function star(c,x,y,r1,r2){
    c.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?r2:r1;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}
    c.closePath();c.fill();
  }
  function flame(c,x,y,s,flick){
    const g=c.createRadialGradient(x,y,1,x,y,s*3.2);
    g.addColorStop(0,'rgba(253,200,90,.55)');g.addColorStop(1,'rgba(253,200,90,0)');
    c.fillStyle=g;c.beginPath();c.arc(x,y,s*3.2,0,6.283);c.fill();
    c.fillStyle='#ffb347';
    c.beginPath();c.moveTo(x,y-s*1.5*flick);
    c.quadraticCurveTo(x+s*.9,y-s*.1,x,y+s*.7);
    c.quadraticCurveTo(x-s*.9,y-s*.1,x,y-s*1.5*flick);c.fill();
    c.fillStyle='#fff3c4';
    c.beginPath();c.moveTo(x,y-s*.6);c.quadraticCurveTo(x+s*.35,y+s*.05,x,y+s*.45);
    c.quadraticCurveTo(x-s*.35,y+s*.05,x,y-s*.6);c.fill();
  }
  Object.assign(EFFECTS,{
    'hol-easter':{
      behind:true,
      init(){
        const dpr=Math.min(window.devicePixelRatio||1,2),gh=Math.max(110,Math.min(190,H*.2)),u=Math.max(.85,Math.min(1.25,H/760));
        const gy=x=>H-gh*.5-Math.sin(x*.004+1)*gh*.12-Math.sin(x*.011)*gh*.05;
        this.gy=gy;this.gh=gh;this.u=u;
        // static scenery (hills, picket fence, grass) is painted once into an offscreen layer
        const off=this.off=document.createElement('canvas');off.width=Math.round(W*dpr);off.height=Math.round(H*dpr);
        const o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
        const hill=(dy,c1,c2)=>{
          const g=o.createLinearGradient(0,H-gh*1.2,0,H);g.addColorStop(0,c1);g.addColorStop(1,c2);
          o.fillStyle=g;o.beginPath();o.moveTo(0,H);for(let x=0;x<=W+20;x+=16)o.lineTo(x,gy(x)+dy);o.lineTo(W+20,H);o.closePath();o.fill();
          o.strokeStyle='rgba(255,255,255,.10)';o.lineWidth=1.2;o.beginPath();for(let x=0;x<=W+20;x+=16)o[x?'lineTo':'moveTo'](x,gy(x)+dy);o.stroke();
        };
        hill(-gh*.34,'rgba(150,140,220,.30)','rgba(120,130,200,.18)');
        hill(-gh*.06,'rgba(110,200,160,.34)','rgba(70,160,120,.24)');
        const L=(document.querySelector('.sidebar,.side')||{}).offsetWidth||0,f0=L+(W-L)*.6,f1=L+(W-L)*.92;
        o.strokeStyle='rgba(255,255,255,.32)';o.lineWidth=2;
        for(const ry of [-12,-5]){o.beginPath();for(let x=f0;x<=f1;x+=10)o[x===f0?'moveTo':'lineTo'](x,gy(x)-gh*.06+4+ry);o.stroke();}
        o.fillStyle='rgba(255,255,255,.40)';
        for(let x=f0;x<=f1;x+=14){const y=gy(x)-gh*.06+4;o.beginPath();o.moveTo(x-2.5,y);o.lineTo(x-2.5,y-17);o.lineTo(x,y-21);o.lineTo(x+2.5,y-17);o.lineTo(x+2.5,y);o.closePath();o.fill();}
        hill(gh*.2,'rgba(90,200,140,.42)','rgba(50,150,100,.30)');
        o.strokeStyle='rgba(150,240,180,.38)';o.lineWidth=1.3;
        for(let i=0;i<W/6;i++){const x=rnd(0,W),y=Math.min(H-2,gy(x)+gh*.12+rnd(0,gh*.42));for(let k=-1;k<=1;k++){o.beginPath();o.moveTo(x+k*2,y);o.lineTo(x+k*3.5,y-rnd(4,9));o.stroke();}}
        // sky + ambience
        this.pt=Array.from({length:Math.round(Math.min(55,W*H/18000))},()=>this.mkP(true));
        this.eg=Array.from({length:6},(_,i)=>({x:rnd(0,W),y:rnd(H*.3,H+60),s:rnd(11,16),vy:rnd(10,20),ph:rnd(0,6.28),k:i}));
        this.cl=Array.from({length:4},()=>({x:rnd(0,W),y:rnd(H*.06,H*.34),s:rnd(.8,1.6),v:rnd(5,12)}));
        this.tw=Array.from({length:Math.round(Math.min(36,W*H/30000))},()=>({x:rnd(0,W),y:rnd(0,H*.55),r:rnd(2,4.5),ph:rnd(0,6.28),sp:rnd(.8,2),c:pick(EGGSP)}));
        this.bf=Array.from({length:5},()=>({x:rnd(0,W),y:rnd(H*.3,Math.max(H*.4,gy(W/2)-40)),a:rnd(0,6.28),sp:rnd(22,38),ph:rnd(0,6.28),s:rnd(5,8),c:pick(['#f9a8d4','#fde68a','#a5f3fc','#c4b5fd','#fdba74'])}));
        this.fw=Array.from({length:Math.round(Math.min(46,W/40))},()=>{const x=rnd(0,W),l=rnd(.05,1);return{x,y:Math.min(H-6,gy(x)+4+l*gh*.32),l,h:rnd(14,26),t:Math.random()<.55,c:pick(['#f9a8d4','#fde68a','#c4b5fd','#fb7185','#fff']),ph:rnd(0,6.28)};}).sort((p,q)=>p.y-q.y);
        this.ge=[];this.ch=[];this.pa=[];this.hT=2.5;
        this.bn=[this.mkB(true),this.mkB(false)];
      },
      mkP(first){return{x:rnd(0,W),y:first?rnd(0,H):-10,s:rnd(4,9),vy:rnd(18,45),rot:rnd(0,6.28),vr:rnd(-2,2),sw:rnd(.5,1.4),ph:rnd(0,6.28),a:rnd(.45,.8),c:pick(['#fbcfe8','#fff','#fde68a','#ddd6fe','#bbf7d0'])};},
      // the Easter Bunny (white, carries a basket, lays eggs) and a small brown bunny (zooms around)
      mkB(main){
        return{main,x:main?W*.2:W*.8,dir:main?1:-1,k:main?1:.68,lane:rnd(.2,.8),lt:rnd(.1,.9),y:0,sc:1,hh:18,h:rnd(0,1),air:0,mode:'run',st:0,dur:rnd(5,9),laid:0,
          hopDur:main?.62:.5,hopLen:main?62:44,ph:rnd(0,6.28),basket:main,
          pal:main?{col:'#fffafc',shade:'#e6dcf0',belly:'#f4e6ff',inner:'#f9a8d4'}:{col:'#dcbc98',shade:'#bf9a74',belly:'#f1dcc2',inner:'#f4b6c2'}};
      },
      spk(x,y,n){for(let i=0;i<n;i++)this.pa.push({x,y,vx:rnd(-45,45),vy:rnd(-80,-20),l:.9,m:.9,r:rnd(2,4.5),c:pick(EGGSP),k:'s'});},
      nextMode(b){
        const r=Math.random();b.mode='run';b.st=0;b.dur=rnd(5,9);
        if(b.basket&&r<.33&&this.ge.length<10){b.mode='lay';b.dur=1.9;b.laid=0;}
        else if(r<.66){b.mode='sniff';b.dur=rnd(2,3.4);}
        else if(r<.85){b.mode='zoom';b.dur=2.6;}
      },
      stepB(b,dt,t){
        b.st+=dt;
        b.lane+=(b.lt-b.lane)*Math.min(1,dt*1.2);
        b.sc=this.u*b.k*(.85+.5*b.lane);
        const zm=b.mode==='zoom',run=b.mode==='run'||zm;
        if(run){
          const hd=zm?.4:b.hopDur,hl=(zm?1.8:1)*b.hopLen*b.sc;
          b.h+=dt/hd;
          b.x+=b.dir*hl*Math.sin(Math.PI*Math.min(1,b.h))*Math.PI/2*dt/hd;
          if((b.x>W-30&&b.dir>0)||(b.x<30&&b.dir<0))b.dir=-b.dir;
          if(b.h>=1){
            b.h-=1;
            if(zm)for(let i=0;i<3;i++)this.pa.push({x:b.x-b.dir*8*b.sc,y:b.y,vx:-b.dir*rnd(10,40),vy:rnd(-20,-5),l:.6,m:.6,r:rnd(3,6),c:'#fff',k:'d'});
            if(Math.random()<.4)b.lt=rnd(0,1);
            if(b.st>b.dur)this.nextMode(b);
          }
        }else{
          b.h=0;
          if(b.mode==='lay'&&!b.laid&&b.st>.7){
            b.laid=1;const s=6.5*b.sc,x=b.x-b.dir*26*b.sc;
            this.ge.push({x,y:b.y,s,k:(Math.random()*6)|0,a:0,ph:rnd(0,6.28),life:rnd(20,28)});this.spk(x,b.y-s*2,9);
          }
          if(b.st>b.dur){b.mode='run';b.st=0;b.dur=rnd(5,10);}
        }
        b.air=run?Math.sin(Math.PI*Math.min(1,b.h)):0;
        b.hh=b.sc*(zm?26:18);
        b.y=Math.min(H-8,this.gy(b.x)+4+b.lane*this.gh*.32);
      },
      step(dt,t){
        const gy=this.gy,gh=this.gh,u=this.u;
        for(let i=0;i<this.pt.length;i++){const f=this.pt[i];f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*20*dt;f.rot+=f.vr*dt;if(f.y>H+10)this.pt[i]=this.mkP(false);}
        for(const e of this.eg){e.y-=e.vy*dt;e.x+=Math.sin(t*.5+e.ph)*8*dt;if(e.y<-60){e.y=H+60;e.x=rnd(0,W);}}
        for(const k of this.cl){k.x+=k.v*dt;if(k.x>W+120)k.x=-120;}
        for(const b of this.bf){
          b.a+=Math.sin(t*.9+b.ph)*2.2*dt;b.x+=Math.cos(b.a)*b.sp*dt;b.y+=Math.sin(b.a)*b.sp*dt*.7;
          if(b.x<20)b.a=0;else if(b.x>W-20)b.a=Math.PI;
          if(b.y<H*.15)b.a=1.2;else if(b.y>gy(b.x)-20)b.a=-1.2;
        }
        for(const b of this.bn)this.stepB(b,dt,t);
        for(const e of this.ge)e.a+=dt;
        this.ge=this.ge.filter(e=>e.a<e.life);
        // eggs hatch every so often: wobble, crack, shell pops off, a chick runs out
        this.hT-=dt;
        if(this.hT<=0){
          this.hT=rnd(9,16);
          if(this.ch.length<3){const x=rnd(W*.12,W*.88),l=rnd(.1,.9);this.ch.push({ex:x,x,y:Math.min(H-8,gy(x)+4+l*gh*.32),a:0,k:(Math.random()*6)|0,dir:Math.random()<.5?1:-1,ph:rnd(0,6.28),burst:0});}
        }
        for(let i=this.ch.length-1;i>=0;i--){
          const h=this.ch[i];h.a+=dt;
          if(h.a>2.6&&!h.burst){h.burst=1;this.spk(h.ex,h.y-9*u*1.4,10);}
          if(h.a>3.8){h.x+=h.dir*46*u*dt;if(h.x<30||h.x>W-30)h.dir=-h.dir;}
          if(h.a>16)this.ch.splice(i,1);
        }
        for(let i=this.pa.length-1;i>=0;i--){
          const p=this.pa[i];p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='s')p.vy+=70*dt;
          if(p.l<=0)this.pa.splice(i,1);
        }
      },
      draw(c,t){
        const u=this.u,gy=this.gy;
        // sky: twinkles, soft sun, rainbow, clouds
        for(const s of this.tw){c.globalAlpha=.2+.6*Math.abs(Math.sin(t*s.sp+s.ph));c.fillStyle=s.c;spark4(c,s.x,s.y,s.r);}
        c.save();c.globalCompositeOperation='lighter';
        glow(c,W*.9,H*.12,150,'255,236,170',.15+.05*Math.sin(t*.6));
        c.globalAlpha=.3;c.fillStyle='#fff4c8';c.beginPath();c.arc(W*.9,H*.12,24,0,6.283);c.fill();
        const rx=W*.4,ry=H*1.02,R=Math.min(W*.46,H*.78),lw=Math.max(6,R*.035);
        c.lineWidth=lw;
        ['#f87171','#fb923c','#fde047','#4ade80','#60a5fa','#818cf8','#c084fc'].forEach((col,i)=>{
          c.globalAlpha=.07+.025*Math.sin(t*.5+i*.6);c.strokeStyle=col;c.beginPath();c.arc(rx,ry,R-i*lw*.95,Math.PI*1.08,Math.PI*1.92);c.stroke();
        });
        c.restore();
        c.fillStyle='rgba(240,230,255,.10)';c.globalAlpha=1;
        for(const k of this.cl){for(const q of [[0,0,1],[.9,-.2,.8],[1.7,0,.9],[-.9,.1,.7],[.4,-.55,.75]]){c.beginPath();c.arc(k.x+q[0]*30*k.s,k.y+q[1]*30*k.s,q[2]*22*k.s,0,6.283);c.fill();}}
        c.drawImage(this.off,0,0,W,H);
        // swaying tulips and daisies
        for(const f of this.fw){
          const sw=Math.sin(t*1.3+f.ph)*3,s=.8+.5*f.l,hh=f.h*s,tx=f.x+sw,ty=f.y-hh;
          c.globalAlpha=.8;c.strokeStyle='#4ade80';c.lineWidth=1.6;c.beginPath();c.moveTo(f.x,f.y);c.quadraticCurveTo(f.x+sw*.3,f.y-hh*.5,tx,ty);c.stroke();
          c.fillStyle='#4ade80';c.beginPath();c.ellipse(f.x+3,f.y-hh*.35,4*s,1.6*s,-.6,0,6.283);c.fill();
          c.fillStyle=f.c;
          if(f.t){
            c.beginPath();c.moveTo(tx-4*s,ty-5*s);c.quadraticCurveTo(tx-5*s,ty+3*s,tx,ty+4*s);c.quadraticCurveTo(tx+5*s,ty+3*s,tx+4*s,ty-5*s);
            c.lineTo(tx+1.8*s,ty-2*s);c.lineTo(tx,ty-6*s);c.lineTo(tx-1.8*s,ty-2*s);c.closePath();c.fill();
          }else{
            for(let k=0;k<6;k++){c.save();c.translate(tx,ty);c.rotate(k*1.047);c.beginPath();c.ellipse(0,-4*s,1.8*s,3.6*s,0,0,6.283);c.fill();c.restore();}
            c.fillStyle='#f59e0b';c.beginPath();c.arc(tx,ty,2.2*s,0,6.283);c.fill();
          }
        }
        // eggs the Bunny has hidden in the grass
        for(const e of this.ge){
          const k=Math.min(1,e.a/.45),sc=Math.min(1,k*1.4)*(1+(k<1?Math.sin(k*Math.PI)*.35:0)),al=Math.max(0,Math.min(1,(e.life-e.a)/3));
          c.globalAlpha=al;eggPaint(c,e.x,e.y-e.s*1.05*sc,e.s*sc,e.k);
          c.globalAlpha=al*.8;c.strokeStyle='#4ade80';c.lineWidth=1.4;
          for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(e.x+i*e.s*.5,e.y+1);c.quadraticCurveTo(e.x+i*e.s*.6,e.y-e.s*.6,e.x+i*e.s*.9+Math.sin(t*2+i)*1.2,e.y-e.s);c.stroke();}
          const g=Math.sin(t*1.8+e.ph);
          if(g>.85){c.globalAlpha=(g-.85)/.15*al;c.fillStyle='#fff';spark4(c,e.x+e.s*.5,e.y-e.s*2,e.s*.9);}
        }
        // hatching eggs and chicks
        for(const h of this.ch){
          const s=9*u,a=h.a,al=a>14.5?Math.max(0,(16-a)/1.5):1,ey=h.y-s*1.1;
          c.globalAlpha=al;
          if(a<2.6){
            c.save();c.translate(h.ex,ey);c.rotate(Math.sin(a*16)*.14*Math.min(1,a/2.2));
            eggPaint(c,0,0,s,h.k);
            if(a>1.7){const n=Math.min(8,Math.ceil((a-1.7)*10));c.strokeStyle='#5b4a7a';c.lineWidth=1.2;c.beginPath();for(let i=-4;i<-4+n;i++){const x=i*s*.25,y=-s*.1+(i&1?-1:1)*s*.2;i===-4?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}
            c.restore();
          }else{
            const q=a-2.6,e=1-Math.pow(1-Math.min(1,q/.9),3),run=a>3.8;
            c.globalAlpha=al;drawChick(c,run?h.x:h.ex,ey+(h.y-ey)*e,h.dir,1.45*u*(.35+.65*e),t,h.ph,run,Math.sin(t*9+h.ph)>.8);
            c.save();c.translate(h.ex,ey);c.globalAlpha=al;eggShell(c,s,h.k,false);c.restore();
            if(q<1.6){c.save();c.globalAlpha=al*Math.max(0,1-q/1.6);c.translate(h.ex+h.dir*q*20,ey-q*70+q*q*140);c.rotate(h.dir*q*4);eggShell(c,s,h.k,true);c.restore();}
          }
        }
        // the bunnies, back-to-front
        c.globalAlpha=1;
        [...this.bn].sort((p,q)=>p.y-q.y).forEach(b=>{c.globalAlpha=1;drawBunny(c,b,t);});
        // falling petals
        for(const f of this.pt){c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=f.a;c.fillStyle=f.c;c.beginPath();c.ellipse(0,0,f.s,f.s*.55,0,0,6.283);c.fill();c.restore();}
        // butterflies
        for(const b of this.bf){
          const fl=.25+.75*Math.abs(Math.sin(t*13+b.ph)),s=b.s;
          c.save();c.translate(b.x,b.y);c.rotate(b.a+Math.PI/2);c.globalAlpha=.85;
          c.save();c.scale(fl,1);c.fillStyle=b.c;
          c.beginPath();c.ellipse(-s*.85,-s*.4,s*.85,s*.6,-.5,0,6.283);c.ellipse(s*.85,-s*.4,s*.85,s*.6,.5,0,6.283);c.fill();
          c.globalAlpha=.65;c.beginPath();c.ellipse(-s*.6,s*.55,s*.55,s*.45,.4,0,6.283);c.ellipse(s*.6,s*.55,s*.55,s*.45,-.4,0,6.283);c.fill();
          c.restore();
          c.globalAlpha=.9;c.strokeStyle='#4c3a6b';c.lineWidth=1.4;c.beginPath();c.moveTo(0,-s*.8);c.lineTo(0,s*.9);c.stroke();
          c.lineWidth=.7;c.beginPath();c.moveTo(0,-s*.8);c.lineTo(-s*.4,-s*1.3);c.moveTo(0,-s*.8);c.lineTo(s*.4,-s*1.3);c.stroke();
          c.restore();
        }
        // floating egg balloons
        for(const e of this.eg){
          const x=e.x+Math.sin(t*.6+e.ph)*14,y=e.y,by=y+e.s*1.1;
          c.globalAlpha=.55;c.strokeStyle='#e9d5ff';c.lineWidth=1;c.beginPath();c.moveTo(x,by);c.bezierCurveTo(x-6,by+22,x+7,by+44,x+Math.sin(t*1.2+e.ph)*5,by+70);c.stroke();
          c.globalAlpha=.8;eggPaint(c,x,y,e.s,e.k,Math.sin(t*.8+e.ph)*.14);
        }
        // sparkles + dust
        for(const p of this.pa){
          const a=Math.max(0,p.l/p.m);c.globalAlpha=p.k==='d'?a*.5:a;c.fillStyle=p.c;
          if(p.k==='s')spark4(c,p.x,p.y,p.r*(.5+.5*a));else{c.beginPath();c.arc(p.x,p.y,p.r*(1.4-.4*a),0,6.283);c.fill();}
        }
        c.globalAlpha=1;
      }
    },
    'hol-autumn':{
      init(){this.l=Array.from({length:Math.round(Math.min(70,W*H/14000))},()=>({x:rnd(0,W),y:rnd(0,H),s:rnd(7,14),vy:rnd(25,60),rot:rnd(0,6.28),vr:rnd(-2.5,2.5),sw:rnd(.5,1.4),ph:rnd(0,6.28),a:rnd(.65,.95),c:pick(['#f97316','#dc2626','#d97706','#b45309','#facc15','#9a3412'])}));},
      step(dt,t){for(const f of this.l){f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*30*dt;f.rot+=f.vr*dt;if(f.y>H+15){f.y=-15;f.x=rnd(0,W);}}},
      draw(c){for(const f of this.l){
        c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=f.a;c.fillStyle=f.c;
        const s=f.s;c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(s*.95,-s*.2,0,s);c.quadraticCurveTo(-s*.95,-s*.2,0,-s);c.fill();
        c.strokeStyle='rgba(0,0,0,.28)';c.lineWidth=1;c.beginPath();c.moveTo(0,-s);c.lineTo(0,s*1.2);c.stroke();c.restore();}}
    },
    'hol-diwali':{
      init(){
        this.sp=Array.from({length:80},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.7,2.2),vy:rnd(15,50),ph:rnd(0,6.28),c:pick(['#fcd34d','#fb923c','#f0abfc','#fff7ed'])}));
        const dn=Math.max(5,Math.round(W/150));this.d=Array.from({length:dn},(_,i)=>({x:(i+.5)*W/dn,ph:rnd(0,6.28)}));
      },
      step(dt){for(const s of this.sp){s.y-=s.vy*dt;if(s.y<-5){s.y=H+5;s.x=rnd(0,W);}}},
      draw(c,t){
        for(const s of this.sp){c.globalAlpha=.3+.7*Math.abs(Math.sin(t*2+s.ph));c.fillStyle=s.c;c.beginPath();c.arc(s.x+Math.sin(t+s.ph)*6,s.y,s.r,0,6.283);c.fill();}
        for(const d of this.d){
          const y=H-16;c.globalAlpha=1;
          flame(c,d.x,y-14,5,1+.18*Math.sin(t*9+d.ph)+.1*Math.sin(t*15+d.ph*2));
          c.fillStyle='#b45309';c.beginPath();c.ellipse(d.x,y-6,20,6,0,0,6.283);c.fill();
          c.fillStyle='#92400e';c.beginPath();c.moveTo(d.x-20,y-6);c.quadraticCurveTo(d.x,y+14,d.x+20,y-6);c.fill();
        }
      }
    },
    'hol-stpat':{
      init(){
        this.c=Array.from({length:Math.round(Math.min(45,W*H/22000))},()=>({x:rnd(0,W),y:rnd(0,H),s:rnd(6,13),vy:rnd(20,48),rot:rnd(0,6.28),vr:rnd(-1.5,1.5),sw:rnd(.5,1.2),ph:rnd(0,6.28),a:rnd(.55,.9)}));
        this.g=Array.from({length:35},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2.2),ph:rnd(0,6.28),sp:rnd(1,3)}));
      },
      step(dt,t){for(const f of this.c){f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*18*dt;f.rot+=f.vr*dt;if(f.y>H+15){f.y=-15;f.x=rnd(0,W);}}},
      draw(c,t){
        for(const g of this.g){c.globalAlpha=.2+.8*Math.abs(Math.sin(t*g.sp+g.ph));c.fillStyle='#fde047';c.beginPath();c.arc(g.x,g.y,g.r,0,6.283);c.fill();}
        for(const f of this.c){
          c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=f.a;c.fillStyle='#22c55e';
          for(let k=0;k<3;k++){c.save();c.rotate(k*2.094);heart(c,0,-f.s*.55,f.s*.62);c.restore();}
          c.strokeStyle='#15803d';c.lineWidth=1.6;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(f.s*.2,f.s*.7,f.s*.55,f.s*1.1);c.stroke();c.restore();
        }
      }
    },
    'hol-parol':{
      behind:true,alpha:.45,
      init(){
        const base=Math.min(W,H)*.15,Rs=[1,.78,1.12,.9,.7],m=Math.max(3,Math.min(5,Math.round(W/330)));
        this.L=Array.from({length:m},(_,i)=>{
          const R=Math.max(48,base*Rs[i%5]);
          return{x:W*((i+.5)/m)+rnd(-W*.03,W*.03),R,y:R+rnd(H*.03,H*.2),n:[16,12,14,10,12][i%5],ph:rnd(0,6.28),h0:rnd(0,360),dir:i&1?-1:1,sp:rnd(2.4,3.6)};
        });
        const gm=Math.max(10,Math.round(W/75));
        this.gl=Array.from({length:gm},(_,i)=>({x:(i+.5)*W/gm,ph:rnd(0,6.28),R:rnd(8,12)}));
        this.st=Array.from({length:50},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.6,1.8),ph:rnd(0,6.28),sp:rnd(1,3)}));
        this.mo=Array.from({length:45},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(1.2,3),vy:rnd(6,20),ph:rnd(0,6.28)}));
      },
      step(dt,t){for(const m of this.mo){m.y-=m.vy*dt;m.x+=Math.sin(t*.7+m.ph)*8*dt;if(m.y<-6){m.y=H+6;m.x=rnd(0,W);}}},
      draw(c,t){
        c.fillStyle='#fff';
        for(const s of this.st){c.globalAlpha=.15+.7*Math.abs(Math.sin(t*s.sp+s.ph));c.beginPath();c.arc(s.x,s.y,s.r,0,6.283);c.fill();}
        // drifting golden motes
        c.save();c.globalCompositeOperation='lighter';
        for(const m of this.mo){c.globalAlpha=.25+.5*Math.abs(Math.sin(t*1.3+m.ph));plGlow(c,m.x,m.y,m.r*4,45,.55);}
        c.restore();
        // garland of small star lanterns across the top
        c.globalAlpha=1;c.strokeStyle='rgba(250,220,150,.55)';c.lineWidth=1.2;
        const sy=x=>{const u=((x/W)*4)%1;return 4+18*4*u*(1-u);};
        c.beginPath();for(let x=0;x<=W+8;x+=8)c[x?'lineTo':'moveTo'](x,sy(x));c.stroke();
        for(const g of this.gl)miniParol(c,g.x+Math.sin(t*.9+g.ph)*3,sy(g.x)+14,g.R,t,g.ph);
        // the giant lanterns, swaying from their cords
        for(const L of this.L){
          c.save();c.translate(L.x,0);c.rotate(Math.sin(t*.6+L.ph)*.035);c.translate(-L.x,0);
          c.globalAlpha=.8;c.strokeStyle='rgba(250,220,150,.7)';c.lineWidth=1.5;c.beginPath();c.moveTo(L.x,0);c.lineTo(L.x,L.y-L.R);c.stroke();
          c.globalAlpha=1;giantParol(c,L.x,L.y,L.R,t,L);
          c.restore();
        }
        c.globalAlpha=1;
      }
    },
    'hol-allsaints':{
      behind:true,alpha:.92,
      init(){
        const dpr=Math.min(window.devicePixelRatio||1,2),u=Math.max(.85,Math.min(1.25,H/760)),gh=Math.max(200,Math.min(330,H*.36));
        this.u=u;this.gh=gh;this.RS=[.55,.8,1.1];this.RY=[.74,.46,.18];
        const gs=this.gs=document.createElement('canvas');gs.width=gs.height=64;
        const g0=gs.getContext('2d'),gg=g0.createRadialGradient(32,32,0,32,32,32);
        gg.addColorStop(0,'rgba(255,205,120,.95)');gg.addColorStop(.25,'rgba(255,170,70,.45)');gg.addColorStop(1,'rgba(255,140,40,0)');
        g0.fillStyle=gg;g0.fillRect(0,0,64,64);
        const off=this.off=document.createElement('canvas');off.width=Math.round(W*dpr);off.height=Math.round(H*dpr);
        const o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
        // moon
        const mx=W*.84,my=Math.max(70,H*.15);
        let g=o.createRadialGradient(mx,my,8,mx,my,170);g.addColorStop(0,'rgba(220,225,255,.28)');g.addColorStop(1,'rgba(220,225,255,0)');
        o.fillStyle=g;o.beginPath();o.arc(mx,my,170,0,6.283);o.fill();
        g=o.createRadialGradient(mx-8,my-8,2,mx,my,32);g.addColorStop(0,'#fffdf2');g.addColorStop(1,'#cfd3f0');
        o.globalAlpha=.8;o.fillStyle=g;o.beginPath();o.arc(mx,my,30,0,6.283);o.fill();o.globalAlpha=1;
        // far hills, palms, chapel
        const hb=x=>H-gh*1.02-Math.sin(x*.004+2)*gh*.07;
        o.fillStyle='rgba(20,22,56,.78)';o.beginPath();o.moveTo(0,H);for(let x=0;x<=W+20;x+=16)o.lineTo(x,hb(x));o.lineTo(W+20,H);o.closePath();o.fill();
        for(let i=0;i<5;i++){const x=rnd(W*.04,W*.96);undasPalm(o,x,hb(x)+8,rnd(70,120)*u);}
        const cs=u*.9,cx=Math.max(W*.3,260),cy=hb(cx)+6;
        o.fillStyle='rgba(18,16,46,.95)';
        o.fillRect(cx-44*cs,cy-40*cs,60*cs,40*cs);                                   // nave
        o.beginPath();o.moveTo(cx-48*cs,cy-40*cs);o.lineTo(cx-14*cs,cy-62*cs);o.lineTo(cx+20*cs,cy-40*cs);o.closePath();o.fill();
        o.fillRect(cx+16*cs,cy-78*cs,24*cs,78*cs);                                    // bell tower
        o.beginPath();o.moveTo(cx+12*cs,cy-78*cs);o.lineTo(cx+28*cs,cy-102*cs);o.lineTo(cx+44*cs,cy-78*cs);o.closePath();o.fill();
        o.fillRect(cx+27*cs,cy-118*cs,2.4*cs,18*cs);o.fillRect(cx+22*cs,cy-113*cs,12*cs,2.4*cs);   // cross
        o.fillStyle='rgba(6,5,18,.95)';o.fillRect(cx+21*cs,cy-72*cs,14*cs,18*cs);o.beginPath();o.arc(cx+28*cs,cy-72*cs,7*cs,Math.PI,0);o.fill();   // belfry opening
        this.cp={cs,cx,cy,bx:cx+28*cs,by:cy-66*cs,wins:[[cx-36*cs,cy-30*cs],[cx-18*cs,cy-30*cs],[cx-2*cs,cy-30*cs]],door:[cx-14*cs,cy-12*cs]};
        // ground
        const RS=this.RS,RY=this.RY,cd=this.cd=[];
        const stone=a=>'rgba(196,194,232,'+a+')',dark=a=>'rgba(16,16,40,'+a+')',top=a=>'rgba(222,220,250,'+a+')';
        const spot=(x,y,s,al)=>{o.fillStyle='rgba(245,236,208,'+Math.min(1,al+.1)+')';o.fillRect(x-1.1*s,y-6*s,2.2*s,6*s);cd.push({x,y:y-6*s,s,ph:rnd(0,6.28),fr:Math.random()});};
        const vase=(x,y,s,al)=>{
          o.fillStyle='rgba(110,150,200,'+al+')';o.beginPath();o.moveTo(x-3*s,y);o.lineTo(x+3*s,y);o.lineTo(x+4*s,y-8*s);o.lineTo(x-4*s,y-8*s);o.closePath();o.fill();
          [['#fde047',-3,-12],['#fff',0,-14],['#f472b6',3,-12],['#c084fc',-1.5,-10],['#fb923c',2,-10.5]].forEach(f=>{o.globalAlpha=al;o.fillStyle=f[0];o.beginPath();o.arc(x+f[1]*s,y+f[2]*s,3*s,0,6.283);o.fill();});o.globalAlpha=1;
        };
        const cross=(x,y,s,h,al)=>{o.fillStyle=stone(al);o.fillRect(x-1.6*s,y-h,3.2*s,h);o.fillRect(x-5.5*s,y-h*.78,11*s,3*s);};
        const tomb=(type,x,yb,s,al)=>{
          let w;
          if(type===0){                                                  // slab tomb with cross at the head
            w=70*s;o.fillStyle=stone(al*.8);o.fillRect(x,yb-13*s,w,13*s);o.fillStyle=top(al);o.fillRect(x-3*s,yb-17*s,w+6*s,4.5*s);
            cross(x+9*s,yb-17*s,s,34*s,al);
            [.48,.62,.78].forEach(f=>spot(x+w*f,yb-17*s,s*.8,al));spot(x+w*.3,yb,s*.9,al);spot(x+w*.7,yb+1,s*.9,al);vase(x+w*.92,yb-17*s,s,al);return w+10*s;
          }
          if(type===1){                                                  // little mausoleum house
            w=58*s;o.fillStyle=stone(al*.85);o.fillRect(x,yb-42*s,w,42*s);
            o.fillStyle=top(al*.9);o.beginPath();o.moveTo(x-5*s,yb-42*s);o.lineTo(x+w/2,yb-66*s);o.lineTo(x+w+5*s,yb-42*s);o.closePath();o.fill();
            o.fillStyle=dark(al);o.beginPath();o.moveTo(x+w*.36,yb);o.lineTo(x+w*.36,yb-24*s);o.arc(x+w*.5,yb-24*s,w*.14,Math.PI,0);o.lineTo(x+w*.64,yb);o.fill();
            o.fillStyle='rgba(255,170,70,'+.22*al+')';o.fill();
            cross(x+w/2,yb-66*s,s,16*s,al);
            spot(x+w*.28,yb,s*.9,al);spot(x+w*.72,yb,s*.9,al);spot(x+w*.5,yb-.5*s,s*.8,al);vase(x-4*s,yb,s,al);return w+14*s;
          }
          if(type===2){                                                  // angel statue or tall cross on a pedestal
            w=26*s;const cx=x+13*s,base=yb-29*s;
            o.fillStyle=stone(al*.85);o.fillRect(x,yb-26*s,w,26*s);o.fillStyle=top(al);o.fillRect(x-2*s,yb-29*s,w+4*s,4*s);
            if(Math.random()<.55){
              o.fillStyle=top(al*.9);o.beginPath();o.moveTo(cx-8*s,base);o.lineTo(cx-4*s,base-22*s);o.lineTo(cx+4*s,base-22*s);o.lineTo(cx+8*s,base);o.closePath();o.fill();
              o.beginPath();o.arc(cx,base-26*s,3.6*s,0,6.283);o.fill();
              for(const d of [-1,1]){o.beginPath();o.moveTo(cx+d*3*s,base-20*s);o.quadraticCurveTo(cx+d*20*s,base-30*s,cx+d*17*s,base-6*s);o.quadraticCurveTo(cx+d*10*s,base-14*s,cx+d*3*s,base-10*s);o.fill();}
            }else cross(cx,base,s,50*s,al);
            spot(x+2*s,yb,s*.9,al);spot(x+24*s,yb,s*.9,al);spot(x+13*s,yb+s,s*.8,al);return 40*s;
          }
          w=84*s;const h=66*s;                                           // apartment-style niche wall
          o.fillStyle=stone(al*.85);o.fillRect(x,yb-h,w,h);o.fillStyle=top(al);o.fillRect(x-2*s,yb-h-4*s,w+4*s,4*s);
          for(let r=0;r<3;r++)for(let k=0;k<4;k++){
            const nx=x+6*s+k*19*s,ny=yb-h+6*s+r*20*s;o.fillStyle=dark(al*.9);o.fillRect(nx,ny,15*s,16*s);
            if(Math.random()<.45){o.fillStyle='rgba(255,170,70,'+.12*al+')';o.fillRect(nx,ny,15*s,16*s);spot(nx+7.5*s,ny+16*s,s*.7,al);}
          }
          cross(x+w/2,yb-h-4*s,s,16*s,al);spot(x+10*s,yb,s*.9,al);spot(x+w-10*s,yb,s*.9,al);return w+12*s;
        };
        // two family tents (blue tarpaulin) take space in the front row
        const s2=u*RS[2],yb2=H-gh*RY[2],tw=96*s2,tents=this.tn=[];
        [.38,.72].forEach(f=>{const l=Math.max(40,L0()+(W-L0())*f-tw/2);tents.push({l,r:l+tw,yb:yb2,s:s2,w:tw});});
        function L0(){return (document.querySelector('.sidebar,.side')||{}).offsetWidth||0;}
        for(let r=0;r<3;r++){
          const s=u*RS[r],yb=H-gh*RY[r],al=[.5,.72,.92][r];
          o.fillStyle='rgba(20,24,48,'+(.35+.12*r)+')';o.fillRect(0,yb-2*s,W,H-yb+2*s);
          let x=rnd(-30,10);
          while(x<W+20){
            if(r===2){const T=tents.find(T=>x+60*s>T.l&&x<T.r);if(T){x=T.r+8*s;continue;}}
            const q=Math.random();x+=tomb(q<.34?0:q<.52?1:q<.68?2:3,x,yb+rnd(-3,3)*s,s,al)+rnd(10,40)*s;
          }
        }
        // tents (static part) + string-bulb positions
        this.bl=[];
        for(const T of tents){
          const s=T.s,ap=[T.l+T.w/2,T.yb-72*s],lf=[T.l-8*s,T.yb-44*s],rt=[T.r+8*s,T.yb-44*s];
          o.strokeStyle='rgba(190,190,220,.55)';o.lineWidth=1.6*s;o.beginPath();o.moveTo(T.l,T.yb);o.lineTo(T.l,T.yb-44*s);o.moveTo(T.r,T.yb);o.lineTo(T.r,T.yb-44*s);o.stroke();
          o.fillStyle='rgba(70,120,200,.6)';o.beginPath();o.moveTo(lf[0],lf[1]);o.lineTo(ap[0],ap[1]);o.lineTo(rt[0],rt[1]);o.closePath();o.fill();
          o.fillStyle='rgba(255,255,255,.18)';o.beginPath();o.moveTo(ap[0],ap[1]);o.lineTo(ap[0]-14*s,ap[1]+10*s);o.lineTo(ap[0]-14*s+10*s,ap[1]+28*s);o.lineTo(ap[0]+4*s,ap[1]+28*s);o.closePath();o.fill();
          for(let i=0;i<=8;i++){const f=i/8;this.bl.push({x:lf[0]+(ap[0]-lf[0])*f,y:lf[1]+(ap[1]-lf[1])*f,ph:rnd(0,6.28),h:pick([48,0,320,200,120])});this.bl.push({x:rt[0]+(ap[0]-rt[0])*f,y:rt[1]+(ap[1]-rt[1])*f,ph:rnd(0,6.28),h:pick([48,0,320,200,120])});}
          spot(T.l+T.w*.4,T.yb+s,s,.95);spot(T.l+T.w*.6,T.yb+s,s,.95);
        }
        if(cd.length>150)cd.sort(()=>Math.random()-.5).length=150;
        // dynamic actors
        this.tp=[];tents.forEach((T,i)=>[[.22,0,1],[.5,1,1],[.78,2,.74]].forEach((p,k)=>this.tp.push({x:T.l+T.w*p[0],y:T.yb,s:T.s*p[2],mode:p[1],ph:rnd(0,6.28),dir:k&1?-1:1})));
        this.wk=Array.from({length:3},(_,i)=>({x:rnd(0,W),row:1+(i&1),dir:i===1?-1:1,sp:rnd(14,22),ph:rnd(0,6.28)}));
        this.mo=Array.from({length:4},()=>{const c=pick(cd);return{cx:c.x,cy:c.y,tx:c.x,ty:c.y,a:rnd(0,6.28),sp:rnd(2.4,3.6),rx:rnd(14,26),ry:rnd(8,16),tt:rnd(4,12),ph:rnd(0,6.28)};});
        this.so=Array.from({length:14},()=>({x:rnd(0,W),y:rnd(H*.3,H),vy:rnd(8,18),ph:rnd(0,6.28),r:rnd(2,4)}));
        this.pt=Array.from({length:30},()=>this.mkP(true));
        this.st=Array.from({length:50},()=>({x:rnd(0,W),y:rnd(0,H*.5),r:rnd(.6,1.7),ph:rnd(0,6.28),sp:rnd(1,3)}));
        this.cl=Array.from({length:3},()=>({x:rnd(0,W),y:rnd(H*.08,H*.28),w:rnd(160,300),v:rnd(5,10)}));
        this.fg=Array.from({length:4},(_,i)=>({x:rnd(0,W),y:H-gh*(.15+.22*i),w:rnd(260,420),v:rnd(5,11)*(i&1?-1:1)}));
        this.pa=[];this.sT=0;this.bt=10;this.w=0;this.gu=0;
      },
      mkP(first){return{x:rnd(0,W),y:first?rnd(0,H):-10,s:rnd(2.5,5),vy:rnd(14,32),rot:rnd(0,6.28),vr:rnd(-2,2),sw:rnd(.5,1.3),ph:rnd(0,6.28),a:rnd(.4,.75),c:pick(['#fb923c','#fde047','#fff','#c084fc','#f9a8d4'])};},
      step(dt,t){
        const gu=Math.pow(Math.max(0,Math.sin(t*.11+1)),6);          // an occasional gust of wind
        this.gu=gu;this.w=Math.sin(t*.21)*.3+gu*(.9+.3*Math.sin(t*1.7));
        this.sT-=dt;
        if(this.sT<=0&&this.cd.length){this.sT=rnd(.15,.35);const c=pick(this.cd);if(this.pa.length<44){const l=rnd(2.5,4);this.pa.push({x:c.x,y:c.y-4*c.s,vx:0,vy:-rnd(14,26),l,m:l,r:rnd(1.5,3)*c.s*1.5});}}
        for(let i=this.pa.length-1;i>=0;i--){const p=this.pa[i];p.l-=dt;p.vx+=this.w*25*dt;p.x+=(p.vx+Math.sin(t*2+p.y*.05)*6)*dt;p.y+=p.vy*dt;p.r+=dt*3;if(p.l<=0)this.pa.splice(i,1);}
        for(const s of this.so){s.y-=s.vy*dt;s.x+=Math.sin(t*.6+s.ph)*10*dt+this.w*10*dt;if(s.y<-20){s.y=H+10;s.x=rnd(0,W);}}
        for(let i=0;i<this.pt.length;i++){const f=this.pt[i];f.y+=f.vy*dt;f.x+=(Math.sin(t*f.sw+f.ph)*16+this.w*60)*dt;f.rot+=f.vr*dt;if(f.y>H+10||f.x>W+30||f.x<-30)this.pt[i]=this.mkP(false);}
        for(const k of this.cl){k.x+=k.v*dt;if(k.x>W+300)k.x=-300;}
        for(const f of this.fg){f.x+=f.v*dt;if(f.x>W+400)f.x=-400;else if(f.x<-400)f.x=W+400;}
        for(const w of this.wk){w.x+=w.dir*w.sp*dt;if(w.x>W+60)w.x=-60;else if(w.x<-60)w.x=W+60;}
        for(const m of this.mo){
          m.a+=m.sp*dt;m.tt-=dt;m.cx+=(m.tx-m.cx)*dt*.8;m.cy+=(m.ty-m.cy)*dt*.8;
          if(m.tt<=0){const c=pick(this.cd);m.tx=c.x;m.ty=c.y;m.tt=rnd(10,18);}
        }
        this.bt+=dt;if(this.bt>16)this.bt=0;
      },
      draw(c,t){
        const u=this.u,RS=this.RS,RY=this.RY,gh=this.gh,cp=this.cp,w=this.w,gu=this.gu;
        for(const s of this.st){c.globalAlpha=.15+.7*Math.abs(Math.sin(t*s.sp+s.ph));c.fillStyle='#fff';c.beginPath();c.arc(s.x,s.y,s.r,0,6.283);c.fill();}
        c.globalAlpha=1;
        for(const k of this.cl){c.fillStyle='rgba(18,22,56,.35)';c.beginPath();c.ellipse(k.x,k.y,k.w,k.w*.09,0,0,6.283);c.fill();}
        c.drawImage(this.off,0,0,W,H);
        // church: glowing windows, swinging bell, tolling rings
        const fl0=.85+.15*Math.sin(t*7)+.08*Math.sin(t*13);
        c.save();c.globalCompositeOperation='lighter';
        for(const wn of cp.wins){c.globalAlpha=.55*fl0;c.fillStyle='#ffb347';c.fillRect(wn[0],wn[1],6*cp.cs,12*cp.cs);c.globalAlpha=.4*fl0;c.drawImage(this.gs,wn[0]-10*cp.cs,wn[1]-8*cp.cs,26*cp.cs,26*cp.cs);}
        c.globalAlpha=.5*fl0;c.drawImage(this.gs,cp.door[0]-8*cp.cs,cp.door[1]-8*cp.cs,30*cp.cs,30*cp.cs);
        c.restore();
        const age=this.bt,ang=age<3.2?Math.sin(age*7)*.45*Math.max(0,1-age/3.2):0;
        c.save();c.translate(cp.bx,cp.by-8*cp.cs);c.rotate(ang);c.fillStyle='#c9a24a';c.globalAlpha=.9;
        c.beginPath();c.moveTo(-1.5*cp.cs,-3*cp.cs);c.quadraticCurveTo(-5*cp.cs,0,-5.5*cp.cs,5*cp.cs);c.lineTo(5.5*cp.cs,5*cp.cs);c.quadraticCurveTo(5*cp.cs,0,1.5*cp.cs,-3*cp.cs);c.closePath();c.fill();c.restore();
        for(let k=0;k<3;k++){const ra=age-k*.5;if(age<4&&ra>0&&ra<2.4){c.globalAlpha=.3*(1-ra/2.4);c.strokeStyle='#ffd88a';c.lineWidth=1.5;c.beginPath();c.arc(cp.bx,cp.by-8*cp.cs,ra*70*u,0,6.283);c.stroke();}}
        c.globalAlpha=1;
        // families under the tarp tents: string bulbs + seated relatives
        c.save();c.globalCompositeOperation='lighter';
        for(const b of this.bl){plGlow(c,b.x,b.y+2,7,b.h,.35+.45*Math.abs(Math.sin(t*2.2+b.ph)));}
        c.restore();
        for(const p of this.tp)undasSeat(c,p.x,p.y,p.s,p.dir,t,p.ph,p.mode);
        // visitors walking with candles
        const fls=[];
        for(const k of this.wk){
          const s=u*RS[k.row],yb=H-gh*RY[k.row]+8*s,f=undasWalker(c,k.x,yb,s,k.dir,t,k.ph,true);fls.push([f[0],f[1],s]);
          undasWalker(c,k.x-k.dir*14*s,yb,s*.72,k.dir,t,k.ph+1.3,false);
        }
        // candle glows (additive), then flames. Wind leans them and a strong gust can snuff some.
        const items=[];
        for(const d of this.cd){const o=1-Math.max(0,Math.min(1,(gu-.5)*2.4*d.fr));items.push([d.x,d.y,d.s*2.3,d.ph,o]);}
        for(const f of fls)items.push([f[0],f[1],f[2]*2.3,f[0]*.01,1]);
        c.save();c.globalCompositeOperation='lighter';
        for(const it of items){
          const fl=1+.18*Math.sin(t*9+it[3])+.1*Math.sin(t*15+it[3]*2)+gu*.25*Math.sin(t*31+it[3]),gr=it[2]*3.2;
          c.globalAlpha=Math.max(0,(.3+.2*fl)*it[4]);c.drawImage(this.gs,it[0]-gr,it[1]-gr*1.1,gr*2,gr*2);
        }
        c.restore();c.globalAlpha=1;
        for(const it of items){
          if(it[4]<.12)continue;
          const fl=1+.18*Math.sin(t*9+it[3])+.1*Math.sin(t*15+it[3]*2)+gu*.25*Math.sin(t*31+it[3]);
          undasFlame(c,it[0],it[1],it[2],fl*it[4],w*.8);
        }
        // wisps of smoke
        for(const p of this.pa){c.globalAlpha=Math.max(0,p.l/p.m)*.16;c.fillStyle='#d8d8ee';c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();}
        // souls rising, moths round the candles
        c.save();c.globalCompositeOperation='lighter';
        for(const s of this.so){c.globalAlpha=.3+.5*Math.abs(Math.sin(t*1+s.ph));plGlow(c,s.x,s.y,s.r*5,48,.55);}
        c.restore();
        for(const m of this.mo){
          const x=m.cx+Math.cos(m.a)*m.rx,y=m.cy-8+Math.sin(m.a*1.3)*m.ry,fl=.25+.75*Math.abs(Math.sin(t*28+m.ph));
          c.globalAlpha=.85;c.fillStyle='#ece3cf';c.beginPath();c.ellipse(x-2*fl,y,2.4*fl,1.5,.4,0,6.283);c.ellipse(x+2*fl,y,2.4*fl,1.5,-.4,0,6.283);c.fill();
        }
        // marigold / sampaguita petals
        for(const f of this.pt){c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=f.a;c.fillStyle=f.c;c.beginPath();c.ellipse(0,0,f.s,f.s*.55,0,0,6.283);c.fill();c.restore();}
        // low ground mist
        for(const f of this.fg){c.save();c.translate(f.x,f.y);c.scale(f.w/90,.35);const g=c.createRadialGradient(0,0,0,0,0,90);g.addColorStop(0,'rgba(180,190,230,.10)');g.addColorStop(1,'rgba(180,190,230,0)');c.fillStyle=g;c.globalAlpha=1;c.beginPath();c.arc(0,0,90,0,6.283);c.fill();c.restore();}
        c.globalAlpha=1;
      }
    },
    'hol-rain':{
      init(){this.d=Array.from({length:Math.round(Math.min(220,W*H/6000))},()=>({x:rnd(0,W),y:rnd(0,H),l:rnd(10,24),v:rnd(520,880),a:rnd(.15,.45)}));},
      step(dt){for(const d of this.d){d.y+=d.v*dt;d.x-=d.v*dt*.12;if(d.y>H+20){d.y=-20;d.x=rnd(0,W*1.1);}if(d.x<-20)d.x=W+10;}},
      draw(c){
        c.strokeStyle='#9bd0ff';c.lineWidth=1;
        for(const d of this.d){c.globalAlpha=d.a;c.beginPath();c.moveTo(d.x,d.y);c.lineTo(d.x-d.l*.12,d.y+d.l);c.stroke();}
        const g=c.createLinearGradient(0,H*.7,0,H);g.addColorStop(0,'rgba(155,208,255,0)');g.addColorStop(1,'rgba(155,208,255,.10)');
        c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,H*.7,W,H*.3);
      }
    }
  });

  // ── Round 3: Haunted Graveyard + Christmas Village (drawn BEHIND the UI so text stays readable) ──
  Object.assign(EFFECTS,{
  'hol-haunted':{
    behind:true,
    ghost(first){const dir=Math.random()<.5?1:-1;return{x:first?rnd(0,W):(dir>0?-70:W+70),y:rnd(H*.18,H*.66),vx:dir*rnd(14,32),s:rnd(.9,1.6),ph:rnd(0,6.28),sw:rnd(.5,1),a:rnd(.6,.85)};},
    bat(first){const dir=Math.random()<.5?1:-1;return{x:first?rnd(0,W):(dir>0?-40:W+40),y:rnd(30,H*.55),vx:dir*rnd(45,110),s:rnd(.7,1.3),ph:rnd(0,6.28),wob:rnd(.6,1.6),by:0};},
    init(){
      const dpr=Math.min(window.devicePixelRatio||1,2),gh=Math.max(90,Math.min(170,H*.17));
      const gy=x=>H-gh*.5-Math.sin(x*.004+1)*gh*.14-Math.sin(x*.013)*gh*.05;
      this.gh=gh;
      const L=(document.querySelector('.sidebar,.side')||{}).offsetWidth||0,X=f=>L+(W-L)*f;
      const off=document.createElement('canvas');off.width=Math.round(W*dpr);off.height=Math.round(H*dpr);
      const o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
      // ── moon: lit sphere with maria + halo
      const mx=W*.88,my=Math.max(70,H*.13);
      let g=o.createRadialGradient(mx,my,10,mx,my,150);g.addColorStop(0,'rgba(210,200,255,.26)');g.addColorStop(1,'rgba(210,200,255,0)');
      o.fillStyle=g;o.beginPath();o.arc(mx,my,150,0,6.283);o.fill();
      o.save();o.globalAlpha=.7;o.beginPath();o.arc(mx,my,34,0,6.283);o.clip();
      g=o.createRadialGradient(mx-9,my-9,2,mx,my,36);g.addColorStop(0,'#fffaf0');g.addColorStop(.6,'#ddd6f4');g.addColorStop(1,'#a59dcc');
      o.fillStyle=g;o.fillRect(mx-36,my-36,72,72);
      o.fillStyle='rgba(80,70,130,.3)';[[-11,-7,10,7],[8,8,12,8],[-3,15,6,4],[12,-12,6,5]].forEach(k=>{o.beginPath();o.ellipse(mx+k[0],my+k[1],k[2],k[3],.5,0,6.283);o.fill();});
      o.fillStyle='rgba(255,255,255,.15)';[[-16,8,2.5],[4,-18,2],[15,2,3]].forEach(k=>{o.beginPath();o.arc(mx+k[0],my+k[1],k[2],0,6.283);o.fill();});
      o.restore();o.globalAlpha=1;
      // ── helpers
      const hill=(dy,c1,c2,rim)=>{
        const hg=o.createLinearGradient(0,H-gh*.9,0,H);hg.addColorStop(0,c1);hg.addColorStop(1,c2);
        o.fillStyle=hg;o.beginPath();o.moveTo(0,H);for(let x=0;x<=W+20;x+=16)o.lineTo(x,gy(x)+dy);o.lineTo(W+20,H);o.closePath();o.fill();
        if(rim){o.strokeStyle=rim;o.lineWidth=1.2;o.beginPath();for(let x=0;x<=W+20;x+=16)o[x?'lineTo':'moveTo'](x,gy(x)+dy);o.stroke();}
      };
      const build=(ty,s)=>{
        let h;o.beginPath();
        if(ty===0){const w=26*s;h=40*s;o.moveTo(-w/2,0);o.lineTo(-w/2,-h+w/2);o.bezierCurveTo(-w/2,-h-2*s,w/2,-h-2*s,w/2,-h+w/2);o.lineTo(w/2,0);o.closePath();}
        else if(ty===1){const w=8*s,a=15*s,k=9*s;h=52*s;o.moveTo(-w/2,0);o.lineTo(-w/2,-h+a);o.lineTo(-w/2-k,-h+a);o.lineTo(-w/2-k,-h+a-w);o.lineTo(-w/2,-h+a-w);o.lineTo(-w/2,-h);o.lineTo(w/2,-h);o.lineTo(w/2,-h+a-w);o.lineTo(w/2+k,-h+a-w);o.lineTo(w/2+k,-h+a);o.lineTo(w/2,-h+a);o.lineTo(w/2,0);o.closePath();}
        else if(ty===2){const w=32*s,b=6*s;h=28*s;o.moveTo(-w/2,0);o.lineTo(-w/2,-h+b);o.lineTo(-w/2+b,-h);o.lineTo(w/2-b*2,-h);o.lineTo(w/2,-h+b*1.6);o.lineTo(w/2,0);o.closePath();}
        else{const w=20*s;h=58*s;o.moveTo(-w/2,0);o.lineTo(-w/2+3*s,-h+12*s);o.lineTo(0,-h);o.lineTo(w/2-3*s,-h+12*s);o.lineTo(w/2,0);o.closePath();}
        return h;
      };
      const stone=(x,y,s,ty,tilt,front)=>{
        o.save();o.translate(x,y);o.rotate(tilt);
        o.fillStyle='rgba(0,0,0,.4)';o.beginPath();o.ellipse(9*s,1,18*s,4*s,0,0,6.283);o.fill();
        const h=build(ty,s);
        const sg=o.createLinearGradient(-20*s,0,22*s,0);
        sg.addColorStop(0,front?'#0a0612':'#181030');sg.addColorStop(.55,front?'#1a1229':'#251a3d');sg.addColorStop(1,front?'#3d3159':'#43366c');
        o.fillStyle=sg;o.fill();
        o.save();o.clip();
        for(let i=0;i<46;i++){o.fillStyle=Math.random()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.28)';o.fillRect(rnd(-20*s,20*s),-rnd(0,h),rnd(.6,1.8),rnd(.6,1.8));}
        for(let i=0;i<8;i++){o.fillStyle='rgba(70,105,80,'+rnd(.12,.32)+')';o.beginPath();o.ellipse(rnd(-14*s,14*s),-rnd(0,8*s),rnd(3,8)*s,rnd(2,4)*s,0,0,6.283);o.fill();}
        if(Math.random()<.6){o.strokeStyle='rgba(0,0,0,.6)';o.lineWidth=.8;let cx=rnd(-6,6)*s,cy=-h*rnd(.5,.9);o.beginPath();o.moveTo(cx,cy);for(let k=0;k<4;k++){cx+=rnd(-4,4)*s;cy+=rnd(3,8)*s;o.lineTo(cx,cy);}o.stroke();}
        o.restore();
        build(ty,s);o.strokeStyle=front?'rgba(190,170,255,.3)':'rgba(190,170,255,.12)';o.lineWidth=1;o.stroke();
        if(front&&(ty===0||ty===2)){o.font='bold '+Math.round(8*s)+'px Georgia,serif';o.textAlign='center';const ty2=ty===0?-h*.5:-h*.38;
          o.fillStyle='rgba(190,170,255,.22)';o.fillText('RIP',.7,ty2+.9);o.fillStyle='rgba(0,0,0,.6)';o.fillText('RIP',0,ty2);}
        o.restore();
      };
      const segs=[];
      const tree=(x,y,len,ang,w,d)=>{
        if(d<=0)return;const x2=x+Math.cos(ang)*len,y2=y+Math.sin(ang)*len;segs.push([x,y,x2,y2,w]);
        tree(x2,y2,len*rnd(.7,.84),ang-rnd(.25,.65),w*.68,d-1);tree(x2,y2,len*rnd(.7,.84),ang+rnd(.25,.65),w*.68,d-1);
        if(d>4&&Math.random()<.5)tree(x2,y2,len*.6,ang+rnd(-.2,.2),w*.6,d-2);
        if(d===1)for(let k=0;k<2;k++)segs.push([x2,y2,x2+rnd(-9,9),y2-rnd(3,10),.7]);
      };
      // ── layered scene
      hill(-gh*.14,'#2b1b48','#120a20','rgba(167,139,250,.12)');
      // wrought-iron fence on the back hill
      const fx0=W*.56,fx1=W*.82;o.strokeStyle='#0d0818';o.fillStyle='#0d0818';
      o.lineWidth=1.6;[10,26].forEach(r=>{o.beginPath();for(let x=fx0;x<=fx1;x+=14)o[x===fx0?'moveTo':'lineTo'](x,gy(x)-gh*.14+4-r);o.stroke();});
      for(let x=fx0;x<=fx1;x+=14){const y=gy(x)-gh*.14+4;o.lineWidth=2;o.beginPath();o.moveTo(x,y);o.lineTo(x,y-34);o.stroke();o.beginPath();o.moveTo(x-3,y-34);o.lineTo(x,y-43);o.lineTo(x+3,y-34);o.closePath();o.fill();}
      for(let x=-10;x<W+30;x+=rnd(55,105))stone(x,gy(x)-gh*.14+4,rnd(.6,.85),(Math.random()*4)|0,rnd(-.07,.07),false);
      hill(0,'#150a22','#05020a','rgba(167,139,250,.2)');
      // grass tufts along the crest
      for(let x=0;x<W;x+=4){const y=gy(x)+rnd(0,6);o.strokeStyle=Math.random()<.2?'#1b2c24':'#0a0612';o.lineWidth=1;o.beginPath();o.moveTo(x,y+3);o.quadraticCurveTo(x+rnd(-2,2),y-rnd(3,6),x+rnd(-5,5),y-rnd(6,14));o.stroke();}
      // gnarled trees with moonlit rim
      [X(.03),W*.96].forEach(x=>tree(x,gy(x)+6,gh*.26,-Math.PI/2+rnd(-.12,.12),gh*.07,7));
      o.lineCap='round';o.strokeStyle='#07030b';segs.forEach(s=>{o.lineWidth=s[4];o.beginPath();o.moveTo(s[0],s[1]);o.lineTo(s[2],s[3]);o.stroke();});
      o.strokeStyle='rgba(167,139,250,.22)';segs.forEach(s=>{if(s[4]<1.5)return;o.lineWidth=s[4]*.28;o.beginPath();o.moveTo(s[0]+s[4]*.3,s[1]);o.lineTo(s[2]+s[4]*.3,s[3]);o.stroke();});
      this.cd=[];
      for(let x=L+rnd(20,80);x<W;x+=rnd(95,175)){
        const y=gy(x)+rnd(10,22);
        stone(x,y,rnd(.95,1.4),(Math.random()*4)|0,rnd(-.09,.09),true);
        if(Math.random()<.5&&this.cd.length<9)this.cd.push({x:x+rnd(-34,34),y:y+rnd(8,16),h:rnd(11,19),ph:rnd(0,6.28)});
      }
      this.bg=off;
      this.gs=Array.from({length:Math.max(3,Math.min(6,Math.round(W/300)))},()=>this.ghost(true));
      this.bats=Array.from({length:7},()=>this.bat(true));
      this.fg=Array.from({length:6},()=>({x:rnd(0,W),y:H-gh*rnd(.2,.8),r:rnd(180,320),vx:rnd(5,14)*(Math.random()<.5?-1:1),a:rnd(.07,.12)}));
      this.em=Array.from({length:22},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2),vy:rnd(10,26),ph:rnd(0,6.28),a:rnd(.3,.7)}));
      this.wp=Array.from({length:7},()=>({x:rnd(0,W),y:H-gh*rnd(.4,1.5),ph:rnd(0,6.28),sp:rnd(.4,.9)}));
      this.sm=[];this.sa=0;
      this.rp={x:X(.2),dir:1,wait:0};
    },
    step(dt,t){
      for(let i=0;i<this.gs.length;i++){const g=this.gs[i];g.x+=g.vx*dt;if(g.x<-90||g.x>W+90)this.gs[i]=this.ghost(false);}
      for(let i=0;i<this.bats.length;i++){const b=this.bats[i];b.x+=b.vx*dt;b.by=Math.sin(t*b.wob+b.ph)*34;if(b.x<-60||b.x>W+60)this.bats[i]=this.bat(false);}
      for(const f of this.fg){f.x+=f.vx*dt;if(f.x>W+f.r)f.x=-f.r;if(f.x<-f.r)f.x=W+f.r;}
      for(const e of this.em){e.y-=e.vy*dt;e.x+=Math.sin(t+e.ph)*8*dt;if(e.y<-5){e.y=H+5;e.x=rnd(0,W);}}
      for(const w of this.wp){w.x+=Math.cos(t*w.sp+w.ph)*14*dt;}
      const r=this.rp;
      if(r.wait>0)r.wait-=dt;
      else{
        r.x+=r.dir*30*dt;if((r.dir>0&&r.x>W+140)||(r.dir<0&&r.x<-140)){r.dir=-r.dir;r.wait=rnd(6,14);}
        if(r.x>-60&&r.x<W+60){this.sa+=dt*16;while(this.sa>1&&this.sm.length<44){this.sa--;this.sm.push({x:r.x+rnd(-34,34),y:H-this.gh*.62+rnd(-4,8),vx:-r.dir*rnd(8,22),vy:-rnd(4,14),r:rnd(9,20),l:1});}this.sa%=1;}
      }
      for(let i=this.sm.length-1;i>=0;i--){const p=this.sm[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=dt*8;p.l-=dt*.45;if(p.l<=0)this.sm.splice(i,1);}
    },
    drawGhost(c,g,t){
      const q=17*g.s,x=g.x,y=g.y+Math.sin(t*g.sw+g.ph)*14,dir=g.vx>0?1:-1,al=g.a*(.7+.3*Math.sin(t*1.3+g.ph));
      c.save();
      let gr=c.createRadialGradient(x,y+q*.5,2,x,y+q*.5,q*3);gr.addColorStop(0,'rgba(150,180,255,.25)');gr.addColorStop(1,'rgba(150,180,255,0)');
      c.globalAlpha=al;c.fillStyle=gr;c.beginPath();c.arc(x,y+q*.5,q*3,0,6.283);c.fill();
      for(let i=1;i<=3;i++){c.globalAlpha=al*.16/i;c.fillStyle='#cdd8ff';c.beginPath();c.ellipse(x-dir*q*(.9+i*.8),y+q*(.9+Math.sin(t*2+i+g.ph)*.25),q*(.7-i*.1),q*(.45-i*.07),0,0,6.283);c.fill();}
      c.globalAlpha=al;
      const N=10,bot=y+q*2.1;
      gr=c.createLinearGradient(0,y-q,0,bot+q*.5);gr.addColorStop(0,'rgba(240,244,255,.95)');gr.addColorStop(.55,'rgba(205,218,255,.7)');gr.addColorStop(1,'rgba(180,200,255,0)');
      c.fillStyle=gr;c.beginPath();c.moveTo(x-q,y+q*.4);c.bezierCurveTo(x-q*1.05,y-q*.5,x-q*.6,y-q,x,y-q);c.bezierCurveTo(x+q*.6,y-q,x+q*1.05,y-q*.5,x+q,y+q*.4);
      for(let i=0;i<=N;i++){const sway=Math.sin(t*2.2+i*1.3+g.ph)*q*.25;c.lineTo(x+q-i*q*2/N-dir*sway*.6,bot+(i%2?q*.45:-q*.1)+sway);}
      c.closePath();c.fill();
      c.strokeStyle='rgba(225,232,255,.55)';c.lineCap='round';c.lineWidth=q*.3;
      for(const sd of [-1,1]){const wv=Math.sin(t*2.5+g.ph+sd)*q*.25;c.beginPath();c.moveTo(x+sd*q*.9,y+q*.5);c.quadraticCurveTo(x+sd*q*1.6,y+q*.9+wv,x+sd*q*1.9+dir*q*.3,y+q*.3-wv);c.stroke();}
      c.fillStyle='rgba(8,6,24,.9)';
      for(const sd of [-1,1]){c.beginPath();c.ellipse(x+sd*q*.38,y-q*.05,q*.17,q*.27,sd*.18,0,6.283);c.fill();}
      c.beginPath();c.ellipse(x,y+q*.55,q*.15,q*(.22+.14*Math.sin(t*2+g.ph)),0,0,6.283);c.fill();
      c.restore();
    },
    draw(c,t){
      c.globalAlpha=.95;c.drawImage(this.bg,0,0,W,H);c.globalAlpha=1;
      // ground-hugging fog
      for(const f of this.fg){c.save();c.translate(f.x,f.y);c.scale(1,.42);const g=c.createRadialGradient(0,0,0,0,0,f.r);g.addColorStop(0,'rgba(196,181,253,'+f.a+')');g.addColorStop(1,'rgba(196,181,253,0)');c.fillStyle=g;c.fillRect(-f.r,-f.r,f.r*2,f.r*2);c.restore();}
      // will-o'-wisps
      c.save();c.globalCompositeOperation='lighter';
      for(const w of this.wp){const y=w.y+Math.sin(t*w.sp*2+w.ph)*10,a=.35+.35*Math.sin(t*1.7+w.ph),g=c.createRadialGradient(w.x,y,0,w.x,y,16);g.addColorStop(0,'rgba(140,255,215,'+a+')');g.addColorStop(1,'rgba(140,255,215,0)');c.fillStyle=g;c.beginPath();c.arc(w.x,y,16,0,6.283);c.fill();}
      c.restore();
      // candles
      for(const k of this.cd){
        const fl=.88+.12*Math.sin(t*9+k.ph)+.08*Math.sin(t*21+k.ph*2),sw=Math.sin(t*5+k.ph)*.9,ty=k.y-k.h;
        c.save();c.globalCompositeOperation='lighter';
        c.save();c.translate(k.x,k.y+2);c.scale(1,.38);let g=c.createRadialGradient(0,0,2,0,0,70);g.addColorStop(0,'rgba(255,150,50,'+.22*fl+')');g.addColorStop(1,'rgba(255,150,50,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,70,0,6.283);c.fill();c.restore();
        g=c.createRadialGradient(k.x,ty-4,1,k.x,ty-4,46);g.addColorStop(0,'rgba(255,170,70,'+.28*fl+')');g.addColorStop(1,'rgba(255,170,70,0)');c.fillStyle=g;c.fillRect(k.x-46,ty-50,92,92);
        c.restore();
        c.fillStyle='#2b2236';c.beginPath();c.ellipse(k.x,k.y,8,2.2,0,0,6.283);c.fill();
        g=c.createLinearGradient(k.x-4,0,k.x+4,0);g.addColorStop(0,'#bfb08a');g.addColorStop(.5,'#f3e8c6');g.addColorStop(1,'#a89a74');
        c.fillStyle=g;c.fillRect(k.x-4,ty,8,k.h);
        c.fillStyle='#fff3cf';c.beginPath();c.ellipse(k.x,ty,4,1.4,0,0,6.283);c.fill();
        c.fillStyle='#f3e8c6';c.fillRect(k.x+2.2,ty,1.6,k.h*.45);c.fillRect(k.x-3.6,ty,1.3,k.h*.3);
        c.strokeStyle='#1a1008';c.lineWidth=1;c.beginPath();c.moveTo(k.x,ty);c.lineTo(k.x+sw*.3,ty-3.5);c.stroke();
        const fx2=k.x+sw*.5,fy=ty-3.5,fh=10*fl;
        c.fillStyle='rgba(255,130,40,.85)';c.beginPath();c.moveTo(fx2,fy);c.bezierCurveTo(fx2-4,fy-fh*.35,fx2-2.5,fy-fh*.8,fx2+sw*.7,fy-fh);c.bezierCurveTo(fx2+2.5,fy-fh*.8,fx2+4,fy-fh*.35,fx2,fy);c.fill();
        c.fillStyle='#ffc247';c.beginPath();c.moveTo(fx2,fy);c.bezierCurveTo(fx2-2.4,fy-fh*.3,fx2-1.5,fy-fh*.6,fx2+sw*.4,fy-fh*.72);c.bezierCurveTo(fx2+1.5,fy-fh*.6,fx2+2.4,fy-fh*.3,fx2,fy);c.fill();
        c.fillStyle='rgba(120,160,255,.7)';c.beginPath();c.ellipse(fx2,fy-.8,1.2,1.8,0,0,6.283);c.fill();
      }
      // smoke trail
      for(const p of this.sm){const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);g.addColorStop(0,'rgba(120,90,190,'+.2*p.l+')');g.addColorStop(1,'rgba(120,90,190,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();}
      // grim reaper
      const r=this.rp,s=Math.max(.9,Math.min(1.25,H/800)),d=r.dir,x=r.x,y=H-this.gh*.62+Math.sin(t*1.1)*6;
      const ea=Math.max(0,Math.min(1,Math.min(x+30,W-x+30)/180));
      if(ea>0){
        c.save();c.globalAlpha=ea*.96;c.lineCap='round';c.lineJoin='round';
        let g=c.createRadialGradient(x,y-50*s,5,x,y-50*s,105*s);g.addColorStop(0,'rgba(124,58,237,.32)');g.addColorStop(1,'rgba(124,58,237,0)');
        c.fillStyle=g;c.beginPath();c.arc(x,y-50*s,105*s,0,6.283);c.fill();
        // scythe: curved wooden shaft + steel blade
        const px=x+d*36*s,pt=y-134*s;
        g=c.createLinearGradient(x,0,px,0);g.addColorStop(0,'#4a3826');g.addColorStop(1,'#7a5f40');
        c.strokeStyle=g;c.lineWidth=3.2*s;c.beginPath();c.moveTo(x+d*22*s,y+14*s);c.quadraticCurveTo(x+d*34*s,y-60*s,px,pt);c.stroke();
        g=c.createLinearGradient(px,pt,px+d*66*s,pt+34*s);g.addColorStop(0,'#8e99bd');g.addColorStop(1,'#eef1ff');
        c.fillStyle=g;c.beginPath();c.moveTo(px,pt+7*s);c.quadraticCurveTo(px+d*36*s,pt-24*s,px+d*68*s,pt+36*s);c.quadraticCurveTo(px+d*40*s,pt-3*s,px,pt+15*s);c.closePath();c.fill();
        c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1;c.beginPath();c.moveTo(px,pt+7*s);c.quadraticCurveTo(px+d*36*s,pt-24*s,px+d*68*s,pt+36*s);c.stroke();
        const gl=Math.pow(Math.max(0,Math.sin(t*.9)),10);
        if(gl>.05){c.strokeStyle='rgba(255,255,255,'+gl+')';c.lineWidth=1.2;const gx=px+d*60*s,gy2=pt+26*s;c.beginPath();c.moveTo(gx-7*s,gy2);c.lineTo(gx+7*s,gy2);c.moveTo(gx,gy2-7*s);c.lineTo(gx,gy2+7*s);c.stroke();}
        // tattered cloak
        g=c.createLinearGradient(x-44*s,0,x+44*s,0);g.addColorStop(0,'#07030c');g.addColorStop(.5,'#1a1030');g.addColorStop(1,'#07030c');
        c.fillStyle=g;c.strokeStyle='rgba(167,139,250,.4)';c.lineWidth=1.2;
        c.beginPath();c.moveTo(x,y-106*s);c.quadraticCurveTo(x-28*s,y-100*s,x-30*s,y-80*s);c.quadraticCurveTo(x-38*s,y-60*s,x-42*s,y-30*s);c.lineTo(x-44*s,y);
        for(let i=0;i<=8;i++){const hx=x-44*s+i*11*s-d*(8+Math.sin(t*1.7+i)*5)*s,hy=y+((i%2)?14:2)*s+Math.sin(t*2.4+i*.9)*4*s+(i%3)*3*s;c.lineTo(hx,hy);}
        c.lineTo(x+44*s,y-30*s);c.quadraticCurveTo(x+38*s,y-60*s,x+30*s,y-80*s);c.quadraticCurveTo(x+28*s,y-100*s,x,y-106*s);c.closePath();c.fill();c.stroke();
        c.strokeStyle='rgba(167,139,250,.13)';c.lineWidth=1;
        for(const fo of [-24,-8,10,26]){c.beginPath();c.moveTo(x+fo*.5*s,y-64*s);c.quadraticCurveTo(x+fo*s+d*4*s,y-30*s,x+fo*1.2*s,y+4*s);c.stroke();}
        // hood interior with faint skull
        const hx0=x+d*4*s,hy0=y-79*s;
        c.fillStyle='#000';c.beginPath();c.ellipse(hx0,hy0,14*s,19*s,0,0,6.283);c.fill();
        c.fillStyle='rgba(222,214,196,.3)';c.beginPath();c.ellipse(hx0,hy0-3*s,9*s,10*s,0,0,6.283);c.fill();c.beginPath();c.rect(hx0-5*s,hy0+4*s,10*s,6*s);c.fill();
        c.fillStyle='rgba(0,0,0,.9)';c.beginPath();c.moveTo(hx0,hy0+1*s);c.lineTo(hx0-1.6*s,hy0+4.5*s);c.lineTo(hx0+1.6*s,hy0+4.5*s);c.fill();
        c.strokeStyle='rgba(0,0,0,.8)';c.lineWidth=.8;for(const tx of [-3,0,3]){c.beginPath();c.moveTo(hx0+tx*s,hy0+6*s);c.lineTo(hx0+tx*s,hy0+10*s);c.stroke();}
        for(const q of [-4.5,4.5]){
          const ex=hx0+q*s,ey=hy0-3*s;
          c.fillStyle='#000';c.beginPath();c.ellipse(ex,ey,3.2*s,3.8*s,0,0,6.283);c.fill();
          g=c.createRadialGradient(ex,ey,0,ex,ey,9*s);g.addColorStop(0,'rgba(255,90,54,.95)');g.addColorStop(1,'rgba(255,90,54,0)');
          c.fillStyle=g;c.beginPath();c.arc(ex,ey,9*s,0,6.283);c.fill();
          c.fillStyle='#ffe0b0';c.beginPath();c.arc(ex,ey,1.2*s,0,6.283);c.fill();
        }
        // skeletal hand gripping the shaft + sleeve
        const hx=x+d*30*s,hy=y-58*s;
        c.strokeStyle='#0d0716';c.lineWidth=10*s;c.beginPath();c.moveTo(x+d*14*s,y-68*s);c.lineTo(hx-d*3*s,hy);c.stroke();
        c.fillStyle='#d9d1bd';c.beginPath();c.ellipse(hx,hy,4*s,3*s,0,0,6.283);c.fill();
        c.strokeStyle='#d9d1bd';c.lineWidth=1.8*s;
        for(let i=0;i<4;i++){c.beginPath();c.moveTo(hx-d*2*s,hy-4.5*s+i*3*s);c.quadraticCurveTo(hx+d*7*s,hy-6*s+i*3*s,hx+d*5.5*s,hy-3.5*s+i*3*s);c.stroke();}
        // hanging arm with bony fingers
        const ax=x-d*22*s,ay=y-36*s;
        c.strokeStyle='#0d0716';c.lineWidth=9*s;c.beginPath();c.moveTo(x-d*18*s,y-64*s);c.quadraticCurveTo(ax-d*4*s,y-50*s,ax,ay);c.stroke();
        c.strokeStyle='#d9d1bd';c.lineWidth=1.5*s;
        for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(ax+i*1.5*s,ay+2*s);c.lineTo(ax+i*3.5*s,ay+9*s);c.stroke();}
        c.restore();
      }
      // ghosts
      for(const g of this.gs)this.drawGhost(c,g,t);
      // bats with ribbed, scalloped wings
      for(const b of this.bats){
        const flap=Math.sin(t*14+b.ph)*.55+.1,s2=b.s*14,bx=b.x,by=b.y+b.by;
        c.fillStyle='#05020a';c.strokeStyle='rgba(167,139,250,.3)';c.lineWidth=.8;c.globalAlpha=.95;
        for(const sd of [-1,1]){
          const wx=bx+sd*s2*.9,wy=by-s2*(.9+flap),tx=bx+sd*s2*2.1,ty=by-s2*(.1+flap*.8);
          c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+sd*s2*.4,by-s2*(.8+flap),wx,wy);c.quadraticCurveTo(wx+sd*s2*.6,wy-s2*.1,tx,ty);
          c.quadraticCurveTo(tx-sd*s2*.3,ty+s2*.7,bx+sd*s2*1.5,by+s2*.45);c.quadraticCurveTo(bx+sd*s2*1.2,by+s2*.15,bx+sd*s2*1.0,by+s2*.5);c.quadraticCurveTo(bx+sd*s2*.6,by+s2*.2,bx+sd*s2*.4,by+s2*.5);c.lineTo(bx,by+s2*.3);c.closePath();c.fill();c.stroke();
          c.beginPath();c.moveTo(wx,wy);c.lineTo(bx+sd*s2*1.5,by+s2*.45);c.moveTo(wx,wy);c.lineTo(bx+sd*s2*1.0,by+s2*.5);c.stroke();
        }
        c.beginPath();c.ellipse(bx,by+s2*.05,s2*.28,s2*.42,0,0,6.283);c.fill();c.beginPath();c.arc(bx,by-s2*.4,s2*.24,0,6.283);c.fill();
        c.beginPath();c.moveTo(bx-s2*.2,by-s2*.55);c.lineTo(bx-s2*.15,by-s2*.9);c.lineTo(bx-s2*.02,by-s2*.6);c.moveTo(bx+s2*.2,by-s2*.55);c.lineTo(bx+s2*.15,by-s2*.9);c.lineTo(bx+s2*.02,by-s2*.6);c.fill();
        c.fillStyle='#ff4d4d';c.fillRect(bx-s2*.13,by-s2*.42,1.4,1.4);c.fillRect(bx+s2*.1,by-s2*.42,1.4,1.4);
      }
      // embers
      c.fillStyle='#fb923c';
      for(const m of this.em){c.globalAlpha=m.a*(.6+.4*Math.sin(t*3+m.ph));c.beginPath();c.arc(m.x,m.y,m.r,0,6.283);c.fill();}
    }
  },
  'hol-xmasvillage':{
    behind:true,
    flake(first){const r=rnd(.6,3.4);return{x:rnd(0,W),y:first?rnd(0,H):-6,r,vy:14+r*13,ph:rnd(0,6.28),sw:rnd(.4,1.1),a:rnd(.5,.95)};},
    init(){
      const dpr=Math.min(window.devicePixelRatio||1,2),gh=Math.max(110,Math.min(200,H*.2)),sc=Math.max(.8,Math.min(1.3,gh/150));
      const gy=x=>H-gh*.5-Math.sin(x*.0035+.6)*gh*.12-Math.sin(x*.012)*gh*.04;
      this.gh=gh;
      const L=(document.querySelector('.sidebar,.side')||{}).offsetWidth||0,X=f=>L+(W-L)*f;
      const off=document.createElement('canvas');off.width=Math.round(W*dpr);off.height=Math.round(H*dpr);
      const o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
      const COL=['#ff4d4d','#ffd84d','#4dd2ff','#66ff88','#ff8ad8'];
      this.lt=[];this.win=[];
      // ── moon
      const mx=W*.88,my=Math.max(70,H*.13);
      let g=o.createRadialGradient(mx,my,10,mx,my,150);g.addColorStop(0,'rgba(220,230,255,.26)');g.addColorStop(1,'rgba(220,230,255,0)');
      o.fillStyle=g;o.beginPath();o.arc(mx,my,150,0,6.283);o.fill();
      o.save();o.globalAlpha=.75;o.beginPath();o.arc(mx,my,32,0,6.283);o.clip();
      g=o.createRadialGradient(mx-8,my-8,2,mx,my,34);g.addColorStop(0,'#fffdf4');g.addColorStop(.7,'#e4e8f8');g.addColorStop(1,'#b4bddf');
      o.fillStyle=g;o.fillRect(mx-34,my-34,68,68);
      o.fillStyle='rgba(110,120,170,.25)';[[-10,-6,9,6],[8,9,11,7],[11,-12,5,4]].forEach(k=>{o.beginPath();o.ellipse(mx+k[0],my+k[1],k[2],k[3],.5,0,6.283);o.fill();});
      o.restore();o.globalAlpha=1;
      // ── helpers
      const hill=(dy,c1,c2,rim)=>{
        const hg=o.createLinearGradient(0,H-gh*.9,0,H);hg.addColorStop(0,c1);hg.addColorStop(1,c2);
        o.fillStyle=hg;o.beginPath();o.moveTo(0,H);for(let x=0;x<=W+20;x+=16)o.lineTo(x,gy(x)+dy);o.lineTo(W+20,H);o.closePath();o.fill();
        o.strokeStyle=rim;o.lineWidth=1.3;o.beginPath();for(let x=0;x<=W+20;x+=16)o[x?'lineTo':'moveTo'](x,gy(x)+dy);o.stroke();
      };
      const pine=(x,y,h,dark,lit,snowA,lights,nl)=>{
        const n=5,hh=h*.3,tiers=[];
        o.fillStyle='#2b1a12';o.fillRect(x-h*.03,y-h*.06,h*.06,h*.08);
        for(let i=n-1;i>=0;i--){
          const yt=y-h+i*h*.17,w=h*.12+i*h*.075,yb=yt+hh;tiers.push({yt,yb,w});
          const gr=o.createLinearGradient(x-w,0,x+w,0);gr.addColorStop(0,dark);gr.addColorStop(1,lit);
          o.fillStyle=gr;o.beginPath();o.moveTo(x,yt);o.lineTo(x+w,yb);o.quadraticCurveTo(x,yb-hh*.12,x-w,yb);o.closePath();o.fill();
          const ex=x+w*.55,ey=yt+hh*.55,sw=w*1.1/4;
          o.fillStyle='rgba(226,236,255,'+snowA+')';o.beginPath();o.moveTo(x,yt-1);o.lineTo(ex,ey);
          for(let k=0;k<4;k++)o.quadraticCurveTo(ex-(k+.5)*sw,ey+hh*.1,ex-(k+1)*sw,ey);
          o.closePath();o.fill();
          if(lights)for(let j=0;j<nl;j++){const u=rnd(-.85,.85)*w;this.lt.push({x:x+u,y:yb-hh*.06*(1-(u/w)*(u/w))-1,c:pick(COL),ph:rnd(0,6.28),sp:rnd(1,3)});}
        }
        return tiers;
      };
      const gift=(x,y,w,h,col,rib)=>{
        o.fillStyle=col;o.fillRect(x,y-h,w,h);o.fillStyle='rgba(0,0,0,.25)';o.fillRect(x+w*.7,y-h,w*.3,h);
        o.fillStyle=rib;o.fillRect(x+w*.42,y-h,w*.16,h);o.fillRect(x,y-h*.58,w,h*.16);
        o.beginPath();o.ellipse(x+w*.4,y-h-2,w*.16,w*.1,-.4,0,6.283);o.ellipse(x+w*.6,y-h-2,w*.16,w*.1,.4,0,6.283);o.fill();
      };
      const cabin=(cx,by,k)=>{
        const w=130*k,h=64*k,x0=cx-w/2;
        o.fillStyle='rgba(205,220,250,.5)';o.beginPath();o.ellipse(cx,by+3*k,w*.62,9*k,0,0,6.283);o.fill();
        const chx=cx+w*.22;o.fillStyle='#5a4a52';o.fillRect(chx,by-h-58*k,16*k,40*k);o.fillStyle='rgba(235,242,255,.95)';o.fillRect(chx-2*k,by-h-62*k,20*k,6*k);
        this.ch={x:chx+8*k,y:by-h-64*k};
        const bgd=o.createLinearGradient(0,by-h,0,by);bgd.addColorStop(0,'#5c3a24');bgd.addColorStop(1,'#35200f');o.fillStyle=bgd;o.fillRect(x0,by-h,w,h);
        o.strokeStyle='rgba(0,0,0,.35)';o.lineWidth=1;for(let y=by-h+8*k;y<by;y+=8*k){o.beginPath();o.moveTo(x0,y);o.lineTo(x0+w,y);o.stroke();}
        o.fillStyle='#6d4629';[x0,x0+w].forEach(ex=>{for(let y=by-h+4*k;y<by;y+=8*k){o.beginPath();o.ellipse(ex,y,3.2*k,4*k,0,0,6.283);o.fill();}});
        const rg=o.createLinearGradient(x0,0,x0+w,0);rg.addColorStop(0,'#2d2236');rg.addColorStop(1,'#4a3a58');
        o.fillStyle=rg;o.beginPath();o.moveTo(x0-12*k,by-h+3*k);o.lineTo(cx,by-h-52*k);o.lineTo(x0+w+12*k,by-h+3*k);o.closePath();o.fill();
        o.fillStyle='rgba(232,240,255,.95)';o.beginPath();o.moveTo(x0-15*k,by-h+6*k);o.lineTo(cx,by-h-58*k);o.lineTo(x0+w+15*k,by-h+6*k);o.lineTo(x0+w+11*k,by-h+14*k);
        for(let x=x0+w+11*k;x>x0-11*k;x-=12*k)o.quadraticCurveTo(x-6*k,by-h+19*k,x-12*k,by-h+14*k);
        o.closePath();o.fill();
        o.fillStyle='rgba(215,232,255,.85)';for(let x=x0-8*k;x<x0+w+8*k;x+=7*k){const L=rnd(5,13)*k;o.beginPath();o.moveTo(x,by-h+13*k);o.lineTo(x+3*k,by-h+13*k);o.lineTo(x+1.5*k,by-h+13*k+L);o.closePath();o.fill();}
        o.fillStyle='#2a170e';o.beginPath();o.moveTo(cx-11*k,by);o.lineTo(cx-11*k,by-28*k);o.quadraticCurveTo(cx,by-40*k,cx+11*k,by-28*k);o.lineTo(cx+11*k,by);o.fill();
        o.strokeStyle='#1f7a45';o.lineWidth=3*k;o.beginPath();o.arc(cx,by-24*k,6*k,0,6.283);o.stroke();o.fillStyle='#d6202b';o.beginPath();o.arc(cx,by-18*k,2.4*k,0,6.283);o.fill();
        for(const sd of [-1,1]){const wx=cx+sd*w*.34-11*k,wy=by-h*.82;this.win.push({x:wx,y:wy,w:22*k,h:20*k,ph:rnd(0,6.28),k});
          o.fillStyle='#1a1020';o.fillRect(wx,wy,22*k,20*k);o.strokeStyle='#2a170e';o.lineWidth=2*k;o.strokeRect(wx,wy,22*k,20*k);o.fillStyle='rgba(235,242,255,.95)';o.fillRect(wx-2*k,wy+20*k,26*k,3*k);}
      };
      const lamp=(x,y,k)=>{
        const ph=70*k;for(let i=0;i<7;i++){o.fillStyle=i%2?'#f5f5f5':'#d6202b';o.fillRect(x-2*k,y-ph+i*ph/7,4*k,ph/7+.5);}
        o.strokeStyle='#d6202b';o.lineWidth=4*k;o.beginPath();o.arc(x+7*k,y-ph,7*k,Math.PI,0);o.stroke();
        o.fillStyle='#2a2030';o.fillRect(x+10*k,y-ph+2*k,8*k,12*k);this.lp={x:x+14*k,y:y-ph+8*k};
      };
      const snowman=(x,y,k)=>{
        const R=[17,12,8.5],cy=[y-17*k,y-42*k,y-59.5*k];
        o.fillStyle='rgba(0,0,0,.3)';o.beginPath();o.ellipse(x+5*k,y,22*k,4*k,0,0,6.283);o.fill();
        for(let i=0;i<3;i++){const r=R[i]*k,gr=o.createRadialGradient(x+r*.35,cy[i]-r*.35,1,x,cy[i],r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.6,'#c4d0ee');gr.addColorStop(1,'#7e90c2');o.fillStyle=gr;o.beginPath();o.arc(x,cy[i],r,0,6.283);o.fill();}
        o.strokeStyle='#4a2f1f';o.lineWidth=1.7*k;o.lineCap='round';for(const sd of [-1,1]){o.beginPath();o.moveTo(x+sd*10*k,cy[1]);o.lineTo(x+sd*26*k,cy[1]-9*k);o.moveTo(x+sd*20*k,cy[1]-6*k);o.lineTo(x+sd*24*k,cy[1]-13*k);o.stroke();}
        o.fillStyle='#16101c';[[-3,-2],[3,-2]].forEach(p=>{o.beginPath();o.arc(x+p[0]*k,cy[2]+p[1]*k,1.1*k,0,6.283);o.fill();});[-6,0,6].forEach(p=>{o.beginPath();o.arc(x,cy[1]+p*k,1.3*k,0,6.283);o.fill();});
        o.fillStyle='#f97316';o.beginPath();o.moveTo(x+1*k,cy[2]+1*k);o.lineTo(x+12*k,cy[2]+3*k);o.lineTo(x+1*k,cy[2]+4*k);o.fill();
        o.strokeStyle='#d6202b';o.lineWidth=4*k;o.beginPath();o.arc(x,cy[2]+7*k,6.5*k,.2,Math.PI-.2);o.stroke();o.fillStyle='#d6202b';o.fillRect(x+3*k,cy[2]+8*k,5*k,13*k);
        o.fillStyle='#15101a';o.beginPath();o.ellipse(x,cy[2]-7*k,10*k,2.6*k,0,0,6.283);o.fill();o.fillRect(x-6*k,cy[2]-19*k,12*k,12*k);o.fillStyle='#d6202b';o.fillRect(x-6*k,cy[2]-11*k,12*k,2.5*k);
      };
      // ── layered scene
      hill(-gh*.16,'#32426f','#1c2544','rgba(210,225,255,.25)');
      const cabX=X(.74);
      for(let x=-10;x<W+30;x+=rnd(60,120))if(Math.abs(x-cabX)>95)pine(x,gy(x)-gh*.16+8,rnd(60,95),'#0d1c34','#1d3a5e',.6,false,0);
      cabin(cabX,gy(cabX)-gh*.16+16,Math.max(.8,sc));
      hill(0,'#4a5d8f','#1e2748','rgba(235,242,255,.45)');
      for(let i=0;i<170;i++){const x=rnd(0,W),y=gy(x)+rnd(3,gh*.5);o.fillStyle='rgba(255,255,255,'+rnd(.15,.55)+')';o.fillRect(x,y,1.2,1.2);}
      const skip=[[X(.07),95],[cabX,100],[X(.4),45],[X(.56),35]];
      for(let x=rnd(10,50);x<W;x+=rnd(110,190))if(!skip.some(s=>Math.abs(x-s[0])<s[1]))pine(x,gy(x)+rnd(10,22),rnd(110,165)*sc,'#07261b','#1c6247',.92,Math.random()<.6,3);
      // hero decorated tree + presents
      const hx=X(.07),hy=gy(hx)+12,hh=gh*1.55,T=pine(hx,hy,hh,'#06281c','#1f7a4f',.85,true,4);
      T.forEach(t=>{
        const x0=hx-t.w*.75,x2=hx+t.w*.75,yy=t.yb-(t.yb-t.yt)*.15,cy=t.yb+(t.yb-t.yt)*.08;
        o.strokeStyle='#e8c35a';o.lineWidth=1.8;o.beginPath();o.moveTo(x0,yy);o.quadraticCurveTo(hx,cy,x2,yy);o.stroke();
        [.2,.5,.8].forEach(u=>{const bx=(1-u)*(1-u)*x0+2*(1-u)*u*hx+u*u*x2,by=(1-u)*(1-u)*yy+2*(1-u)*u*cy+u*u*yy+3,r=Math.max(3,hh*.017),c0=pick(['#e11d2e','#2563eb','#f5c542','#a855f7']);
          const gr=o.createRadialGradient(bx-r*.35,by-r*.35,.5,bx,by,r);gr.addColorStop(0,'#fff');gr.addColorStop(.35,c0);gr.addColorStop(1,'rgba(0,0,0,.6)');o.fillStyle=gr;o.beginPath();o.arc(bx,by,r,0,6.283);o.fill();o.fillStyle='#e8c35a';o.fillRect(bx-1.3,by-r-2,2.6,2.6);});
      });
      this.star={x:hx,y:hy-hh-4};
      gift(hx-48*sc,hy+6,22*sc,18*sc,'#c81d25','#f5d36b');gift(hx+22*sc,hy+7,26*sc,14*sc,'#1f7a4f','#f5f5f5');gift(hx+6*sc,hy+8,16*sc,24*sc,'#2563eb','#f5d36b');
      snowman(X(.4),gy(X(.4))+14,sc);lamp(X(.56),gy(X(.56))+12,sc);
      this.bg=off;
      this.sf=Array.from({length:Math.round(Math.min(260,W*H/7000))},()=>this.flake(true));
      this.st=Array.from({length:70},()=>({x:rnd(0,W),y:rnd(0,H*.5),r:rnd(.5,1.4),ph:rnd(0,6.28),sp:rnd(1,3)}));
      this.ag=[0,1,2].map(i=>{const gr=ctx.createLinearGradient(0,0,0,H*.45);const c=[['80,255,170','90,140,255'],['120,255,210','190,110,255'],['90,255,140','70,200,255']][i];gr.addColorStop(0,'rgba('+c[0]+',0)');gr.addColorStop(.3,'rgba('+c[0]+',1)');gr.addColorStop(.65,'rgba('+c[1]+',.6)');gr.addColorStop(1,'rgba('+c[1]+',0)');return gr;});
      this.sk=[];this.ska=0;this.tr=[];this.ta=0;this.ss=null;
      this.sn={x:W*.15,dir:1,wait:0};
    },
    sy(x){return H*.17+Math.sin(x*.006)*H*.04;},
    step(dt,t){
      for(let i=0;i<this.sf.length;i++){const f=this.sf[i];f.y+=f.vy*dt;f.x+=(Math.sin(t*f.sw+f.ph)*14+Math.sin(t*.3)*10)*dt;if(f.y>H+6){this.sf[i]=this.flake(false);}if(f.x>W+8)f.x=-8;if(f.x<-8)f.x=W+8;}
      const sn=this.sn,s=Math.max(.9,Math.min(1.25,H/800));
      if(sn.wait>0)sn.wait-=dt;
      else{
        sn.x+=sn.dir*95*dt;if((sn.dir>0&&sn.x>W+420)||(sn.dir<0&&sn.x<-420)){sn.dir=-sn.dir;sn.wait=rnd(14,26);}
        this.ta+=dt*45;while(this.ta>1&&this.tr.length<90){this.ta--;this.tr.push({x:sn.x-sn.dir*60*s,y:this.sy(sn.x)+8*s+rnd(-6,6),vx:-sn.dir*rnd(4,16),vy:rnd(6,26),l:1,r:rnd(.8,2.2),c:Math.random()<.6?'#ffe08a':'#ffffff'});}this.ta%=1;
      }
      for(let i=this.tr.length-1;i>=0;i--){const p=this.tr[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt*.55;if(p.l<=0)this.tr.splice(i,1);}
      if(this.ch){this.ska+=dt*8;while(this.ska>1&&this.sk.length<40){this.ska--;this.sk.push({x:this.ch.x+rnd(-2,2),y:this.ch.y,vx:rnd(6,14),vy:-rnd(12,22),r:rnd(4,8),l:1});}this.ska%=1;}
      for(let i=this.sk.length-1;i>=0;i--){const p=this.sk[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=dt*5;p.l-=dt*.35;if(p.l<=0)this.sk.splice(i,1);}
      if(!this.ss&&Math.random()<dt*.04)this.ss={x:rnd(W*.1,W*.9),y:rnd(0,H*.25),vx:rnd(300,500),vy:rnd(120,220),l:1};
      if(this.ss){const p=this.ss;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt*1.4;if(p.l<=0)this.ss=null;}
    },
    deer(c,x,y,ph,t,lead){
      c.save();c.translate(x,y+Math.sin(t*8+ph)*1.5);c.lineCap='round';
      c.strokeStyle='#24150f';c.lineWidth=2.4;
      [[10,0],[7,2],[-9,3.14],[-12,5]].forEach(l=>{const a=Math.sin(t*8+ph+l[1])*.9,kx=l[0]+Math.sin(a)*6;c.beginPath();c.moveTo(l[0],4);c.lineTo(kx,12);c.lineTo(kx+Math.sin(a-.7)*6-2,20-Math.max(0,Math.sin(a+1))*3);c.stroke();});
      const bg=c.createLinearGradient(0,-8,0,8);bg.addColorStop(0,'#4a2e20');bg.addColorStop(1,'#2a1810');c.fillStyle=bg;c.strokeStyle='rgba(255,214,150,.3)';c.lineWidth=.8;
      c.beginPath();c.ellipse(0,0,16,7.5,0,0,6.283);c.fill();c.stroke();c.beginPath();c.ellipse(10,1,7,6.5,0,0,6.283);c.fill();
      c.beginPath();c.moveTo(10,-4);c.lineTo(16,-16);c.lineTo(22,-14);c.lineTo(15,2);c.fill();
      c.beginPath();c.ellipse(23,-15,5.5,3.4,.4,0,6.283);c.fill();c.beginPath();c.ellipse(27.5,-13,3,2.2,.5,0,6.283);c.fill();c.beginPath();c.ellipse(19,-19,1.6,3,-.5,0,6.283);c.fill();
      c.fillStyle='#efe6d6';c.beginPath();c.ellipse(-16,-3,3,2.2,0,0,6.283);c.fill();
      c.strokeStyle='#6b4a30';c.lineWidth=1.4;c.beginPath();c.moveTo(21,-18);c.quadraticCurveTo(18,-28,23,-34);c.moveTo(20,-23);c.lineTo(25,-26);c.moveTo(20,-26);c.lineTo(14,-29);c.moveTo(22,-31);c.lineTo(27,-32);c.stroke();
      c.strokeStyle='#d6202b';c.lineWidth=2;c.beginPath();c.moveTo(13,-6);c.lineTo(18,-10);c.stroke();
      if(lead){c.save();c.globalCompositeOperation='lighter';const gl=.7+.3*Math.sin(t*5),g=c.createRadialGradient(30.5,-12.5,0,30.5,-12.5,13);g.addColorStop(0,'rgba(255,60,50,'+gl+')');g.addColorStop(1,'rgba(255,60,50,0)');c.fillStyle=g;c.beginPath();c.arc(30.5,-12.5,13,0,6.283);c.fill();c.restore();c.fillStyle='#ff3b30';c.beginPath();c.arc(30.5,-12.5,2.2,0,6.283);c.fill();}
      c.restore();
    },
    draw(c,t){
      const star5=(x,y,r1,r2)=>{c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?r2:r1;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();};
      // aurora + stars (behind the hills)
      c.save();c.globalCompositeOperation='lighter';
      for(let b=0;b<3;b++)for(let x=0;x<=W;x+=10){const ph=x*.004+t*.12*(b+1)+b*2,top=H*(.05+.05*b)+Math.sin(ph)*H*.05,hh=H*(.16+.06*Math.sin(x*.003+t*.2+b));c.globalAlpha=Math.max(0,.05+.035*Math.sin(x*.006+t*.3+b));c.fillStyle=this.ag[b];c.fillRect(x,top,10,hh);}
      c.restore();c.fillStyle='#fff';
      for(const s of this.st){c.globalAlpha=.25+.55*Math.abs(Math.sin(t*s.sp+s.ph));c.beginPath();c.arc(s.x,s.y,s.r,0,6.283);c.fill();}
      c.globalAlpha=.97;c.drawImage(this.bg,0,0,W,H);c.globalAlpha=1;
      // cabin windows + light on the snow
      for(const w of this.win){
        const fl=.88+.1*Math.sin(t*7+w.ph)+.05*Math.sin(t*17+w.ph*2),cx=w.x+w.w/2;
        c.save();c.globalCompositeOperation='lighter';c.translate(cx,w.y+w.h+14*w.k);c.scale(1,.55);const g=c.createRadialGradient(0,0,2,0,0,62);g.addColorStop(0,'rgba(255,190,90,'+.2*fl+')');g.addColorStop(1,'rgba(255,190,90,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,62,0,6.283);c.fill();c.restore();
        const pg=c.createLinearGradient(0,w.y,0,w.y+w.h);pg.addColorStop(0,'#ffd98a');pg.addColorStop(1,'#ff9d42');c.globalAlpha=Math.min(1,fl);c.fillStyle=pg;c.fillRect(w.x,w.y,w.w,w.h);c.globalAlpha=1;
        c.strokeStyle='#2a170e';c.lineWidth=1.5*w.k;c.beginPath();c.moveTo(cx,w.y);c.lineTo(cx,w.y+w.h);c.moveTo(w.x,w.y+w.h/2);c.lineTo(w.x+w.w,w.y+w.h/2);c.stroke();
      }
      // lamp glow, string lights, tree-top star
      c.save();c.globalCompositeOperation='lighter';
      const lf=.9+.1*Math.sin(t*6),lg=c.createRadialGradient(this.lp.x,this.lp.y,1,this.lp.x,this.lp.y,48);lg.addColorStop(0,'rgba(255,200,110,'+.5*lf+')');lg.addColorStop(1,'rgba(255,200,110,0)');c.fillStyle=lg;c.beginPath();c.arc(this.lp.x,this.lp.y,48,0,6.283);c.fill();
      for(const L of this.lt){const a=.55+.45*Math.sin(t*(2+L.sp)+L.ph);c.fillStyle=L.c;c.globalAlpha=.16*a;c.beginPath();c.arc(L.x,L.y,7,0,6.283);c.fill();c.globalAlpha=.35*a;c.beginPath();c.arc(L.x,L.y,3.6,0,6.283);c.fill();c.globalAlpha=.4+.6*a;c.beginPath();c.arc(L.x,L.y,1.7,0,6.283);c.fill();}
      const sp=.85+.15*Math.sin(t*4),sg=c.createRadialGradient(this.star.x,this.star.y,2,this.star.x,this.star.y,40);sg.addColorStop(0,'rgba(255,226,122,'+.6*sp+')');sg.addColorStop(1,'rgba(255,226,122,0)');c.globalAlpha=1;c.fillStyle=sg;c.beginPath();c.arc(this.star.x,this.star.y,40,0,6.283);c.fill();
      c.restore();c.fillStyle='#ffe27a';star5(this.star.x,this.star.y,10,4.4);
      // chimney smoke
      for(const p of this.sk){const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);g.addColorStop(0,'rgba(200,210,235,'+.22*p.l+')');g.addColorStop(1,'rgba(200,210,235,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();}
      // shooting star
      if(this.ss){const p=this.ss,n=Math.hypot(p.vx,p.vy),g=c.createLinearGradient(p.x,p.y,p.x-p.vx/n*90,p.y-p.vy/n*90);g.addColorStop(0,'rgba(255,255,255,'+p.l+')');g.addColorStop(1,'rgba(255,255,255,0)');c.strokeStyle=g;c.lineWidth=1.6;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx/n*90,p.y-p.vy/n*90);c.stroke();}
      // sleigh trail
      c.save();c.globalCompositeOperation='lighter';
      for(const p of this.tr){c.globalAlpha=p.l*.9;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();c.globalAlpha=p.l*.18;c.beginPath();c.arc(p.x,p.y,p.r*3.5,0,6.283);c.fill();}
      c.restore();c.globalAlpha=1;
      // Santa's sleigh and reindeer
      const sn=this.sn,s=Math.max(.9,Math.min(1.25,H/800));
      if(sn.wait<=0){
        c.save();c.translate(sn.x,this.sy(sn.x)+Math.sin(t*2)*3);c.scale(sn.dir*s,s);c.lineCap='round';c.lineJoin='round';
        c.save();c.globalCompositeOperation='lighter';let g=c.createRadialGradient(0,-10,5,0,-10,150);g.addColorStop(0,'rgba(255,215,130,.16)');g.addColorStop(1,'rgba(255,215,130,0)');c.fillStyle=g;c.beginPath();c.arc(0,-10,150,0,6.283);c.fill();c.restore();
        c.strokeStyle='rgba(232,195,90,.8)';c.lineWidth=1;c.beginPath();c.moveTo(54,-6);for(let i=0;i<4;i++)c.lineTo(99+i*54,-6-i*3+3);c.stroke();
        for(let i=3;i>=0;i--)this.deer(c,105+i*54,-6-i*3,i*1.3,t,i===3);
        c.strokeStyle='#e8c35a';c.lineWidth=2;c.beginPath();c.moveTo(-46,17);c.lineTo(44,17);c.quadraticCurveTo(60,17,58,2);c.moveTo(-26,10);c.lineTo(-26,17);c.moveTo(14,10);c.lineTo(14,17);c.stroke();
        g=c.createLinearGradient(0,-16,0,14);g.addColorStop(0,'#d6202b');g.addColorStop(1,'#80101a');c.fillStyle=g;c.strokeStyle='#e8c35a';c.lineWidth=1.4;
        c.beginPath();c.moveTo(-44,-16);c.lineTo(-38,8);c.quadraticCurveTo(0,16,44,8);c.quadraticCurveTo(58,0,56,-14);c.quadraticCurveTo(44,-8,36,-10);c.lineTo(-30,-10);c.closePath();c.fill();c.stroke();
        c.fillStyle='#8b5e34';c.beginPath();c.ellipse(-34,-24,10,10,0,0,6.283);c.fill();c.fillStyle='#c81d25';c.fillRect(-32,-38,7,7);c.fillStyle='#1f7a4f';c.fillRect(-39,-36,6,6);
        c.fillStyle='#d41f2b';c.beginPath();c.ellipse(-6,-20,9,11,0,0,6.283);c.fill();c.fillStyle='#fff';c.fillRect(-15,-12,18,3);
        c.fillStyle='#f3c9a6';c.beginPath();c.arc(-4,-36,5,0,6.283);c.fill();c.fillStyle='#fff';c.beginPath();c.ellipse(-2.5,-32,5,4.5,0,0,6.283);c.fill();
        c.fillStyle='#d41f2b';c.beginPath();c.moveTo(-10,-38);c.lineTo(0,-39);c.quadraticCurveTo(-2,-50,-14,-51);c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.ellipse(-5,-38.5,6,2,0,0,6.283);c.fill();c.beginPath();c.arc(-15,-51,2.6,0,6.283);c.fill();
        c.strokeStyle='#d41f2b';c.lineWidth=4;c.beginPath();c.moveTo(0,-22);c.lineTo(14,-16);c.stroke();
        c.restore();
      }
      // snowfall in front of everything
      c.fillStyle='#fff';
      for(const f of this.sf){c.globalAlpha=f.a;c.beginPath();c.arc(f.x,f.y,f.r,0,6.283);c.fill();if(f.r>2.2){c.globalAlpha=f.a*.18;c.beginPath();c.arc(f.x,f.y,f.r*2.3,0,6.283);c.fill();}}
    }
  }
  });

  // ── Round 3: world holidays ─────────────────────────────────────────────
  // ramadan · eid · holi · hanukkah · midautumn · july4 · phindep · dayofdead
  function crescent(c,x,y,r,col){
    c.save();c.beginPath();c.rect(-5,-5,W+10,H+10);c.arc(x+r*.42,y-r*.1,r*.84,0,6.283);c.clip('evenodd');
    c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();c.restore();
  }
  function glow(c,x,y,r,rgb,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();}
  const mkStars=(n,ym)=>Array.from({length:n},()=>({x:rnd(0,W),y:rnd(0,H*ym),r:rnd(.5,1.6),ph:rnd(0,6.28),sp:rnd(1,3)}));
  function twinkle(c,arr,t,col){c.fillStyle=col;for(const s of arr){c.globalAlpha=.2+.7*Math.abs(Math.sin(t*s.sp+s.ph));c.beginPath();c.arc(s.x,s.y,s.r,0,6.283);c.fill();}c.globalAlpha=1;}
  function hexa(c,x,y,r){c.beginPath();for(let k=0;k<2;k++){for(let i=0;i<3;i++){const a=-Math.PI/2+k*Math.PI/3+i*2.0944;c[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();}c.stroke();}
  function marigold(c,x,y,r,rot,col){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=col;for(let i=0;i<8;i++){c.rotate(.7854);c.beginPath();c.ellipse(r*.55,0,r*.55,r*.28,0,0,6.283);c.fill();}c.fillStyle='#b45309';c.beginPath();c.arc(0,0,r*.2,0,6.283);c.fill();c.restore();}
  function fanous(c,x,y,w,h,col,fl){
    glow(c,x,y,w*3.4,'255,196,96',.3*fl);
    const g=c.createRadialGradient(x,y,1,x,y,w);g.addColorStop(0,'#fff1b8');g.addColorStop(1,col);
    c.fillStyle=g;c.strokeStyle='#e6b94a';c.lineWidth=1.3;c.beginPath();
    c.moveTo(x-w*.25,y-h*.9);c.lineTo(x+w*.25,y-h*.9);c.lineTo(x+w*.5,y-h*.55);c.lineTo(x+w,y);c.lineTo(x+w*.5,y+h*.55);c.lineTo(x+w*.25,y+h*.8);
    c.lineTo(x-w*.25,y+h*.8);c.lineTo(x-w*.5,y+h*.55);c.lineTo(x-w,y);c.lineTo(x-w*.5,y-h*.55);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(x,y-h*.55);c.lineTo(x,y+h*.55);c.moveTo(x-w*.5,y-h*.55);c.lineTo(x-w*.5,y+h*.55);c.moveTo(x+w*.5,y-h*.55);c.lineTo(x+w*.5,y+h*.55);c.stroke();
    c.fillStyle='#e6b94a';c.beginPath();c.arc(x,y+h*.8+5,2.4,0,6.283);c.fill();
  }
  function fwInit(o){o.rk=[];o.sp=[];o.nx=.3;}
  function fwStep(o,dt,cols){
    o.nx-=dt;
    if(o.nx<=0){o.nx=rnd(.6,1.5);o.rk.push({x:rnd(W*.1,W*.9),y:H+10,ty:rnd(H*.15,H*.5),c:pick(cols)});}
    for(let i=o.rk.length-1;i>=0;i--){const r=o.rk[i];r.y-=360*dt;if(r.y<=r.ty){const v0=rnd(80,200),c2=pick(cols);for(let k=0;k<64;k++){const a=k/64*6.283,v=v0*(.55+.45*Math.random());o.sp.push({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c:Math.random()<.7?r.c:c2});}o.rk.splice(i,1);}}
    for(let i=o.sp.length-1;i>=0;i--){const p=o.sp[i];p.vy+=80*dt;p.vx*=.985;p.vy*=.99;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt*.75;if(p.l<=0)o.sp.splice(i,1);}
  }
  function fwDraw(c,o){
    for(const r of o.rk){c.globalAlpha=1;c.fillStyle=r.c;c.fillRect(r.x-1,r.y,2,14);}
    c.save();c.globalCompositeOperation='lighter';
    for(const p of o.sp){c.globalAlpha=Math.max(0,p.l);c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,2.2*p.l+.6,0,6.283);c.fill();}
    c.restore();c.globalAlpha=1;
  }
  const EIDC=['#fbbf24','#34d399','#f8fafc','#2dd4bf'],J4C=['#ef4444','#f8fafc','#3b82f6','#fbbf24'],HOLIC=['#ec4899','#facc15','#22d3ee','#84cc16','#a855f7','#f97316'];
  Object.assign(EFFECTS,{
    // Ramadan — crescent moon, twinkling stars, swaying fanous lanterns
    'hol-ramadan':{behind:true,
      init(){this.st=mkStars(90,.8);const n=Math.max(4,Math.round(W/260));this.ln=Array.from({length:n},(_,i)=>({x:W*(i+.5)/n+rnd(-30,30),len:rnd(70,190),s:rnd(.8,1.25),ph:rnd(0,6.28),c:pick(['#f59e0b','#ef4444','#22c55e','#38bdf8','#e879f9'])}));},
      step(){},
      draw(c,t){
        twinkle(c,this.st,t,'#fff7d6');
        const mx=W*.82,my=H*.2,mr=Math.min(W,H)*.09;
        glow(c,mx,my,mr*3.2,'253,224,130',.28);crescent(c,mx,my,mr,'#fde68a');c.fillStyle='#fde68a';star(c,mx+mr*.62,my-mr*.1,mr*.22,mr*.09);
        for(const l of this.ln){
          c.save();c.translate(l.x,0);c.rotate(Math.sin(t*.8+l.ph)*.07);
          c.strokeStyle='rgba(253,230,138,.55)';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.lineTo(0,l.len-24*l.s);c.stroke();
          fanous(c,0,l.len,15*l.s,26*l.s,l.c,.85+.15*Math.sin(t*5+l.ph));c.restore();
        }
      }},
    // Eid — gold & emerald fireworks, drifting crescents and stars
    'hol-eid':{
      init(){fwInit(this);this.f=Array.from({length:34},()=>({x:rnd(0,W),y:rnd(0,H),s:rnd(5,12),vy:rnd(14,34),ph:rnd(0,6.28),sw:rnd(.5,1.2),k:Math.random()<.5,a:rnd(.4,.85)}));},
      step(dt,t){fwStep(this,dt,EIDC);for(const f of this.f){f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*12*dt;if(f.y>H+14){f.y=-14;f.x=rnd(0,W);}}},
      draw(c){for(const f of this.f){c.globalAlpha=f.a;c.fillStyle='#fcd34d';if(f.k)crescent(c,f.x,f.y,f.s,'#fcd34d');else star(c,f.x,f.y,f.s*.7,f.s*.3);}c.globalAlpha=1;fwDraw(c,this);}
    },
    // Holi — festival of colours: powder bursts
    'hol-holi':{
      init(){this.b=[];this.nx=.1;},
      step(dt){
        this.nx-=dt;
        if(this.nx<=0){this.nx=rnd(.35,.9);const x=rnd(W*.08,W*.92),y=rnd(H*.15,H*.8),c1=pick(HOLIC),c2=pick(HOLIC);for(let k=0;k<70;k++){const a=rnd(0,6.283),v=rnd(30,230)*Math.random();this.b.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,r:rnd(3,9),l:1,dl:rnd(.25,.5),c:Math.random()<.6?c1:c2});}}
        const d=Math.pow(.04,dt);
        for(let i=this.b.length-1;i>=0;i--){const p=this.b[i];p.vx*=d;p.vy=p.vy*d+30*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=dt*6;p.l-=dt*p.dl;if(p.l<=0)this.b.splice(i,1);}
      },
      draw(c){c.save();c.globalCompositeOperation='lighter';for(const p of this.b){c.globalAlpha=Math.max(0,p.l)*.38;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();}c.restore();}
    },
    // Hanukkah — glowing menorah, drifting silver stars of David
    'hol-hanukkah':{behind:true,
      init(){this.st=mkStars(80,.8);this.h=Array.from({length:26},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(5,13),vy:rnd(10,28),ph:rnd(0,6.28),sw:rnd(.4,1),a:rnd(.25,.6)}));},
      step(dt,t){for(const h of this.h){h.y+=h.vy*dt;h.x+=Math.sin(t*h.sw+h.ph)*10*dt;if(h.y>H+16){h.y=-16;h.x=rnd(0,W);}}},
      draw(c,t){
        twinkle(c,this.st,t,'#dbe6ff');
        c.lineWidth=1.4;c.strokeStyle='#93c5fd';for(const h of this.h){c.globalAlpha=h.a;hexa(c,h.x,h.y,h.r);}c.globalAlpha=1;
        const sc=Math.max(.7,Math.min(1.6,H/700)),cx=W*.5,by=H*.94,Y=i=>{const u=(i-4)/4;return by-70*sc-u*u*55*sc;};
        glow(c,cx,by-130*sc,280*sc,'250,204,21',.10);
        c.strokeStyle='#d9a93a';c.lineWidth=4*sc;c.lineCap='round';
        c.beginPath();c.moveTo(cx-60*sc,by);c.lineTo(cx+60*sc,by);c.moveTo(cx,by);c.lineTo(cx,by-70*sc);c.stroke();
        c.beginPath();for(let i=0;i<9;i++)c[i?'lineTo':'moveTo'](cx+(i-4)*46*sc,Y(i));c.stroke();
        for(let i=0;i<9;i++){const x=cx+(i-4)*46*sc,h=(i===4?150:80)*sc;c.fillStyle='#dbe6ff';c.fillRect(x-4*sc,Y(i)-h,8*sc,h);flame(c,x,Y(i)-h-6*sc,5*sc,.9+.1*Math.sin(t*9+i*1.7));}
      }},
    // Mid-Autumn — huge harvest moon and rising lanterns
    'hol-midautumn':{behind:true,
      init(){this.st=mkStars(70,.7);this.ln=Array.from({length:Math.max(6,Math.round(W/150))},()=>this.lan(true));},
      lan(first){return{x:rnd(0,W),y:first?rnd(0,H):H+40,s:rnd(.6,1.3),vy:rnd(10,24),ph:rnd(0,6.28),c:pick(['#fb923c','#f59e0b','#ef4444','#fbbf24'])};},
      step(dt){for(let i=0;i<this.ln.length;i++){const l=this.ln[i];l.y-=l.vy*dt;if(l.y<-50)this.ln[i]=this.lan(false);}},
      draw(c,t){
        twinkle(c,this.st,t,'#fff3d0');
        const mx=W*.72,my=H*.26,mr=Math.min(W,H)*.14;
        glow(c,mx,my,mr*3,'255,236,170',.22);glow(c,mx,my,mr*1.6,'255,244,200',.3);
        const g=c.createRadialGradient(mx-mr*.25,my-mr*.25,mr*.1,mx,my,mr);g.addColorStop(0,'#fffbe6');g.addColorStop(1,'#f6dc8a');
        c.fillStyle=g;c.beginPath();c.arc(mx,my,mr,0,6.283);c.fill();
        c.fillStyle='rgba(180,150,80,.16)';[[-.3,-.1,.22],[.25,.2,.28],[.05,-.4,.14],[-.1,.35,.12]].forEach(k=>{c.beginPath();c.arc(mx+k[0]*mr,my+k[1]*mr,k[2]*mr,0,6.283);c.fill();});
        for(const l of this.ln){
          const x=l.x+Math.sin(t*.7+l.ph)*8,r=11*l.s,fl=.85+.15*Math.sin(t*4+l.ph);
          glow(c,x,l.y,r*3.2,'255,170,80',.3*fl);
          const g2=c.createRadialGradient(x,l.y,1,x,l.y,r*1.2);g2.addColorStop(0,'#fff1b8');g2.addColorStop(1,l.c);
          c.fillStyle=g2;c.beginPath();c.ellipse(x,l.y,r,r*1.15,0,0,6.283);c.fill();
          c.fillStyle='#b45309';c.fillRect(x-r*.45,l.y-r*1.25,r*.9,r*.25);c.fillRect(x-r*.45,l.y+r*1.05,r*.9,r*.25);
          c.strokeStyle='#fbbf24';c.lineWidth=1.2;c.beginPath();c.moveTo(x,l.y+r*1.3);c.lineTo(x,l.y+r*1.3+10*l.s);c.stroke();
        }
      }},
    // Independence Day (US) — red, white & blue fireworks and falling stars
    'hol-july4':{
      init(){fwInit(this);this.s=Array.from({length:36},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(4,9),vy:rnd(20,55),rot:rnd(0,6.28),vr:rnd(-2,2),sw:rnd(.5,1.4),ph:rnd(0,6.28),c:pick(J4C),a:rnd(.5,.9)}));},
      step(dt,t){fwStep(this,dt,J4C);for(const s of this.s){s.y+=s.vy*dt;s.x+=Math.sin(t*s.sw+s.ph)*14*dt;s.rot+=s.vr*dt;if(s.y>H+12){s.y=-12;s.x=rnd(0,W);}}},
      draw(c){for(const s of this.s){c.save();c.translate(s.x,s.y);c.rotate(s.rot);c.globalAlpha=s.a;c.fillStyle=s.c;star(c,0,0,s.r,s.r*.4);c.restore();}c.globalAlpha=1;fwDraw(c,this);}
    },
    // Día de los Muertos — falling marigolds and glowing sparks
    'hol-dayofdead':{
      // Día de los Muertos: swaying papel picado banners, an ofrenda row of decorated sugar skulls,
      // glowing veladora candles and marigold clusters along the bottom, monarch butterflies (said to carry
      // the souls home), falling cempasúchil petals and drifting sparks. Everything is procedural.
      init(){
        const u=this.u=Math.max(.8,Math.min(1.25,H/800));
        this.f=Array.from({length:Math.round(Math.min(46,W*H/26000))},()=>this.fl(true));
        this.sp=Array.from({length:40},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2),vy:rnd(10,26),ph:rnd(0,6.28),a:rnd(.3,.8)}));
        // papel picado: pre-render a few cut-paper flags (cut-outs made with destination-out on their own canvas)
        const cols=['#ec4899','#f97316','#14b8a6','#a855f7','#facc15','#22c55e','#ef4444','#38bdf8'];
        const fw=Math.round(46*u),fh=Math.round(fw*.8),dpr=Math.min(window.devicePixelRatio||1,2);
        this.fw=fw;this.fh=fh;
        this.flags=cols.map((col,i)=>{
          const cv2=document.createElement('canvas');cv2.width=Math.round(fw*dpr);cv2.height=Math.round(fh*dpr);
          const o=cv2.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);
          o.fillStyle=col;o.fillRect(0,0,fw,fh*.88);
          o.beginPath();o.moveTo(0,fh*.88);for(let k=0;k<5;k++){o.lineTo((k+.5)*fw/5,fh);o.lineTo((k+1)*fw/5,fh*.88);}o.closePath();o.fill();
          o.fillStyle='rgba(255,255,255,.35)';o.fillRect(0,0,fw,3);
          o.globalCompositeOperation='destination-out';
          const cx=fw/2,cy=fh*.42;
          if(i%3===0){o.beginPath();o.arc(cx,cy,fw*.17,0,6.283);o.fill();for(let k=0;k<8;k++){const a=k/8*6.283;o.beginPath();o.arc(cx+Math.cos(a)*fw*.3,cy+Math.sin(a)*fw*.3,fw*.04,0,6.283);o.fill();}}
          else if(i%3===1){[[0,-.2],[.22,0],[0,.2],[-.22,0]].forEach(d=>{o.beginPath();o.moveTo(cx+d[0]*fw,cy+d[1]*fw-fw*.1);o.lineTo(cx+d[0]*fw+fw*.08,cy+d[1]*fw);o.lineTo(cx+d[0]*fw,cy+d[1]*fw+fw*.1);o.lineTo(cx+d[0]*fw-fw*.08,cy+d[1]*fw);o.closePath();o.fill();});o.beginPath();o.arc(cx,cy,fw*.07,0,6.283);o.fill();}
          else{o.beginPath();o.ellipse(cx,cy-fw*.06,fw*.17,fw*.2,0,0,6.283);o.fill();o.fillRect(cx-fw*.11,cy+fw*.12,fw*.22,fw*.1);   // little skull cut-out
            o.globalCompositeOperation='source-over';o.fillStyle=col;o.beginPath();o.arc(cx-fw*.07,cy-fw*.07,fw*.045,0,6.283);o.arc(cx+fw*.07,cy-fw*.07,fw*.045,0,6.283);o.fill();o.globalCompositeOperation='destination-out';}
          for(let k=0;k<6;k++){o.beginPath();o.arc(fw*(.12+k*.152),fh*.78,1.6,0,6.283);o.fill();}
          o.fillRect(fw*.06,fh*.12,fw*.88,1.6);
          return cv2;});
        this.strings=[{y0:-6,sag:Math.max(28,H*.04),dx:0},{y0:Math.max(30,H*.045),sag:Math.max(34,H*.05),dx:fw*.6}];
        this.fp=[];
        for(const st of this.strings){const n=Math.ceil(W/(fw*1.12));for(let k=0;k<=n;k++){const x=st.dx+k*fw*1.12,q=x/W;if(q>1.02||x<-fw)continue;this.fp.push({x,y:st.y0+st.sag*4*q*(1-q)+2,fi:(this.fp.length*5+(this.fp.length>>3))%this.flags.length,ph:rnd(0,6.28),sw:rnd(.9,1.5)});}}
        // ofrenda along the bottom: sugar skulls, candles and marigold clusters
        this.of=[];let x=rnd(10,40),i=0;
        while(x<W){const kind=['skull','candle','mar','skull','candle','mar','candle'][i++%7];
          const r=kind==='skull'?rnd(22,30)*u:kind==='candle'?rnd(9,12)*u:rnd(16,24)*u;
          this.of.push({k:kind,x:x+r,r,ph:rnd(0,6.28),c:pick(['#ec4899','#14b8a6','#facc15','#a855f7','#f97316']),c2:pick(['#38bdf8','#f472b6','#a3e635','#fb923c'])});
          x+=r*2+rnd(8,26)*u;}
        this.bf=Array.from({length:7},()=>({x:rnd(0,W),y:rnd(H*.15,H*.8),vx:rnd(14,34)*(Math.random()<.5?1:-1),a:rnd(0,6.28),s:rnd(9,15),ph:rnd(0,6.28),sp:rnd(7,11)}));
      },
      fl(first){return{x:rnd(0,W),y:first?rnd(0,H):-20,r:rnd(7,15),vy:rnd(18,50),rot:rnd(0,6.28),vr:rnd(-1.2,1.2),sw:rnd(.4,1.2),ph:rnd(0,6.28),c:pick(['#f97316','#fb923c','#fbbf24','#f59e0b','#ea580c']),a:rnd(.55,.95)};},
      step(dt,t){
        for(let i=0;i<this.f.length;i++){const f=this.f[i];f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*16*dt;f.rot+=f.vr*dt;if(f.y>H+24)this.f[i]=this.fl(false);}
        for(const s of this.sp){s.y-=s.vy*dt;if(s.y<-5){s.y=H+5;s.x=rnd(0,W);}}
        for(const b of this.bf){b.a+=dt*.8;b.x+=b.vx*dt;b.y+=Math.sin(b.a+b.ph)*18*dt-6*dt*Math.sin(t*.3+b.ph);if(b.x>W+30)b.x=-30;if(b.x<-30)b.x=W+30;if(b.y<40)b.y=40;if(b.y>H*.85)b.y=H*.85;}
      },
      draw(c,t){
        c.save();c.globalCompositeOperation='lighter';c.fillStyle='#fdba74';
        for(const s of this.sp){c.globalAlpha=s.a*(.5+.5*Math.sin(t*3+s.ph));c.beginPath();c.arc(s.x,s.y,s.r,0,6.283);c.fill();}
        c.restore();
        for(const f of this.f){c.globalAlpha=f.a;marigold(c,f.x,f.y,f.r,f.rot,f.c);}
        // papel picado + ofrenda, faded so tiles stay visible
        fade(c,.42,c=>{
        c.lineWidth=1.2;c.strokeStyle='rgba(255,230,190,.55)';c.globalAlpha=1;
        for(const st of this.strings){c.beginPath();for(let x=-10;x<=W+10;x+=20){const q=x/W,y=st.y0+st.sag*4*q*(1-q);x<=-10?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}
        for(const p of this.fp){c.save();c.translate(p.x+this.fw/2,p.y);c.rotate(Math.sin(t*p.sw+p.ph)*.12);c.globalAlpha=.9;c.drawImage(this.flags[p.fi],-this.fw/2,0,this.fw,this.fh);c.restore();}
        // ofrenda
        const base=H;
        for(const o of this.of){
          const fl=.8+.2*Math.sin(t*8+o.ph)*Math.sin(t*3.3+o.ph),x=o.x,r=o.r;
          if(o.k==='mar'){for(let k=-1;k<=1;k++)marigold(c,x+k*r*.8,base-r*.55-(k===0?r*.4:0),r*.62,k+o.ph,k===0?'#f59e0b':'#f97316');c.globalAlpha=1;}
          else if(o.k==='candle'){
            const h=r*3.2,y=base-h;
            const gg=c.createRadialGradient(x,y-r*.6,1,x,y-r*.6,r*5);gg.addColorStop(0,'rgba(255,190,80,'+(.5*fl)+')');gg.addColorStop(1,'rgba(255,140,40,0)');
            c.globalAlpha=1;c.fillStyle=gg;c.beginPath();c.arc(x,y-r*.6,r*5,0,6.283);c.fill();
            c.fillStyle='rgba(255,236,190,.85)';c.fillRect(x-r*.5,y,r,h);c.fillStyle='rgba(233,213,255,.9)';c.fillRect(x-r*.5,y+h*.5,r,h*.5);
            c.fillStyle='#fb923c';c.beginPath();c.moveTo(x,y-r*1.5*fl);c.quadraticCurveTo(x+r*.55,y-r*.4,x,y+r*.05);c.quadraticCurveTo(x-r*.55,y-r*.4,x,y-r*1.5*fl);c.fill();
            c.fillStyle='#fff3c4';c.beginPath();c.ellipse(x,y-r*.35,r*.2,r*.45,0,0,6.283);c.fill();
          }else{ // decorated sugar skull
            const y=base-r*1.15,glow=c.createRadialGradient(x,y,r*.4,x,y,r*2.2);glow.addColorStop(0,'rgba(255,170,60,'+(.18*fl)+')');glow.addColorStop(1,'rgba(255,170,60,0)');
            c.globalAlpha=1;c.fillStyle=glow;c.beginPath();c.arc(x,y,r*2.2,0,6.283);c.fill();
            c.fillStyle='#fdf6e3';c.beginPath();c.ellipse(x,y-r*.1,r*.9,r*.95,0,0,6.283);c.fill();
            c.beginPath();c.moveTo(x-r*.55,y+r*.6);c.lineTo(x-r*.5,y+r*1.15);c.lineTo(x+r*.5,y+r*1.15);c.lineTo(x+r*.55,y+r*.6);c.closePath();c.fill();   // jaw
            c.strokeStyle=o.c;c.lineWidth=r*.07;c.beginPath();c.ellipse(x,y-r*.1,r*.84,r*.89,0,0,6.283);c.stroke();
            [-1,1].forEach(d=>{                                        // flower-ringed eye sockets
              const ex=x+d*r*.38,ey=y-r*.12;
              c.fillStyle=o.c;for(let k=0;k<8;k++){const a=k/8*6.283;c.beginPath();c.ellipse(ex+Math.cos(a)*r*.31,ey+Math.sin(a)*r*.31,r*.1,r*.07,a,0,6.283);c.fill();}
              c.fillStyle='#1b0f2a';c.beginPath();c.arc(ex,ey,r*.23,0,6.283);c.fill();
              c.fillStyle=o.c2;c.beginPath();c.arc(ex,ey,r*.06,0,6.283);c.fill();});
            c.fillStyle=o.c2;c.beginPath();c.moveTo(x,y+r*.18);c.lineTo(x-r*.1,y+r*.34);c.lineTo(x+r*.1,y+r*.34);c.closePath();c.fill();      // nose
            c.fillStyle=o.c;for(let k=-2;k<=2;k++){c.beginPath();c.arc(x+k*r*.17,y-r*.62+Math.abs(k)*r*.06,r*.045,0,6.283);c.fill();}               // forehead dots
            c.strokeStyle='#1b0f2a';c.lineWidth=r*.05;c.beginPath();c.moveTo(x-r*.46,y+r*.62);c.lineTo(x+r*.46,y+r*.62);c.stroke();               // smile
            for(let k=-3;k<=3;k++){c.beginPath();c.moveTo(x+k*r*.14,y+r*.55);c.lineTo(x+k*r*.14,y+r*.72);c.stroke();}
            c.strokeStyle=o.c2;c.lineWidth=r*.05;c.beginPath();c.moveTo(x-r*.3,y+r*.95);c.quadraticCurveTo(x,y+r*1.05,x+r*.3,y+r*.95);c.stroke();
          }
        }
        });
        // monarch butterflies
        for(const b of this.bf){
          const fl=Math.abs(Math.sin(t*b.sp+b.ph)),s=b.s,d=b.vx>0?1:-1;
          c.save();c.translate(b.x,b.y);c.rotate(Math.sin(b.a+b.ph)*.25);c.globalAlpha=.92;
          [-1,1].forEach(sd=>{c.save();c.scale(sd*(.25+.75*fl),1);
            c.fillStyle='#f97316';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(s*1.1,-s*1.1,s*1.3,-s*.1);c.quadraticCurveTo(s*.9,s*.15,0,0);c.fill();
            c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(s*.9,s*.1,s*.9,s*.75);c.quadraticCurveTo(s*.3,s*.8,0,0);c.fill();
            c.strokeStyle='#1c1917';c.lineWidth=1.3;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(s*1.1,-s*1.1,s*1.3,-s*.1);c.quadraticCurveTo(s*.9,s*.15,0,0);c.stroke();
            c.fillStyle='#fff';c.beginPath();c.arc(s*1.0,-s*.3,s*.07,0,6.283);c.arc(s*.85,-s*.55,s*.06,0,6.283);c.fill();
            c.restore();});
          c.fillStyle='#1c1917';c.fillRect(-s*.07,-s*.4,s*.14,s*.9);c.restore();
        }
      }}
  });

  // ── Sinulog (Cebu) ─────────────────────────────────────────────────────
  // Rows of red & yellow banderitas strung across the top that dance to a 120-bpm drumbeat,
  // a golden sunburst, festival confetti, and a procession (queen holding the Santo Niño, dancers, drummer).
  // Procession: Sinulog Queen carrying the Santo Niño, flanked by festival dancers and a drummer.
  // Everything is drawn procedurally (no images). The group does the Sinulog step — two steps
  // forward, one step back — locked to the same 120-bpm beat as the banderitas.
  const SKIN='#c98a4b',HAIR='#1c1009',GOLD='#fbbf24',RED='#c81e2d',TEAL='#14b8a6',DTEAL='#0f766e';
  const smooth01=x=>x*x*(3-2*x);
  function sinArm(c,sx,sy,hx,hy,bend,w,col){
    const mx=(sx+hx)/2-(hy-sy)*bend,my=(sy+hy)/2+(hx-sx)*bend;
    c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(mx,my,hx,hy);c.stroke();
  }
  function sinPlume(c,x,y,L,wd,n,spread,t,pal,ph){
    const mid=(n-1)/2;
    for(let i=0;i<n;i++){
      const th=(i-mid)*spread+Math.sin(t*3+i*.8+ph)*.05,l=L*(1-Math.abs(i-mid)/n*.4);
      c.save();c.translate(x,y);c.rotate(th);c.fillStyle=pal[i%pal.length];
      c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(wd,-l*.5,0,-l);c.quadraticCurveTo(-wd,-l*.5,0,0);c.fill();
      c.restore();
    }
  }
  function sinRibbons(c,hx,hy,u,t,ph,cols,dir){
    for(let k=0;k<cols.length;k++){
      c.strokeStyle=cols[k];c.lineWidth=u*.13;c.lineCap='round';c.beginPath();c.moveTo(hx,hy);
      for(let i=1;i<=9;i++){c.lineTo(hx-dir*i*u*.2,hy+Math.sin(t*7-i*.6+ph+k*1.7)*i*u*.045+i*u*.05*k);}
      c.stroke();
    }
    c.fillStyle=GOLD;c.beginPath();c.arc(hx,hy,u*.13,0,6.283);c.fill();
  }
  // The Santo Niño: red cape, golden crown, halo, orb in one hand, blessing with the other.
  function sinSantoNino(c,x,by,s,t,beat){
    c.save();c.globalCompositeOperation='lighter';glow(c,x,by-s*.95,s*(1.9+.35*beat),'251,191,36',.34+.18*beat);c.restore();
    const cy=by-s*1.22;                                                    // head centre
    c.fillStyle=GOLD;c.globalAlpha*=.9;c.beginPath();c.arc(x,cy,s*.6,0,6.283);c.fill();c.globalAlpha/=.9; // halo disc
    c.fillStyle='#fff4c2';c.beginPath();c.arc(x,cy,s*.5,0,6.283);c.fill();
    // cape
    c.fillStyle=RED;c.beginPath();c.moveTo(x-s*.34,by-s*.95);c.lineTo(x+s*.34,by-s*.95);c.lineTo(x+s*.62,by);c.lineTo(x-s*.62,by);c.closePath();c.fill();
    c.fillStyle=GOLD;c.fillRect(x-s*.62,by-s*.14,s*1.24,s*.14);                   // hem
    c.beginPath();c.moveTo(x,by-s*.95);c.lineTo(x+s*.2,by-s*.14);c.lineTo(x-s*.2,by-s*.14);c.closePath();c.fill(); // embroidered front
    c.fillStyle='#fff6e0';for(let i=0;i<3;i++){c.beginPath();c.arc(x,by-s*.7+i*s*.22,s*.045,0,6.283);c.fill();}
    // arms: right raised in blessing, left holding the orb
    sinArm(c,x+s*.3,by-s*.9,x+s*.6,by-s*1.3,.15,s*.17,'#f1c9a0');
    sinArm(c,x-s*.3,by-s*.9,x-s*.55,by-s*.62,-.15,s*.17,'#f1c9a0');
    c.fillStyle=GOLD;c.beginPath();c.arc(x-s*.56,by-s*.62,s*.15,0,6.283);c.fill();
    c.fillRect(x-s*.575,by-s*.9,s*.03,s*.17);c.fillRect(x-s*.64,by-s*.85,s*.17,s*.03);
    // head, curls, crown
    c.fillStyle='#f1c9a0';c.beginPath();c.arc(x,cy,s*.3,0,6.283);c.fill();
    c.fillStyle='#2a160b';for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;c.beginPath();c.arc(x+Math.cos(a)*s*.3,cy+Math.sin(a)*s*.3+s*.04,s*.09,0,6.283);c.fill();}
    c.fillStyle=GOLD;c.beginPath();c.moveTo(x-s*.27,cy-s*.2);
    for(let i=0;i<5;i++){c.lineTo(x-s*.27+i*s*.135+s*.0675,cy-s*.2-s*.24);c.lineTo(x-s*.27+(i+1)*s*.135,cy-s*.2);}
    c.closePath();c.fill();
    c.fillStyle='#ef4444';c.beginPath();c.arc(x,cy-s*.4,s*.06,0,6.283);c.fill();
    c.fillStyle='#3b2412';c.beginPath();c.arc(x-s*.1,cy+s*.02,s*.03,0,6.283);c.arc(x+s*.1,cy+s*.02,s*.03,0,6.283);c.fill();
  }
  function sinShadow(c,x,y,w){c.save();c.globalAlpha*=.28;c.fillStyle='#000';c.beginPath();c.ellipse(x,y+2,w,w*.17,0,0,6.283);c.fill();c.restore();}
  function sinLegs(c,x,y,hipY,u,bi,fr,s0){
    for(const s of [-1,1]){
      const lift=((bi%2===0)===(s<0))?Math.sin(Math.PI*fr)*.55*u:0;
      sinArm(c,x+s*.28*u,hipY,x+s*.4*u,y-lift,.1*s,u*.34,SKIN);
      c.fillStyle='#7c2d12';c.beginPath();c.ellipse(x+s*.4*u+.12*u,y-lift,u*.3,u*.12,0,0,6.283);c.fill();
    }
  }
  function sinDancer(c,o){
    const {x,y,u,t,ph,pal,prop}=o,bt=t*2,bi=Math.floor(bt),fr=bt-bi;
    const bob=-Math.abs(Math.sin(Math.PI*bt))*.28*u,hipY=y-2.5*u+bob,shY=y-4.2*u+bob,hdY=y-5.05*u+bob;
    sinShadow(c,x,y,u*1.1);
    sinLegs(c,x,y,hipY,u,bi,fr);
    // skirt with zig-zag hem
    const sw=Math.sin(t*4+ph)*.1*u,hy=y-1.45*u;
    c.fillStyle=pal.skirt;c.beginPath();c.moveTo(x-.5*u,hipY-.35*u);c.lineTo(x+.5*u,hipY-.35*u);c.lineTo(x+1*u+sw,hy);
    for(let i=0;i<6;i++){c.lineTo(x+(1-i*.4)*u+sw-.2*u,hy+.32*u);c.lineTo(x+(.8-i*.4)*u+sw-.2*u,hy);}
    c.lineTo(x-1*u+sw,hy);c.closePath();c.fill();
    c.fillStyle=GOLD;c.fillRect(x-.98*u+sw,hy-.28*u,1.96*u,.2*u);
    // torso, sash
    c.fillStyle=pal.top;c.beginPath();c.moveTo(x-.62*u,shY);c.lineTo(x+.62*u,shY);c.lineTo(x+.48*u,hipY-.3*u);c.lineTo(x-.48*u,hipY-.3*u);c.closePath();c.fill();
    c.strokeStyle=GOLD;c.lineWidth=u*.2;c.lineCap='butt';c.beginPath();c.moveTo(x-.6*u,shY+.05*u);c.lineTo(x+.45*u,hipY-.35*u);c.stroke();
    // arms (V-shaped, waving on the beat)
    const aL=1.15+.45*Math.sin(t*6.283+ph),aR=1.15+.45*Math.sin(t*6.283+ph+3.14);
    const hL=[x-.6*u-Math.sin(aL)*1.9*u,shY+.15*u-Math.cos(aL)*1.9*u],hR=[x+.6*u+Math.sin(aR)*1.9*u,shY+.15*u-Math.cos(aR)*1.9*u];
    sinArm(c,x-.6*u,shY+.15*u,hL[0],hL[1],-.12,u*.3,SKIN);sinArm(c,x+.6*u,shY+.15*u,hR[0],hR[1],.12,u*.3,SKIN);
    if(prop==='shield'){
      c.save();c.translate(hL[0]-.1*u,hL[1]-.35*u);c.rotate(-.2);c.fillStyle=pal.shield;c.beginPath();c.ellipse(0,0,.55*u,.9*u,0,0,6.283);c.fill();
      c.strokeStyle=GOLD;c.lineWidth=u*.12;c.stroke();c.fillStyle=GOLD;c.beginPath();c.moveTo(0,-.7*u);c.lineTo(.28*u,0);c.lineTo(0,.7*u);c.lineTo(-.28*u,0);c.closePath();c.fill();c.restore();
      sinRibbons(c,hR[0],hR[1],u,t,ph,[pal.rib[0],pal.rib[1]],-1);
    }else{
      sinRibbons(c,hL[0],hL[1],u,t,ph,[pal.rib[0],pal.rib[1]],1);sinRibbons(c,hR[0],hR[1],u,t,ph+1,[pal.rib[1],pal.rib[0]],-1);
    }
    // head, hair, headdress
    c.fillStyle=HAIR;c.beginPath();c.ellipse(x-.12*u,hdY+.1*u,.55*u,.58*u,0,0,6.283);c.fill();
    c.fillStyle=SKIN;c.beginPath();c.arc(x+.05*u,hdY,.43*u,0,6.283);c.fill();
    c.fillStyle=HAIR;c.beginPath();c.arc(x,hdY-.1*u,.46*u,Math.PI*1.02,Math.PI*1.98);c.fill();
    c.fillStyle=GOLD;c.fillRect(x-.45*u,hdY-.36*u,.95*u,.12*u);
    sinPlume(c,x,hdY-.3*u,1.7*u,.38*u,7,.34,t,pal.plume,ph);
  }
  function sinDrummer(c,o){
    const {x,y,u,t}=o,bt=t*2,bi=Math.floor(bt),fr=bt-bi,beat=Math.pow(1-fr,3);
    const bob=-Math.abs(Math.sin(Math.PI*bt))*.28*u,hipY=y-2.5*u+bob,shY=y-4.2*u+bob,hdY=y-5.05*u+bob;
    sinShadow(c,x,y,u*1.1);sinLegs(c,x,y,hipY,u,bi,fr);
    c.fillStyle='#b45309';c.fillRect(x-.55*u,hipY-.3*u,1.1*u,1.5*u);                                  // wrap-around pants
    c.fillStyle=RED;c.beginPath();c.moveTo(x-.62*u,shY);c.lineTo(x+.62*u,shY);c.lineTo(x+.48*u,hipY-.3*u);c.lineTo(x-.48*u,hipY-.3*u);c.closePath();c.fill();
    const dx=x+.8*u,dy=y-2.9*u+bob;                                                                  // drum on a strap
    c.strokeStyle=GOLD;c.lineWidth=u*.1;c.beginPath();c.moveTo(x-.3*u,shY);c.lineTo(dx-.3*u,dy-.3*u);c.stroke();
    c.fillStyle=TEAL;c.fillRect(dx-.45*u,dy-.4*u,.9*u,.8*u);c.fillStyle=GOLD;c.fillRect(dx-.48*u,dy-.42*u,.96*u,.12*u);c.fillRect(dx-.48*u,dy+.3*u,.96*u,.12*u);
    c.fillStyle='#fff6e0';c.beginPath();c.ellipse(dx,dy-.4*u,.45*u,.13*u,0,0,6.283);c.fill();
    if(beat>.15){c.save();c.globalAlpha*=beat*.7;c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.ellipse(dx,dy-.4*u,.45*u*(1+(1-beat)*.8),.13*u*(1+(1-beat)*.8),0,0,6.283);c.stroke();c.restore();}
    const top=dy-.5*u;
    for(const s of [-1,1]){
      const hits=((bi%2===0)===(s<0)),h=hits?top-Math.abs(Math.sin(Math.PI*fr))*.9*u:top-.25*u;
      const hx=dx+s*.22*u;sinArm(c,x+s*.5*u,shY+.2*u,hx,h,.1*s,u*.3,SKIN);
      c.strokeStyle='#f5e6c8';c.lineWidth=u*.08;c.beginPath();c.moveTo(hx,h);c.lineTo(hx+.5*u,h-.45*u);c.stroke();
    }
    c.fillStyle=HAIR;c.beginPath();c.ellipse(x-.12*u,hdY+.1*u,.55*u,.58*u,0,0,6.283);c.fill();
    c.fillStyle=SKIN;c.beginPath();c.arc(x+.05*u,hdY,.43*u,0,6.283);c.fill();
    c.fillStyle=HAIR;c.beginPath();c.arc(x,hdY-.1*u,.46*u,Math.PI*1.02,Math.PI*1.98);c.fill();
    c.fillStyle=RED;c.fillRect(x-.47*u,hdY-.34*u,.97*u,.16*u);                                      // headband
    sinPlume(c,x,hdY-.3*u,1.3*u,.32*u,5,.36,t,[GOLD,RED,TEAL],1);
  }
  function sinQueen(c,o){
    const {x,y:y0,u:u0,t}=o,u=u0*1.08,y=y0,bt=t*2,bi=Math.floor(bt),fr=bt-bi,beat=Math.pow(1-fr,3);
    const bob=-Math.abs(Math.sin(Math.PI*bt))*.2*u,shY=y-4.35*u+bob,hdY=y-5.2*u+bob,waistY=y-3.1*u+bob;
    sinShadow(c,x,y,u*1.7);
    // radiant back-piece (a sunburst of teal and gold)
    const wy=shY+.2*u,R=u*(2.35+.06*beat);
    for(let i=0;i<13;i++){
      const a0=Math.PI+(-.12+i*(Math.PI+.24)/13),a1=Math.PI+(-.12+(i+1)*(Math.PI+.24)/13);
      c.fillStyle=i%2?GOLD:(i%4===0?DTEAL:TEAL);c.beginPath();c.moveTo(x,wy);c.arc(x,wy,R*(i%2?.88:1),a0,a1);c.closePath();c.fill();
    }
    // gown: bell-shaped red with gold hem and centre panel
    const sw=Math.sin(t*3)*.1*u;
    c.fillStyle=RED;c.beginPath();c.moveTo(x-.5*u,waistY);c.bezierCurveTo(x-.7*u,y-1.8*u,x-1.2*u+sw,y-.9*u,x-1.5*u+sw,y);c.lineTo(x+1.5*u+sw,y);c.bezierCurveTo(x+1.2*u+sw,y-.9*u,x+.7*u,y-1.8*u,x+.5*u,waistY);c.closePath();c.fill();
    c.fillStyle='#fde68a';c.beginPath();c.moveTo(x-.12*u,waistY);c.lineTo(x+.12*u,waistY);c.lineTo(x+.5*u+sw,y);c.lineTo(x-.5*u+sw,y);c.closePath();c.fill();
    c.fillStyle=GOLD;c.fillRect(x-1.5*u+sw,y-.3*u,3*u,.3*u);
    c.fillStyle=TEAL;for(let i=0;i<6;i++){c.beginPath();c.arc(x-1.25*u+i*.5*u+sw,y-.15*u,.08*u,0,6.283);c.fill();}
    // bodice and sash
    c.fillStyle=GOLD;c.beginPath();c.moveTo(x-.62*u,shY);c.lineTo(x+.62*u,shY);c.lineTo(x+.5*u,waistY);c.lineTo(x-.5*u,waistY);c.closePath();c.fill();
    c.fillStyle=TEAL;c.beginPath();c.moveTo(x-.62*u,shY);c.lineTo(x-.3*u,shY);c.lineTo(x+.62*u,waistY);c.lineTo(x+.3*u,waistY);c.closePath();c.fill();
    c.fillStyle=SKIN;c.fillRect(x-.14*u,shY-.4*u,.28*u,.45*u);                                      // neck
    // left arm: graceful wave with a ribbon wand
    const aL=1.2+.4*Math.sin(t*3.14+.6),hLx=x-.6*u-Math.sin(aL)*1.9*u,hLy=shY+.15*u-Math.cos(aL)*1.9*u;
    sinArm(c,x-.6*u,shY+.15*u,hLx,hLy,-.12,u*.3,SKIN);sinRibbons(c,hLx,hLy,u,t,0,[GOLD,'#fff6e0','#ef4444'],1);
    // right arm lifts the Santo Niño
    const hx=x+2.15*u,hy=y-4.55*u+bob+Math.sin(t*3.14)*.05*u;
    sinArm(c,x+.6*u,shY+.15*u,hx,hy,.18,u*.3,SKIN);
    sinSantoNino(c,hx,hy-.04*u,u*1.55,t,beat);
    c.fillStyle=SKIN;c.beginPath();c.arc(hx,hy,u*.2,0,6.283);c.fill();
    // head: long hair, face, crown, tall plume
    c.fillStyle=HAIR;c.beginPath();c.ellipse(x-.2*u,hdY+.3*u,.6*u,.75*u,0,0,6.283);c.fill();
    c.fillStyle=SKIN;c.beginPath();c.arc(x+.04*u,hdY,.43*u,0,6.283);c.fill();
    c.fillStyle=HAIR;c.beginPath();c.arc(x,hdY-.08*u,.46*u,Math.PI*1.02,Math.PI*1.98);c.fill();
    c.fillStyle='#b91c1c';c.beginPath();c.arc(x+.2*u,hdY+.16*u,.06*u,0,6.283);c.fill();               // lips
    c.fillStyle=GOLD;c.beginPath();c.moveTo(x-.46*u,hdY-.25*u);c.lineTo(x-.36*u,hdY-.7*u);c.lineTo(x-.14*u,hdY-.4*u);c.lineTo(x,hdY-.8*u);c.lineTo(x+.14*u,hdY-.4*u);c.lineTo(x+.36*u,hdY-.7*u);c.lineTo(x+.46*u,hdY-.25*u);c.closePath();c.fill();
    sinPlume(c,x,hdY-.55*u,2.5*u,.5*u,11,.24,t,[RED,GOLD,TEAL,'#ffffff',GOLD,'#ef4444'],0);
    c.fillStyle=GOLD;c.beginPath();c.arc(x,hdY-.58*u,.14*u,0,6.283);c.fill();
  }
  // Fluvial parade: the Santo Niño sails on a decorated pump boat with escort boats, past waves and glints.
  function sinBunting(c,x1,y1,x2,y2,sag,t,n,ph,sz){
    const cols=[RED,GOLD,TEAL,'#ffffff',GOLD];
    c.strokeStyle='#7c2d12';c.lineWidth=1;c.beginPath();c.moveTo(x1,y1);c.quadraticCurveTo((x1+x2)/2,(y1+y2)/2+2*sag,x2,y2);c.stroke();
    for(let i=1;i<n;i++){
      const s=i/n,x=x1+(x2-x1)*s,y=y1+(y2-y1)*s+4*sag*s*(1-s),dx=Math.sin(t*4+i*.9+ph)*sz*.18;
      c.fillStyle=cols[i%cols.length];c.beginPath();c.moveTo(x-sz*.3,y);c.lineTo(x+sz*.3,y);c.lineTo(x+dx,y+sz*.8);c.closePath();c.fill();
    }
  }
  function sinPaddler(c,x,y,b,t,col,ph){
    const bob=Math.sin(t*4+ph)*.08*b;
    c.fillStyle=col;c.fillRect(x-.28*b,y-1.0*b+bob,.56*b,1.0*b);
    c.fillStyle=SKIN;c.beginPath();c.arc(x,y-1.28*b+bob,.26*b,0,6.283);c.fill();
    c.fillStyle=HAIR;c.beginPath();c.arc(x,y-1.34*b+bob,.28*b,Math.PI,6.283);c.fill();
    sinPlume(c,x,y-1.5*b+bob,.8*b,.18*b,5,.4,t,[GOLD,RED,TEAL],ph);
    sinArm(c,x+.2*b,y-.85*b+bob,x+.7*b,y-1.5*b+Math.sin(t*6.283+ph)*.3*b,.1,b*.16,SKIN);
  }
  function sinBoat(c,o){
    const {x,wy,b,t,kind,hull,ph}=o,beat=Math.pow(1-((t*2)%1),3),lead=kind==='lead',L=lead?1.2:1;
    c.save();c.translate(x,wy+Math.sin(t*2.1+ph)*.14*b);c.rotate(Math.sin(t*1.5+ph)*.025);
    // outrigger poles + float
    c.strokeStyle='#92400e';c.lineWidth=b*.1;c.lineCap='round';
    for(const px of [-1.7,1.5]){c.beginPath();c.moveTo(px*b*L,-.5*b);c.lineTo(px*b*L-.1*b,.62*b);c.stroke();}
    c.fillStyle='#e8c9a8';c.beginPath();c.ellipse(-.1*b*L,.66*b,2.9*b*L,.2*b,0,0,6.283);c.fill();
    // hull
    c.fillStyle=hull;c.beginPath();c.moveTo(-3.3*b*L,-1*b);c.quadraticCurveTo(-3*b*L,.5*b,-2*b*L,.5*b);c.lineTo(2.5*b*L,.5*b);c.quadraticCurveTo(3.6*b*L,.2*b,4.1*b*L,-1.4*b);c.closePath();c.fill();
    c.strokeStyle=GOLD;c.lineWidth=b*.14;c.beginPath();c.moveTo(-3.1*b*L,-.5*b);c.lineTo(3.7*b*L,-.7*b);c.stroke();
    if(lead){
      // canopy / shrine
      c.fillStyle='rgba(70,10,16,.92)';c.fillRect(-2.3*b,-3.7*b,4.6*b,2.7*b);
      c.save();c.globalCompositeOperation='lighter';glow(c,0,-2.1*b,b*(2.6+.4*beat),'251,191,36',.3+.15*beat);c.restore();
      sinSantoNino(c,0,-1.05*b,b*1.05,t,beat);
      c.fillStyle='#92400e';for(const px of [-2.3,2.1]){c.fillRect(px*b,-3.8*b,.2*b,2.8*b);}
      c.fillStyle=RED;c.beginPath();c.moveTo(-3.1*b,-3.6*b);c.lineTo(3.1*b,-3.6*b);c.lineTo(2.5*b,-4.5*b);c.lineTo(-2.5*b,-4.5*b);c.closePath();c.fill();
      c.fillStyle=GOLD;c.fillRect(-3.1*b,-3.7*b,6.2*b,.16*b);
      c.fillStyle=TEAL;c.beginPath();c.moveTo(-2.1*b,-4.5*b);c.lineTo(2.1*b,-4.5*b);c.lineTo(1.2*b,-5.3*b);c.lineTo(-1.2*b,-5.3*b);c.closePath();c.fill();
      c.fillStyle=GOLD;c.fillRect(-.06*b,-6.1*b,.12*b,.8*b);c.beginPath();c.arc(0,-6.2*b,.2*b,0,6.283);c.fill();
      c.strokeStyle=GOLD;c.lineWidth=b*.1;c.beginPath();c.moveTo(-2.3*b,-3.6*b);c.quadraticCurveTo(0,-2.9*b,2.3*b,-3.6*b);c.stroke();    // garland swag
      sinBunting(c,0,-6.1*b,4.1*b*L,-1.4*b,.7*b,t,13,ph,b*.5);sinBunting(c,0,-6.1*b,-3.3*b*L,-1*b,.7*b,t,13,ph+1,b*.5);
      sinPaddler(c,-2.9*b,-1*b,b*.9,t,'#dc2626',ph);sinPaddler(c,3.4*b,-1.2*b,b*.9,t,'#fbbf24',ph+1.5);
    }else{
      c.strokeStyle='#92400e';c.lineWidth=b*.12;c.beginPath();c.moveTo(0,-1*b);c.lineTo(0,-4.2*b);c.stroke();
      const fl=Math.sin(t*5+ph)*.3*b;c.fillStyle=pickPennant(ph);c.beginPath();c.moveTo(0,-4.2*b);c.lineTo(1.6*b,-3.9*b+fl);c.lineTo(0,-3.4*b);c.closePath();c.fill();
      sinPaddler(c,-1.8*b,-1*b,b,t,'#ef4444',ph);sinPaddler(c,-.2*b,-1*b,b,t,'#14b8a6',ph+1);sinPaddler(c,1.6*b,-1*b,b,t,'#fbbf24',ph+2);
      sinBunting(c,0,-4.2*b,3.9*b,-1.4*b,.6*b,t,10,ph,b*.45);sinBunting(c,0,-4.2*b,-3.1*b,-1*b,.6*b,t,10,ph+1,b*.45);
    }
    c.restore();
  }
  function pickPennant(ph){return ph>2?'#fbbf24':ph>1?'#14b8a6':'#ef4444';}
  function sinWavePath(c,W,top,bot,t,ph,amp){
    c.beginPath();c.moveTo(0,bot);
    for(let x=0;x<=W+8;x+=8)c.lineTo(x,top+Math.sin(x*.022+t*1.3+ph)*amp+Math.sin(x*.05-t*.9+ph)*amp*.5);
    c.lineTo(W+8,bot);c.closePath();
  }
  const SIN=['#fbbf24','#ef4444','#fbbf24','#ef4444','#2dd4bf','#ffffff','#4ade80'];
  Object.assign(EFFECTS,{
    'hol-sinulog':{
      init(){
        this.rows=[{y:4,sag:7,a:.55,ph:rnd(0,6.28)},{y:30,sag:9,a:.48,ph:rnd(0,6.28)},{y:56,sag:11,a:.4,ph:rnd(0,6.28)}];
        this.cf=Array.from({length:Math.round(Math.min(90,W*H/11000))},()=>this.p(true));
        this.u=Math.max(13,Math.min(26,H*.027,W*.02));              // procession scale
        this.pal=[                                                     // dancer costumes (teal / red / yellow / green)
          {skirt:'#dc2626',top:'#14b8a6',shield:'#7f1d1d',rib:['#fbbf24','#ffffff'],plume:['#fbbf24','#ef4444','#14b8a6','#ffffff'],prop:'shield'},
          {skirt:'#0f766e',top:'#fbbf24',shield:'#0f766e',rib:['#ef4444','#fbbf24'],plume:['#ef4444','#fbbf24','#4ade80'],prop:'ribbons'},
          {skirt:'#ca8a04',top:'#dc2626',shield:'#14532d',rib:['#2dd4bf','#ffffff'],plume:['#4ade80','#fbbf24','#ef4444'],prop:'ribbons'},
          {skirt:'#b91c1c',top:'#fbbf24',shield:'#0f766e',rib:['#fbbf24','#ef4444'],plume:['#fbbf24','#14b8a6','#ffffff','#ef4444'],prop:'shield'}];
      },
      p(first){return{x:rnd(0,W),y:first?rnd(0,H):-12,w:rnd(5,10),h:rnd(3,6),vy:rnd(30,80),rot:rnd(0,6.28),vr:rnd(-5,5),sw:rnd(.5,1.5),ph:rnd(0,6.28),c:pick(SIN),o:Math.random()<.2};},
      step(dt,t){for(let i=0;i<this.cf.length;i++){const f=this.cf[i];f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*26*dt;f.rot+=f.vr*dt;if(f.y>H+12)this.cf[i]=this.p(false);}},
      draw(c,t){
        const bp=(t*2)%1,beat=Math.pow(1-bp,3);                         // drumbeat: sharp hit, quick decay
        // golden glow pulsing with the beat
        c.save();c.globalCompositeOperation='lighter';
        const g=c.createRadialGradient(W*.5,0,0,W*.5,0,Math.max(W,H)*.6);g.addColorStop(0,'rgba(251,191,36,'+(.16+.1*beat)+')');g.addColorStop(1,'rgba(251,191,36,0)');
        c.fillStyle=g;c.fillRect(0,0,W,H);c.restore();
        // confetti
        for(const f of this.cf){c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=.9;c.fillStyle=f.c;if(f.o){c.beginPath();c.arc(0,0,f.h,0,6.283);c.fill();}else c.fillRect(-f.w/2,-f.h/2,f.w,f.h);c.restore();}
        // procession along the bottom: two steps forward, one step back, on the beat
        {
          const u=this.u,U=3.1*u,beats=t*2,tau=beats%3;
          const seg=tau<1?smooth01(tau)*U:tau<2?U+smooth01(tau-1)*U:2*U-smooth01(tau-2)*U;
          const span=W*1.5+30*u,gx=((U*beats/3)%span)-15*u+(seg-U*tau/3),gy=H-3.6*u;
          c.globalAlpha=.55;
          sinDancer(c,{x:gx-9*u,y:gy-.3*u,u:u*.96,t,ph:0,pal:this.pal[0],prop:'shield'});
          sinDancer(c,{x:gx-5.6*u,y:gy,u,t,ph:1.1,pal:this.pal[1],prop:'ribbons'});
          sinQueen(c,{x:gx,y:gy,u,t});
          sinDancer(c,{x:gx+5.8*u,y:gy,u,t,ph:2.2,pal:this.pal[2],prop:'ribbons'});
          sinDancer(c,{x:gx+9*u,y:gy-.3*u,u:u*.96,t,ph:3.3,pal:this.pal[3],prop:'shield'});
          sinDrummer(c,{x:gx+12.4*u,y:gy,u:u*.98,t});
        }
        // fluvial parade on the water strip below the shore
        {
          const u=this.u,b=u*.85,T=H-3.4*u,wy=T+1.5*u;
          c.globalAlpha=1;
          const wg=c.createLinearGradient(0,T,0,H);wg.addColorStop(0,'rgba(45,212,191,.30)');wg.addColorStop(1,'rgba(8,47,55,.50)');
          c.fillStyle=wg;sinWavePath(c,W,T,H,t,0,2.5);c.fill();
          c.strokeStyle='rgba(167,243,208,.35)';c.lineWidth=1.2;
          for(let k=0;k<3;k++){c.beginPath();for(let x=0;x<=W+8;x+=8){const y=T+u*(.5+k*.7)+Math.sin(x*.03+t*(1.2+k*.3)+k*2)*2.2;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
          c.save();c.globalCompositeOperation='lighter';c.fillStyle='#fde68a';
          for(let i=0;i<18;i++){const gxp=(i*97.3+t*14*(1+i%3*.3))%W,gyp=T+u*.4+((i*53)%Math.max(1,Math.round(u*2.6)));c.globalAlpha=.5*Math.max(0,Math.sin(t*3+i*1.7));c.fillRect(gxp,gyp,6+i%3*3,1.6);}
          c.restore();
          const span=W*1.4+46*b,fx0=((t*2.4*u+span*.55)%span)-24*b;
          c.globalAlpha=.78;
          sinBoat(c,{x:fx0-18*b,wy:wy+.1*b,b:b*.9,t,kind:'esc',hull:'#0f766e',ph:2.4});
          sinBoat(c,{x:fx0-9*b,wy:wy-.05*b,b:b*.95,t,kind:'esc',hull:'#ca8a04',ph:1.3});
          sinBoat(c,{x:fx0,wy,b,t,kind:'lead',hull:'#dc2626',ph:0});
          sinBoat(c,{x:fx0+11*b,wy:wy+.12*b,b:b*.9,t,kind:'esc',hull:'#b91c1c',ph:.6});
          // water in front of the hulls + foam trailing the lead boat
          c.globalAlpha=1;c.fillStyle='rgba(8,70,80,.42)';sinWavePath(c,W,wy+.12*b,H,t,1.7,2.2);c.fill();
          c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.4;
          for(let k=0;k<5;k++){c.globalAlpha=.5-k*.09;c.beginPath();c.ellipse(fx0-4.2*b*1.2-k*b*.9,wy+.5*b,b*.4,b*.09,0,0,6.283);c.stroke();}
          c.globalAlpha=1;
        }
        // banderitas
        const fw=13,step=15,n=Math.ceil(W/step)+1;
        for(let r=0;r<this.rows.length;r++){
          const R=this.rows[r];
          c.globalAlpha=R.a;c.strokeStyle='#7c2d12';c.lineWidth=1;c.beginPath();c.moveTo(0,R.y);c.quadraticCurveTo(W/2,R.y+2*R.sag,W,R.y);c.stroke();
          for(let i=0;i<n;i++){
            const x=i*step,u=x/W,ys=R.y+4*R.sag*u*(1-u),h=13+(i%3)*2;
            const dx=Math.sin(t*3.2+i*.7+R.ph)*(1.2+beat*2.6);          // flutter, stronger on the beat
            c.fillStyle=(i+r)%2?'#fbbf24':(i%7===0?'#fb923c':'#ef4444');
            c.beginPath();c.moveTo(x,ys);c.lineTo(x+fw,ys);c.lineTo(x+fw+dx,ys+h);c.lineTo(x+dx,ys+h);c.closePath();c.fill();
          }
        }
        c.globalAlpha=1;
      }}
  });

  // ── Araw ng Kalayaan (Philippine Independence Day) ─────────────────────
  // Translucent overlay: Katipunero silhouettes charging with bolos (plus a duelling pair that throws
  // sparks when their blades meet), waving Philippine & Katipunan flags, doves, falling sampaguita,
  // tricolour fireworks, flag bunting along the top, and a slowly turning eight-ray sun.
  const PHB='#0038a8',PHR='#ce1126',PHY='#fcd116',PHC=['#fcd116','#ff4d63','#5b8cff','#ffffff'];
  function phBlade(c,hx,hy,ang,len,wd){
    c.save();c.translate(hx,hy);c.rotate(ang);
    c.strokeStyle='#8a5a1c';c.lineWidth=wd*.8;c.lineCap='round';c.beginPath();c.moveTo(-len*.24,0);c.lineTo(0,0);c.stroke();
    c.fillStyle='#eef4ff';c.beginPath();c.moveTo(0,0);c.lineTo(len*.18,-wd*.35);c.quadraticCurveTo(len*.7,-wd*1.5,len,-wd*.15);c.quadraticCurveTo(len*.62,wd*.55,len*.18,wd*.4);c.closePath();c.fill();
    c.restore();
  }
  // One silhouette, feet at (x,y), facing right (dir=-1 mirrors). Returns the pole-top for flag bearers.
  function phFig(c,o){
    const {x,y,u,t,ph,col,dir,mode,hat}=o,duel=mode==='duel',p=t*(duel?4:7)+ph,bob=Math.abs(Math.sin(p))*(duel?.05:.16)*u;
    c.save();c.translate(x,y);c.scale(dir,1);c.fillStyle=col;c.lineCap='round';c.lineJoin='round';
    const hip=[0,-2.55*u-bob];
    for(let k=0;k<2;k++){
      const q=p+k*Math.PI,th=(duel?.3:.95)*Math.sin(q),bend=(duel?.12:(.5+.5*Math.cos(q)))*.95;
      const kx=hip[0]+Math.sin(th)*1.3*u,ky=hip[1]+Math.cos(th)*1.3*u,sh=th-bend,fx=kx+Math.sin(sh)*1.3*u,fy=Math.min(0,ky+Math.cos(sh)*1.3*u);
      c.strokeStyle=col;c.lineWidth=.5*u;c.beginPath();c.moveTo(hip[0],hip[1]);c.lineTo(kx,ky);c.lineTo(fx,fy);c.stroke();
      c.beginPath();c.ellipse(fx+.15*u,fy-.05*u,.32*u,.12*u,0,0,6.283);c.fill();
    }
    const lean=duel?.12:.28,sx=hip[0]+Math.sin(lean)*1.75*u,sy=hip[1]-Math.cos(lean)*1.75*u;
    c.strokeStyle=col;c.lineWidth=.95*u;c.beginPath();c.moveTo(hip[0],hip[1]+.1*u);c.lineTo(sx,sy);c.stroke();
    c.beginPath();c.moveTo(hip[0]-.4*u,hip[1]);c.lineTo(hip[0]+.4*u,hip[1]);c.lineTo(hip[0]-.55*u-Math.sin(t*8+ph)*.15*u,hip[1]+1*u);c.closePath();c.fill();   // bahag cloth
    const hx=sx+Math.sin(lean)*.55*u,hy=sy-Math.cos(lean)*.55*u;
    c.beginPath();c.arc(hx,hy,.4*u,0,6.283);c.fill();
    if(hat==='salakot'){c.beginPath();c.moveTo(hx-.95*u,hy-.1*u);c.quadraticCurveTo(hx,hy-1.05*u,hx+.95*u,hy-.1*u);c.closePath();c.fill();}
    else{const f=Math.sin(t*9+ph)*.2*u;c.beginPath();c.moveTo(hx-.3*u,hy-.12*u);c.lineTo(hx-1*u,hy-.05*u+f);c.lineTo(hx-.9*u,hy+.25*u+f);c.closePath();c.fill();}   // fluttering headband tails
    // back arm
    const ba=-.5-.7*Math.sin(p);sinArm(c,sx,sy,sx+Math.sin(ba)*1.6*u,sy+Math.cos(ba)*1.6*u,.1,.42*u,col);
    let pole=null;
    if(mode==='flag'){
      const fx=sx+1.35*u,fy=sy+.35*u;sinArm(c,sx,sy,fx,fy,.12,.42*u,col);
      c.strokeStyle='#d4a017';c.lineWidth=.14*u;c.beginPath();c.moveTo(fx,fy+1.9*u);c.lineTo(fx,fy-4.7*u);c.stroke();
      pole=[x+dir*fx,y+fy-4.7*u];
    }else{
      const d=t*5.2+(o.duel==='B'?Math.PI:0),A=duel?-.95+.5*Math.sin(d):-1+.9*Math.sin(t*5.2+ph);
      const bx=sx+Math.cos(A)*1.5*u,by=sy+Math.sin(A)*1.5*u;
      sinArm(c,sx,sy,bx,by,-.1,.5*u,col);phBlade(c,bx,by,A-(duel?.35:.25),2.4*u,.42*u);
    }
    c.restore();return pole;
  }
  function phFlag(c,px,py,w,h,t,ph,kind,side){
    const N=22,wave=x=>Math.sin(x/w*6.2-t*6+ph)*h*.11*Math.min(1,x/w*1.4),M=(x,y)=>[px+side*x,py+y+wave(x)];
    const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach((q,i)=>{const m=M(q[0],q[1]);i?c.lineTo(m[0],m[1]):c.moveTo(m[0],m[1]);});c.closePath();c.fill();};
    const row=y=>{const a=[];for(let i=0;i<=N;i++)a.push([w*i/N,y]);return a;};
    if(kind==='kat'){
      poly(row(0).concat(row(h).reverse()),PHR);
      c.fillStyle='#fff';c.font='bold '+Math.round(h*.46)+'px Georgia,serif';c.textAlign='center';c.textBaseline='middle';
      [[.24,.5],[.52,.27],[.52,.73]].forEach(q=>{const m=M(w*q[0],h*q[1]);c.fillText('K',m[0],m[1]);});
    }else{
      poly(row(0).concat(row(h/2).reverse()),PHB);poly(row(h/2).concat(row(h).reverse()),PHR);poly([[0,0],[h*.866,h/2],[0,h]],'#ffffff');
      const sc=M(h*.28,h/2);c.fillStyle=PHY;c.strokeStyle=PHY;c.lineWidth=Math.max(1,h*.03);c.beginPath();c.arc(sc[0],sc[1],h*.085,0,6.283);c.fill();
      for(let k=0;k<8;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(sc[0]+Math.cos(a)*h*.11,sc[1]+Math.sin(a)*h*.11);c.lineTo(sc[0]+Math.cos(a)*h*.17,sc[1]+Math.sin(a)*h*.17);c.stroke();}
      [[.1,.13],[.1,.87],[.7,.5]].forEach(q=>{const m=M(h*q[0],h*q[1]);star(c,m[0],m[1],h*.075,h*.03);});
    }
    for(let i=0;i<N;i++){const x0=w*i/N,x1=w*(i+1)/N,s=wave(x1)-wave(x0);if(s>0)poly([[x0,0],[x1,0],[x1,h],[x0,h]],'rgba(0,0,40,'+Math.min(.3,s*.55)+')');}
    c.fillStyle=PHY;c.beginPath();c.arc(px,py-h*.04,h*.07,0,6.283);c.fill();
  }
  function phDove(c,x,y,s,t,ph,dir){
    const f=Math.sin(t*9+ph);
    c.save();c.translate(x,y);c.scale(dir,1);c.fillStyle='#ffffff';
    c.globalAlpha*=.6;c.beginPath();c.moveTo(-s*.1,-s*.05);c.quadraticCurveTo(-s*.2,-s*(.5-.5*f),-s*.95,-s*(.55-.6*f));c.quadraticCurveTo(-s*.3,s*.1,-s*.1,-s*.05);c.fill();   // far wing
    c.globalAlpha/=.6;
    c.beginPath();c.ellipse(0,0,s*.9,s*.33,-.12,0,6.283);c.fill();
    c.beginPath();c.arc(s*.9,-s*.22,s*.21,0,6.283);c.fill();
    c.beginPath();c.moveTo(-s*.75,-s*.05);c.lineTo(-s*1.7,s*.05);c.lineTo(-s*1.5,-s*.22);c.closePath();c.fill();                                             // tail
    c.fillStyle='#fbbf24';c.beginPath();c.moveTo(s*1.08,-s*.24);c.lineTo(s*1.32,-s*.18);c.lineTo(s*1.08,-s*.13);c.closePath();c.fill();
    c.fillStyle='#ffffff';c.beginPath();c.moveTo(s*.15,-s*.1);c.quadraticCurveTo(-s*.1,-s*(1+.9*f),-s*1.05,-s*(1.1+.9*f));c.quadraticCurveTo(-s*.35,-s*.3,-s*.2,s*.05);c.closePath();c.fill();   // near wing
    c.restore();
  }
  function phFlower(c,r){c.fillStyle='#fffdf5';for(let k=0;k<5;k++){c.save();c.rotate(k*1.2566);c.beginPath();c.ellipse(0,-r*.55,r*.3,r*.58,0,0,6.283);c.fill();c.restore();}c.fillStyle=PHY;c.beginPath();c.arc(0,0,r*.2,0,6.283);c.fill();}
  const PH_BACK=[[-13,'#8f1f3a','salakot'],[-10.4,'#2c4aa0','band'],[-7.8,'#8f1f3a','band'],[-3.2,'#2c4aa0','salakot'],[0,'#9a7f12','band'],[7.4,'#8f1f3a','salakot'],[10.3,'#2c4aa0','band'],[15.5,'#8f1f3a','band']];
  const PH_FRONT=[
    {dx:-11.6,col:'#d4182f',hat:'salakot',ph:0},{dx:-8.8,col:'#4f7dff',hat:'band',ph:1.2},
    {dx:-5.6,col:'#fcd116',hat:'band',mode:'flag',flag:'ph',ph:.4},{dx:-2.2,col:'#d4182f',hat:'salakot',ph:2.1},
    {dx:1,col:'#4f7dff',hat:'band',mode:'duel',duel:'A',ph:0},{dx:3.9,col:'#f4f7ff',hat:'salakot',mode:'duel',duel:'B',dir:-1,ph:1},
    {dx:8.2,col:'#fcd116',hat:'salakot',ph:3},{dx:11.4,col:'#d4182f',hat:'band',mode:'flag',flag:'kat',ph:2.6},
    {dx:14.6,col:'#4f7dff',hat:'band',ph:.9},{dx:17.4,col:'#d4182f',hat:'salakot',ph:1.7}];
  Object.assign(EFFECTS,{
    'hol-phindep':{
      init(){
        const u=this.u=Math.max(13,Math.min(26,H*.027,W*.02)),dpr=cv?cv.width/W:1;
        this.bh=Math.ceil(11.8*u);
        this.lay=document.createElement('canvas');this.lay.width=Math.round(W*dpr);this.lay.height=Math.round(this.bh*dpr);
        this.lc=this.lay.getContext('2d');this.lc.setTransform(dpr,0,0,dpr,0,0);
        fwInit(this);
        this.cf=Array.from({length:Math.round(Math.min(60,W*H/16000))},()=>({x:rnd(0,W),y:rnd(0,H),w:rnd(5,9),h:rnd(2,4),vy:rnd(25,70),rot:rnd(0,6.28),vr:rnd(-3,3),sw:rnd(.5,1.4),ph:rnd(0,6.28),c:pick(['#fcd116','#ce1126','#3b6fe0','#ffffff'])}));
        this.fl=Array.from({length:Math.round(Math.min(20,W*H/55000))},()=>this.flw(true));
        this.dv=Array.from({length:4},(_,i)=>this.dove(true,i));
        this.rows=[{y:4,sag:7,a:.55,ph:rnd(0,6.28)},{y:28,sag:9,a:.45,ph:rnd(0,6.28)}];
        this.sk=null;
      },
      flw(first){return{x:rnd(0,W),y:first?rnd(0,H):-14,r:rnd(5,9),vy:rnd(22,50),rot:rnd(0,6.28),vr:rnd(-1.4,1.4),sw:rnd(.4,1.2),ph:rnd(0,6.28),a:rnd(.5,.85)};},
      dove(first,i){const dir=Math.random()<.7?1:-1;return{x:first?rnd(0,W):(dir>0?-60:W+60),y:rnd(H*.14,H*.5),vx:dir*rnd(55,95),s:rnd(11,16),ph:rnd(0,6.28),dir,wob:rnd(.5,1.1),by:rnd(0,6.28)};},
      step(dt,t){
        fwStep(this,dt,PHC);
        for(const f of this.cf){f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*20*dt;f.rot+=f.vr*dt;if(f.y>H+8){f.y=-8;f.x=rnd(0,W);}}
        for(let i=0;i<this.fl.length;i++){const f=this.fl[i];f.y+=f.vy*dt;f.x+=Math.sin(t*f.sw+f.ph)*16*dt;f.rot+=f.vr*dt;if(f.y>H+16)this.fl[i]=this.flw(false);}
        for(let i=0;i<this.dv.length;i++){const d=this.dv[i];d.x+=d.vx*dt;if(d.x<-80||d.x>W+80)this.dv[i]=this.dove(false,i);}
      },
      draw(c,t){
        const u=this.u,mx=W*.8,my=H*.2,R=Math.min(W,H)*.075,P=(a,r)=>[mx+Math.cos(a)*r,my+Math.sin(a)*r];
        // rising golden glow + eight-ray sun (additive, so it never hides the dashboard)
        c.save();c.globalCompositeOperation='lighter';
        glow(c,mx,my,R*5,'252,209,22',.2);glow(c,W*.5,H+u*2,Math.max(W,H)*.5,'252,160,30',.1);
        c.fillStyle=PHY;
        for(let k=0;k<8;k++){
          const a=t*.12+k*Math.PI/4;c.globalAlpha=.3;c.beginPath();c.moveTo(...P(a-.1,R*1.2));c.lineTo(...P(a,R*2.7));c.lineTo(...P(a+.1,R*1.2));c.closePath();c.fill();
          const b=a+Math.PI/8;c.globalAlpha=.18;c.beginPath();c.moveTo(...P(b-.05,R*1.2));c.lineTo(...P(b,R*1.9));c.lineTo(...P(b+.05,R*1.2));c.closePath();c.fill();
        }
        c.globalAlpha=.35;c.beginPath();c.arc(mx,my,R,0,6.283);c.fill();
        [[.07,.2],[.05,.5],[.07,.8]].forEach((q,i)=>{c.globalAlpha=.3+.3*Math.sin(t*2+i*2);star(c,W*q[0],H*q[1],14,6);});
        c.restore();
        // confetti, fireworks
        for(const f of this.cf){c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=.6;c.fillStyle=f.c;c.fillRect(-f.w/2,-f.h/2,f.w,f.h);c.restore();}
        fwDraw(c,this);
        // doves + sampaguita
        for(const d of this.dv){c.globalAlpha=.6;phDove(c,d.x,d.y+Math.sin(t*d.wob+d.by)*18,d.s,t,d.ph,d.vx>0?1:-1);}
        for(const f of this.fl){c.save();c.translate(f.x,f.y);c.rotate(f.rot);c.globalAlpha=f.a*.8;phFlower(c,f.r);c.restore();}
        // flag bunting along the top
        const step=16,n=Math.ceil(W/step)+1,cols=[PHB,'#ffffff',PHR,PHY];
        for(let r=0;r<this.rows.length;r++){
          const R2=this.rows[r];c.globalAlpha=R2.a;c.strokeStyle='#cbd5e1';c.lineWidth=1;c.beginPath();c.moveTo(0,R2.y);c.quadraticCurveTo(W/2,R2.y+2*R2.sag,W,R2.y);c.stroke();
          for(let i=0;i<n;i++){const x=i*step,uu=x/W,ys=R2.y+4*R2.sag*uu*(1-uu),dx=Math.sin(t*3+i*.7+R2.ph)*2;
            c.fillStyle=cols[(i+r)%4];c.beginPath();c.moveTo(x,ys);c.lineTo(x+14,ys);c.lineTo(x+7+dx,ys+17);c.closePath();c.fill();}
        }
        // procession: Katipuneros charging with bolos (drawn opaque in an offscreen layer, composited translucent)
        const lc=this.lc,bh=this.bh,gy=bh-.5*u,sp=3.6*u,span=W*1.3+36*u,gx=((t*sp)%span)-20*u,poles=[];
        lc.clearRect(0,0,W,bh);
        PH_BACK.forEach((b,i)=>phFig(lc,{x:gx+b[0]*u,y:gy-.9*u,u:u*.72,t,ph:i*1.3,col:b[1],dir:1,mode:'run',hat:b[2]}));
        PH_FRONT.forEach(f=>{const r=phFig(lc,{x:gx+f.dx*u,y:gy,u,t,ph:f.ph,col:f.col,dir:f.dir||1,mode:f.mode||'run',duel:f.duel,hat:f.hat});if(r)poles.push([r,f.flag]);});
        poles.forEach(q=>phFlag(lc,q[0][0],q[0][1],q[1]==='kat'?4.1*u:4.5*u,q[1]==='kat'?2.5*u:2.7*u,t,q[0][0]*.01,q[1],-1));
        c.globalAlpha=.7;c.drawImage(this.lay,0,H-bh,W,bh);c.globalAlpha=1;
        // sparks where the duelling bolos meet
        const d=t*5.2,k=Math.pow(Math.max(0,1-Math.abs(Math.sin(d))*2.8),2);
        if(k>.02){
          const sxp=gx+(1+1.55)*u,syp=H-bh+gy-6.6*u;
          c.save();c.globalCompositeOperation='lighter';glow(c,sxp,syp,u*1.8,'255,240,180',.65*k);
          c.strokeStyle='#fff6c8';c.lineWidth=1.6;c.globalAlpha=k;
          for(let i=0;i<9;i++){const a=i*.7+Math.floor(t*10)*1.3,r1=u*.25,r2=u*(.6+.5*((i*37)%5)/5)*(.5+k);c.beginPath();c.moveTo(sxp+Math.cos(a)*r1,syp+Math.sin(a)*r1);c.lineTo(sxp+Math.cos(a)*r2,syp+Math.sin(a)*r2);c.stroke();}
          c.restore();
        }
        c.globalAlpha=1;
      }}
  });

  // ── Sakura & Fuji — drifting cherry-blossom petals ─────────────────────
  function petal(c,s){
    c.beginPath();c.moveTo(0,-s*.8);
    c.bezierCurveTo(s*.3,-s*1.15,s*.95,-s*.8,s*.8,-s*.15);
    c.bezierCurveTo(s*.65,s*.4,s*.2,s*.8,0,s);
    c.bezierCurveTo(-s*.2,s*.8,-s*.65,s*.4,-s*.8,-s*.15);
    c.bezierCurveTo(-s*.95,-s*.8,-s*.3,-s*1.15,0,-s*.8);c.closePath();
  }
  const SAKC=['#f9a8c9','#fbc4d9','#ffd6e5','#f7b6cf','#f4a1c0','#ffffff'];
  Object.assign(EFFECTS,{
    'img-fuji':{
      init(){
        this.p=Array.from({length:Math.round(Math.min(80,W*H/16000))},()=>this.mk(true));
        this.g=Array.from({length:18},()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(.8,2),vy:rnd(6,16),ph:rnd(0,6.28)}));
      },
      mk(first){const s=rnd(6,15);return{x:rnd(-20,W+20),y:first?rnd(-20,H):rnd(-60,-10),s,vy:20+s*3.2+rnd(0,18),sw:rnd(.5,1.3),ph:rnd(0,6.28),rot:rnd(0,6.28),vr:rnd(-1.6,1.6),fp:rnd(0,6.28),fs:rnd(1.5,4),a:.55+.4*(s/15),c:Math.random()<.12?'#ffffff':pick(SAKC)};},
      step(dt,t){
        // gentle breeze plus an occasional gust that sweeps the petals sideways
        const wind=Math.sin(t*.25)*18+Math.max(0,Math.sin(t*.07))*Math.max(0,Math.sin(t*.9))*45;
        for(let i=0;i<this.p.length;i++){
          const q=this.p[i];
          q.y+=q.vy*dt;q.x+=(wind*(q.s/10)+Math.sin(t*q.sw+q.ph)*24)*dt;q.rot+=q.vr*dt;q.fp+=q.fs*dt;
          if(q.y>H+24)this.p[i]=this.mk(false);
          else if(q.x>W+40)q.x=-30;else if(q.x<-40)q.x=W+30;
        }
        for(const g of this.g){g.y-=g.vy*dt;if(g.y<-5){g.y=H+5;g.x=rnd(0,W);}}
      },
      draw(c,t){
        c.save();c.globalCompositeOperation='lighter';c.fillStyle='#ffe4ef';
        for(const g of this.g){c.globalAlpha=.55*(.5+.5*Math.sin(t*2.2+g.ph));c.beginPath();c.arc(g.x,g.y,g.r,0,6.283);c.fill();}
        c.restore();
        for(const q of this.p){
          c.save();c.translate(q.x,q.y);c.rotate(q.rot);
          const f=Math.cos(q.fp);c.scale(.2+.8*Math.abs(f),1);          // tumbling flip
          const gr=c.createLinearGradient(0,-q.s,0,q.s);gr.addColorStop(0,'#fff4f8');gr.addColorStop(1,q.c);
          c.globalAlpha=q.a*(.75+.25*Math.abs(f));c.fillStyle=gr;petal(c,q.s);c.fill();
          c.restore();
        }
      }}
  });

  function ensureCanvas(){
    if(cv)return;
    cv=document.createElement('canvas');cv.id='holiday-fx';
    cv.setAttribute('aria-hidden','true');
    cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50;display:none';
    document.body.appendChild(cv);ctx=cv.getContext('2d');
  }
  function resize(){
    if(!cv)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth;H=window.innerHeight;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(fx&&fx.init)fx.init();
  }
  function frame(ts){
    raf=requestAnimationFrame(frame);
    const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
    const t=ts/1000;
    fx.step(dt,t);
    ctx.clearRect(0,0,W,H);ctx.save();fx.draw(ctx,t);ctx.restore();ctx.globalAlpha=1;
  }
  function stop(){
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(cv){cv.style.display='none';ctx&&ctx.clearRect(0,0,W,H);}
    fx=null;
  }
  function start(name){
    ensureCanvas();
    fx=Object.assign({},EFFECTS[name]);
    cv.style.zIndex=fx.behind?'0':'50';
    cv.style.opacity=fx.alpha!=null?String(fx.alpha):'1';   // per-effect overall transparency
    cv.style.display='block';resize();
    if(!raf&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}
  }
  function sync(){
    const cls=Object.keys(EFFECTS).find(k=>document.documentElement.classList.contains(k))||null;
    if(cls===cur)return;
    cur=cls;
    if(!cls||reduce){stop();return;}
    start(cls);
  }
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',()=>{if(fx)resize();});
  document.addEventListener('visibilitychange',()=>{
    if(!fx)return;
    if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0;}}
    else if(!raf){last=performance.now();raf=requestAnimationFrame(frame);}
  });
  sync();
})();
