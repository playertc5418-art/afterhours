export const DEFAULT_POSE=Object.freeze({yaw:.15,pitch:.13,distance:25});
export const DISTANCE_LIMITS=Object.freeze({min:7.2,max:44});
const keys=['yaw','pitch','distance'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>{t=clamp(t,0,1);return t*t*t*(10+t*(-15+6*t));};
const zero=()=>({yaw:0,pitch:0,distance:0});
const bounded=p=>({yaw:p.yaw,pitch:clamp(p.pitch,-.95,.95),distance:clamp(p.distance,DISTANCE_LIMITS.min,DISTANCE_LIMITS.max)});

export function createNavigation({reduced=false,pose:initial=DEFAULT_POSE}={}){
  let pose=bounded(initial),velocity=zero(),mode='orbit',time=20,flightTime=0;
  let paused=reduced,suspended=false,speed=1,manual=null,anchor={...pose},entryVelocity=zero();
  function cycle(t){
    return {yaw:anchor.yaw+Math.sin(t*.07)*.8,pitch:anchor.pitch+Math.sin(t*.12)*.14,distance:anchor.distance+Math.sin(t*.085)*4};
  }
  function automatic(t){
    let p;
    if(mode==='cinema'){
      p=cycle(t);
      const w=t*(1-smooth(t/.8));
      p.yaw+=(entryVelocity.yaw-.8*.07)*w;
      p.pitch+=(entryVelocity.pitch-.14*.12)*w;
      p.distance+=(entryVelocity.distance-4*.085)*w;
    }else{
      const u=clamp(t/16,0,1),e=u*u*(3-2*u);
      p={yaw:anchor.yaw+.32*e,pitch:anchor.pitch+.025*Math.sin(e*Math.PI),distance:anchor.distance+(DISTANCE_LIMITS.min-anchor.distance)*e};
      const w=t*(1-smooth(t/.18));
      for(const k of keys)p[k]+=entryVelocity[k]*w;
    }
    return bounded(p);
  }
  function moveTo(end,duration=.18,kind='input'){
    manual={start:{...pose},end:bounded(end),velocity:{...velocity},t:0,duration,kind};
    mode='orbit';flightTime=0;
  }
  function manualTarget(){return manual?.kind==='input'?manual.end:pose;}
  function moving(){return !suspended&&(!!manual||(!paused&&mode!=='orbit'));}
  const api={
    snapshot:()=>({pose:{...pose},mode,time,flightTime,paused,suspended,speed,moving:moving()}),
    step(dt){
      if(suspended||!Number.isFinite(dt)||dt<=0)return api.snapshot();
      if(!paused)time+=dt*speed;
      const before={...pose};
      if(manual){
        manual.t=Math.min(manual.duration,manual.t+dt);
        const u=manual.t/manual.duration,u2=u*u,u3=u2*u;
        for(const k of keys)pose[k]=(2*u3-3*u2+1)*manual.start[k]+(u3-2*u2+u)*manual.duration*manual.velocity[k]+(-2*u3+3*u2)*manual.end[k];
        pose=bounded(pose);
        if(manual.t>=manual.duration-1e-10){pose={...manual.end};manual=null;}
      }else if(!paused&&mode!=='orbit'){
        flightTime+=dt;pose=automatic(flightTime);
        if(mode==='dive'&&flightTime>=16){pose=automatic(16);mode='orbit';velocity=zero();}
      }
      for(const k of keys)velocity[k]=(pose[k]-before[k])/dt;
      if(!manual&&mode==='orbit')velocity=zero();
      return api.snapshot();
    },
    setMode(next){
      if(!['orbit','cinema','dive'].includes(next))return;
      if(next==='orbit'){
        if(keys.some(k=>Math.abs(velocity[k])>1e-9))moveTo(pose,.18,'stop');
        else{mode='orbit';manual=null;flightTime=0;}
        return;
      }
      anchor={...pose};entryVelocity={...velocity};manual=null;flightTime=0;paused=false;mode=next;
      if(next==='dive'&&pose.distance<=DISTANCE_LIMITS.min+1e-6){mode='orbit';velocity=zero();}
    },
    setPaused(value){paused=Boolean(value);if(paused)velocity=zero();},
    setSpeed(value){speed=clamp(Number(value)||0,0,2.5);},
    setSuspended(value){suspended=Boolean(value);},
    rotate(dx,dy){const target={...manualTarget()};target.yaw+=dx;target.pitch+=dy;moveTo(target);},
    zoom(delta){const target={...manualTarget()};target.distance*=Math.exp(clamp(delta*.0015,-30,30));moveTo(target);},
    reset(){moveTo(DEFAULT_POSE,1.2,'reset');},
    needsFrame:()=>!suspended&&(!!manual||(!paused&&(speed>0||mode!=='orbit'))),
  };
  return api;
}
