<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Calcio iPad</title>
<style>
html,body{margin:0;padding:0;overflow:hidden;background:#000;touch-action:none;font-family:-apple-system,sans-serif;-webkit-user-select:none;user-select:none}
canvas{display:block}
#joystick{position:fixed;left:30px;bottom:40px;width:180px;height:180px;z-index:10}
#buttons{position:fixed;right:20px;bottom:30px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;z-index:10}
.btn{width:75px;height:75px;border-radius:50%;border:3px solid white;background:rgba(255,255,255,0.18);color:white;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.1}
.btn:active{background:rgba(255,255,255,0.55);transform:scale(0.93)}
.shoot{background:rgba(255,80,80,0.35);border-color:#ff8080}
.pass{background:rgba(80,180,255,0.35);border-color:#80c8ff}
.sprint{background:rgba(255,200,80,0.35);border-color:#ffd060}
.slide{background:rgba(180,80,255,0.35);border-color:#c080ff}
.dribble{background:rgba(80,255,150,0.35);border-color:#80ffa0}
.action{background:rgba(255,140,0,0.35);border-color:#ffaa00}
#score{position:fixed;top:15px;left:50%;transform:translateX(-50%);color:white;font-size:44px;font-weight:900;text-shadow:2px 2px 8px black;letter-spacing:6px;z-index:10}
#team{position:fixed;top:20px;left:20px;color:white;font-size:15px;font-weight:700;text-shadow:1px 1px 3px black;background:rgba(0,0,0,0.5);padding:8px 14px;border-radius:20px;z-index:10}
#status{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:white;font-size:26px;background:rgba(0,0,0,0.9);z-index:100;text-align:center;padding:20px}
#hud{position:fixed;top:20px;right:20px;color:white;font-size:14px;font-weight:700;text-shadow:1px 1px 3px black;background:rgba(0,0,0,0.5);padding:8px 14px;border-radius:20px;z-index:10}
#chargeBar{position:fixed;bottom:130px;right:95px;width:75px;height:8px;background:rgba(0,0,0,0.4);border-radius:4px;overflow:hidden;display:none;z-index:11}
#chargeFill{height:100%;background:linear-gradient(90deg,#ffeb3b,#ff5722);width:0%}
#stunOverlay{position:fixed;inset:0;background:rgba(255,255,0,0.15);z-index:50;display:none;pointer-events:none}
</style>
</head>
<body>
<div id="status">Connessione in corso...<br><small>Apri questo link sul secondo iPad per giocare!</small></div>
<div id="team"></div>
<div id="score">0 - 0</div>
<div id="hud"></div>
<div id="joystick"></div>
<div id="chargeBar"><div id="chargeFill"></div></div>
<div id="stunOverlay"></div>
<div id="buttons">
  <div class="btn sprint" id="sprintBtn">⚡SPRINT</div>
  <div class="btn pass" id="passBtn">🔵PASS</div>
  <div class="btn dribble" id="dribbleBtn">🟢DRIB</div>
  <div class="btn shoot" id="shootBtn">🔴TIRO</div>
  <div class="btn slide" id="slideBtn">🟣TACKLE</div>
  <div class="btn action" id="actionBtn">🟠ACT</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nipplejs@0.10.1/dist/nipplejs.min.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script>
var FIELD_L=100,FIELD_W=65,GOAL_W=16;
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x87CEEB);
scene.fog=new THREE.Fog(0x87CEEB,90,220);
var camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,0.1,500);
var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Luci
scene.add(new THREE.AmbientLight(0xffffff,0.6));
var sun=new THREE.DirectionalLight(0xffffff,1.1);
sun.position.set(20,60,25);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-70;sun.shadow.camera.right=70;
sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;
scene.add(sun);

// Campo
var fieldMat=new THREE.MeshStandardMaterial({color:0x3a9b3a});
var field=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L+20,FIELD_W+20),fieldMat);
field.rotation.x=-Math.PI/2;field.receiveShadow=true;scene.add(field);
for(var si=0;si<10;si++){
  var stripe=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L/10,FIELD_W),new THREE.MeshStandardMaterial({color:si%2===0?0x35923a:0x3da43d}));
  stripe.rotation.x=-Math.PI/2;stripe.position.set(-FIELD_L/2+(si+0.5)*FIELD_L/10,0.01,0);scene.add(stripe);
}

// Linee
function addLine(pts,color){
  color=color||0xffffff;
  var geo=new THREE.BufferGeometry().setFromPoints(pts.map(function(p){return new THREE.Vector3(p[0],0.03,p[1]);}));
  scene.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:color})));
}
addLine([[-FIELD_L/2,-FIELD_W/2],[FIELD_L/2,-FIELD_W/2],[FIELD_L/2,FIELD_W/2],[-FIELD_L/2,FIELD_W/2],[-FIELD_L/2,-FIELD_W/2]]);
addLine([[0,-FIELD_W/2],[0,FIELD_W/2]]);
var circ=[];for(var ci=0;ci<=50;ci++){var ca=(ci/50)*Math.PI*2;circ.push([Math.cos(ca)*9.5,Math.sin(ca)*9.5]);}addLine(circ);
addLine([[-FIELD_L/2,-16],[-FIELD_L/2+16,-16],[-FIELD_L/2+16,16],[-FIELD_L/2,16]]);
addLine([[FIELD_L/2,-16],[FIELD_L/2-16,-16],[FIELD_L/2-16,16],[FIELD_L/2,16]]);

