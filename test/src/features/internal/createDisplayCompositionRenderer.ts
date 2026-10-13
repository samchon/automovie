import * as THREE from "three";

/**
 * In-memory renderer controls for display-compositor orchestration only.
 * Copies and shader uniforms are observable; this renderer claims no pixel,
 * tone-mapping or GPU equivalence. Failure inputs name the actual operation.
 * State comparison assigns native targets scalar object identities rather than
 * traversing their cyclic texture and attachment ownership graphs.
 */
export const createDisplayCompositionRenderer = (width = 64, height = 32, attributes: WebGLContextAttributes | null = {antialias: true, premultipliedAlpha: true}) => {
  const size = new THREE.Vector2(width, height);
  let target: THREE.WebGLRenderTarget | null = null;
  let autoClear = true;
  let toneMapping: THREE.ToneMapping = THREE.ACESFilmicToneMapping;
  let exposure = 1.5;
  let color = new THREE.Color(0x336699), alpha = .4;
  let face=0,mip=0,pixelRatio=1,viewport=new THREE.Vector4(0,0,width,height),scissor=new THREE.Vector4(0,0,width,height),scissorTest=false;
  let currentViewport=viewport.clone(),currentScissor=scissor.clone(),currentScissorTest=scissorTest;
  const nativeEncoding={value:0x2601};
  const nativeWebGL2={value:true};
  const nativeFramebufferStatus={value:0x8cd5};
  const nativeComponent={value:0x8c17};
  const nativeChannelBits:{value:unknown[]}={value:[8,8,8,8]};
  const nativeColourConstants=new Map<string,unknown>([["FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE",0x8211],["FRAMEBUFFER_ATTACHMENT_RED_SIZE",0x8212],["FRAMEBUFFER_ATTACHMENT_GREEN_SIZE",0x8213],["FRAMEBUFFER_ATTACHMENT_BLUE_SIZE",0x8214],["FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE",0x8215],["UNSIGNED_NORMALIZED",0x8c17]]);
  const targetIdentities=new WeakMap<THREE.WebGLRenderTarget,number>();
  let nextTargetIdentity=0;
  const targetIdentity=():number|null=>{
    if(target===null)return null;
    const previous=targetIdentities.get(target);
    if(previous!==undefined)return previous;
    const identity=nextTargetIdentity++;
    targetIdentities.set(target,identity);
    return identity;
  };
  const copied: THREE.FramebufferTexture[] = [];
  const rendered: Array<{ target: THREE.WebGLRenderTarget | null; face:number;mip:number;alpha: number; fade: boolean; backing: boolean;srgb:boolean;viewport:number[];scissor:number[];scissorTest:boolean }> = [];
  const errors = new Map<string, unknown>();
  const calls: string[] = [];
  const perform = (name: string): void => { calls.push(name); if (errors.has(name)) throw errors.get(name); };
  const renderer = {
    get toneMapping() { return toneMapping; },
    set toneMapping(value: THREE.ToneMapping) { perform(value === THREE.NoToneMapping ? "quadTone" : "restoreTone"); toneMapping = value; },
    get toneMappingExposure() { return exposure; },
    set toneMappingExposure(value: number) { perform(value === 1 ? "quadExposure" : "restoreExposure"); exposure = value; },
    get autoClear() { return autoClear; },
    set autoClear(value: boolean) { perform(value ? "restoreAuto" : "compositeAuto"); autoClear = value; },
    getDrawingBufferSize: (value: THREE.Vector2) => value.copy(size),
    getContextAttributes: () => attributes,
    getContext:()=>({FRAMEBUFFER:0x8d40,FRAMEBUFFER_COMPLETE:0x8cd5,COLOR_ATTACHMENT0:0x8ce0,FLOAT:0x1406,...Object.fromEntries(nativeColourConstants),...(nativeWebGL2.value?{FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING:0x8210,SRGB:0x8c40}:{}),LINEAR:0x2601,SCISSOR_BOX:0x0c10,SCISSOR_TEST:0x0c11,getParameter:()=>currentScissor.toArray(),isEnabled:()=>currentScissorTest,checkFramebufferStatus:()=>{perform("framebufferStatus");return nativeFramebufferStatus.value;},getFramebufferAttachmentParameter:(_target:number,_attachment:number,parameter:number)=>{
      if(parameter===0x8211){perform("component");return nativeComponent.value;}
      const channel=[0x8212,0x8213,0x8214,0x8215].indexOf(parameter);
      if(channel!==-1){perform("precision");return nativeChannelBits.value[channel];}
      perform("encoding");return nativeEncoding.value;
    }}),
    getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getPixelRatio:()=>pixelRatio,
    setPixelRatio:(value:number)=>{pixelRatio=value;},
    getViewport:(value:THREE.Vector4)=>value.copy(viewport),getCurrentViewport:(value:THREE.Vector4)=>value.copy(currentViewport),getScissor:(value:THREE.Vector4)=>value.copy(scissor),getScissorTest:()=>scissorTest,
    setViewport:(value:THREE.Vector4)=>{perform("viewport");viewport=value.clone();currentViewport=value.clone().multiplyScalar(pixelRatio).round();},
    setScissor:(value:THREE.Vector4)=>{perform("scissor");scissor=value.clone();currentScissor=value.clone().multiplyScalar(pixelRatio).round();},
    setScissorTest:(value:boolean)=>{perform("scissorTest");scissorTest=value;currentScissorTest=value;},
    getRenderTarget: () => target,
    setRenderTarget: (value: THREE.WebGLRenderTarget | null,nextFace=0,nextMip=0) => { perform(value === null ? "screen" : "host"); target = value;face=nextFace;mip=nextMip;currentViewport=value===null?viewport.clone().multiplyScalar(pixelRatio).round():value.viewport.clone();currentScissor=value===null?scissor.clone().multiplyScalar(pixelRatio).round():value.scissor.clone();currentScissorTest=value===null?scissorTest:value.scissorTest; },
    getClearColor: (value: THREE.Color) => value.copy(color),
    getClearAlpha: () => alpha,
    setClearColor: (value: THREE.Color, nextAlpha: number) => { perform("restoreColor"); color = value.clone(); alpha = nextAlpha; },
    clear: () => { perform("clear"); },
    resetState: () => { perform("reset"); target = null;face=0;mip=0; },
    copyFramebufferToTexture: (value: THREE.FramebufferTexture) => { perform("copy"); copied.push(value); },
    render: (scene: THREE.Scene) => {
      const material = (scene.children[0] as THREE.Mesh | undefined)?.material;
      if (!(material instanceof THREE.RawShaderMaterial)) { perform("sourceRender"); return; }
      perform(material.uniforms.copyBacking!.value ? "backingRender" : "compositeRender");
      rendered.push({target,face,mip,alpha: material.uniforms.alpha!.value, fade: material.uniforms.fade!.value, backing: material.uniforms.copyBacking!.value,srgb:material.uniforms.outputSRGB!.value,viewport:currentViewport.toArray(),scissor:currentScissor.toArray(),scissorTest:currentScissorTest});
    },
  } as unknown as THREE.WebGLRenderer;
  return { renderer, copied, rendered, size, calls, errors,nativeEncoding,nativeWebGL2,nativeFramebufferStatus,nativeComponent,nativeChannelBits,nativeColourConstants,state: () => ({target:targetIdentity(),face,mip,autoClear,color:color.getHex(),alpha,viewport:viewport.toArray(),scissor:scissor.toArray(),scissorTest,currentViewport:currentViewport.toArray(),currentScissor:currentScissor.toArray(),currentScissorTest}) };
};
