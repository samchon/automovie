import type * as THREE from "three";

import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import {readAutoMovieCubeShadowDepth} from "./readAutoMovieCubeShadowDepth.js";
import {retireAutoMovieCubeShadowDepth} from "./retireAutoMovieCubeShadowDepth.js";
import {guardAutoMovieSceneShadowRetirement} from "./guardAutoMovieSceneShadowRetirement.js";

/**
 * Retire every scene light's retained shadow attachment after a filter change.
 *
 * PCF comparison depth and VSM ordinary depth/distribution attachments are different GPU products. Three's previous filter is renderer-global while targets belong to individual lights, so a light hidden during a switch can retain the wrong product. Include hidden lights, clear public target slots, and mark their next shadow draw dirty. Disposal attempts every unique target and depth texture even if an independent resource listener fails. Retained targets belong exclusively to this renderer context and the scene's complete light population. External depth borrowers must be detached before retirement; an observable caller destination borrowing these resources is rejected before mutation. Native cube depth is queried before disposal and its still-live handle is released once without changing SDK bookkeeping. A cube depth with version zero is known uninitialized in Three r186 and is disposed without binding or allocating it. Positive version is not evidence of GPU residency; all other queried cubes must be actual retained draws in this context, not manually assigned CPU-only maps dirtied with needsUpdate.
 *
 * @evidence contracts/common.md#principled-implementation Collects every scene light retained map/blur/depth owner including hidden lights, refuses the current destination borrowing them, queries retained native cube depth before mutation and independently disposes distinct resources plus supplemental still-live cube handles.
 * @evidence contracts/common.md#clear-and-simple-design Scene collection/slot withdrawal compose existing native query/retirement and independent failure collection; the internal context guard retains only in-progress or failed owner references and outcome.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The scene must own mutable exclusive-context shadow slots and external depth borrowers must be detached; positive depth version is not upload proof, zero version skips allocation-producing query, and disposal completion does not independently certify kernel storage release.
 * @evidence contracts/common.md#meaningful-documentation Documents filter representation, hidden lights, borrower preflight, retained-draw/zero-version premises and failed-context admission refusal rather than pretending cleared slots prove release.
 * @evidence contracts/performance.md#efficient-algorithms One N-node traversal and distinct target/texture/native-handle sets give O(N+R) coordinator work plus native query/disposal costs; no shadow texel arrays are allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work Resource/handle identity deduplicates one attempt; failure is retained by renderer identity and later retirement/pass calls return that same outcome without native retry or replacement allocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Slots withdraw before independent attempts; failed scene/resource/handle references and original cause stay under a weak renderer key. Existing scene passes then refuse drawing, and direct hosts must likewise respect this guard rather than infer physical release from empty slots.
 */
export const resetAutoMovieSceneShadowTargets: (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => void=(scene:THREE.Scene,renderer:THREE.WebGLRenderer):void=>{
  guardAutoMovieSceneShadowRetirement(scene,renderer);
  const resources: Set<THREE.RenderTarget | THREE.Texture>=new Set<THREE.RenderTarget|THREE.Texture>();
  const nativeDepth: Set<WebGLTexture>=new Set<WebGLTexture>();
  const failures:unknown[]=[];
  const shadows:Array<THREE.LightShadow>=[];
  const targets: Set<THREE.RenderTarget>=new Set<THREE.RenderTarget>();
  scene.traverse((object: THREE.Object3D): void =>{
    if((object as THREE.Light).isLight!==true)return;
    const shadow: THREE.DirectionalLight["shadow"] | undefined=(object as THREE.DirectionalLight).shadow;
    if(shadow===undefined)return;
    shadows.push(shadow);
    for(const target of [shadow.map,shadow.mapPass])if(target!==null){targets.add(target);resources.add(target);if(target.depthTexture!==null)resources.add(target.depthTexture);}
  });
  const destination: ReturnType<THREE.WebGLRenderer["getRenderTarget"]>=renderer.getRenderTarget();
  if(destination!==null && (targets.has(destination) || (destination.depthTexture!==null && resources.has(destination.depthTexture))))
    throw new Error("Cannot retire shadow attachments borrowed by the caller's current render destination.");
  for(const target of targets){
      if("isWebGLCubeRenderTarget" in target && target.isWebGLCubeRenderTarget===true && target.depthTexture!==null && target.depthTexture.version!==0){
        try{const handle: WebGLTexture | null=readAutoMovieCubeShadowDepth(renderer,target);if(handle!==null)nativeDepth.add(handle);}catch(error){failures.push(error);}
      }
      target.depthTexture=null;
  }
  for(const shadow of shadows){
    shadow.map=null;shadow.mapPass=null;shadow.needsUpdate=true;
  }
  guardAutoMovieSceneShadowRetirement(scene,renderer,{
    resources:[...resources],nativeDepth:[...nativeDepth],
    run:():void=>restoreAutoMovieRenderModeState([
    ...failures.map((error: unknown): () => void =>(): void =>{throw error;}),
    ...Array.from(resources,(resource: THREE.RenderTarget | THREE.Texture): () => void =>(): void =>{resource.dispose();}),
    ...Array.from(nativeDepth,(handle: WebGLTexture): () => void =>(): void =>{retireAutoMovieCubeShadowDepth(renderer,handle);}),
    ]),
  });
};