// Porte
function makeGoal(xPos){
  var grp=new THREE.Group();
  var mat=new THREE.MeshStandardMaterial({color:0xffffff,metalness:0.3,roughness:0.4});
  var pg=new THREE.CylinderGeometry(0.25,0.25,5);
  var p1=new THREE.Mesh(pg,mat);p1.position.set(xPos,2.5,-GOAL_W/2);p1.castShadow=true;grp.add(p1);
  var p2=new THREE.Mesh(pg,mat);p2.position.set(xPos,2.5,GOAL_W/2);p2.castShadow=true;grp.add(p2);
  var cross=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,GOAL_W),mat);
  cross.rotation.x=Math.PI/2;cross.position.set(xPos,5,0);cross.castShadow=true;grp.add(cross);
  var net=new THREE.Mesh(new THREE.BoxGeometry(3,5,GOAL_W),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.2,side:THREE.DoubleSide,wireframe:true}));
  net.position.set(xPos+(xPos>0?1.5:-1.5),2.5,0);grp.add(net);
  scene.add(grp);
}
makeGoal(-FIELD_L/2);makeGoal(FIELD_L/2);

// Palla
var ballMesh=new THREE.Mesh(new THREE.SphereGeometry(0.55,24,24),new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.3}));
ballMesh.castShadow=true;ballMesh.position.y=0.55;scene.add(ballMesh);
var ballPat=new THREE.Mesh(new THREE.SphereGeometry(0.56,12,12),new THREE.MeshBasicMaterial({color:0x222222,wireframe:true,transparent:true,opacity:0.5}));
ballMesh.add(ballPat);

// Ombra palla
var shadowCircle=new THREE.Mesh(new THREE.CircleGeometry(0.6,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.25}));
shadowCircle.rotation.x=-Math.PI/2;shadowCircle.position.y=0.02;scene.add(shadowCircle);

// Pickup meshes
var pickupMeshes={};
function makePickupMesh(type){
  var grp=new THREE.Group();
  if(type==='gun'){
    var body=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.4,0.2),new THREE.MeshStandardMaterial({color:0x333333,metalness:0.8}));
    body.position.y=1.2;grp.add(body);
    var barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.6),new THREE.MeshStandardMaterial({color:0x111111,metalness:0.9}));
    barrel.rotation.z=Math.PI/2;barrel.position.set(0.6,1.25,0);grp.add(barrel);
  } else {
    var chili=new THREE.Mesh(new THREE.SphereGeometry(0.35,8,8),new THREE.MeshStandardMaterial({color:0xff2200,roughness:0.4}));
    chili.scale.set(0.7,1.4,0.7);chili.position.y=1.2;grp.add(chili);
    var stem=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.3),new THREE.MeshStandardMaterial({color:0x228800}));
    stem.position.y=1.85;grp.add(stem);
  }
  return grp;
}

// Proiettili
var bulletMeshes={};

