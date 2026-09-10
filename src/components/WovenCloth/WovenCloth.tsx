import React from 'react'

const CLOTH_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d0d0d;overflow:hidden}
canvas{display:block;width:100%;height:100%}
.vignette{position:fixed;inset:0;pointer-events:none;background:radial-gradient(90% 80% at 50% 46%,transparent 55%,rgba(13,13,13,.68) 100%)}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div class="vignette"></div>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script>
(function(){
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var canvas = document.getElementById('c');
  function waitForThree(cb, tries) {
    if (window.THREE) { cb(); return; }
    if ((tries||0) > 40) return;
    setTimeout(function(){ waitForThree(cb, (tries||0)+1); }, 80);
  }
  waitForThree(function() {
    var BW=4.4, BH=2.75, GX=40, GY=26;

    function makeTexture() {
      var W=1280, H=800;
      var c2=document.createElement('canvas'); c2.width=W; c2.height=H;
      var x=c2.getContext('2d');
      var g=x.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#ece9e2'); g.addColorStop(.5,'#e6e3dc'); g.addColorStop(1,'#dedad3');
      x.fillStyle=g; x.fillRect(0,0,W,H);
      x.strokeStyle='#2676ff'; x.lineWidth=10; x.strokeRect(46,46,W-92,H-92);
      x.lineWidth=3; x.strokeStyle='#1a3acc'; x.strokeRect(66,66,W-132,H-132);
      x.fillStyle='#2676ff'; x.font='bold 78px Georgia,serif'; x.textAlign='center'; x.textBaseline='middle';
      x.fillText('SQ',W/2,190);
      x.font='normal 20px Arial,sans-serif'; x.fillStyle='#1a3acc'; x.fillText('· CAPE TOWN ·',W/2,246);
      x.fillStyle='#2052cc'; x.font='bold 118px Georgia,serif';
      x.fillText('SIDEQUEST',W/2,400); x.fillText('TECH',W/2,520);
      x.fillStyle='#1a3acc'; x.font='600 28px Arial,sans-serif';
      x.fillText('Y O U R   V I S I O N .   O U R   N E X T   Q U E S T .',W/2,626);
      for(var yy=0;yy<H;yy+=3){ x.strokeStyle='rgba(60,30,20,0.045)'; x.lineWidth=1; x.beginPath(); x.moveTo(0,yy+.5); x.lineTo(W,yy+.5); x.stroke(); }
      for(var xx=0;xx<W;xx+=3){ x.strokeStyle='rgba(255,250,235,0.055)'; x.lineWidth=1; x.beginPath(); x.moveTo(xx+.5,0); x.lineTo(xx+.5,H); x.stroke(); }
      var id=x.getImageData(0,0,W,H), d=id.data;
      for(var i=0;i<d.length;i+=4){ var n=(Math.random()*2-1)*10; d[i]+=n; d[i+1]+=n; d[i+2]+=n; }
      x.putImageData(id,0,0);
      var tex=new THREE.CanvasTexture(c2);
      tex.anisotropy=4; tex.colorSpace=THREE.SRGBColorSpace; return tex;
    }

    var scene=new THREE.Scene();
    var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    var camera;
    var geo=new THREE.PlaneGeometry(BW,BH,GX,GY);
    var mat=new THREE.MeshPhongMaterial({map:makeTexture(),side:THREE.DoubleSide,shininess:6,specular:0x0a1828,color:0xffffff});
    scene.add(new THREE.Mesh(geo,mat));
    scene.add(new THREE.AmbientLight(0xece9e2,0.55));
    var key=new THREE.DirectionalLight(0xffffff,1.05); key.position.set(-3,3.5,3.2); scene.add(key);
    var rim=new THREE.DirectionalLight(0x2676ff,0.28); rim.position.set(3,-1.5,2.0); scene.add(rim);

    var pos=geo.attributes.position;
    var N=(GX+1)*(GY+1);
    var cur=new Float32Array(N*3), prev=new Float32Array(N*3), rest=new Float32Array(N*3);
    var pinned=new Uint8Array(N);
    for(var i=0;i<N;i++){
      var ax=pos.getX(i), ay=pos.getY(i);
      cur[i*3]=prev[i*3]=rest[i*3]=ax;
      cur[i*3+1]=prev[i*3+1]=rest[i*3+1]=ay;
      cur[i*3+2]=prev[i*3+2]=rest[i*3+2]=0;
    }
    for(var ix=0;ix<=GX;ix++) pinned[ix]=1;

    var restH=BW/GX, restV=BH/GY;
    var GRAV=-3.1, DAMP=0.985, DT=0.016;
    var IDX=function(ix,iy){ return ix+iy*(GX+1); };

    function wind(ix,iy,t){
      var cx=ix/GX, cy=iy/GY;
      var travel=t*1.7-cy*4.2;
      var gust=0.6+0.42*Math.sin(t*0.6)+0.18*Math.sin(t*1.9+1.3);
      var amp=4.3*cy;
      var fz=(Math.sin(travel+cx*3.3)+0.5*Math.sin(travel*1.7+cx*6.0))*amp*gust;
      return [Math.sin(t*0.9+cy*2.2)*0.6*cy, -0.4*cy, fz];
    }

    function solve(a,b,rl){
      var dx=cur[b*3]-cur[a*3], dy=cur[b*3+1]-cur[a*3+1], dz=cur[b*3+2]-cur[a*3+2];
      var d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-6;
      var diff=(d-rl)/d*0.5;
      dx*=diff; dy*=diff; dz*=diff;
      var pa=pinned[a], pb=pinned[b];
      if(!pa&&!pb){ cur[a*3]+=dx; cur[a*3+1]+=dy; cur[a*3+2]+=dz; cur[b*3]-=dx; cur[b*3+1]-=dy; cur[b*3+2]-=dz; }
      else if(pa&&!pb){ cur[b*3]-=dx*2; cur[b*3+1]-=dy*2; cur[b*3+2]-=dz*2; }
      else if(!pa&&pb){ cur[a*3]+=dx*2; cur[a*3+1]+=dy*2; cur[a*3+2]+=dz*2; }
    }

    function step(t){
      for(var iy=0;iy<=GY;iy++) for(var ix=0;ix<=GX;ix++){
        var i=IDX(ix,iy); if(pinned[i]) continue;
        var f=wind(ix,iy,t);
        for(var k=0;k<3;k++){
          var j=i*3+k, a=(k===0?f[0]:k===1?(f[1]+GRAV):f[2]);
          var v=(cur[j]-prev[j])*DAMP; prev[j]=cur[j]; cur[j]+=v+a*DT*DT;
        }
      }
      for(var it=0;it<3;it++){
        for(var iy2=0;iy2<=GY;iy2++) for(var ix2=0;ix2<GX;ix2++) solve(IDX(ix2,iy2),IDX(ix2+1,iy2),restH);
        for(var iy3=0;iy3<GY;iy3++) for(var ix3=0;ix3<=GX;ix3++) solve(IDX(ix3,iy3),IDX(ix3,iy3+1),restV);
      }
      for(var ix4=0;ix4<=GX;ix4++){
        cur[ix4*3]=rest[ix4*3]; cur[ix4*3+1]=rest[ix4*3+1]; cur[ix4*3+2]=rest[ix4*3+2];
        prev[ix4*3]=rest[ix4*3]; prev[ix4*3+1]=rest[ix4*3+1]; prev[ix4*3+2]=rest[ix4*3+2];
      }
    }

    function commit(){
      for(var i=0;i<N;i++) pos.setXYZ(i,cur[i*3],cur[i*3+1],cur[i*3+2]);
      pos.needsUpdate=true; geo.computeVertexNormals();
    }

    function fit(){
      var w=innerWidth, h=innerHeight;
      renderer.setSize(w,h,false);
      var aspect=w/h;
      camera=new THREE.PerspectiveCamera(42,aspect,0.1,100);
      var vFit=(BH/2)/Math.tan(42*Math.PI/360);
      var hFit=(BW/2)/Math.tan(42*Math.PI/360)/aspect;
      camera.position.set(0,0.05,Math.max(vFit,hFit)*1.16+0.4);
      camera.lookAt(0,0,0);
    }
    window.addEventListener('resize',fit); fit();

    var running=false, raf=0, t=0;
    function loop(){ if(!running)return; t+=DT; step(t); commit(); renderer.render(scene,camera); raf=requestAnimationFrame(loop); }
    function start(){ if(running)return; running=true; raf=requestAnimationFrame(loop); }
    function stop(){ running=false; cancelAnimationFrame(raf); }

    if(reduce){
      for(var s=0;s<220;s++) step(s*DT); commit(); renderer.render(scene,camera);
    } else {
      for(var s=0;s<40;s++) step(s*DT); t=40*DT; start();
      document.addEventListener('visibilitychange',function(){ document.hidden?stop():start(); });
    }
  });
})();
</script>
</body>
</html>`

interface WovenClothProps {
  className?: string
  style?: React.CSSProperties
}

export default function WovenCloth({ className, style }: WovenClothProps): React.ReactElement {
  return (
    <iframe
      title="SideQuest Tech cloth background"
      srcDoc={CLOTH_HTML}
      sandbox="allow-scripts"
      loading="eager"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', border: 0, background: '#0d0d0d', ...style }}
    />
  )
}
