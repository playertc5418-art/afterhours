export function attachControls(canvas,navigation,{onPause,onImmersive,onReset,onChange=()=>{}}){
  const pointers=new Map(),listeners=[];let pinch=0;
  const on=(el,type,fn,options)=>{el.addEventListener(type,fn,options);listeners.push(()=>el.removeEventListener(type,fn,options));};
  function clear(){for(const id of pointers.keys())if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);pointers.clear();pinch=0;}
  on(canvas,'pointerdown',e=>{navigation.setMode('orbit');canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;onChange();});
  on(canvas,'pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){navigation.rotate(-(e.clientX-prev.x)*.005,(e.clientY-prev.y)*.004);}else{const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch&&d>0)navigation.zoom(Math.log(pinch/d)/.0015);pinch=d;}onChange();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])on(canvas,event,e=>{pointers.delete(e.pointerId);pinch=0;});
  on(canvas,'wheel',e=>{e.preventDefault();navigation.zoom(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1));onChange();},{passive:false});
  on(canvas,'dblclick',()=>{onReset();onChange();});
  on(window,'keydown',e=>{if(e.code==='Escape'){onImmersive(false);return;}if(e.target.closest('input,select,textarea,button,a,[contenteditable="true"]'))return;if(e.code==='Space'){e.preventDefault();onPause();}if(e.code==='KeyH')onImmersive();});
  on(window,'blur',clear);
  return {clear,dispose(){clear();listeners.forEach(fn=>fn());}};
}
