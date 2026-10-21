/* Shared pilot helpers: time tracking by exercise type, extra minutes, ratings, logging.
   Used by /pilot/, /pilot/cards/, /pilot/chains/, /pilot/listen/. Everything is stored in this browser. */
(function(){
"use strict";
var KEY="lingokey-pilot-shared-v1";
var TESTKEY="lingokey-pilot-test";
// Existing comment-sheet script. Time and rating rows go here under level PILOT-TIME / PILOT-RATING
// until a separate time-log script is deployed (see pilot/TIME_LOG_SETUP.md), then paste its URL into TIME_WEBHOOK.
var WEBHOOK="https://script.google.com/macros/s/AKfycbzulcwGt5sjFf-t7fcV9R7OeVhmfvM5D6Rb3HydAb-9cpdMZ4zwP6NTREiIIWkr34qx7g/exec";
var TIME_WEBHOOK="";
var TYPES=["cards","chains","listen"];
var LABEL={cards:"Cards",chains:"Chains",listen:"Listening"};
var EXTRA=["1:1 class","Group class","German conversation","Real-life situation","Podcast, video or reading","Other"];
try{var q=new URLSearchParams(location.search);if(q.get("test")==="1")localStorage.setItem(TESTKEY,"1");if(q.get("test")==="0")localStorage.removeItem(TESTKEY);}catch(e){}
function isTest(){try{return localStorage.getItem(TESTKEY)==="1";}catch(e){return false;}}
function dkey(t){var d=new Date(t===undefined?Date.now():t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
var mem=null;
function load(){try{var r=localStorage.getItem(KEY);if(r){var o=JSON.parse(r);if(o&&o.days)return o;}}catch(e){}return {v:1,days:{},ratings:[],listen:{levels:{}}};}
var S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function refresh(){S=load();}
function day(k){k=k||dkey();var d=S.days[k];if(!d){d={ms:{cards:0,chains:0,listen:0},extra:[],cards:{n:0,r:0,sh:0,ag:0,gd:0},checkin:null,done:{}};S.days[k]=d;}
  d.ms=d.ms||{cards:0,chains:0,listen:0};d.extra=d.extra||[];d.cards=d.cards||{n:0,r:0,sh:0,ag:0,gd:0};d.done=d.done||{};return d;}
function appMs(k){var d=day(k),t=0;TYPES.forEach(function(x){t+=d.ms[x]||0;});return t;}
function extraMin(k){var t=0;day(k).extra.forEach(function(e){t+=e.min||0;});return t;}
function totalMs(k){return appMs(k)+extraMin(k)*60000;}
function overallMs(){var t=0;Object.keys(S.days).forEach(function(k){t+=totalMs(k);});return t;}
function fmt(ms){var s=Math.round(ms/1000),m=Math.floor(s/60);return m+":"+String(s%60).padStart(2,"0");}
function fmtMin(ms){var m=Math.round(ms/60000);if(m<60)return m+" min";return Math.floor(m/60)+" h "+String(m%60).padStart(2,"0")+" min";}
function post(level,lesson,message,page){
  if(isTest())return false;
  try{
    var fd=new FormData();
    if(TIME_WEBHOOK&&level==="PILOT-TIME"){fd.append("message",message);fd.append("lesson",lesson);fd.append("page",page||"/pilot");fetch(TIME_WEBHOOK,{method:"POST",mode:"no-cors",body:fd});return true;}
    fd.append("level",level);fd.append("lesson",lesson);fd.append("message",message);fd.append("page",page||"/pilot");
    fetch(WEBHOOK,{method:"POST",mode:"no-cors",body:fd});return true;
  }catch(e){return false;}
}
/* ---- timer ---- */
var T={type:null,audio:false,playing:false,sess:0,last:0,lastAct:Date.now(),iv:null,badge:null,showBadge:true,saveN:0};
["pointerdown","keydown","touchstart","scroll","input","click"].forEach(function(ev){window.addEventListener(ev,function(){T.lastAct=Date.now();},{passive:true,capture:true});});
function active(){
  if(!T.type)return false;
  if(T.audio)return T.playing;
  return document.visibilityState==="visible"&&(Date.now()-T.lastAct)<120000;
}
function tick(){
  var now=Date.now(),dt=Math.min(now-T.last,2000);T.last=now;
  if(active()){
    refresh();var d=day();d.ms[T.type]=(d.ms[T.type]||0)+dt;save();T.sess+=dt;
  }
  paint();
}
function paint(){
  if(T.badge){T.badge.textContent="⏱ "+fmt(T.sess);T.badge.setAttribute("data-run",active()?"1":"0");}
  var c=document.getElementById("clock");if(c&&T.type)c.textContent=fmt(T.sess);
}
function mount(){
  if(T.badge||!T.showBadge||!document.body)return;
  var b=document.createElement("div");b.id="lkbadge";b.setAttribute("role","timer");b.setAttribute("aria-label","Time on this exercise");
  b.style.cssText="position:fixed;bottom:14px;right:14px;z-index:60;background:#0E172D;color:#F3EBDF;border-radius:999px;padding:6px 14px;font:700 15px/1.2 'Atkinson Hyperlegible',system-ui,sans-serif;font-variant-numeric:tabular-nums;box-shadow:0 2px 8px rgba(14,23,45,.25)";
  document.body.appendChild(b);T.badge=b;
  var st=document.createElement("style");st.textContent="#lkbadge[data-run='0']{opacity:.55}";document.head.appendChild(st);
}
function start(type,opts){
  opts=opts||{};
  if(T.type===type&&T.audio===!!opts.audio){return;}
  stop();
  T.type=type;T.audio=!!opts.audio;T.playing=false;T.sess=0;T.last=Date.now();T.lastAct=Date.now();T.showBadge=opts.badge!==false;
  mount();if(T.badge)T.badge.style.display=T.showBadge?"":"none";
  if(!T.iv)T.iv=setInterval(tick,1000);
  paint();
}
function stop(){
  if(T.iv){clearInterval(T.iv);T.iv=null;}
  T.type=null;T.playing=false;
  if(T.badge)T.badge.style.display="none";
}
function setPlaying(b){T.playing=!!b;paint();}
window.addEventListener("pagehide",function(){if(T.type)tick();});
/* ---- records ---- */
function addExtra(type,min,note){refresh();day().extra.push({type:type,min:min,note:note||"",t:Date.now()});save();}
function setProgress(a,g){refresh();var c=day().cards;if(c.ans!==a||c.goal!==g){c.ans=a;c.goal=g;save();}}
function markDone(t){refresh();day().done[t]=1;save();}
function isDone(t){return !!day().done[t];}
function removeExtra(i){refresh();day().extra.splice(i,1);save();}
function cardStat(k,n){refresh();var d=day();d.cards[k]=(d.cards[k]||0)+(n||1);save();}
function rate(page,stage,phrase,rating){
  refresh();S.ratings.push({t:Date.now(),page:page,stage:stage,phrase:phrase,rating:rating});save();
  post("PILOT-RATING",page+" "+stage,page+" stage "+stage+" | after phrase: "+phrase+" | rating: "+rating,"/pilot/"+page);
}
function lastRating(page,stage){for(var i=S.ratings.length-1;i>=0;i--){var r=S.ratings[i];if(r.page===page&&(stage===undefined||r.stage===stage))return r;}return null;}
function summaryText(k,dayNo,note){
  var d=day(k),c=d.cards;
  var ex=d.extra.map(function(e){return e.type+" "+e.min+" min"+(e.note?" ("+e.note+")":"");}).join("; ");
  return "TIME "+k+" day "+dayNo+" | cards "+fmt(d.ms.cards)+" | chains "+fmt(d.ms.chains)+" | listening "+fmt(d.ms.listen)+" | extra "+extraMin(k)+" min"+(ex?" ["+ex+"]":"")+" | total "+fmtMin(totalMs(k))+" | cards: new "+c.n+", reviewed "+c.r+", shelved "+c.sh+", again "+c.ag+", good "+c.gd+(note?" | note: "+note:"");
}
function checkin(k,dayNo,note){
  refresh();var d=day(k);d.checkin={t:Date.now(),day:dayNo,note:note||""};save();
  return post("PILOT-TIME","day "+dayNo,summaryText(k,dayNo,note),"/pilot");
}
function uncheckin(k){refresh();day(k).checkin=null;save();}
window.LK={dkey:dkey,isTest:isTest,refresh:refresh,get:function(){return S;},save:save,day:day,appMs:appMs,extraMin:extraMin,totalMs:totalMs,overallMs:overallMs,fmt:fmt,fmtMin:fmtMin,
  start:start,stop:stop,setPlaying:setPlaying,sessionMs:function(){return T.sess;},addExtra:addExtra,setProgress:setProgress,markDone:markDone,isDone:isDone,removeExtra:removeExtra,cardStat:cardStat,rate:rate,lastRating:lastRating,
  checkin:checkin,uncheckin:uncheckin,post:post,summaryText:summaryText,TYPES:TYPES,LABEL:LABEL,EXTRA:EXTRA};
})();
