var express = require('express');
var http = require('http');
var Server = require('socket.io').Server;
var app = express();
var server = http.createServer(app);
var io = new Server(server);
app.use(express.static('public'));

var FIELD_L=100,FIELD_W=65,GOAL_W=14,GOAL_DEPTH=3;
var AREA_DEPTH=18,AREA_WIDTH=34;
var SPEED=13,SPRINT=1.65,FRICTION=0.955,KICK=28,KICK_MAX=48,PASS=20;
var GK_DIVE_SPEED=26,GK_DIVE_TIME=0.7,GK_HOLD_TIME=2.5;
var STUN_TIME=1.5,CHILI_BOOST_TIME=3,CHILI_SPEED_BOOST=1.8;
var PICKUP_RADIUS=2.2,SPAWN_INTERVAL=9;

var state={players:{},ball:{x:0,z:0,vx:0,vz:0,heldBy:null},score:{A:0,B:0},pickups:[],throwIn:null};
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
    chargeShot:0,dribbleTime:0,isGK:false,
    stunned:0,chiliBoost:0,hasGun:0,shootCooldown:0,
    holdingBall:false,holdTimer:0,
    input:{mx:0,mz:0,pass:false,shoot:false,sprint:false,dribble:false,slide:false,action:false}
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
    state.ball.heldBy=null;
    resetBall();
  });
});

