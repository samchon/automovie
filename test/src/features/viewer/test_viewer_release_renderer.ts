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
 * 1. Observed fade/dissolve copy objects dispose exactly once during release.
 * 2. The still-live fact host can acquire a new compositor after successful
 *    owner removal; this does not permit reusing a disposed native renderer.
 * 3. An unused renderer still releases without acquiring compositor state.
 * 4. Independent compositor/renderer failures preserve all errors and release
 *    every later attempted owner; failed extents remain retained and a single
 *    failure keeps its original identity.
 * 5. Mounted release stops the loop and retires scene shadow targets before
 *    releasing the renderer, even after loop or shadow-disposal failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises production renderer/mounted release through the existing in-memory composition port, real Three copy/target disposal events and owned callback request order; failed compositors must keep their extent and cause while independent owners still receive attempts.
 * @evidence contracts/testing.md#independent-expectations Independently counted events for the five copied Texture objects, fixed three-copy potential extents per compositor and literal stop/shadow/renderer order define expectations. The unused fade incoming wrapper and actual GPU/kernel retirement are not observed, and the port's callback records do not prove native renderer reuse or hardware bytes.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts unused/successful/reacquired compositor ownership, independent dissolve/fade/renderer failures, repeated sticky compositor failure, a sole renderer failure and mounted loop/shadow/renderer failure order; shader byte precision and native browser shutdown belong to other obligations.
 * @evidence contracts/testing.md#execution-ownership This named unit entry uses the existing orchestration fact host plus real CPU-side Three resources and their own listeners, starting no native renderer/browser/process/GPU and adding no driver; fixture-local callback assignments record requests rather than replacing a foreign SDK instance method.
 */
export function test_viewer_release_renderer(): void {
  const used: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer();let disposed: number=0;
  used.renderer.dispose=(): void =>{disposed++;};
  renderCrossDissolveFrames(used.renderer,(): undefined =>undefined,(): undefined =>undefined,.5);
  renderFadeToBlackFrame(used.renderer,(): undefined =>undefined,.5);
  let copiesDisposed: number=0;for(const copy of used.copied)copy.addEventListener("dispose",(): void =>{copiesDisposed++;});
  releaseViewerRenderer(used.renderer);TestValidator.equals("all uploaded source copies released",copiesDisposed,5);TestValidator.equals("renderer release",disposed,1);
  const previous: THREE.FramebufferTexture | undefined=used.copied[1];renderCrossDissolveFrames(used.renderer,(): undefined =>undefined,(): undefined =>undefined,.5);TestValidator.predicate("fresh post-release copy",used.copied.at(-2)!==previous);releaseViewerRenderer(used.renderer);
  const unused: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer();unused.renderer.dispose=(): void =>{disposed++;};releaseViewerRenderer(unused.renderer);TestValidator.equals("unused renderer still releases",disposed,3);
  const failed: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(),first: Error=new Error("dissolve release"),second: Error=new Error("fade release"),third: Error=new Error("renderer release");
  renderCrossDissolveFrames(failed.renderer,(): undefined =>undefined,(): undefined =>undefined,.5);renderFadeToBlackFrame(failed.renderer,(): undefined =>undefined,.5);
  let releases: number=0;for(const copy of new Set(failed.copied))copy.addEventListener("dispose",(): void =>{releases++;});
  failed.copied[1]!.addEventListener("dispose",(): void =>{throw first;});failed.copied[4]!.addEventListener("dispose",(): void =>{throw second;});failed.renderer.dispose=(): void =>{releases++;throw third;};
  let aggregate:unknown;try{releaseViewerRenderer(failed.renderer);}catch(error){aggregate=error;}
  TestValidator.predicate("all independent release failures remain visible",aggregate instanceof AggregateError&&aggregate.errors.length===3&&aggregate.errors[0]===first&&aggregate.errors[1]===second&&aggregate.errors[2]===third);
  TestValidator.equals("failed release attempts independent owners without claiming its copies freed",{releases,residency:readAutoMovieFilmDisplayTextureResidency(failed.renderer)},{releases:6,residency:[{owner:"film-fade",width:64,height:32,copies:3},{owner:"film-dissolve",width:64,height:32,copies:3}]});
  let repeated: unknown; try { releaseViewerRenderer(failed.renderer); } catch (error) { repeated = error; }
  TestValidator.predicate("repeated compositor retirement preserves the original ordered causes",
    repeated instanceof AggregateError && repeated.errors.length === 3 && repeated.errors[0] === first && repeated.errors[1] === second && repeated.errors[2] === third);
  TestValidator.equals("repeat does not retry copied Texture disposal, while the raw renderer API remains requested", releases, 7);
  const single: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer();single.renderer.dispose=(): void =>{throw third;};let singleFailure:unknown;try{releaseViewerRenderer(single.renderer);}catch(error){singleFailure=error;}TestValidator.predicate("single renderer error preserves identity",singleFailure===third);
  const mounted: ReturnType<typeof createDisplayCompositionRenderer>=createDisplayCompositionRenderer(),scene: THREE.Scene=new THREE.Scene(),light: THREE.DirectionalLight=new THREE.DirectionalLight(),target: THREE.WebGLRenderTarget=new THREE.WebGLRenderTarget(4,4),order:string[]=[];light.shadow.map=target;scene.add(light);
  target.addEventListener("dispose",(): void =>{order.push("shadow");});mounted.renderer.dispose=(): void =>{order.push("renderer");};
  releaseMountedViewer(mounted.renderer,scene,(): void =>{order.push("stop");});TestValidator.equals("native shadow lifetime ends before renderer",order,["stop","shadow","renderer"]);TestValidator.equals("mounted shadow slot is retired",light.shadow.map,null);
  const failedTarget: THREE.WebGLRenderTarget=new THREE.WebGLRenderTarget(4,4);light.shadow.map=failedTarget;failedTarget.addEventListener("dispose",(): void =>{order.push("shadow failure");throw second;});mounted.renderer.dispose=(): void =>{order.push("renderer failure");throw third;};
  aggregate=undefined;try{releaseMountedViewer(mounted.renderer,scene,(): void =>{order.push("stop failure");throw first;});}catch(error){aggregate=error;}
  TestValidator.predicate("mounted independent failures stay in lifecycle order",aggregate instanceof AggregateError&&aggregate.errors.length===3&&aggregate.errors[0]===first&&aggregate.errors[1]===second&&aggregate.errors[2]===third);
  TestValidator.equals("failure cannot skip later mounted owners",order.slice(-3),["stop failure","shadow failure","renderer failure"]);TestValidator.equals("failed mounted shadow retirement clears slot",light.shadow.map,null);
}
