import {invalidateAutoMovieSceneShadowPrograms,renderAutoMovieScenePass} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";

/**
 * Renderer shadow policy reaches unique material program generations and its
 * restoration invalidates the same source for a later direct consumer.
 *
 * Scenarios:
 * 1. Shared, array, override and non-mesh materials are marked once per scene
 *    boundary, while a scene with no materials remains valid.
 * 2. Effective enablement or filter changes mark before draw and after restore;
 *    unchanged policy reuses program generations without unnecessary marking.
 */
export const test_viewer_shadow_program_state=():void=>{
  const empty=new THREE.Scene();invalidateAutoMovieSceneShadowPrograms(empty);
  const scene=new THREE.Scene(),first=new THREE.MeshStandardMaterial(),second=new THREE.MeshBasicMaterial(),override=new THREE.MeshNormalMaterial(),geometry=new THREE.BoxGeometry();
  scene.add(new THREE.Mesh(geometry,first),new THREE.Mesh(geometry,[first,second]),new THREE.Line(new THREE.BufferGeometry(),second),new THREE.Group());scene.overrideMaterial=override;
  const versions=[first.version,second.version,override.version];invalidateAutoMovieSceneShadowPrograms(scene);
  TestValidator.equals("unique materials and override each change once",[first.version,second.version,override.version],versions.map(value=>value+1));
  scene.overrideMaterial=null;
  const renderer={getRenderTarget:()=>null,toneMapping:THREE.NoToneMapping,toneMappingExposure:1,shadowMap:{enabled:true,type:THREE.PCFShadowMap},render:()=>undefined} as unknown as THREE.WebGLRenderer;
  const environment={image:null,background:null,intensity:1,rotationDeg:0,exposure:1,toneMapping:"none" as const,shadows:{enabled:false,type:"pcf" as const}};
  const before=first.version;renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),environment,"beauty");
  TestValidator.equals("changed shadow enablement invalidates apply and restore",first.version,before+2);
  const same=first.version;renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),{...environment,shadows:{enabled:true,type:"pcf"}},"beauty");TestValidator.equals("same shadow state reuses program generation",first.version,same);
  renderAutoMovieScenePass(renderer,scene,new THREE.Camera(),{...environment,shadows:{enabled:true,type:"vsm"}},"beauty");TestValidator.equals("changed filter invalidates both boundaries",first.version,same+2);
  const failure=new Error("program update rejected");
  class RejectingMaterial extends THREE.MeshBasicMaterial {
    public override set needsUpdate(value:boolean){if(value)throw failure;}
  }
  const failedScene=new THREE.Scene(),failedMaterial=new RejectingMaterial();failedMaterial.needsUpdate=false;failedScene.add(new THREE.Mesh(geometry,failedMaterial));
  let caught:unknown;try{renderAutoMovieScenePass(renderer,failedScene,new THREE.Camera(),environment,"beauty");}catch(error){caught=error;}
  TestValidator.predicate("apply and restoration update failures remain visible",caught instanceof AggregateError&&caught.errors[0]===failure&&caught.errors[1]===failure);
  TestValidator.equals("failed material update still restores renderer shadow policy",[renderer.shadowMap.enabled,renderer.shadowMap.type],[true,THREE.PCFShadowMap]);failedMaterial.dispose();
  first.dispose();second.dispose();override.dispose();geometry.dispose();
};
