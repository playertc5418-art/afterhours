import {createNavigation} from './state.mjs';
import {attachControls} from './controls.mjs';
import {createRenderer} from './renderer.mjs';
import {createAudio} from './audio.mjs';
const $=id=>document.getElementById(id),canvas=$('universe');
const navigation=createNavigation({reduced:matchMedia('(prefers-reduced-motion:reduce)').matches});
let hidden=document.hidden,bfcached=false,contextLost=false,unavailable=false,disposed=false,pending=0,last=0,palette=0,exposure=1,targetExposure=1;
const frameTimes=[],audio=createAudio({onRecordingError(){if(audio.snapshot().enabled)toast('声音素材未加载 · 已启用基础氛围音');},onStateChange:audioButton});
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function suspended(){navigation.setSuspended(hidden||bfcached||contextLost||unavailable);audio.setHidden(hidden||bfcached||contextLost||unavailable).catch(()=>{});last=0;}
function error(title,text){$('errorTitle').textContent=title;$('errorText').textContent=text;$('error').hidden=false;$('loading').classList.add('done');$('loading').setAttribute('aria-hidden','true');}
function invalidate(){if(!pending&&!disposed)pending=requestAnimationFrame(frame);}
function ui(){const state=navigation.snapshot();for(const id of ['orbit','cinema','dive']){$(id).classList.toggle('active',state.mode===id);$(id).setAttribute('aria-pressed',String(state.mode===id));}$('pause').setAttribute('aria-pressed',String(state.paused));$('pause').setAttribute('aria-label',state.paused?'继续时间':'暂停时间');$('pause').title=state.paused?'继续时间':'暂停时间';$('pause').textContent=state.paused?'▷':'Ⅱ';}
function setPaused(){navigation.setPaused(!navigation.snapshot().paused);ui();invalidate();toast(navigation.snapshot().paused?'时间已暂停':'时间继续流动');}
function immersive(force){const value=typeof force==='boolean'?force:!document.body.classList.contains('immersive');document.body.classList.toggle('immersive',value);$('panel').classList.remove('open');$('settings').classList.remove('active');$('settings').setAttribute('aria-expanded','false');$('frame')?.setAttribute('aria-hidden',String(value));const frame=document.querySelector('.frame');frame.inert=value;$('reveal').tabIndex=value?0:-1;}
function reset(){navigation.reset();ui();invalidate();toast('回到最佳视角');}
const controls=attachControls(canvas,navigation,{onPause:setPaused,onImmersive:immersive,onReset:reset,onChange(){ui();invalidate();}});
const renderer=createRenderer(canvas,{onLost(){contextLost=true;controls.clear();suspended();error('画面暂时中断','正在等待图形恢复。你也可以重试。');},onReady(){contextLost=false;unavailable=false;suspended();$('error').hidden=true;invalidate();},onError(e){unavailable=true;suspended();error('星空暂时无法呈现',e.message+'。可重试，或重新载入页面。');}});
function resize(){controls.clear();renderer.resize({width:innerWidth,height:innerHeight,dpr:devicePixelRatio});invalidate();}
function frame(now){pending=0;if(disposed||navigation.snapshot().suspended){last=0;return;}const raw=last?now-last:0,dt=last?Math.min(raw/1000,.06):1/60;last=now;const state=navigation.step(dt);audio.update({distance:state.pose.distance});exposure+=(targetExposure-exposure)*(1-Math.exp(-dt*8));if(Math.abs(targetExposure-exposure)<.0001)exposure=targetExposure;const ok=renderer.render({pose:state.pose,time:state.time,palette,exposure});if(ok){canvas.dataset.ready='true';$('loading').classList.add('done');$('loading').setAttribute('aria-hidden','true');}if(raw>0){frameTimes.push(raw);if(frameTimes.length>1200)frameTimes.shift();renderer.sampleFrame(raw);}ui();if(navigation.needsFrame()||exposure!==targetExposure)invalidate();else last=0;}
for(const id of ['orbit','cinema','dive'])$(id).onclick=()=>{navigation.setMode(id);ui();invalidate();if(id==='dive')toast(navigation.snapshot().mode==='orbit'?'已在最近观察位置':'迫近中 · 拖动可随时接管');};
$('pause').onclick=setPaused;$('reset').onclick=reset;
$('settings').onclick=()=>{const open=$('panel').classList.toggle('open');$('settings').classList.toggle('active',open);$('settings').setAttribute('aria-expanded',String(open));};
$('speed').oninput=e=>{navigation.setSpeed(+e.target.value);$('speedValue').textContent=(+e.target.value).toFixed(1)+'×';invalidate();};
$('exposure').oninput=e=>{targetExposure=+e.target.value;$('exposureValue').textContent=Math.round(targetExposure*100)+'%';invalidate();};
$('volume').oninput=e=>{audio.setVolume(+e.target.value);$('volumeValue').textContent=Math.round(+e.target.value*100)+'%';};
document.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>{palette=+b.dataset.palette;document.querySelectorAll('[data-palette]').forEach(x=>x.classList.toggle('active',x===b));invalidate();});
$('immersive').onclick=()=>immersive();$('reveal').onclick=()=>immersive(false);$('reveal').tabIndex=-1;
$('retry').onclick=()=>{controls.clear();renderer.retry();invalidate();};$('reload').onclick=()=>location.reload();
$('hint').textContent=matchMedia('(pointer:coarse)').matches?'单指绕行 · 双指缩放':'拖动绕行 · 滚轮缩放 · 双击复位';
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;controls.clear();suspended();invalidate();});
addEventListener('pagehide',event=>{controls.clear();if(event.persisted){bfcached=true;suspended();return;}disposed=true;cancelAnimationFrame(pending);controls.dispose();renderer.dispose();audio.dispose();});
addEventListener('pageshow',event=>{if(event.persisted){bfcached=false;hidden=document.hidden;suspended();invalidate();}});
window.singularity=Object.freeze({snapshot:()=>navigation.snapshot(),metrics:()=>({...renderer.metrics(),palette,exposure,audio:audio.snapshot(),frameTimes:[...frameTimes]})});
resize();suspended();ui();invalidate();

function audioButton(){const {enabled,contextState}=audio.snapshot(),waiting=enabled&&contextState!=='running';$('sound').classList.toggle('active',enabled);$('sound').dataset.soundStatus=enabled?(waiting?'waiting':'playing'):'off';$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'关闭氛围音':'开启氛围音');$('sound').querySelector('path').setAttribute('d',enabled?'M4 10v4h4l5 4V6l-5 4H4zM16 9c2 1 2 5 0 6m3-9c4 3 4 9 0 12':'M4 10v4h4l5 4V6l-5 4H4zM17 9l4 6m0-6-4 6');$('sound').title=waiting?'声音已开启，轻触页面开始播放':enabled?'关闭氛围音':'开启氛围音';}
$('sound').onclick=()=>{const result=audio.toggle();audioButton();result.then(()=>{audioButton();toast(audio.snapshot().enabled?'氛围音已开启':'氛围音已关闭');}).catch(e=>{audioButton();toast(e.message);});};
const unlockSound=event=>{if(!event.target.closest?.('#sound'))audio.unlock();};
document.addEventListener('pointerdown',unlockSound,{capture:true});
document.addEventListener('keydown',unlockSound,{capture:true});
try{audio.start();audioButton();}catch(error){audioButton();toast(error.message);}
