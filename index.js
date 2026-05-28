var express = require('express');
var http = require('http');
var Server = require('socket.io').Server;
var app = express();
var server = http.createServer(app);
var io = new Server(server);
app.use(express.static('public'));
var FIELD_L=100,FIELD_W=65,GOAL_W=16,AREA_DEPTH=16,AREA_WIDTH=32;
var SPEED=13,SPRINT=1.7,FRICTION=0.96,KICK=32,KICK_MAX=52,PASS=18;
var GK_DIVE_SPEED=22,GK_DIVE_TIME=0.5,STUN_TIME=1.5;
var CHILI_BOOST_TIME=3,CHILI_SPEED_BOOST=2.0,PICKUP_RADIUS=2,SPAWN_INTERVAL=8;
var state={players:{},ball:{x:0,z:0,vx:0,vz:0},score:{A:0,B:0},pickups:[]};
var slots={A:null,B:null},pickupCounter=0,bulletCounter=0,bullets=[];
function inOwnArea(p){if(p.team==='A')return p.x<-FIELD_L/2+AREA_DEPTH&&Math.abs(p.z)<AREA_WIDTH/2;return p.x>FIELD_L/2-AREA_DEPTH&&Math.abs(p.z)<AREA_WIDTH/2;}
io.on('connection',function(socket){
var team=null;
if(!slots.A){slots.A=socket.id;team='A';}
else if(!slots.B){slots.B=socket.id;team='B';}
if(!team){socket.emit('full');socket.disconnect();return;}
state.players[socket.id]={x:team==='A'?-25:25,z:0,dirX:team==='A'?1:-1,dirZ:0,team:team,number:team==='A'?10:7,sliding:0,diving:0,diveX:0,diveZ:0,chargeShot:0,dribbleTime:0,isGK:false,stunned:0,chiliBoost:0,hasGun:0,shootCooldown:0,input:{mx:0,mz:0,pass:false,shoot:false,sprint:false,dribble:false,slide:false,action:false}};
socket.emit('init',{id:socket.id,team:team});
console.log('Connesso:',team);
socket.on('input',function(d){var p=state.players[socket.id];if(!p)return;p.input.mx=d.mx||0;p.input.mz=d.mz||0;p.input.pass=!!d.pass;p.input.shoot=!!d.shoot;p.input.sprint=!!d.sprint;p.input.dribble=!!d.dribble;p.input.slide=!!d.slide;p.input.action=!!d.action;});
socket.on('disconnect',function(){if(slots.A===socket.id)slots.A=null;if(slots.B===socket.id)slots.B=null;delete state.players[socket.id];resetBall();});
});
function resetBall(){state.ball={x:0,z:0,vx:0,vz:0};var ids=Object.keys(state.players);for(var i=0;i<ids.length;i++){var p=state.players[ids[i]];p.x=p.team==='A'?-25:25;p.z=0;p.diving=0;p.sliding=0;}}
function spawnPickup(){var type=Math.random()<0.5?'gun':'chili';var x=(Math.random()-0.5)*(FIELD_L-30);var z=(Math.random()-0.5)*(FIELD_W-15);pickupCounter++;state.pickups.push({id:pickupCounter,type:type,x:x,z:z});if(state.pickups.length>6)state.pickups.shift();}
setInterval(spawnPickup,SPAWN_INTERVAL*1000);setTimeout(spawnPickup,2000);setTimeout(spawnPickup,4000);
var lastTick=Date.now();
setInterval(function(){
var now=Date.now();var dt=(now-lastTick)/1000;lastTick=now;
var ids=Object.keys(state.players);
for(var i=0;i<ids.length;i++){
var id=ids[i];var p=state.players[id];
if(p.stunned>0)p.stunned-=dt;
if(p.chiliBoost>0)p.chiliBoost-=dt;
if(p.shootCooldown>0)p.shootCooldown-=dt;
p.isGK=inOwnArea(p);
if(p.stunned>0){p.input.mx=0;p.input.mz=0;continue;}
var len=Math.sqrt(p.input.mx*p.input.mx+p.input.mz*p.input.mz);
if(p.isGK&&p.input.action&&p.diving<=0){p.diving=GK_DIVE_TIME;if(len>0.15){p.diveX=p.input.mx/len;p.diveZ=p.input.mz/len;}else{p.diveX=0;p.diveZ=p.team==='A'?1:-1;}}
if(p.diving>0){p.diving-=dt;p.x+=p.diveX*GK_DIVE_SPEED*dt;p.z+=p.diveZ*GK_DIVE_SPEED*dt;}
else if(!p.isGK&&p.input.slide&&p.sliding<=0){p.sliding=0.6;if(len>0.15){p.dirX=p.input.mx/len;p.dirZ=p.input.mz/len;}}
if(p.sliding>0&&p.diving<=0){p.sliding-=dt;p.x+=p.dirX*SPEED*1.5*dt;p.z+=p.dirZ*SPEED*1.5*dt;}
else if(p.diving<=0){var spd=SPEED;if(p.input.sprint)spd*=SPRINT;if(p.chiliBoost>0)spd*=CHILI_SPEED_BOOST;if(len>0.15){p.x+=(p.input.mx/len)*spd*dt;p.z+=(p.input.mz/len)*spd*dt;p.dirX=p.input.mx/len;p.dirZ=p.input.mz/len;}}
if(p.x<-FIELD_L/2+1)p.x=-FIELD_L/2+1;if(p.x>FIELD_L/2-1)p.x=FIELD_L/2-1;
if(p.z<-FIELD_W/2+1)p.z=-FIELD_W/2+1;if(p.z>FIELD_W/2-1)p.z=FIELD_W/2-1;
if(!p.isGK&&p.input.action&&p.hasGun>0&&p.shootCooldown<=0){p.hasGun--;p.shootCooldown=0.4;bulletCounter++;bullets.push({id:bulletCounter,x:p.x+p.dirX*1.5,z:p.z+p.dirZ*1.5,vx:p.dirX*55,vz:p.dirZ*55,team:p.team,life:1.5});}
for(var k=state.pickups.length-1;k>=0;k--){var pk=state.pickups[k];var pdx=pk.x-p.x;var pdz=pk.z-p.z;if(Math.sqrt(pdx*pdx+pdz*pdz)<PICKUP_RADIUS){if(pk.type==='gun')p.hasGun=3;else p.chiliBoost=CHILI_BOOST_TIME;state.pickups.splice(k,1);}}
if(!p.isGK&&p.input.shoot){p.chargeShot+=dt;if(p.chargeShot>1.2)p.chargeShot=1.2;}
if(p.input.dribble)p.dribbleTime=0.3;else if(p.dribbleTime>0)p.dribbleTime-=dt;
var dx=state.ball.x-p.x;var dz=state.ball.z-p.z;var d=Math.sqrt(dx*dx+dz*dz);
var range=p.dribbleTime>0?2.5:(p.diving>0?2.8:1.9);
if(d<range){
var dirX=d>0.01?dx/d:p.dirX;var dirZ=d>0.01?dz/d:p.dirZ;
if(p.isGK&&p.diving>0){state.ball.vx=0;state.ball.vz=0;state.ball.x=p.x+p.diveX*1.2;state.ball.z=p.z+p.diveZ*1.2;}
else if(!p.isGK&&!p.input.shoot&&p.chargeShot>0.1){var power=KICK+(KICK_MAX-KICK)*(p.chargeShot/1.2);var targetX=p.team==='A'?FIELD_L/2:-FIELD_L/2;var tx=targetX-p.x;var tz=-p.z*0.3;var tl=Math.sqrt(tx*tx+tz*tz);state.ball.vx=(tx/tl)*power;state.ball.vz=(tz/tl)*power;p.chargeShot=0;}
else if(p.input.pass){var pp=p.isGK?PASS*1.6:PASS;state.ball.vx=p.dirX*pp;state.ball.vz=p.dirZ*pp;p.input.pass=false;}
else if(!p.isGK&&p.dribbleTime>0&&p.sliding<=0){var spd2=SPEED;if(p.input.sprint)spd2*=SPRINT;if(p.chiliBoost>0)spd2*=CHILI_SPEED_BOOST;state.ball.x=p.x+p.dirX*1.3;state.ball.z=p.z+p.dirZ*1.3;state.ball.vx=p.dirX*spd2;state.ball.vz=p.dirZ*spd2;}
else if(d<1.4){state.ball.vx=dirX*9;state.ball.vz=dirZ*9;}
}
}
for(var b=bullets.length-1;b>=0;b--){var bl=bullets[b];bl.x+=bl.vx*dt;bl.z+=bl.vz*dt;bl.life-=dt;if(bl.life<=0||Math.abs(bl.x)>FIELD_L/2||Math.abs(bl.z)>FIELD_W/2){bullets.splice(b,1);continue;}for(var j=0;j<ids.length;j++){var target=state.players[ids[j]];if(!target||target.team===bl.team)continue;var bdx=bl.x-target.x;var bdz=bl.z-target.z;if(Math.sqrt(bdx*bdx+bdz*bdz)<1.3){target.stunned=STUN_TIME;bullets.splice(b,1);break;}}}
state.ball.x+=state.ball.vx*dt;state.ball.z+=state.ball.vz*dt;state.ball.vx*=FRICTION;state.ball.vz*=FRICTION;
if(state.ball.z>FIELD_W/2){state.ball.z=FIELD_W/2;state.ball.vz*=-0.6;}
if(state.ball.z<-FIELD_W/2){state.ball.z=-FIELD_W/2;state.ball.vz*=-0.6;}
if(state.ball.x>FIELD_L/2&&Math.abs(state.ball.z)<GOAL_W/2){state.score.A++;resetBall();}
else if(state.ball.x<-FIELD_L/2&&Math.abs(state.ball.z)<GOAL_W/2){state.score.B++;resetBall();}
else if(Math.abs(state.ball.x)>FIELD_L/2+1){state.ball.vx*=-0.5;state.ball.x=state.ball.x>0?FIELD_L/2:-FIELD_L/2;}
io.emit('state',{players:state.players,ball:state.ball,score:state.score,pickups:state.pickups,bullets:bullets});
},1000/60);
var PORT=process.env.PORT||3000;
server.listen(PORT,function(){console.log('Server avviato porta',PORT);});