function resetBall(){
  state.ball={x:0,z:0,vx:0,vz:0,heldBy:null};
  state.throwIn=null;
  var ids=Object.keys(state.players);
  for(var i=0;i<ids.length;i++){
    var p=state.players[ids[i]];
    p.x=p.team==='A'?-25:25;p.z=0;
    p.diving=0;p.sliding=0;p.holdingBall=false;p.holdTimer=0;
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

  // Rimessa laterale: aspetta 2 sec poi rilascia
  if(state.throwIn){
    state.throwIn.timer-=dt;
    if(state.throwIn.timer<=0){
      state.ball.x=state.throwIn.x;
      state.ball.z=state.throwIn.z;
      state.ball.vx=0;state.ball.vz=0;
      state.ball.heldBy=null;
      state.throwIn=null;
    }
  }

  for(var i=0;i<ids.length;i++){
    var id=ids[i];var p=state.players[id];
    if(p.stunned>0)p.stunned-=dt;
    if(p.chiliBoost>0)p.chiliBoost-=dt;
    if(p.shootCooldown>0)p.shootCooldown-=dt;
    p.isGK=inOwnArea(p);

    if(p.stunned>0){p.input.mx=0;p.input.mz=0;continue;}

    var len=Math.sqrt(p.input.mx*p.input.mx+p.input.mz*p.input.mz);

    // PORTIERE TIENE PALLA IN MANO
    if(p.holdingBall){
      p.holdTimer-=dt;
      state.ball.x=p.x+p.dirX*1.2;
      state.ball.z=p.z+p.dirZ*1.2;
      state.ball.vx=0;state.ball.vz=0;
      state.ball.heldBy=id;
      // Rilascio con PASS = lancia fuori area
      if(p.input.pass||p.holdTimer<=0){
        var launchPower=p.input.pass?PASS*1.8:PASS;
        // Lancia sempre verso il centro campo
        var launchDirX=p.team==='A'?1:-1;
        state.ball.vx=launchDirX*launchPower;
        state.ball.vz=p.dirZ*launchPower*0.3;
        state.ball.heldBy=null;
        p.holdingBall=false;p.holdTimer=0;
        p.input.pass=false;
      }
      // Tiro in porta con SHOOT (portiere può tirare)
      if(p.input.shoot&&!p.input.pass){
        p.chargeShot+=dt;
        if(p.chargeShot>1.0)p.chargeShot=1.0;
      }
      if(!p.input.shoot&&p.chargeShot>0.05){
        var gkPower=KICK*0.8+(KICK_MAX-KICK)*0.8*(p.chargeShot/1.0);
        var gkTargetX=p.team==='A'?FIELD_L/2:-FIELD_L/2;
        var gkTx=gkTargetX-p.x;var gkTz=-p.z*0.2;
        var gkTl=Math.sqrt(gkTx*gkTx+gkTz*gkTz);
        state.ball.vx=(gkTx/gkTl)*gkPower;
        state.ball.vz=(gkTz/gkTl)*gkPower;
        state.ball.heldBy=null;
        p.holdingBall=false;p.holdTimer=0;p.chargeShot=0;
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
      p.x+=p.diveX*GK_DIVE_SPEED*dt;
      p.z+=p.diveZ*GK_DIVE_SPEED*dt;
    }
    else if(!p.isGK&&p.input.slide&&p.sliding<=0){
      p.sliding=0.6;
      if(len>0.15){p.dirX=p.input.mx/len;p.dirZ=p.input.mz/len;}
    }

    if(p.sliding>0&&p.diving<=0){
      p.sliding-=dt;
      p.x+=p.dirX*SPEED*1.5*dt;p.z+=p.dirZ*SPEED*1.5*dt;
    } else if(p.diving<=0&&!p.holdingBall){
      var spd=SPEED;
      if(p.input.sprint)spd*=SPRINT;
      if(p.chiliBoost>0)spd*=CHILI_SPEED_BOOST;
      if(len>0.15){
        p.x+=(p.input.mx/len)*spd*dt;
        p.z+=(p.input.mz/len)*spd*dt;
        p.dirX=p.input.mx/len;p.dirZ=p.input.mz/len;
      }
    }

    if(p.x<-FIELD_L/2+1)p.x=-FIELD_L/2+1;if(p.x>FIELD_L/2-1)p.x=FIELD_L/2-1;
    if(p.z<-FIELD_W/2+1)p.z=-FIELD_W/2+1;if(p.z>FIELD_W/2-1)p.z=FIELD_W/2-1;

    // SPARA
    if(!p.isGK&&p.input.action&&p.hasGun>0&&p.shootCooldown<=0){
      p.hasGun--;p.shootCooldown=0.4;bulletCounter++;
      bullets.push({id:bulletCounter,x:p.x+p.dirX*1.5,z:p.z+p.dirZ*1.5,vx:p.dirX*55,vz:p.dirZ*55,team:p.team,life:1.5});
    }

    // PICKUP
    for(var k=state.pickups.length-1;k>=0;k--){
      var pk=state.pickups[k];
      var pdx=pk.x-p.x;var pdz=pk.z-p.z;
      if(Math.sqrt(pdx*pdx+pdz*pdz)<PICKUP_RADIUS){
        if(pk.type==='gun')p.hasGun=3;else p.chiliBoost=CHILI_BOOST_TIME;
        state.pickups.splice(k,1);
      }
    }

    // CARICA TIRO (solo fuori area e non tiene palla)
    if(!p.isGK&&!p.holdingBall&&p.input.shoot){
      p.chargeShot+=dt;if(p.chargeShot>1.2)p.chargeShot=1.2;
    }
    if(p.input.dribble)p.dribbleTime=0.3;
    else if(p.dribbleTime>0)p.dribbleTime-=dt;

    // INTERAZIONE PALLA (skip se portiere tiene palla)
    if(p.holdingBall)continue;
    if(state.ball.heldBy&&state.ball.heldBy!==id)continue;

    var dx=state.ball.x-p.x;var dz=state.ball.z-p.z;
    var d=Math.sqrt(dx*dx+dz*dz);
    // Portiere ha range tuffo molto più grande
    var range=p.diving>0?3.5:(p.dribbleTime>0?2.5:2.0);

    if(d<range){
      var bDirX=d>0.01?dx/d:p.dirX;var bDirZ=d>0.01?dz/d:p.dirZ;

      // PORTIERE PARA = prende palla in mano
      if(p.isGK&&p.diving>0){
        p.holdingBall=true;p.holdTimer=GK_HOLD_TIME;
        p.diving=0;state.ball.heldBy=id;
      }
      // PORTIERE IN AREA (non in tuffo) tocca palla = la prende
      else if(p.isGK&&d<1.8&&!p.holdingBall){
        p.holdingBall=true;p.holdTimer=GK_HOLD_TIME;
        state.ball.heldBy=id;
      }
      // TIRO (al rilascio, fuori area)
      else if(!p.isGK&&!p.input.shoot&&p.chargeShot>0.05){
        // Tiro più facile: punta verso porta con ampio angolo
        var power=KICK+(KICK_MAX-KICK)*(p.chargeShot/1.2);
        var targetX=p.team==='A'?FIELD_L/2:-FIELD_L/2;
        // Aggiunge direzione joystick per controllo manuale
        var autoX=targetX-p.x;var autoZ=-p.z*0.25;
        var autoLen=Math.sqrt(autoX*autoX+autoZ*autoZ);
        var joyWeight=Math.min(len*1.5,0.7); // quanto conta il joystick
        var finalX=autoX/autoLen*(1-joyWeight)+p.dirX*joyWeight;
        var finalZ=autoZ/autoLen*(1-joyWeight)+p.dirZ*joyWeight;
        var finalLen=Math.sqrt(finalX*finalX+finalZ*finalZ);
        state.ball.vx=(finalX/finalLen)*power;
        state.ball.vz=(finalZ/finalLen)*power;
        p.chargeShot=0;
      }
      // PASSAGGIO
      else if(p.input.pass){
        state.ball.vx=p.dirX*PASS;state.ball.vz=p.dirZ*PASS;
        p.input.pass=false;
      }
      // DRIBBLING
      else if(!p.isGK&&p.dribbleTime>0&&p.sliding<=0){
        var spd3=SPEED;
        if(p.input.sprint)spd3*=SPRINT;
        if(p.chiliBoost>0)spd3*=CHILI_SPEED_BOOST;
        state.ball.x=p.x+p.dirX*1.3;state.ball.z=p.z+p.dirZ*1.3;
        state.ball.vx=p.dirX*spd3;state.ball.vz=p.dirZ*spd3;
      }
      // Contatto naturale morbido
      else if(d<1.5){
        state.ball.vx=bDirX*8;state.ball.vz=bDirZ*8;
      }
    }
  }

  // PROIETTILI
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

  // PALLA (skip se tenuta)
  if(!state.ball.heldBy){
    state.ball.x+=state.ball.vx*dt;state.ball.z+=state.ball.vz*dt;
    state.ball.vx*=FRICTION;state.ball.vz*=FRICTION;

    // FUORI BANDA — rimessa laterale
    if(Math.abs(state.ball.z)>FIELD_W/2&&!state.throwIn){
      var throwZ=state.ball.z>0?FIELD_W/2-0.5:-(FIELD_W/2-0.5);
      state.throwIn={x:state.ball.x,z:throwZ,timer:2.0};
      state.ball.vx=0;state.ball.vz=0;
      state.ball.z=throwZ;
    }

    // GOL — palla deve essere dentro la porta (x oltre linea E z dentro porta)
    if(state.ball.x>FIELD_L/2+GOAL_DEPTH&&Math.abs(state.ball.z)<GOAL_W/2){
      state.score.A++;resetBall();
    } else if(state.ball.x<-(FIELD_L/2+GOAL_DEPTH)&&Math.abs(state.ball.z)<GOAL_W/2){
      state.score.B++;resetBall();
    }
    // Palla oltre linea di fondo (non gol) = rimessa dal fondo
    else if(state.ball.x>FIELD_L/2&&Math.abs(state.ball.z)>=GOAL_W/2){
      state.ball.vx*=-0.6;state.ball.x=FIELD_L/2-1;
    } else if(state.ball.x<-FIELD_L/2&&Math.abs(state.ball.z)>=GOAL_W/2){
      state.ball.vx*=-0.6;state.ball.x=-(FIELD_L/2-1);
    }
  }

  io.emit('state',{players:state.players,ball:state.ball,score:state.score,pickups:state.pickups,bullets:bullets,throwIn:state.throwIn});
},1000/60);

var PORT=process.env.PORT||3000;
server.listen(PORT,function(){console.log('Server avviato porta',PORT);});
