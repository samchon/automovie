import {assertAutoMovieSceneShadowProfile,readAutoMovieShadowLightSource,renderAutoMovieScenePass} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";

/**
 * Public native-scene rendering reaches the same point/VSM refusal as an AST
 * scene before mutable renderer policy, target allocation or drawing occurs.
 *
 * Scenarios:
 * 1. Casting point VSM refuses, including hidden lights, while adjacent PCF,
 *    disabled VSM and noncasting point VSM remain supported.
 * 2. Directional, spot and non-shadow light populations retain supported VSM.
 * 3. Scene-owned and inherited host VSM refuse before changing host state;
 *    structural guides bypass shadows and restore the original policy.
 */
export const test_viewer_scene_shadow_admission=():void=>{
  const scene=new THREE.Scene(),point=new THREE.PointLight();point.name="point-caster";point.castShadow=true;point.visible=false;scene.add(point,new THREE.AmbientLight(),new THREE.Group());
  let refused:unknown;try{assertAutoMovieSceneShadowProfile(scene,{enabled:true,type:"vsm"});}catch(error){refused=error;}TestValidator.predicate("casting point refuses with runtime identity",refused instanceof Error&&refused.message.includes("point-caster")&&refused.message.includes("castShadow"));
  assertAutoMovieSceneShadowProfile(scene,{enabled:true,type:"pcf"});assertAutoMovieSceneShadowProfile(scene,{enabled:false,type:"vsm"});point.castShadow=false;assertAutoMovieSceneShadowProfile(scene,{enabled:true,type:"vsm"});
  const directional=new THREE.DirectionalLight(),spot=new THREE.SpotLight();directional.castShadow=true;spot.castShadow=true;scene.add(directional,spot);assertAutoMovieSceneShadowProfile(scene,{enabled:true,type:"vsm"});
  TestValidator.equals("native punctual projection preserves supplied identity and casting",[readAutoMovieShadowLightSource("p",point),readAutoMovieShadowLightSource("d",directional),readAutoMovieShadowLightSource("s",spot),readAutoMovieShadowLightSource("a",new THREE.AmbientLight()),readAutoMovieShadowLightSource("g",new THREE.Group())],[{id:"p",type:"point",castShadow:false},{id:"d",type:"directional",castShadow:true},{id:"s",type:"spot",castShadow:true},null,null]);
  point.name="";point.castShadow=true;
  let draws=0;const renderer={getRenderTarget:()=>null,toneMapping:THREE.NoToneMapping,toneMappingExposure:1,shadowMap:{enabled:true,type:THREE.PCFShadowMap,needsUpdate:false},render:()=>{draws++;}} as unknown as THREE.WebGLRenderer;
  const environment={image:null,background:null,intensity:1,rotationDeg:0,exposure:1.5,toneMapping:"acesFilmic" as const,shadows:{enabled:true,type:"vsm" as const}};
  let failed=false;try{renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),environment,"beauty");}catch{failed=true;}TestValidator.predicate("refusal precedes renderer state and draw",failed&&draws===0&&renderer.toneMapping===THREE.NoToneMapping&&renderer.toneMappingExposure===1&&renderer.shadowMap.type===THREE.PCFShadowMap);
  renderer.shadowMap.type=THREE.VSMShadowMap;failed=false;try{renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),undefined,"beauty");}catch{failed=true;}TestValidator.predicate("inherited host VSM shares admission",failed&&draws===0);
  renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),environment,"normal");TestValidator.equals("structural bypass draws and restores",[draws,renderer.shadowMap.enabled,renderer.shadowMap.type],[1,true,THREE.VSMShadowMap]);
};