// Giocatori
var playerMeshes={};
function makePlayerMesh(team,number){
  var grp=new THREE.Group();
  var isMessi=(team==='A');
  var shirtColor=isMessi?0x1e5fdb:0xdb1e1e;
  var shortsColor=isMessi?0x0a3a8a:0x8a0a0a;
  var skinColor=isMessi?0xf0c090:0xe8b87a;
  var hairColor=isMessi?0x4a3000:0x1a1a1a; // Messi capelli scuri, Ronaldo nero

  // Gambe
  var legMat=new THREE.MeshStandardMaterial({color:shortsColor});
  var legGeo=new THREE.CylinderGeometry(0.2,0.17,1.0,8);
  var legL=new THREE.Mesh(legGeo,legMat);legL.position.set(-0.22,0.5,0);legL.castShadow=true;grp.add(legL);
  var legR=new THREE.Mesh(legGeo,legMat);legR.position.set(0.22,0.5,0);legR.castShadow=true;grp.add(legR);

  // Calzini bianchi
  var sockMat=new THREE.MeshStandardMaterial({color:0xffffff});
  var sockGeo=new THREE.CylinderGeometry(0.19,0.18,0.3,8);
  var skL=new THREE.Mesh(sockGeo,sockMat);skL.position.set(-0.22,0.15,0);grp.add(skL);
  var skR=new THREE.Mesh(sockGeo,sockMat);skR.position.set(0.22,0.15,0);grp.add(skR);

  // Scarpe
  var shoeMat=new THREE.MeshStandardMaterial({color:0x111111});
  var shL=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.18,0.52),shoeMat);shL.position.set(-0.22,0.09,0.08);shL.castShadow=true;grp.add(shL);
  var shR=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.18,0.52),shoeMat);shR.position.set(0.22,0.09,0.08);shR.castShadow=true;grp.add(shR);

  // Tronco
  var torso=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.38,1.0,12),new THREE.MeshStandardMaterial({color:shirtColor}));
  torso.position.y=1.5;torso.castShadow=true;grp.add(torso);

  // Numero maglia
  var cnv=document.createElement('canvas');cnv.width=64;cnv.height=64;
  var ctx=cnv.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.font='bold 52px Arial';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(number,32,34);
  var tex=new THREE.CanvasTexture(cnv);
  var numPlate=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.55),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
  numPlate.position.set(0,1.5,0.43);grp.add(numPlate);

  // Braccia
  var armMat=new THREE.MeshStandardMaterial({color:shirtColor});
  var armGeo=new THREE.CylinderGeometry(0.14,0.12,0.85,8);
  var armL=new THREE.Mesh(armGeo,armMat);armL.position.set(-0.54,1.5,0);armL.rotation.z=0.15;armL.castShadow=true;grp.add(armL);
  var armR=new THREE.Mesh(armGeo,armMat);armR.position.set(0.54,1.5,0);armR.rotation.z=-0.15;armR.castShadow=true;grp.add(armR);

  // Testa
  var head=new THREE.Mesh(new THREE.SphereGeometry(0.32,16,16),new THREE.MeshStandardMaterial({color:skinColor}));
  head.position.y=2.35;head.castShadow=true;grp.add(head);

  // Capelli Messi = marrone scuro fluente, Ronaldo = nero corto
  if(isMessi){
    var hair=new THREE.Mesh(new THREE.SphereGeometry(0.335,16,16,0,Math.PI*2,0,Math.PI*0.6),new THREE.MeshStandardMaterial({color:hairColor}));
    hair.position.y=2.38;grp.add(hair);
  } else {
    // Ronaldo capelli corti neri con riga
    var hair=new THREE.Mesh(new THREE.SphereGeometry(0.325,16,16,0,Math.PI*2,0,Math.PI*0.45),new THREE.MeshStandardMaterial({color:hairColor,roughness:0.3}));
    hair.position.y=2.42;grp.add(hair);
  }

  // Occhi
  var eyeMat=new THREE.MeshBasicMaterial({color:0x000000});
  var eyeGeo=new THREE.SphereGeometry(0.05,6,6);
  var eyeL=new THREE.Mesh(eyeGeo,eyeMat);eyeL.position.set(-0.12,2.38,0.28);grp.add(eyeL);
  var eyeR=new THREE.Mesh(eyeGeo,eyeMat);eyeR.position.set(0.12,2.38,0.28);grp.add(eyeR);

  grp.userData={legL:legL,legR:legR,armL:armL,armR:armR};
  return grp;
}

// Socket
var socket=io();
var myId=null,myTeam=null,serverState=null;

