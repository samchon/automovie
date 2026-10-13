import {readAutoMovieCubeShadowDepth,retireAutoMovieCubeShadowDepth,resetAutoMovieSceneShadowTargets} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";

/** Read the public post-operation slot without assuming a caller assignment survives. */
const readShadowMap=(shadow:THREE.LightShadow):THREE.RenderTarget|null=>shadow.map;

/**
 * Native cube depth retirement preserves caller framebuffer/raster ownership,
 * handles shared retiring aliases once and keeps independent failures visible.
 * This typed in-memory host exercises ownership orchestration, not GPU output.
 * Resource identity is checked by reference; raster values use the authored
 * host rectangles, so comparison never traverses a target's cyclic texture graph.
 *
 * Scenarios:
 * 1. Attachment queries restore target/face/mip, viewport, scissor and test;
 *    nontexture/null attachments and query failures restore the same state.
 * 2. Alive depth is deleted once after public disposal; already-ended handles
 *    need no delete, while deletion/reset failures still restore raster state.
 * 3. Shared cube maps release one handle, known current borrowers refuse before
 *    mutation, and failed queries do not skip independent public retirement.
 */
export const test_viewer_cube_shadow_depth_lifecycle=():void=>{
  const cube=new THREE.WebGLCubeRenderTarget(4),depth=new THREE.DepthTexture(4,4),destination=new THREE.WebGLRenderTarget(8,8);
  cube.depthTexture=depth;
  const handle={} as WebGLTexture,primary=new Error("native query"),secondary=new Error("native delete");
  const failures=new Map<string,unknown>();const calls:string[]=[];
  let alive=true,attachment:WebGLTexture|null=handle,textureAttachment=true,target:THREE.WebGLRenderTarget|null=destination,face=2,mip=1;
  let viewport=new THREE.Vector4(1,2,3,4),scissor=new THREE.Vector4(5,6,7,8),test=true;
  let currentViewport=destination.viewport.clone(),currentScissor=destination.scissor.clone(),currentTest=destination.scissorTest;
  const operation=(name:string):void=>{calls.push(name);if(failures.has(name))throw failures.get(name);};
  const gl={FRAMEBUFFER:0x8d40,DEPTH_ATTACHMENT:0x8d00,FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE:0x8cd0,FRAMEBUFFER_ATTACHMENT_OBJECT_NAME:0x8cd1,TEXTURE:0x1702,SCISSOR_BOX:0x0c10,SCISSOR_TEST:0x0c11,
    getParameter:()=>currentScissor.toArray(),isEnabled:()=>currentTest,
    getFramebufferAttachmentParameter:(_target:number,_attachment:number,parameter:number)=>{operation("query");return parameter===0x8cd0?(textureAttachment?0x1702:0):attachment;},
    isTexture:()=>{operation("alive");return alive;},deleteTexture:()=>{operation("delete");alive=false;},
  } as unknown as WebGL2RenderingContext;
  const renderer={getContext:()=>gl,getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,
    getViewport:(value:THREE.Vector4)=>value.copy(viewport),getCurrentViewport:(value:THREE.Vector4)=>value.copy(currentViewport),getScissor:(value:THREE.Vector4)=>value.copy(scissor),getScissorTest:()=>test,
    setRenderTarget:(value:THREE.WebGLRenderTarget|null,nextFace=0,nextMip=0)=>{operation(value===cube?"bind":"restoreTarget");target=value;face=nextFace;mip=nextMip;currentViewport=value===null?viewport.clone().multiplyScalar(2):value.viewport.clone();currentScissor=value===null?scissor.clone().multiplyScalar(2):value.scissor.clone();currentTest=value===null?test:value.scissorTest;},
    setViewport:(value:THREE.Vector4)=>{operation("viewport");viewport=value.clone();currentViewport=value.clone().multiplyScalar(2);},setScissor:(value:THREE.Vector4)=>{operation("scissor");scissor=value.clone();currentScissor=value.clone().multiplyScalar(2);},setScissorTest:(value:boolean)=>{operation("test");test=value;currentTest=value;},
    resetState:()=>{operation("reset");target=null;face=0;mip=0;},
  } as unknown as THREE.WebGLRenderer;
  const state=()=>({face,mip,viewport:viewport.toArray(),scissor:scissor.toArray(),test,currentViewport:currentViewport.toArray(),currentScissor:currentScissor.toArray(),currentTest});
  const initial:ReturnType<typeof state>={face:2,mip:1,viewport:[1,2,3,4],scissor:[5,6,7,8],test:true,currentViewport:[0,0,8,8],currentScissor:[0,0,8,8],currentTest:false};
  TestValidator.predicate("the host begins at the caller's exact destination",target===destination);
  TestValidator.equals("the arranged caller raster matches its authored fields",state(),initial);
  const unsupported=new THREE.RenderTarget(4,4);let refused=false;try{readAutoMovieCubeShadowDepth(renderer,unsupported);}catch{refused=true;}TestValidator.predicate("non-WebGL target refuses before binding",refused&&calls.length===0);unsupported.dispose();
  class OtherBackendTarget extends THREE.RenderTarget {public readonly isWebGLRenderTarget=false;}
  const otherBackend=new OtherBackendTarget(4,4);refused=false;try{readAutoMovieCubeShadowDepth(renderer,otherBackend);}catch{refused=true;}TestValidator.predicate("explicit non-WebGL identity refuses before binding",refused&&calls.length===0);otherBackend.dispose();
  refused=false;try{readAutoMovieCubeShadowDepth(renderer,cube);}catch{refused=true;}TestValidator.predicate("known uninitialized native depth refuses without binding",refused&&calls.length===0&&depth.version===0);depth.needsUpdate=true;
  TestValidator.predicate("native depth handle comes from actual bound attachment",readAutoMovieCubeShadowDepth(renderer,cube)===handle);TestValidator.predicate("read restores the exact caller target",renderer.getRenderTarget()===destination);TestValidator.equals("read restores complete caller raster state",state(),initial);
  textureAttachment=false;TestValidator.equals("nontexture attachment has no owned texture",readAutoMovieCubeShadowDepth(renderer,cube),null);textureAttachment=true;attachment=null;TestValidator.equals("missing texture handle remains absent",readAutoMovieCubeShadowDepth(renderer,cube),null);attachment=handle;
  renderer.setRenderTarget(null);const canvasState:ReturnType<typeof state>={face:0,mip:0,viewport:[1,2,3,4],scissor:[5,6,7,8],test:true,currentViewport:[2,4,6,8],currentScissor:[10,12,14,16],currentTest:true};TestValidator.predicate("the canvas experiment begins at the default framebuffer",renderer.getRenderTarget()===null);TestValidator.equals("the arranged canvas applies its pixel ratio to authored rectangles",state(),canvasState);readAutoMovieCubeShadowDepth(renderer,cube);TestValidator.predicate("default framebuffer selection survives the native query",renderer.getRenderTarget()===null);TestValidator.equals("default framebuffer preserves logical and pixel-ratio raster state",state(),canvasState);renderer.setRenderTarget(destination,2,1);
  failures.set("query",primary);let caught:unknown;try{readAutoMovieCubeShadowDepth(renderer,cube);}catch(error){caught=error;}TestValidator.predicate("query failure preserves identity",caught===primary);TestValidator.predicate("failed query restores the exact caller target",renderer.getRenderTarget()===destination);TestValidator.equals("failed query restores caller raster state",state(),initial);failures.clear();
  failures.set("query",primary);failures.set("restoreTarget",secondary);caught=undefined;try{readAutoMovieCubeShadowDepth(renderer,cube);}catch(error){caught=error;}TestValidator.predicate("query and target restoration failures remain visible",caught instanceof AggregateError&&caught.errors[0]===primary&&caught.errors[1]===secondary);TestValidator.equals("temporary destination fields restore even if binding fails",[destination.viewport.toArray(),destination.scissor.toArray(),destination.scissorTest],[[0,0,8,8],[0,0,8,8],false]);failures.clear();renderer.setRenderTarget(destination,2,1);
  retireAutoMovieCubeShadowDepth(renderer,handle);retireAutoMovieCubeShadowDepth(renderer,handle);TestValidator.equals("already-ended handle is not deleted twice",calls.filter(call=>call==="delete").length,1);TestValidator.predicate("native retirement restores the exact caller target",renderer.getRenderTarget()===destination);TestValidator.equals("native retire restores raster state",state(),initial);
  alive=true;failures.set("delete",secondary);failures.set("reset",primary);caught=undefined;try{retireAutoMovieCubeShadowDepth(renderer,handle);}catch(error){caught=error;}TestValidator.predicate("independent native failures retain both",caught instanceof AggregateError&&caught.errors[0]===secondary&&caught.errors[1]===primary);TestValidator.predicate("native failures still restore the exact caller target",renderer.getRenderTarget()===destination);TestValidator.equals("native failures still restore all raster state",state(),initial);failures.clear();
  const scene=new THREE.Scene(),point=new THREE.PointLight(),spot=new THREE.SpotLight(),alias=new THREE.WebGLCubeRenderTarget(4),unrelatedDepth=new THREE.DepthTexture(8,8);alias.depthTexture=depth;point.shadow.map=cube;point.shadow.mapPass=cube;spot.shadow.map=alias;scene.add(point,spot);destination.depthTexture=unrelatedDepth;
  let disposals=0,aliasDisposals=0;cube.addEventListener("dispose",()=>{disposals++;});alias.addEventListener("dispose",()=>{aliasDisposals++;});const previousDeletes=calls.filter(call=>call==="delete").length;
  resetAutoMovieSceneShadowTargets(scene,renderer);TestValidator.equals("shared retiring aliases release once",[disposals,aliasDisposals,calls.filter(call=>call==="delete").length-previousDeletes],[1,1,1]);TestValidator.predicate("shared retiring aliases clear both owning light slots",readShadowMap(point.shadow)===null&&readShadowMap(spot.shadow)===null);TestValidator.predicate("whole retirement restores the exact caller target",renderer.getRenderTarget()===destination);TestValidator.equals("whole retirement restores caller raster state",state(),initial);TestValidator.predicate("unrelated destination depth remains owned",destination.depthTexture===unrelatedDepth);
  for(const currentBorrower of [cube,destination]){cube.depthTexture=depth;point.shadow.map=cube;target=currentBorrower;if(currentBorrower===destination)destination.depthTexture=depth;caught=undefined;try{resetAutoMovieSceneShadowTargets(scene,renderer);}catch(error){caught=error;}TestValidator.predicate("known current borrower refuses before mutation",caught instanceof Error&&point.shadow.map===cube&&cube.depthTexture===depth&&disposals===1);}
  destination.depthTexture=null;target=destination;failures.set("query",primary);caught=undefined;try{resetAutoMovieSceneShadowTargets(scene,renderer);}catch(error){caught=error;}TestValidator.predicate("failed native read does not suppress public release",caught===primary&&point.shadow.map===null&&disposals===2);failures.clear();
  cube.depthTexture=depth;point.shadow.map=cube;attachment=null;resetAutoMovieSceneShadowTargets(scene,renderer);TestValidator.equals("absent native handle still retires public target",disposals,3);
  point.shadow.map=cube;resetAutoMovieSceneShadowTargets(scene,renderer);TestValidator.equals("cube without depth needs no native attachment",disposals,4);
  textureAttachment=false;TestValidator.equals("drawn cube with no depth texture yields no native depth",readAutoMovieCubeShadowDepth(renderer,cube),null);textureAttachment=true;
  const coldDepth=new THREE.DepthTexture(4,4);cube.depthTexture=coldDepth;point.shadow.map=cube;const queryCount=calls.filter(call=>call==="query").length;
  resetAutoMovieSceneShadowTargets(scene,renderer);TestValidator.equals("known cold product retires without query or upload generation",[coldDepth.version,calls.filter(call=>call==="query").length,disposals],[0,queryCount,5]);TestValidator.predicate("known cold product clears its owning light slot",readShadowMap(point.shadow)===null);
  cube.depthTexture=null;cube.dispose();alias.dispose();depth.dispose();coldDepth.dispose();unrelatedDepth.dispose();destination.dispose();
};
