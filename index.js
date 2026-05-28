var express = require('express');
var http = require('http');
var Server = require('socket.io').Server;
var app = express();
var server = http.createServer(app);
var io = new Server(server);
app.use(express.static('public'));

var FIELD_L=100,FIELD_W=65,GOAL_W=16;
var AREA_DEPTH=18,AREA_WIDTH=34;
var SPEED=13,SPRINT=1.65,FRICTION=0.96,KICK=30,KICK_MAX=48,PASS=20;
var GK_DIVE_SPEED=26,GK_DIVE_TIME=0.7,GK_HOLD_TIME=2.5;
var STUN_TIME=1.5,CHILI_BOOST_TIME=3,CHILI_SPEED_BOOST=1.8;
var PICKUP_RADIUS=2.2,SPAWN_INTERVAL=9;

var state={players:{},ball:{x:0,z:0,vx:0,vz:0,heldBy:null,dribbledBy:null},score:{A:0,B:0},pickups:[],throwIn:null};
var slots={A:null,B:null},pickupCounter=0,bulletCounter=0,bullets=[];

function inOwnArea(p){
  if(p.team==='A')return p.x<-FIELD_L/2+AREA_DEPTH&&Math.abs(p.z)<AREA_WIDTH/2;
  return p.x>FIELD_L/2-AREA_DEPTH&&Math.abs(p.z)<AREA_WIDTH/2;
}

io.on('connection',function(socket){
  var team=null;
  if(!slots.A){slots.A=socket.id;team='A';}
  else if(!slots.B){slots.B=socket.id;team='B';}
  if(!team){socket.emit('full');socket.disconnect();return;}
  state.players[socket.id]={
    x:team==='A'?-25:25,z:0,dirX:team==='A'?1:-1,dirZ:0,
    team:team,number:team==='A'?10:7,
    sliding:0,diving:0,diveX:0,diveZ:0,
    chargeShot:0,dribbling:false,dribbleCooldown:0,
    isGK:false,stunned:0,chiliBoost:0,hasGun:0,shootCooldown:0,
    holdingBall:false,holdTimer:0,
    input:{mx:0,mz:0,pass:false,shoot:false,sprint:false,dribble:false,slide:false,action:false},
    prevDribble:false
  };
  socket.emit('init',{id:socket.id,team:team});
  console.log('Connesso:',team);
  socket.on('input',function(d){
    var p=state.players[socket.id];if(!p)return;
    p.input.mx=d.mx||0;p.input.mz=d.mz||0;
    p.input.pass=!!d.pass;p.input.shoot=!!d.shoot;
    p.input.sprint=!!d.sprint;p.input.dribble=!!d.dribble;
    p.input.slide=!!d.slide;p.input.action=!!d.action;
  });
  socket.on('disconnect',function(){
    if(slots.A===socket.id)slots.A=null;
    if(slots.B===socket.id)slots.B=null;
    delete state.players[socket.id];
    state.ball.heldBy=null;state.ball.dribbledBy=null;
    resetBall();
  });
});

function resetBall(){
  state.ball={x:0,z:0,vx:0,vz:0,heldBy:null,dribbledBy:null};
  state.throwIn=null;
  var ids=Object.keys(state.players);
  for(var i=0;i<ids.length;i++){
    var p=state.players[ids[i]];
    p.x=p.team==='A'?-25:25;p.z=0;
    p.diving=0;p.sliding=0;p.holdingBall=false;p.holdTimer=0;p.dribbling=false;
  }
}

function spawnPickup(){
  var type=Math.random()<0.5?'gun':'chili';
  var x=(Math.random()-0.5)*(FIELD_L-30);
  var z=(Math.random()-0.5)*(FIELD_W-15);
  pickupCounter++;
  state.pickups.push({id:pickupCounter,type:type,x:x,z:z});
  if(state.pickups.length>6)state.pickups.shift();
}
setInterval(spawnPickup,SPAWN_INTERVAL*1000);
setTimeout(spawnPickup,2000);setTimeout(spawnPickup,4000);