socket.on('init',function(d){
  myId=d.id;myTeam=d.team;
  document.getElementById('team').textContent='TEAM '+(myTeam==='A'?'🔵 MESSI #10':'🔴 RONALDO #7');
  document.getElementById('status').style.display='none';
});
socket.on('full',function(){document.getElementById('status').textContent='Partita piena! Riprova più tardi.';});
socket.on('state',function(s){
  serverState=s;
  document.getElementById('score').textContent=s.score.A+' - '+s.score.B;

  // Giocatori
  for(var id in s.players){
    if(!playerMeshes[id]){
      playerMeshes[id]=makePlayerMesh(s.players[id].team,s.players[id].number);
      scene.add(playerMeshes[id]);
    }
  }
  for(var id in playerMeshes){if(!s.players[id]){scene.remove(playerMeshes[id]);delete playerMeshes[id];}}

  // Pickup
  var activePkIds={};
  for(var pi=0;pi<s.pickups.length;pi++){
    var pk=s.pickups[pi];
    activePkIds[pk.id]=true;
    if(!pickupMeshes[pk.id]){
      pickupMeshes[pk.id]=makePickupMesh(pk.type);
      scene.add(pickupMeshes[pk.id]);
    }
    pickupMeshes[pk.id].position.set(pk.x,0,pk.z);
    pickupMeshes[pk.id].rotation.y+=0.05;
  }
  for(var pkid in pickupMeshes){if(!activePkIds[pkid]){scene.remove(pickupMeshes[pkid]);delete pickupMeshes[pkid];}}

  // Proiettili
  var activeBulletIds={};
  if(s.bullets){
    for(var bi=0;bi<s.bullets.length;bi++){
      var bl=s.bullets[bi];
      activeBulletIds[bl.id]=true;
      if(!bulletMeshes[bl.id]){
        var bm=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8),new THREE.MeshBasicMaterial({color:0xffff00}));
        var trail=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.15,0.5),new THREE.MeshBasicMaterial({color:0xff8800,transparent:true,opacity:0.6}));
        trail.rotation.z=Math.PI/2;trail.position.x=-0.3;bm.add(trail);
        bulletMeshes[bl.id]=bm;scene.add(bm);
      }
      bulletMeshes[bl.id].position.set(bl.x,0.8,bl.z);
    }
  }
  for(var blid in bulletMeshes){if(!activeBulletIds[blid]){scene.remove(bulletMeshes[blid]);delete bulletMeshes[blid];}}

  // HUD
  if(myId&&s.players[myId]){
    var me=s.players[myId];
    var hudText='';
    if(me.hasGun>0) hudText+='🔫 x'+me.hasGun+' ';
    if(me.chiliBoost>0) hudText+='🌶️ BOOST! ';
    if(me.stunned>0) hudText+='⚡ STUN! ';
    if(me.isGK) hudText+='🧤 PORTIERE';
    document.getElementById('hud').textContent=hudText;
    document.getElementById('stunOverlay').style.display=me.stunned>0?'block':'none';
    // Cambia bottone action
    var actBtn=document.getElementById('actionBtn');
    if(me.isGK){actBtn.textContent='🤸TUFFO';actBtn.style.background='rgba(0,200,255,0.4)';}
    else if(me.hasGun>0){actBtn.textContent='🔫SPARA';actBtn.style.background='rgba(255,200,0,0.4)';}
    else{actBtn.textContent='🟠ACT';actBtn.style.background='rgba(255,140,0,0.35)';}
  }
});

// Input
var input={mx:0,mz:0,pass:false,shoot:false,sprint:false,dribble:false,slide:false,action:false};
var joystick=nipplejs.create({zone:document.getElementById('joystick'),mode:'static',position:{left:'90px',bottom:'90px'},color:'white',size:160});
joystick.on('move',function(e,data){
  if(!data.vector)return;
  var flip=myTeam==='B'?-1:1;
  input.mx=-data.vector.x*flip;
  input.mz=data.vector.y*flip;
});
joystick.on('end',function(){input.mx=0;input.mz=0;});

