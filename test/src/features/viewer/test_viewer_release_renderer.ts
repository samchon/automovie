import {releaseViewerRenderer,releaseMountedViewer,renderCrossDissolveFrames,renderFadeToBlackFrame,readAutoMovieFilmDisplayTextureResidency} from "@automovie/viewer";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";
import {createDisplayCompositionRenderer} from "../internal/createDisplayCompositionRenderer";
/**
 * Renderer release also closes the source-display copies retained by both
 * beauty compositors. Copies use the source canvas's own antialiasing rather
 * than introducing another intermediate multisample resolve.
 *
 * Scenarios:
 * 1. Fade and dissolve copies dispose exactly once when their renderer ends.
 * 2. A later compositor draw acquires new copies for that renderer.
 * 3. An unused renderer still releases without acquiring compositor state.
 * 4. Independent compositor/renderer failures preserve all errors and release
 *    every later lifetime; a single failure keeps its original identity.
 * 5. Mounted release stops the loop and retires scene shadow targets before
 *    releasing the renderer, even after loop or shadow-disposal failure.
 */
export const test_viewer_release_renderer=():void=>{
  const used=createDisplayCompositionRenderer();let disposed=0;
  used.renderer.dispose=()=>{disposed++;};
  renderCrossDissolveFrames(used.renderer,()=>undefined,()=>undefined,.5);
  renderFadeToBlackFrame(used.renderer,()=>undefined,.5);
  let copiesDisposed=0;for(const copy of used.copied)copy.addEventListener("dispose",()=>{copiesDisposed++;});
  releaseViewerRenderer(used.renderer);TestValidator.equals("all uploaded source copies released",copiesDisposed,5);TestValidator.equals("renderer release",disposed,1);
  const previous=used.copied[1];renderCrossDissolveFrames(used.renderer,()=>undefined,()=>undefined,.5);TestValidator.predicate("fresh post-release copy",used.copied.at(-2)!==previous);releaseViewerRenderer(used.renderer);
  const unused=createDisplayCompositionRenderer();unused.renderer.dispose=()=>{disposed++;};releaseViewerRenderer(unused.renderer);TestValidator.equals("unused renderer still releases",disposed,3);
  const failed=createDisplayCompositionRenderer(),first=new Error("dissolve release"),second=new Error("fade release"),third=new Error("renderer release");
  renderCrossDissolveFrames(failed.renderer,()=>undefined,()=>undefined,.5);renderFadeToBlackFrame(failed.renderer,()=>undefined,.5);
  let releases=0;for(const copy of new Set(failed.copied))copy.addEventListener("dispose",()=>{releases++;});
  failed.copied[1]!.addEventListener("dispose",()=>{throw first;});failed.copied[4]!.addEventListener("dispose",()=>{throw second;});failed.renderer.dispose=()=>{releases++;throw third;};
  let aggregate:unknown;try{releaseViewerRenderer(failed.renderer);}catch(error){aggregate=error;}
  TestValidator.predicate("all independent release failures remain visible",aggregate instanceof AggregateError&&aggregate.errors.length===3&&aggregate.errors[0]===first&&aggregate.errors[1]===second&&aggregate.errors[2]===third);
  TestValidator.equals("failed release still ends every acquired owner",{releases,residency:readAutoMovieFilmDisplayTextureResidency(failed.renderer)},{releases:6,residency:[]});
  const single=createDisplayCompositionRenderer();single.renderer.dispose=()=>{throw third;};let singleFailure:unknown;try{releaseViewerRenderer(single.renderer);}catch(error){singleFailure=error;}TestValidator.predicate("single renderer error preserves identity",singleFailure===third);
  const mounted=createDisplayCompositionRenderer(),scene=new THREE.Scene(),light=new THREE.DirectionalLight(),target=new THREE.WebGLRenderTarget(4,4),order:string[]=[];light.shadow.map=target;scene.add(light);
  target.addEventListener("dispose",()=>{order.push("shadow");});mounted.renderer.dispose=()=>{order.push("renderer");};
  releaseMountedViewer(mounted.renderer,scene,()=>{order.push("stop");});TestValidator.equals("native shadow lifetime ends before renderer",order,["stop","shadow","renderer"]);TestValidator.equals("mounted shadow slot is retired",light.shadow.map,null);
  const failedTarget=new THREE.WebGLRenderTarget(4,4);light.shadow.map=failedTarget;failedTarget.addEventListener("dispose",()=>{order.push("shadow failure");throw second;});mounted.renderer.dispose=()=>{order.push("renderer failure");throw third;};
  aggregate=undefined;try{releaseMountedViewer(mounted.renderer,scene,()=>{order.push("stop failure");throw first;});}catch(error){aggregate=error;}
  TestValidator.predicate("mounted independent failures stay in lifecycle order",aggregate instanceof AggregateError&&aggregate.errors.length===3&&aggregate.errors[0]===first&&aggregate.errors[1]===second&&aggregate.errors[2]===third);
  TestValidator.equals("failure cannot skip later mounted owners",order.slice(-3),["stop failure","shadow failure","renderer failure"]);TestValidator.equals("failed mounted shadow retirement clears slot",light.shadow.map,null);
};
