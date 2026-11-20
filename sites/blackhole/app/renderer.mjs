import {vertexSource,sceneSource,postSource} from './shaders.mjs';

export function createRenderer(canvas,{onLost=()=>{},onReady=()=>{},onError=()=>{}}={}){
  let gl,resources=null,lost=false,generation=0,frames=0,quality=1,samples=[],size={width:1,height:1,dpr:1},w=1,h=1,mobile=false;
  function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message||'Shader 编译失败');}return shader;}
  function program(source){
    const p=gl.createProgram();let v=null,f=null;
    try{
      v=compile(gl.VERTEX_SHADER,vertexSource);f=compile(gl.FRAGMENT_SHADER,source);
      gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||'Shader 链接失败');
      const names=['uResolution','uTime','uYaw','uPitch','uDistance','uPalette','uExposure','uScene'];
      return {program:p,attribute:gl.getAttribLocation(p,'aPosition'),uniforms:Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]))};
    }catch(e){gl.deleteProgram(p);throw e;}
    finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}
  }
  function release(){
    if(!resources)return;
    if(!lost){
      for(const p of [resources.scene,resources.post])if(p)gl.deleteProgram(p.program);
      if(resources.buffer)gl.deleteBuffer(resources.buffer);if(resources.fb)gl.deleteFramebuffer(resources.fb);if(resources.tex)gl.deleteTexture(resources.tex);
    }
    resources=null;
  }
  function resize(next={}){size={...size,...next};mobile=size.width<=650||matchMedia('(pointer:coarse)').matches;const budget=mobile?490000:1050000;quality=Math.min(quality,size.quality??1);const scale=Math.min(size.dpr,1.5,Math.sqrt(budget/(size.width*size.height)))*quality;w=Math.max(1,Math.floor(size.width*scale));h=Math.max(1,Math.floor(size.height*scale));canvas.width=w;canvas.height=h;if(resources&&!lost){gl.bindTexture(gl.TEXTURE_2D,resources.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,resources.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,resources.tex,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('图形缓冲区创建失败');gl.bindFramebuffer(gl.FRAMEBUFFER,null);}}
  function initialize(){
    try{
      release();gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'high-performance'});
      if(!gl)throw Error('此浏览器暂时无法创建 WebGL 画面');
      lost=gl.isContextLost();if(lost)return false;
      resources={scene:null,post:null,buffer:null,tex:null,fb:null};
      resources.scene=program(sceneSource);
      resources.post=program(postSource);
      resources.buffer=gl.createBuffer();resources.tex=gl.createTexture();resources.fb=gl.createFramebuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,resources.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D,resources.tex);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      resize(size);generation++;queueMicrotask(()=>onReady());return true;
    }catch(e){release();onError(e);return false;}
  }
  function bind(p){gl.useProgram(p.program);gl.bindBuffer(gl.ARRAY_BUFFER,resources.buffer);gl.enableVertexAttribArray(p.attribute);gl.vertexAttribPointer(p.attribute,2,gl.FLOAT,false,0,0);return p.uniforms;}
  function render({pose,time,palette,exposure}){if(lost||!resources)return false;gl.viewport(0,0,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,resources.fb);let u=bind(resources.scene);gl.uniform2f(u.uResolution,w,h);for(const [name,value]of Object.entries({uTime:time,uYaw:pose.yaw,uPitch:pose.pitch,uDistance:pose.distance,uPalette:palette}))gl.uniform1f(u[name],value);gl.drawArrays(gl.TRIANGLES,0,6);gl.bindFramebuffer(gl.FRAMEBUFFER,null);u=bind(resources.post);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,resources.tex);gl.uniform1i(u.uScene,0);gl.uniform2f(u.uResolution,w,h);gl.uniform1f(u.uTime,time);gl.uniform1f(u.uExposure,exposure);gl.drawArrays(gl.TRIANGLES,0,6);frames++;return true;}
  const lose=e=>{e.preventDefault();lost=true;resources=null;onLost();};
  const restore=()=>{lost=false;initialize();};canvas.addEventListener('webglcontextlost',lose);canvas.addEventListener('webglcontextrestored',restore);
  initialize();
  return {resize,render,retry(){if(lost){gl?.getExtension('WEBGL_lose_context')?.restoreContext();return false;}return initialize();},sampleFrame(ms){if(ms<=0||ms>300)return;samples.push(ms);if(samples.length===90){const avg=samples.reduce((a,b)=>a+b)/samples.length;samples=[];if(avg>50&&quality>.6){quality=Math.max(.6,quality*.8);resize(size);}}},metrics:()=>({width:w,height:h,quality,contextLost:lost,resourceGeneration:generation,drawCalls:resources?2:0,frames}),dispose(){canvas.removeEventListener('webglcontextlost',lose);canvas.removeEventListener('webglcontextrestored',restore);release();}};
}
