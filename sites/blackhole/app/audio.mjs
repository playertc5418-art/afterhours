import {DISTANCE_LIMITS} from './state.mjs';

export function createAudio({onRecordingError=()=>{},onStateChange=()=>{}}={}){
  let context=null,master=null,bedGain=null,bedFilter=null,voiceFilter=null,voiceGain=null,enabled=false,hidden=false,disposed=false;
  let pending=Promise.resolve(),loading=null,controller=null,recordingState='idle',volume=.6,distance=25,lastMix={};
  let nodes=[],sources=[];
  const intensity=()=>{
    const d=Math.max(DISTANCE_LIMITS.min,Math.min(DISTANCE_LIMITS.max,distance));
    const p=(1/d-1/DISTANCE_LIMITS.max)/(1/DISTANCE_LIMITS.min-1/DISTANCE_LIMITS.max);
    return p*p*(3-2*p);
  };
  function applyMix(){
    if(!context||disposed)return;
    const near=intensity(),time=context.currentTime;
    for(const [key,param,value,tau]of [
      ['volume',master.gain,enabled&&!hidden?volume:0,.12],
      ['filter',voiceFilter.frequency,550+near*1850,.45],
      ['voice',voiceGain.gain,.32+near*.68,.45],
      ['bed',bedGain.gain,.28+near*.72,.45],
      ['body',bedFilter.frequency,220+near*680,.45],
    ])if(lastMix[key]===undefined||Math.abs(lastMix[key]-value)>.00001){param.setTargetAtTime(value,time,tau);lastMix[key]=value;}
  }
  function create(){
    if(context)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)throw Error('此浏览器暂不支持氛围音');
    context=new Audio();context.addEventListener('statechange',()=>{if(!disposed)onStateChange();});master=context.createGain();master.gain.value=0;
    const mix=context.createGain(),limiter=context.createDynamicsCompressor();
    limiter.threshold.value=-5;limiter.knee.value=6;limiter.ratio.value=8;limiter.attack.value=.008;limiter.release.value=.3;
    mix.connect(limiter);limiter.connect(master);master.connect(context.destination);
    bedGain=context.createGain();bedGain.gain.value=0;bedGain.connect(mix);nodes.push(mix,limiter,master,bedGain);
    for(const [frequency,level]of [[43.65,.055],[65.4,.035],[87.31,.02],[130.8,.012]]){
      const source=context.createOscillator(),gain=context.createGain();source.frequency.value=frequency;gain.gain.value=level;source.connect(gain);gain.connect(bedGain);source.start();nodes.push(source,gain);sources.push(source);
    }
    const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=buffer.getChannelData(0);let seed=42,z=0;
    for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;z=(z+(seed/4294967296-.5)*.025)/1.02;data[i]=z*3;}
    const noise=context.createBufferSource();bedFilter=context.createBiquadFilter();noise.buffer=buffer;noise.loop=true;bedFilter.type='lowpass';bedFilter.frequency.value=220;noise.connect(bedFilter);bedFilter.connect(bedGain);noise.start();nodes.push(noise,bedFilter);sources.push(noise);
    voiceFilter=context.createBiquadFilter();voiceFilter.type='lowpass';voiceGain=context.createGain();voiceGain.gain.value=0;voiceFilter.connect(voiceGain);voiceGain.connect(mix);nodes.push(voiceFilter,voiceGain);
    applyMix();
  }
  function loadRecording(){
    if(!context||disposed||loading||recordingState==='ready')return;
    recordingState='loading';controller=new AbortController();
    loading=(async()=>{
      try{
        const response=await fetch(new URL('../audio/perseus-loop.mp3',import.meta.url),{signal:controller.signal});
        if(!response.ok)throw Error('Sound file unavailable');
        const bytes=await response.arrayBuffer();if(disposed)return;
        const buffer=await context.decodeAudioData(bytes);if(disposed)return;
        const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(voiceFilter);source.start();nodes.push(source);sources.push(source);recordingState='ready';applyMix();
      }catch(error){if(!disposed){recordingState='failed';onRecordingError(error);}}
      finally{loading=null;controller=null;}
    })();
  }
  async function sync(){
    if(disposed||!context)return enabled;
    applyMix();
    if(enabled&&!hidden)await context.resume();else if(context.state!=='closed')await context.suspend();
    if(disposed)return false;
    applyMix();
    if((!enabled||hidden)&&context.state==='running')await context.suspend();
    return enabled;
  }
  function schedule(){pending=pending.catch(()=>{}).then(sync);return pending;}
  return {
    start(){
      if(disposed)return false;
      enabled=true;
      try{create();applyMix();if(!hidden)context.resume().catch(()=>{});loadRecording();}
      catch(error){enabled=false;throw error;}
      return enabled;
    },
    unlock(){
      if(!disposed&&enabled&&!hidden&&context?.state==='suspended')context.resume().catch(()=>{});
    },
    toggle(){
      if(disposed)return Promise.resolve(false);
      enabled=!enabled;
      if(enabled){try{create();if(!hidden)context.resume().catch(()=>{});loadRecording();}catch(error){enabled=false;return Promise.reject(error);}}
      applyMix();
      return schedule();
    },
    update(view={}){if(Number.isFinite(view.distance)){distance=view.distance;applyMix();}},
    setVolume(value){if(Number.isFinite(+value))volume=Math.max(0,Math.min(1,+value));applyMix();},
    setHidden(value){hidden=Boolean(value);applyMix();if(hidden&&context?.state==='running')context.suspend().catch(()=>{});return schedule();},
    snapshot:()=>({enabled,created:!!context,contextState:context?.state??'not-created',nodeCount:nodes.length,source:recordingState==='ready'?'nasa-perseus':'synth-fallback',recordingState,volume,intensity:intensity(),filterHz:voiceFilter?.frequency.value??null}),
    dispose(){disposed=true;enabled=false;controller?.abort();for(const source of sources){try{source.stop();}catch{}}for(const node of nodes){try{node.disconnect();}catch{}}nodes=[];sources=[];context?.close().catch(()=>{});},
  };
}
