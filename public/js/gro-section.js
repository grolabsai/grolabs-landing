/* ════════════════════════════════════════════════════════════════════════
   GRO optimization — landing-page SECTION engine (responsive).
   • No promotional title text — the page supplies its own copy.
   • Reflows: 3 columns (desktop) → stacked monitor/engine/results (mobile).
   • Finite: 5 leaks → results graph → Replay. Plays when scrolled into view.
   Reads window.GRO_CONFIG.  Canvas-only (rAF-reliable).
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  const CFG = window.GRO_CONFIG;
  const cv = document.getElementById(CFG.canvasId || "cv");
  const wrap = cv.parentElement;
  const ctx = cv.getContext("2d");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ACCENT = "#fae194", PASS = "#34d399", LEAK = "#f0a3a3", LEAK_S = "#ef4444", BLUE = "#9ec5ff";
  const MONO = "ui-monospace, Menlo, monospace", SANS = "Hanken Grotesk, sans-serif";
  function rgba(c, a, b, d) { if (typeof c === "number") return "rgba(" + c + "," + a + "," + b + "," + d + ")"; const n = parseInt(c.slice(1),16); return "rgba(" + ((n>>16)&255) + "," + ((n>>8)&255) + "," + (n&255) + "," + a + ")"; }
  function txt(t,x,y,f,c,al,a){ ctx.save(); ctx.font=f; ctx.fillStyle=c; ctx.textAlign=al||"left"; if(a!=null)ctx.globalAlpha=a; ctx.fillText(t,x,y); ctx.restore(); }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  const money = (n) => "$" + Math.round(n).toLocaleString();
  const SPEND = 42000;
  function panel(x,y,w,h,litCol){
    ctx.save(); ctx.shadowColor="rgba(0,0,0,0.5)"; ctx.shadowBlur=26; ctx.shadowOffsetY=12;
    rr(x,y,w,h,14); ctx.fillStyle="#1a1b22"; ctx.fill(); ctx.restore();
    ctx.lineWidth=1; ctx.strokeStyle=litCol||"rgba(255,255,255,0.10)"; rr(x,y,w,h,14); ctx.stroke();
  }

  /* ── Responsive layout ──────────────────────────────────────── */
  const BP = 860;            // below this container width → stacked
  let W, H, dpr, portrait, A, B, C, STREAM, LANES, RAIL = 28;
  function computeLayout(){
    const cw = wrap.clientWidth || 1200;
    portrait = cw < BP;
    dpr = Math.min(devicePixelRatio || 1, 2);
    if (portrait) {
      W = 600; H = 1760;
      A = { x:40, w:520, oy:0 };
      B = { x:40, w:520, oy:620 };
      C = { x:40, w:520, oy:1260 };
    } else {
      W = 1440; H = 660;
      A = { x:40, w:432, oy:0 };
      B = { x:502, w:432, oy:0 };
      C = { x:964, w:436, oy:0 };
    }
    STREAM = { top:118, evalY:360, bottom:596 };
    LANES = [A.x+20, A.x+Math.round(A.w*0.30), A.x+Math.round(A.w*0.56), A.x+Math.round(A.w*0.80)];
    laneLast = LANES.map(()=>null);
    cv.width = W*dpr; cv.height = H*dpr;
    cv.style.width = "100%"; cv.style.height = "auto";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  /* ── State ──────────────────────────────────────────────────── */
  const LEAKS = CFG.leaks;
  let stream = [], laneLast = [];
  let signals = 2040, leaksFound = 0, leaksFixed = 0;
  let totalRev = 0, dispRev = 0, totalSEO = 0, totalCAT = 0;
  let ledger = [];
  let engine = { state:"idle", leak:null, token:null, classify:null, classP:0, fixP:0, routeP:0 };
  let fixedMon = { leak:null, metricP:0, revP:0, active:false };
  let ending = false, endP = 0;
  let last = performance.now(), lastSpawn = 0, typeI = 0, typeT = 0;

  let P = { semantic:0.74, semanticT:0.74, syn:1284, synT:1284, typo:0.46, typoT:0.46 };
  const DOCS = []; for (let i=0;i<12;i++) DOCS.push({ fill:0.5+Math.random()*0.3, target:0.5+Math.random()*0.3 });
  let complete = 0.71, completeT = 0.71, errDoc = -1, errA = 0;

  function pick(a){ return a[(Math.random()*a.length)|0]; }
  function freeLane(){ const f=[]; for(let i=0;i<LANES.length;i++){const w=laneLast[i]; if(!w||w.y>STREAM.top+50)f.push(i);} return f.length?f[(Math.random()*f.length)|0]:-1; }
  function addItem(o){ stream.push(o); if(o.lane!=null)laneLast[o.lane]=o; return o; }
  function spawnAmbient(){ if(ending)return; const l=freeLane(); if(l<0)return; addItem({text:pick(CFG.ambient), x:LANES[l], y:STREAM.top, vy:92+Math.random()*42, kind:"ambient", lane:l, scored:false, alpha:0, green:false}); }
  function ease(c,t,dt,k){ return c+(t-c)*Math.min(1,dt/(k||240)); }

  function update(now, dt){
    if(!reduce && now-lastSpawn>250){ spawnAmbient(); lastSpawn=now; }
    for(let i=stream.length-1;i>=0;i--){ const w=stream[i]; w.alpha=Math.min(1,w.alpha+dt/240); w.y+=w.vy*dt/1000;
      if(!w.scored && w.y>=STREAM.evalY){ w.scored=true; if(w.kind==="ambient"){ w.green=true; signals++; } }
      if(w.y>STREAM.bottom+20) stream.splice(i,1); }
    P.semantic=ease(P.semantic,P.semanticT,dt,320); P.syn=ease(P.syn,P.synT,dt,320); P.typo=ease(P.typo,P.typoT,dt,320);
    for(const d of DOCS) d.fill=ease(d.fill,d.target,dt,340);
    complete=ease(complete,completeT,dt,340); dispRev=ease(dispRev,totalRev,dt,380);
    errA=ease(errA, errDoc>=0?1:0, dt, 160);
    if(ending) endP=Math.min(1,endP+dt/1100);
  }

  /* ════ COLUMN A · LIVE MONITORING (+ scanner) ════ */
  function colA(now){
    txt("LIVE MONITORING", A.x, 30, "600 13px "+MONO, rgba(PASS,0.9));
    txt("every search scored — we learn from all of it", A.x, 48, "500 11px "+MONO, rgba(237,234,224,0.34));
    const sb={x:A.x,y:62,w:A.w,h:42}; rr(sb.x,sb.y,sb.w,sb.h,11); ctx.fillStyle="rgba(255,255,255,0.03)"; ctx.fill();
    ctx.lineWidth=1; ctx.strokeStyle="rgba(255,255,255,0.10)"; ctx.stroke();
    ctx.save(); ctx.strokeStyle=rgba(ACCENT,0.8); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(sb.x+24,sb.y+sb.h/2,6.5,0,7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sb.x+29,sb.y+sb.h/2+5); ctx.lineTo(sb.x+35,sb.y+sb.h/2+11); ctx.stroke(); ctx.restore();
    const shown=LEAKS[typeI%LEAKS.length].item; const chars=Math.min(shown.length,Math.floor((now-typeT)/70)); const typed=shown.slice(0,chars);
    txt(typed, sb.x+46, sb.y+sb.h/2+5, "500 15px "+SANS, rgba(255,255,255,0.66));
    if(Math.floor(now/500)%2===0){ const tw=ctx.measureText(typed).width; ctx.fillStyle=rgba(ACCENT,0.8); ctx.fillRect(sb.x+46+tw+2,sb.y+12,1.5,18); }
    if(chars>=shown.length && now-typeT>shown.length*70+1500){ typeI++; typeT=now; }

    drawScanner(now);
    for(const w of stream) drawQuery(w, now);
    txt(signals.toLocaleString()+" SIGNALS ANALYZED", A.x, STREAM.bottom+34, "600 12px "+MONO, rgba(237,234,224,0.6));
    txt("the model learns from every signal — not only the leaks", A.x, STREAM.bottom+52, "500 11px "+MONO, rgba(52,211,153,0.55));
  }

  function drawScanner(now){
    const cx=A.x, cw=A.w, y=STREAM.evalY, drift=Math.sin(now/900)*7;
    ctx.save(); ctx.setLineDash([5,5]); ctx.strokeStyle=rgba(ACCENT,0.18); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,y); ctx.lineTo(cx+cw,y); ctx.stroke(); ctx.restore();
    const bandH=34, by=y-bandH/2+drift;
    const g=ctx.createLinearGradient(0,by,0,by+bandH); g.addColorStop(0,rgba(ACCENT,0)); g.addColorStop(0.5,rgba(ACCENT,0.07)); g.addColorStop(1,rgba(ACCENT,0));
    ctx.fillStyle=g; ctx.fillRect(cx,by,cw,bandH);
    const sx=cx+((now/2200)%1)*cw;
    ctx.beginPath(); ctx.fillStyle=rgba(ACCENT,0.8); ctx.shadowColor=ACCENT; ctx.shadowBlur=8; ctx.arc(sx,y+drift,2.6,0,7); ctx.fill(); ctx.shadowBlur=0;
    txt("ANALYZING", cx, y-bandH/2-6+drift, "600 10px "+MONO, rgba(237,234,224,0.4));
    txt("pass", cx+cw, y-bandH/2-6+drift, "600 10px "+MONO, rgba(PASS,0.55), "right");
  }

  function drawQuery(w, now){
    ctx.font="500 14px "+SANS; ctx.textAlign="left";
    let color=!w.scored?rgba(237,234,224,0.32):w.green?rgba(PASS,0.6):rgba(LEAK,0.95);
    let a=w.alpha; if(w.scored&&w.green) a*=Math.max(0,1-(w.y-STREAM.evalY)/(STREAM.bottom-STREAM.evalY)*0.9);
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=color; ctx.fillText(w.text,w.x,w.y); const tw=ctx.measureText(w.text).width;
    if(w.scored&&w.green){ ctx.strokeStyle=rgba(PASS,0.5*a); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(w.x,w.y+4); ctx.lineTo(w.x+tw,w.y+4); ctx.stroke(); }
    ctx.restore();
    if(w.kind==="leak"&&w.scored){ const p=0.5+0.5*Math.sin(now/140);
      ctx.save(); ctx.strokeStyle=rgba(LEAK_S,0.4+0.4*p); ctx.lineWidth=1.4; rr(w.x-8,w.y-16,tw+16,23,6); ctx.stroke(); ctx.restore();
      txt("LEAK IDENTIFIED", w.x, w.y+20, "600 9.5px "+MONO, rgba(LEAK,0.95)); }
  }

  /* ════ COLUMN B · CLASSIFY + DUAL MODULES ════ */
  const SEO = "seo", CAT = "catalog";
  const CLS = { seo:{name:"SEARCH ENGINE FIX", short:"SEARCH FIX", col:ACCENT}, catalog:{name:"DATA CATALOG ENRICHMENT", short:"CATALOG FIX", col:BLUE} };

  function colB(now){
    drawClassifier(now);
    drawSearchModule(now);
    drawCatalogModule(now);
    drawRail(now);
  }

  function drawClassifier(now){
    const x=B.x, y=64, w=B.w, h=128, st=engine.state, lk=engine.leak;
    panel(x,y,w,h, lk?(st==="fixed"?rgba(PASS,0.32):rgba(LEAK,0.3)):"rgba(255,255,255,0.10)");
    if(!lk){ txt("STANDING BY", x+18, y+30, "600 10px "+MONO, rgba(237,234,224,0.4));
      txt("watching search traffic for leaks", x+18, y+56, "500 14px "+SANS, rgba(237,234,224,0.45)); return; }
    const fixed=st==="fixed";
    txt(fixed?"LEAK FIXED":"LEAK IDENTIFIED", x+18, y+28, "700 11px "+MONO, fixed?rgba(PASS,0.95):rgba(LEAK,0.95));
    txt('"'+lk.item+'"', x+18, y+56, "600 19px "+SANS, rgba(255,255,255,0.95));
    txt(lk.reason, x+18, y+78, "500 12px "+MONO, rgba(LEAK,0.78));
    if(st==="classifying"){
      const dots=".".repeat(1+Math.floor(now/400)%3);
      txt("EVALUATING FIX TYPE"+dots, x+18, y+106, "600 11px "+MONO, rgba(ACCENT,0.85));
    } else if(engine.classify && (st==="fixing"||st==="fixed")){
      const c=CLS[engine.classify];
      txt("→ CLASSIFIED AS", x+18, y+106, "600 10px "+MONO, rgba(237,234,224,0.45));
      ctx.font="700 11px "+MONO; const tw=ctx.measureText(c.name).width;
      const px=x+135, py=y+94; rr(px,py,tw+20,20,5); ctx.fillStyle=rgba(c.col,0.12); ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle=rgba(c.col,0.5); ctx.stroke();
      txt(c.name, px+10, py+14, "700 11px "+MONO, rgba(c.col,0.95));
      if(fixed) txt("→ "+lk.fix, x+18, y+h-2, "600 12px "+SANS, rgba(c.col,0.9));
    }
  }

  function moduleActive(kind){ return engine.classify===kind && (engine.state==="fixing"||engine.state==="fixed"); }

  function drawSearchModule(now){
    const x=B.x, y=204, w=B.w, h=186, on=moduleActive(SEO);
    panel(x,y,w,h, on?rgba(ACCENT,0.55):"rgba(255,255,255,0.10)");
    txt("AI-POWERED SEARCH ENGINE", x+16+RAIL, y+24, "700 12.5px "+SANS, rgba(ACCENT,0.95));
    txt(on?"ENGAGED":"tunable", x+w-16, y+24, "600 10px "+MONO, on?rgba(ACCENT,0.9):"rgba(237,234,224,0.35)","right");
    const rows=[
      {k:"synonym",  label:"Synonyms mapped", val:(P.syn%100)/100, show:Math.round(P.syn).toLocaleString()},
      {k:"typo",     label:"Typo tolerance",  val:P.typo,          show:"±"+(1+Math.round(P.typo*2))},
      {k:"semantic", label:"Semantic relevance", val:P.semantic,   show:P.semantic.toFixed(2)},
    ];
    rows.forEach((r,i)=>{ const ry=y+54+i*42; const lit=on&&engine.leak&&engine.leak.kind===r.k;
      txt(r.label, x+16+RAIL, ry, "600 12px "+SANS, lit?rgba(255,255,255,0.95):"rgba(237,234,224,0.62)");
      txt(r.show, x+w-16, ry, "600 11px "+MONO, lit?rgba(ACCENT,0.95):"rgba(237,234,224,0.45)","right");
      const tx=x+16+RAIL, tw=w-150-RAIL, ty=ry+12; rr(tx,ty,tw,4,2); ctx.fillStyle="rgba(255,255,255,0.08)"; ctx.fill();
      const kx=tx+tw*r.val; rr(tx,ty,tw*r.val,4,2); ctx.fillStyle=rgba(lit?ACCENT:PASS,0.6); ctx.fill();
      ctx.beginPath(); ctx.arc(kx,ty+2,5.5,0,7); ctx.fillStyle=lit?ACCENT:"rgba(237,234,224,0.5)"; if(lit){ctx.shadowColor=ACCENT;ctx.shadowBlur=9;} ctx.fill(); ctx.shadowBlur=0;
    });
  }

  function drawCatalogModule(now){
    const x=B.x, y=402, w=B.w, h=230, on=moduleActive(CAT);
    panel(x,y,w,h, on?rgba(BLUE,0.55):"rgba(255,255,255,0.10)");
    txt("AI-POWERED PRODUCT DATA ENRICHMENT", x+16+RAIL, y+24, "700 12.5px "+SANS, rgba(ACCENT,0.95));
    txt(Math.round(complete*100)+"%", x+w-16, y+24, "700 14px "+SANS, rgba(complete>0.9?PASS:(on?BLUE:ACCENT),0.95),"right");
    txt("768 DOCUMENTS · COMPLETENESS", x+16+RAIL, y+42, "600 9.5px "+MONO, rgba(237,234,224,0.36));
    rr(x+16+RAIL, y+50, w-32-RAIL, 5, 2.5); ctx.fillStyle="rgba(255,255,255,0.08)"; ctx.fill();
    rr(x+16+RAIL, y+50, (w-32-RAIL)*complete, 5, 2.5); ctx.fillStyle=rgba(complete>0.9?PASS:BLUE,0.7); ctx.fill();
    const cols=6, gx=x+18+RAIL, gy=y+68, cellW=(w-36-RAIL)/cols, dw=cellW-8, dh=64;
    DOCS.forEach((d,i)=>{ const c=i%cols, r=(i/cols)|0; const dx=gx+c*cellW, dy=gy+r*(dh+10);
      const isErr = i===errDoc && errA>0.02;
      rr(dx,dy,dw,dh,4); ctx.fillStyle=isErr?rgba(LEAK_S,0.06+0.06*errA):"rgba(255,255,255,0.03)"; ctx.fill();
      ctx.lineWidth=isErr?1.5:1; if(isErr){ctx.shadowColor=LEAK_S; ctx.shadowBlur=10*errA;} ctx.strokeStyle=isErr?rgba(LEAK_S,0.5+0.5*errA):"rgba(255,255,255,0.08)"; ctx.stroke(); ctx.shadowBlur=0;
      if(isErr){ const p=0.5+0.5*Math.sin(now/120); txt("!", dx+dw-13, dy+dh-6, "700 12px "+SANS, rgba(LEAK_S,0.7+0.3*p)); }
      ctx.beginPath(); ctx.moveTo(dx+dw-8,dy); ctx.lineTo(dx+dw,dy+8); ctx.lineTo(dx+dw-8,dy+8); ctx.closePath(); ctx.fillStyle="rgba(255,255,255,0.10)"; ctx.fill();
      const fields=4;
      for(let f=0;f<fields;f++){ const fy=dy+12+f*12, full=(f+1)/fields<=d.fill+0.001;
        rr(dx+6,fy,dw-16,3.5,1.5);
        if(isErr && f===fields-1){ ctx.fillStyle=rgba(LEAK_S,0.5+0.5*errA); const p=0.5+0.5*Math.sin(now/120); ctx.globalAlpha=0.6+0.4*p; ctx.fill(); ctx.globalAlpha=1; }
        else { ctx.fillStyle=full?rgba(PASS,0.7):"rgba(255,255,255,0.10)"; ctx.fill(); }
      }
    });
    if(on && errDoc>=0 && engine.state==="fixing") txt("◉ gap detected — enriching record", x+16+RAIL, y+h-10, "600 10px "+MONO, rgba(LEAK,0.9));
    else if(on && engine.state==="fixed") txt("✓ records enriched", x+16+RAIL, y+h-10, "600 10px "+MONO, rgba(PASS,0.9));
  }

  function drawRail(now){
    if(!engine.leak) return;
    const railX=B.x+15, railTop=198, railBot=600;
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(railX,railTop); ctx.lineTo(railX,railBot); ctx.stroke();
    const active=(engine.state==="fixing"||engine.state==="fixed")?engine.classify:null;
    if(!active) return;
    const col=CLS[active].col, turnY=active===SEO?297:512, targetX=B.x+16+RAIL-2;
    const down=turnY-railTop, right=targetX-railX, total=down+right, downFrac=down/total, rp=engine.routeP||0;
    let px,py; if(rp<=downFrac){ px=railX; py=railTop+(rp/downFrac)*down; } else { px=railX+((rp-downFrac)/(1-downFrac))*right; py=turnY; }
    ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=8; ctx.strokeStyle=rgba(col,0.78); ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(railX,railTop);
    if(rp<=downFrac){ ctx.lineTo(railX,py); } else { ctx.lineTo(railX,turnY); ctx.lineTo(px,turnY); }
    ctx.stroke();
    ctx.beginPath(); ctx.fillStyle=col; ctx.shadowBlur=12; ctx.arc(px,py,4,0,7); ctx.fill(); ctx.restore();
    if(rp>0.97){ const p=0.5+0.5*Math.sin(now/110); ctx.beginPath(); ctx.strokeStyle=rgba(col,0.6*p); ctx.lineWidth=1.5; ctx.arc(targetX,turnY,6+5*p,0,7); ctx.stroke(); }
  }

  /* ════ COLUMN C · FIXED MONITORING + LEDGER ════ */
  function colC(now){
    txt("FIXED MONITORING", C.x, 30, "600 13px "+MONO, rgba(ACCENT,0.9));
    txt("before vs after — measured in recovered revenue", C.x, 48, "500 11px "+MONO, rgba(237,234,224,0.34));
    const zy=62, zh=146, fm=fixedMon;
    panel(C.x,zy,C.w,zh, fm.active?rgba(ACCENT,0.32):"rgba(255,255,255,0.10)");
    if(!fm.active){ txt("AWAITING A FIX", C.x+20, zy+34, "600 10px "+MONO, rgba(237,234,224,0.4)); txt("validated outcomes appear here", C.x+20, zy+60, "500 14px "+SANS, rgba(237,234,224,0.4)); }
    else { const lk=fm.leak, cc=CLS[lk.classify];
      txt("VALIDATED OUTCOME", C.x+20, zy+28, "600 10px "+MONO, rgba(PASS,0.85));
      txt(cc.short, C.x+C.w-20, zy+28, "700 10px "+MONO, rgba(cc.col,0.9), "right");
      txt(lk.before, C.x+20, zy+58, "600 15px "+MONO, rgba(LEAK,0.8));
      txt("→", C.x+170, zy+58, "600 15px "+MONO, rgba(237,234,224,0.5));
      txt(lk.after, C.x+200, zy+58, "600 15px "+MONO, rgba(PASS,0.4+0.6*fm.metricP));
      rr(C.x+20, zy+72, C.w-40, 7, 3); ctx.fillStyle="rgba(255,255,255,0.08)"; ctx.fill();
      rr(C.x+20, zy+72, (C.w-40)*(0.12+0.88*fm.metricP), 7, 3); ctx.fillStyle=rgba(fm.metricP<0.5?LEAK:PASS,0.85); ctx.fill();
      txt("REVENUE RECOVERED FROM LEAK FIX", C.x+20, zy+104, "600 10px "+MONO, rgba(237,234,224,0.4));
      txt("+"+money(lk.revenue*fm.revP)+" /mo", C.x+20, zy+128, "700 21px "+SANS, rgba(PASS,0.95));
    }
    const ty=zy+zh+16;
    txt("ACCUMULATED · RECOVERED THIS PASS", C.x, ty, "600 10px "+MONO, rgba(237,234,224,0.4));
    txt(money(dispRev)+" /mo", C.x, ty+32, "700 32px "+SANS, rgba(ACCENT,0.96));
    txt(leaksFixed+" leaks fixed", C.x+C.w, ty+32, "600 13px "+MONO, rgba(237,234,224,0.5), "right");
    txt("◆ "+money(totalSEO)+" search", C.x, ty+54, "600 10.5px "+MONO, rgba(ACCENT,0.6));
    txt("◆ "+money(totalCAT)+" catalog", C.x+150, ty+54, "600 10.5px "+MONO, rgba(BLUE,0.7));
    const ly=ty+78; ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.beginPath(); ctx.moveTo(C.x,ly-12); ctx.lineTo(C.x+C.w,ly-12); ctx.stroke();
    txt("LEAK-FIX LEDGER", C.x, ly+4, "600 10px "+MONO, rgba(237,234,224,0.4));
    ledger.slice(0,5).forEach((r,i)=>{ const yy=ly+28+i*30, fade=1-i*0.05, cc=CLS[r.classify];
      ctx.beginPath(); ctx.arc(C.x+6, yy-4, 4, 0, 7); ctx.fillStyle=rgba(cc.col,0.85*fade); ctx.fill();
      txt(r.item, C.x+20, yy, "600 12.5px "+SANS, rgba(237,234,224,0.82*fade));
      txt(cc.short+" · "+r.fix, C.x+20, yy+14, "500 10px "+MONO, rgba(cc.col,0.5*fade));
      txt("+"+money(r.revenue), C.x+C.w, yy, "600 12.5px "+MONO, rgba(PASS,0.85*fade), "right");
    });
  }

  /* ════ token + separators + ending ════ */
  function drawToken(){ if(!engine.token)return; const t=engine.token; ctx.save(); ctx.font="600 14px "+SANS; ctx.globalAlpha=(t.a!=null?t.a:1);
    const tw=ctx.measureText(t.text).width; ctx.strokeStyle=rgba(ACCENT,0.16); ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(t.fromX!=null?t.fromX:t.x,t.fromY!=null?t.fromY:t.y); ctx.lineTo(t.x,t.y); ctx.stroke(); ctx.setLineDash([]);
    rr(t.x-tw/2-12,t.y-15,tw+24,30,8); ctx.fillStyle="rgba(18,19,24,0.96)"; ctx.fill();
    ctx.lineWidth=1.4; ctx.strokeStyle=rgba(LEAK_S,0.85); ctx.shadowColor=LEAK_S; ctx.shadowBlur=12; ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle=rgba(LEAK_S,0.95); ctx.textAlign="center"; ctx.fillText(t.text,t.x,t.y+5); ctx.restore(); }

  function separators(){
    ctx.strokeStyle="rgba(255,255,255,0.07)"; ctx.lineWidth=1;
    if(!portrait){ [(A.x+A.w+B.x)/2,(B.x+B.w+C.x)/2].forEach(x=>{ ctx.beginPath(); ctx.moveTo(x,20); ctx.lineTo(x,H-16); ctx.stroke(); }); }
    else { [B.oy-16, C.oy-16].forEach(y=>{ ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(W-40,y); ctx.stroke(); }); }
  }

  function drawEnding(){ if(!ending)return;
    ctx.save(); ctx.globalAlpha=endP*0.9; ctx.fillStyle="#0a0a0d"; ctx.fillRect(0,0,W,H); ctx.restore();
    ctx.save(); ctx.globalAlpha=endP;
    const cx=W/2, top=H/2-205;
    txt("OPTIMIZATION PASS COMPLETE", cx, top, "600 13px "+MONO, rgba(ACCENT,0.9), "center");
    txt(money(totalRev)+" /mo", cx, top+60, "700 "+(portrait?44:60)+"px "+SANS, rgba(255,255,255,0.98), "center");
    txt("recovered from "+leaksFixed+" leaks fixed", cx, top+92, "500 16px "+SANS, rgba(237,234,224,0.6), "center");
    const gw=Math.min(560, W-100), gx=cx-gw/2, gh=160, gy=top+134, baseY=gy+gh;
    const chrono=ledger.slice().reverse(); let cum=[], s=0; for(const r of chrono){ s+=r.revenue; cum.push(s); }
    const N=cum.length||1, maxY=Math.max(totalRev, SPEND)*1.2 || 1, yOf=(v)=> baseY-(v/maxY)*gh;
    ctx.strokeStyle="rgba(255,255,255,0.12)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx,gy-8); ctx.lineTo(gx,baseY); ctx.lineTo(gx+gw,baseY); ctx.stroke();
    const sy=yOf(SPEND); ctx.save(); ctx.setLineDash([6,5]); ctx.strokeStyle=rgba(BLUE,0.75); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx,sy); ctx.lineTo(gx+gw,sy); ctx.stroke(); ctx.restore();
    txt("Traffic spend — stays flat", gx+6, sy-9, "600 11.5px "+MONO, rgba(BLUE,0.85), "left");
    const rev=Math.max(0,Math.min(1,(endP-0.15)/0.8));
    const pts=[[gx,baseY]]; for(let k=0;k<N;k++) pts.push([gx+gw*(k+1)/N, yOf(cum[k]||0)]);
    ctx.save(); ctx.beginPath(); ctx.rect(gx,0,gw*rev,H); ctx.clip();
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(const p of pts) ctx.lineTo(p[0],p[1]); ctx.lineTo(pts[pts.length-1][0],baseY); ctx.closePath();
    const ag=ctx.createLinearGradient(0,gy,0,baseY); ag.addColorStop(0,rgba(ACCENT,0.24)); ag.addColorStop(1,rgba(ACCENT,0)); ctx.fillStyle=ag; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(const p of pts) ctx.lineTo(p[0],p[1]); ctx.strokeStyle=rgba(ACCENT,0.95); ctx.lineWidth=2.5; ctx.stroke(); ctx.restore();
    for(let k=0;k<N;k++){ const px=gx+gw*(k+1)/N; if((px-gx)<=gw*rev+1){ ctx.beginPath(); ctx.fillStyle=ACCENT; ctx.arc(px,yOf(cum[k]||0),3.4,0,7); ctx.fill(); } }
    txt("Revenue recovered — keeps growing", gx+gw, yOf(totalRev)-14, "600 11.5px "+SANS, rgba(ACCENT,0.95), "right");
    txt("same money spent on traffic — compounding recovered revenue", cx, baseY+24, "500 11.5px "+MONO, rgba(237,234,224,0.45), "center");
    txt("◆ "+money(totalSEO)+" search engine fixes", cx-12, baseY+48, "600 12px "+MONO, rgba(ACCENT,0.8), "right");
    txt("◆ "+money(totalCAT)+" data catalog enrichment", cx+12, baseY+48, "600 12px "+MONO, rgba(BLUE,0.85), "left");
    ctx.restore();
    if(endP>0.96){ placeReplay(baseY+72); }
  }

  /* ── Replay button (runtime DOM, scaled to canvas) ── */
  const replayBtn = document.createElement("button");
  replayBtn.type = "button"; replayBtn.textContent = "↻  Replay";
  replayBtn.style.cssText = "position:absolute; z-index:5; display:none; align-items:center; justify-content:center; padding:0 22px; height:44px; transform:translateX(-50%); background:rgba(250,225,148,0.12); color:#fae194; border:1px solid rgba(250,225,148,0.6); border-radius:10px; font:600 15px 'Hanken Grotesk',-apple-system,sans-serif; letter-spacing:0.04em; cursor:pointer;";
  wrap.appendChild(replayBtn);
  function placeReplay(designY){
    const scale = cv.clientHeight / H;
    replayBtn.style.left = "50%";
    replayBtn.style.top = (cv.offsetTop + designY*scale) + "px";
    replayBtn.style.display = "flex";
  }

  /* ════ async helpers ════ */
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  function until(fn){ return new Promise(res=>{ (function c(){ fn()?res():requestAnimationFrame(c); })(); }); }
  function tween(o,to,dur){ return new Promise(res=>{ const s=performance.now(),fx=o.x,fy=o.y; o.fromX=fx; o.fromY=fy; (function st(){ const n=performance.now(); let p=Math.min(1,(n-s)/dur),e=p*p*(3-2*p); o.x=fx+(to.x-fx)*e; o.y=fy+(to.y-fy)*e; p<1?requestAnimationFrame(st):res(); })(); }); }
  function tweenVal(set,dur){ return new Promise(res=>{ const s=performance.now(); (function st(){ const n=performance.now(); let p=Math.min(1,(n-s)/dur); set(p<1?p*p*(3-2*p):1); p<1?requestAnimationFrame(st):res(); })(); }); }

  function applyFix(lk){
    if(lk.classify===SEO){
      if(lk.kind==="semantic") P.semanticT=Math.min(0.99,P.semantic+0.07);
      else if(lk.kind==="synonym") P.synT=P.syn+1;
      else if(lk.kind==="typo") P.typoT=Math.min(0.95,P.typo+0.12);
    } else {
      completeT=Math.min(0.99,complete+0.07);
      const n=4+(Math.random()*4|0); for(let i=0;i<n;i++){ const d=DOCS[(Math.random()*DOCS.length)|0]; d.target=Math.min(1,d.target+0.4+Math.random()*0.3); }
      if(errDoc>=0) DOCS[errDoc].target=1;
    }
  }

  async function run(){
    if(reduce){ leaksFound=leaksFixed=LEAKS.length; LEAKS.forEach(l=>{ ledger.unshift({item:l.item,fix:l.fix,revenue:l.revenue,classify:l.classify}); totalRev+=l.revenue; (l.classify===SEO?totalSEO+=l.revenue:totalCAT+=l.revenue); }); dispRev=totalRev; ending=true; endP=1; return; }
    await sleep(500);
    for(let i=0;i<LEAKS.length;i++){
      const lk=LEAKS[i];
      const l=freeLane(); const lane=l<0?0:l; ctx.font="500 14px "+SANS;
      const it=addItem({text:lk.item, x:LANES[lane], y:STREAM.top, vy:600, kind:"leak", leak:lk, lane, scored:false, alpha:0, green:false});
      await until(()=>it.scored); leaksFound++;
      await sleep(200);
      stream=stream.filter(s=>s!==it); ctx.font="600 14px "+SANS;
      engine.token={text:lk.item, x:it.x+ctx.measureText(lk.item).width/2, y:STREAM.evalY, a:1};
      engine.leak=lk; engine.classify=null; engine.state="identified";
      await tween(engine.token,{x:B.x+B.w/2, y:B.oy+120},300);
      await tweenVal(v=>{ if(engine.token)engine.token.a=1-v; },150); engine.token=null;
      await sleep(170);
      engine.state="classifying"; await sleep(420);
      engine.classify=lk.classify; await sleep(150);
      engine.state="fixing"; engine.fixP=0; engine.routeP=0;
      await tweenVal(v=>engine.routeP=v, 600);
      if(lk.classify===CAT){ errDoc=(Math.random()*DOCS.length)|0; await sleep(420); }
      applyFix(lk);
      await tweenVal(v=>engine.fixP=v, 340);
      engine.state="fixed"; errDoc=-1;
      await sleep(230);
      fixedMon={leak:lk, metricP:0, revP:0, active:true};
      await tweenVal(v=>fixedMon.metricP=v, 320);
      await tweenVal(v=>fixedMon.revP=v, 240);
      leaksFixed++; ledger.unshift({item:lk.item, fix:lk.fix, revenue:lk.revenue, classify:lk.classify});
      totalRev+=lk.revenue; (lk.classify===SEO?totalSEO+=lk.revenue:totalCAT+=lk.revenue);
      await sleep(280);
      engine.state="idle"; engine.leak=null; engine.classify=null; engine.routeP=0;
      await sleep(150);
    }
    await sleep(500); ending=true;
  }

  function reset(){
    replayBtn.style.display="none";
    stream=[]; laneLast=LANES.map(()=>null); signals=2040; leaksFound=0; leaksFixed=0;
    totalRev=0; dispRev=0; totalSEO=0; totalCAT=0; ledger=[];
    engine={state:"idle",leak:null,token:null,classify:null,classP:0,fixP:0,routeP:0};
    fixedMon={leak:null,metricP:0,revP:0,active:false};
    ending=false; endP=0; typeI=0; typeT=0;
    P={semantic:0.74,semanticT:0.74,syn:1284,synT:1284,typo:0.46,typoT:0.46};
    for(let i=0;i<DOCS.length;i++){ const f=0.5+Math.random()*0.3; DOCS[i].fill=f; DOCS[i].target=f; }
    complete=0.71; completeT=0.71; errDoc=-1; errA=0;
    run();
  }
  replayBtn.onclick = reset;

  /* ════ render loop + responsive + play-on-scroll ════ */
  function frame(now){ const dt=Math.min(50,now-last); last=now; ctx.clearRect(0,0,W,H); update(now,dt);
    ctx.save(); ctx.translate(0,A.oy); colA(now); ctx.restore();
    ctx.save(); ctx.translate(0,B.oy); colB(now); ctx.restore();
    ctx.save(); ctx.translate(0,C.oy); colC(now); ctx.restore();
    separators(); drawToken(); drawEnding();
    requestAnimationFrame(frame);
  }

  let started = false;
  computeLayout();
  requestAnimationFrame(frame);
  window.__groFrame = frame;

  // re-layout only when crossing the breakpoint (CSS scales within a mode)
  let wasPortrait = portrait;
  addEventListener("resize", () => { const cw = wrap.clientWidth || 1200; const p = cw < BP; if (p !== wasPortrait) { wasPortrait = p; const wasRunning = started; computeLayout(); if (wasRunning) reset(); } });

  // start the leak sequence when scrolled into view (once), with a safety fallback
  function begin(){ if(started) return; started = true; run(); }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { es.forEach(e => { if (e.isIntersecting) { begin(); io.disconnect(); } }); }, { threshold: 0.2 });
    io.observe(wrap);
  }
  // fallback: if the observer never fires (already in view / embedded contexts), start anyway
  setTimeout(() => { const r = wrap.getBoundingClientRect(); if (!started && r.top < innerHeight && r.bottom > 0) begin(); }, 1400);
})();