function bindBtn(id,key){
  var el=document.getElementById(id);
  el.addEventListener('touchstart',function(e){e.preventDefault();input[key]=true;},{passive:false});
  el.addEventListener('touchend',function(e){e.preventDefault();input[key]=false;});
  el.addEventListener('touchcancel',function(){input[key]=false;});
  el.addEventListener('mousedown',function(){input[key]=true;});
  el.addEventListener('mouseup',function(){input[key]=false;});
}
bindBtn('passBtn','pass');
bindBtn('shootBtn','shoot');
bindBtn('sprintBtn','sprint');
bindBtn('dribbleBtn','dribble');
bindBtn('slideBtn','slide');
bindBtn('actionBtn','action');

// Barra carica tiro
var chargeBar=document.getElementById('chargeBar');
var chargeFill=document.getElementById('chargeFill');
var chargeTime=0;
setInterval(function(){
  if(input.shoot){chargeTime=Math.min(chargeTime+0.033,1.2);chargeBar.style.display='block';chargeFill.style.width=(chargeTime/1.2*100)+'%';}
  else{chargeTime=0;chargeBar.style.display='none';}
},33);

setInterval(function(){socket.emit('input',input);},33);

addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

var lerp=function(a,b,t){return a+(b-a)*t;};
var walkPhase=0;

function animate(){
  requestAnimationFrame(animate);
  if(!serverState){renderer.render(scene,camera);return;}

  // Palla
  ballMesh.position.x=lerp(ballMesh.position.x,serverState.ball.x,0.4);
  ballMesh.position.z=lerp(ballMesh.position.z,serverState.ball.z,0.4);
  ballMesh.rotation.x+=serverState.ball.vz*0.04;
  ballMesh.rotation.z-=serverState.ball.vx*0.04;
  shadowCircle.position.x=ballMesh.position.x;
  shadowCircle.position.z=ballMesh.position.z;

  // Giocatori
  walkPhase+=0.22;
  for(var id in serverState.players){
    var p=serverState.players[id];
    var m=playerMeshes[id];
    if(!m)continue;
    m.position.x=lerp(m.position.x,p.x,0.35);
    m.position.z=lerp(m.position.z,p.z,0.35);

    // Rotazione verso direzione
    var moving=Math.sqrt(p.input.mx*p.input.mx+p.input.mz*p.input.mz)>0.15;
    if(moving||p.sliding>0){
      var targetRot=Math.atan2(p.dirX,p.dirZ);
      var curRot=m.rotation.y;
      var diff=targetRot-curRot;
      while(diff>Math.PI)diff-=Math.PI*2;
      while(diff<-Math.PI)diff+=Math.PI*2;
      m.rotation.y+=diff*0.2;
    }

    // Animazione gambe
    if(moving&&p.sliding<=0&&p.diving<=0){
      var swing=Math.sin(walkPhase)*0.55;
      m.userData.legL.rotation.x=swing;
      m.userData.legR.rotation.x=-swing;
      m.userData.armL.rotation.x=-swing*0.5;
      m.userData.armR.rotation.x=swing*0.5;
    } else {
      m.userData.legL.rotation.x*=0.85;
      m.userData.legR.rotation.x*=0.85;
      m.userData.armL.rotation.x*=0.85;
      m.userData.armR.rotation.x*=0.85;
    }

    // Scivolata = inclinato
    if(p.sliding>0) m.rotation.x=lerp(m.rotation.x,-Math.PI/3,0.3);
    else if(p.diving>0) m.rotation.x=lerp(m.rotation.x,-Math.PI/2.5,0.3);
    else m.rotation.x=lerp(m.rotation.x,0,0.2);

    // Effetto stun = lampeggia
    if(p.stunned>0){
      var vis=Math.floor(Date.now()/100)%2===0;
      m.traverse(function(child){if(child.isMesh)child.visible=vis;});
    } else {
      m.traverse(function(child){if(child.isMesh)child.visible=true;});
    }
  }

  // Pickup rotazione
  for(var pkid in pickupMeshes){pickupMeshes[pkid].rotation.y+=0.03;}

  // Camera laterale
  if(myId&&serverState.players[myId]){
    var me=serverState.players[myId];
    var camSide=myTeam==='A'?-1:1;
    camera.position.x=lerp(camera.position.x,me.x*0.4,0.07);
    camera.position.z=lerp(camera.position.z,camSide*(FIELD_W/2+30),0.07);
    camera.position.y=24;
    camera.lookAt(me.x*0.2,0,0);
  } else {
    camera.position.set(0,30,55);
    camera.lookAt(0,0,0);
  }

  renderer.render(scene,camera);
}
animate();
</script>
</body>
</html>
