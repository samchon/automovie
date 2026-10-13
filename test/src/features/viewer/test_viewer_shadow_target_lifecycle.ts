import {resetAutoMovieSceneShadowTargets,renderAutoMovieScenePass} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";

/** Observe the public mutable slots after an operation that owns their change. */
const readShadowSlots=(shadow:THREE.LightShadow):{map:THREE.RenderTarget|null;mapPass:THREE.RenderTarget|null;needsUpdate:boolean}=>({map:shadow.map,mapPass:shadow.mapPass,needsUpdate:shadow.needsUpdate});

/**
 * A filter change retires all retained per-light shadow products, including a
 * hidden light, so renderer-global filter history cannot admit stale depth.
 *
 * Scenarios:
 * 1. Empty, ordinary and non-shadow lights remain valid; hidden shadow lights
 *    release shared targets/depth exactly once and clear their public slots.
 * 2. Independent disposal failures preserve both errors after every slot is
 *    cleared and later resources have been attempted.
 * 3. A source pass changing filter retires both previous and newly produced
 *    attachments, leaving the restored renderer dirty for its next direct draw.
 */
export const test_viewer_shadow_target_lifecycle=():void=>{
  const renderer={getRenderTarget:()=>null,toneMapping:THREE.NoToneMapping,toneMappingExposure:1,shadowMap:{enabled:true,type:THREE.PCFShadowMap,needsUpdate:false},render:()=>{directional.shadow.map=new THREE.WebGLRenderTarget(4,4);}} as unknown as THREE.WebGLRenderer;
  const empty=new THREE.Scene();empty.add(new THREE.Group(),new THREE.AmbientLight());resetAutoMovieSceneShadowTargets(empty,renderer);
  const scene=new THREE.Scene(),directional=new THREE.DirectionalLight(),spot=new THREE.SpotLight();spot.visible=false;scene.add(directional,spot);
  const target=new THREE.WebGLRenderTarget(4,4),depth=new THREE.DepthTexture(4,4),distribution=new THREE.WebGLRenderTarget(4,4);target.depthTexture=depth;
  directional.shadow.map=target;spot.shadow.map=target;spot.shadow.mapPass=distribution;
  const disposed=[0,0,0];target.addEventListener("dispose",()=>{disposed[0]++;});depth.addEventListener("dispose",()=>{disposed[1]++;});distribution.addEventListener("dispose",()=>{disposed[2]++;});
  resetAutoMovieSceneShadowTargets(scene,renderer);TestValidator.equals("shared and hidden products release once",disposed,[1,1,1]);TestValidator.equals("public map slots clear and updates become dirty",[readShadowSlots(directional.shadow).map,readShadowSlots(spot.shadow).map,readShadowSlots(spot.shadow).mapPass,directional.shadow.needsUpdate,spot.shadow.needsUpdate],[null,null,null,true,true]);
  resetAutoMovieSceneShadowTargets(scene,renderer);TestValidator.equals("empty retained slots do not dispose twice",disposed,[1,1,1]);
  const failed=new THREE.WebGLRenderTarget(4,4),later=new THREE.WebGLRenderTarget(4,4),first=new Error("first"),second=new Error("second");directional.shadow.map=failed;spot.shadow.map=later;failed.addEventListener("dispose",()=>{throw first;});later.addEventListener("dispose",()=>{throw second;});
  let caught:unknown;try{resetAutoMovieSceneShadowTargets(scene,renderer);}catch(error){caught=error;}TestValidator.predicate("all independent disposal failures retained",caught instanceof AggregateError&&caught.errors[0]===first&&caught.errors[1]===second);TestValidator.equals("failed disposal still clears retired slots",[readShadowSlots(directional.shadow).map,readShadowSlots(spot.shadow).map],[null,null]);
  renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),{image:null,background:null,intensity:1,rotationDeg:0,exposure:1,toneMapping:"none",shadows:{enabled:true,type:"vsm"}},"beauty");
  TestValidator.equals("restored filter has no incompatible retained map",[renderer.shadowMap.type,renderer.shadowMap.needsUpdate,readShadowSlots(directional.shadow).map],[THREE.PCFShadowMap,true,null]);
  renderer.render=()=>{const target=new THREE.WebGLRenderTarget(4,4);target.addEventListener("dispose",()=>{throw first;});directional.shadow.map=target;renderer.shadowMap.needsUpdate=false;};
  let restoreFailure:unknown;try{renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),{image:null,background:null,intensity:1,rotationDeg:0,exposure:1,toneMapping:"none",shadows:{enabled:true,type:"vsm"}},"beauty");}catch(error){restoreFailure=error;}
  TestValidator.predicate("failed target disposal retains failure",restoreFailure===first);TestValidator.equals("disposal failure cannot suppress renderer rebuild request",[renderer.shadowMap.needsUpdate,readShadowSlots(directional.shadow).map],[true,null]);
};
