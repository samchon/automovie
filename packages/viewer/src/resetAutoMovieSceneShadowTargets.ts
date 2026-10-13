import type * as THREE from "three";

import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import {readAutoMovieCubeShadowDepth} from "./readAutoMovieCubeShadowDepth.js";
import {retireAutoMovieCubeShadowDepth} from "./retireAutoMovieCubeShadowDepth.js";

/**
 * Retire every scene light's retained shadow attachment after a filter change.
 *
 * PCF comparison depth and VSM ordinary depth/distribution attachments are
 * different GPU products. Three's previous filter is renderer-global while
 * targets belong to individual lights, so a light hidden during a switch can
 * retain the wrong product. Include hidden lights, clear public target slots,
 * and mark their next shadow draw dirty. Disposal attempts every unique target
 * and depth texture even if an independent resource listener fails.
 * Retained targets belong exclusively to this renderer context and the scene's
 * complete light population. External depth borrowers must be detached before
 * retirement; an observable caller destination borrowing these resources is
 * rejected before mutation. Native cube depth is queried before disposal and
 * its still-live handle is released once without changing SDK bookkeeping.
 * A cube depth with version zero is known uninitialized in Three r186 and is
 * disposed without binding or allocating it. Positive version is not evidence
 * of GPU residency; all other queried cubes must be actual retained draws in
 * this context, not manually assigned CPU-only maps dirtied with needsUpdate.
 *
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-identity Keeps retained per-light depth and distribution targets consistent with the effective filter family.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Invalidates per-light cached products when the renderer filter changes, including lights absent from the current render list.
 */
export const resetAutoMovieSceneShadowTargets=(scene:THREE.Scene,renderer:THREE.WebGLRenderer):void=>{
  const resources=new Set<THREE.RenderTarget|THREE.Texture>();
  const nativeDepth=new Set<WebGLTexture>();
  const failures:unknown[]=[];
  const shadows:Array<THREE.LightShadow>=[];
  const targets=new Set<THREE.RenderTarget>();
  scene.traverse(object=>{
    if((object as THREE.Light).isLight!==true)return;
    const shadow=(object as THREE.DirectionalLight).shadow;
    if(shadow===undefined)return;
    shadows.push(shadow);
    for(const target of [shadow.map,shadow.mapPass])if(target!==null){targets.add(target);resources.add(target);if(target.depthTexture!==null)resources.add(target.depthTexture);}
  });
  const destination=renderer.getRenderTarget();
  if(destination!==null && (targets.has(destination) || (destination.depthTexture!==null && resources.has(destination.depthTexture))))
    throw new Error("Cannot retire shadow attachments borrowed by the caller's current render destination.");
  for(const target of targets){
      if("isWebGLCubeRenderTarget" in target && target.isWebGLCubeRenderTarget===true && target.depthTexture!==null && target.depthTexture.version!==0){
        try{const handle=readAutoMovieCubeShadowDepth(renderer,target);if(handle!==null)nativeDepth.add(handle);}catch(error){failures.push(error);}
      }
      target.depthTexture=null;
  }
  for(const shadow of shadows){
    shadow.map=null;shadow.mapPass=null;shadow.needsUpdate=true;
  }
  restoreAutoMovieRenderModeState([
    ...failures.map(error=>()=>{throw error;}),
    ...Array.from(resources,resource=>()=>{resource.dispose();}),
    ...Array.from(nativeDepth,handle=>()=>{retireAutoMovieCubeShadowDepth(renderer,handle);}),
  ]);
};