var lastTick=Date.now();
setInterval(function(){
  var now=Date.now();var dt=(now-lastTick)/1000;lastTick=now;
  var ids=Object.keys(state.players);

  if(state.throwIn){
    state.throwIn.timer-=dt;
    if(state.throwIn.timer<=0){
      state.ball.x=state.throwIn.x;state.ball.z=state.throwIn.z;
      state.ball.vx=0;state.ball.vz=0;state.ball.heldBy=null;state.throwIn=null;
    }
  }

  for(var i=0;i<ids.length;i++){
    var id=ids[i];var p=state.players[id];
    if(p.stunned>0)p.stunned-=dt;
    if(p.chiliBoost>0)p.chiliBoost-=dt;
    if(p.shootCooldown>0)p.shootCooldown-=dt;
    if(p.dribbleCooldown>0)p.dribbleCooldown-=dt;
    p.isGK=inOwnArea(p);

    if(p.stunned>0){p.input.mx=0;p.input.mz=0;p.prevDribble=p.input.dribble;continue;}

    var len=Math.sqrt(p.input.mx*p.input.mx+p.input.mz*p.input.mz);

    // DRIBBLING TOGGLE: premi una volta attiva, di nuovo disattiva
    if(p.input.dribble&&!p.prevDribble&&p.dribbleCooldown<=0){
      p.dribbling=!p.dribbling;
      p.dribbleCooldown=0.25;
      if(!p.dribbling&&state.ball.dribbledBy===id){
        state.ball.dribbledBy=null; // rilascia palla
      }
    }
    p.prevDribble=p.input.dribble;

    // PORTIERE TIENE PALLA
    if(p.holdingBall){
      p.holdTimer-=dt;
      state.ball.x=p.x+p.dirX*1.2;state.ball.z=p.z+p.dirZ*1.2;
      state.ball.vx=0;state.ball.vz=0;state.ball.heldBy=id;
      // Rilascia/lancia con PASS
      if(p.input.pass||p.holdTimer<=0){
        var launchDirX=p.team==='A'?1:-1;
        state.ball.vx=launchDirX*PASS*1.8;
        state.ball.vz=p.dirZ*PASS*0.4;
        state.ball.heldBy=null;p.holdingBall=false;p.holdTimer=0;p.input.pass=false;
      }
      // Tiro forte con SHOOT
      if(p.input.shoot){p.chargeShot+=dt;if(p.chargeShot>1.0)p.chargeShot=1.0;}
      if(!p.input.shoot&&p.chargeShot>0.05){
        var gkPwr=KICK+(KICK_MAX-KICK)*(p.chargeShot/1.0);
        var gkTx=(p.team==='A'?FIELD_L/2:-FIELD_L/2)-p.x;var gkTz=-p.z*0.2;
        var gkTl=Math.sqrt(gkTx*gkTx+gkTz*gkTz);
        state.ball.vx=(gkTx/gkTl)*gkPwr;state.ball.vz=(gkTz/gkTl)*gkPwr;
        state.ball.heldBy=null;p.holdingBall=false;p.chargeShot=0;
      }
    }

    // TUFFO PORTIERE
    if(p.isGK&&p.input.action&&p.diving<=0&&!p.holdingBall){
      p.diving=GK_DIVE_TIME;
      if(len>0.15){p.diveX=p.input.mx/len;p.diveZ=p.input.mz/len;}
      else{p.diveX=0;p.diveZ=p.team==='A'?1:-1;}
    }
    if(p.diving>0){
      p.diving-=dt;
      p.x+=p.diveX*GK_DIVE_SPEED*dt;p.z+=p.diveZ*GK_DIVE_SPEED*dt;
    }
    else if(!p.isGK&&p.input.slide&&p.sliding<=0){
      p.sliding=0.5;
      if(len>0.15){p.dirX=p.input.mx/len;p.dirZ=p.input.mz/len;}
    }

    if(p.sliding>0&&p.diving<=0){
      p.sliding-=dt;
      p.x+=p.dirX*SPEED*2.0*dt;p.z+=p.dirZ*SPEED*2.0*dt;
    } else if(p.diving<=0&&!p.holdingBall){
      var spd=SPEED;
      if(p.input.sprint)spd*=SPRINT;
      if(p.chiliBoost>0)spd*=CHILI_SPEED_BOOST;
      if(len>0.15){
        p.x+=(p.input.mx/len)*spd*dt;p.z+=(p.input.mz/len)*spd*dt;
        p.dirX=p.input.mx/len;p.dirZ=p.input.mz/len;
      }
    }

    if(p.x<-FIELD_L/2+1)p.x=-FIELD_L/2+1;if(p.x>FIELD_L/2-1)p.x=FIELD_L/2-1;
    if(p.z<-FIELD_W/2+1)p.z=-FIELD_W/2+1;if(p.z>FIELD_W/2-1)p.z=FIELD_W/2-1;

    if(!p.isGK&&p.input.action&&p.hasGun>0&&p.shootCooldown<=0){
      p.hasGun--;p.shootCooldown=0.4;bulletCounter++;
      bullets.push({id:bulletCounter,x:p.x+p.dirX*1.5,z:p.z+p.dirZ*1.5,vx:p.dirX*55,vz:p.dirZ*55,team:p.team,life:1.5});
    }

    for(var k=state.pickups.length-1;k>=0;k--){
      var pk=state.pickups[k];var pdx=pk.x-p.x;var pdz=pk.z-p.z;
      if(Math.sqrt(pdx*pdx+pdz*pdz)<PICKUP_RADIUS){
        if(pk.type==='gun')p.hasGun=3;else p.chiliBoost=CHILI_BOOST_TIME;
        state.pickups.splice(k,1);
      }
    }

    if(!p.holdingBall&&p.input.shoot){
      p.chargeShot+=dt;if(p.chargeShot>1.2)p.chargeShot=1.2;
    }

    if(p.holdingBall){p.prevDribble=p.input.dribble;continue;}

    // TACKLE/SCIVOLATA ruba palla all'avversario
    if(p.sliding>0&&state.ball.dribbledBy&&state.ball.dribbledBy!==id){
      var owner=state.players[state.ball.dribbledBy];
      if(owner){
        var odx=owner.x-p.x;var odz=owner.z-p.z;
        if(Math.sqrt(odx*odx+odz*odz)<3.0){
          state.ball.dribbledBy=null;
          owner.dribbling=false;
        }
      }
    }

    var dx=state.ball.x-p.x;var dz=state.ball.z-p.z;
    var d=Math.sqrt(dx*dx+dz*dz);
    var range=p.diving>0?3.5:(p.dribbling?2.5:2.0);

    if(d<range){
      var bDirX=d>0.01?dx/d:p.dirX;var bDirZ=d>0.01?dz/d:p.dirZ;

      // PORTIERE PARA col tuffo
      if(p.isGK&&p.diving>0){
        p.holdingBall=true;p.holdTimer=GK_HOLD_TIME;p.diving=0;
        state.ball.heldBy=id;state.ball.dribbledBy=null;
      }
      // TIRO
      else if(!p.input.shoot&&p.chargeShot>0.05){
        var power=KICK+(KICK_MAX-KICK)*(p.chargeShot/1.2);
        var targetX=p.team==='A'?FIELD_L/2:-FIELD_L/2;
        var autoX=targetX-p.x;var autoZ=-p.z*0.25;
        var autoLen=Math.sqrt(autoX*autoX+autoZ*autoZ);
        var jw=Math.min(len*1.5,0.7);
        var fX=autoX/autoLen*(1-jw)+p.dirX*jw;
        var fZ=autoZ/autoLen*(1-jw)+p.dirZ*jw;
        var fl=Math.sqrt(fX*fX+fZ*fZ);
        state.ball.vx=(fX/fl)*power;state.ball.vz=(fZ/fl)*power;
        state.ball.dribbledBy=null;p.dribbling=false;p.chargeShot=0;
      }
      // PASSAGGIO
      else if(p.input.pass){
        state.ball.vx=p.dirX*PASS;state.ball.vz=p.dirZ*PASS;
        state.ball.dribbledBy=null;p.dribbling=false;p.input.pass=false;
      }
      // DRIBBLING attivo: palla incollata
      else if(p.dribbling&&p.sliding<=0){
        var spd3=SPEED;
        if(p.input.sprint)spd3*=SPRINT;
        if(p.chiliBoost>0)spd3*=CHILI_SPEED_BOOST;
        state.ball.x=p.x+p.dirX*1.4;state.ball.z=p.z+p.dirZ*1.4;
        state.ball.vx=p.dirX*spd3;state.ball.vz=p.dirZ*spd3;
        state.ball.dribbledBy=id;
      }
      // Contatto morbido
      else if(d<1.5&&!p.dribbling){
        state.ball.vx=bDirX*8;state.ball.vz=bDirZ*8;
      }
    }
    p.prevDribble=p.input.dribble;
  }

  for(var b=bullets.length-1;b>=0;b--){
    var bl=bullets[b];bl.x+=bl.vx*dt;bl.z+=bl.vz*dt;bl.life-=dt;
    if(bl.life<=0||Math.abs(bl.x)>FIELD_L/2||Math.abs(bl.z)>FIELD_W/2){bullets.splice(b,1);continue;}
    for(var j=0;j<ids.length;j++){
      var target=state.players[ids[j]];
      if(!target||target.team===bl.team)continue;
      var bdx=bl.x-target.x;var bdz=bl.z-target.z;
      if(Math.sqrt(bdx*bdx+bdz*bdz)<1.3){target.stunned=STUN_TIME;bullets.splice(b,1);break;}
    }
  }

  // PALLA si muove solo se non tenuta e non dribblata
  if(!state.ball.heldBy&&!state.ball.dribbledBy){
    state.ball.x+=state.ball.vx*dt;state.ball.z+=state.ball.vz*dt;
    state.ball.vx*=FRICTION;state.ball.vz*=FRICTION;

    // FUORI BANDA
    if(Math.abs(state.ball.z)>FIELD_W/2&&!state.throwIn){
      var tz=state.ball.z>0?FIELD_W/2-0.5:-(FIELD_W/2-0.5);
      state.throwIn={x:state.ball.x,z:tz,timer:1.5};
      state.ball.vx=0;state.ball.vz=0;state.ball.z=tz;
    }

    // GOL: palla supera la linea di porta (x oltre FIELD_L/2) E dentro i pali
    if(state.ball.x>FIELD_L/2&&Math.abs(state.ball.z)<GOAL_W/2){
      state.score.A++;resetBall();
    } else if(state.ball.x<-FIELD_L/2&&Math.abs(state.ball.z)<GOAL_W/2){
      state.score.B++;resetBall();
    }
    // Fuori sul fondo (non gol): rimbalza
    else if(state.ball.x>FIELD_L/2&&Math.abs(state.ball.z)>=GOAL_W/2){
      state.ball.vx*=-0.5;state.ball.x=FIELD_L/2-1;
    } else if(state.ball.x<-FIELD_L/2&&Math.abs(state.ball.z)>=GOAL_W/2){
      state.ball.vx*=-0.5;state.ball.x=-(FIELD_L/2-1);
    }
  }

  io.emit('state',{players:state.players,ball:state.ball,score:state.score,pickups:state.pickups,bullets:bullets,throwIn:state.throwIn});
},1000/60);

var PORT=process.env.PORT||3000;
server.listen(PORT,function(){console.log('Server avviato porta',PORT);});
