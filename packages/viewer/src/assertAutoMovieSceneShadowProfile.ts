import {resolveAutoMovieShadowProfile} from "@automovie/engine";
import type {IAutoMovieLight,IAutoMovieSceneEnvironment} from "@automovie/interface";
import type * as THREE from "three";
import {readAutoMovieShadowLightSource} from "./readAutoMovieShadowLightSource.js";

/**
 * Admit an actual scene's punctual shadow casters through the Engine profile.
 * Include hidden lights because their retained targets can participate in a
 * later sample. Runtime names, or native UUIDs when unnamed, identify this
 * scene projection; its light-array paths are not authored AST positions.
 * Area and ambient lights have no punctual shadow product. The caller resolves
 * effective renderer policy before any mutable pass state or GPU allocation.
 *
 * @evidence contracts/common.md#principled-implementation Traverses real scene objects into punctual light source descriptors, including hidden retained lights, and applies the engine's closed shadow-profile admission; native name/UUID identifies this projection and duplicate authored identity/source provenance is not reconstructed here.
 * @evidence contracts/common.md#clear-and-simple-design Owns the Three scene-to-portable-profile join and delegates supported light/filter policy to the engine, before callers mutate pass state or allocate shadow products.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Includes actual hidden casters rather than counting only a visible fixture frame; area/ambient omissions follow their lack of a punctual shadow product, and no unsupported profile is compensated with a different filter.
 * @evidence contracts/common.md#meaningful-documentation States hidden-light inclusion, name/UUID identity, runtime-path versus authored-AST distinction and required caller ordering before mutable/GPU work.
 * @evidence contracts/performance.md#efficient-algorithms Traverses O scene nodes and stores L punctual descriptors for engine admission, O(O+L) adapter time and O(L) temporary storage; refusal diagnostic size grows with actual violations.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the engine profile validator instead of duplicating the policy; scene lights/policy can mutate and hidden lights can become active, so no visibility-only cached admission is assumed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows scene/shadow declaration and retains only request-local descriptors/results; creates no shadow map or task, and throws before callers acquire their downstream products.
 */
export const assertAutoMovieSceneShadowProfile: (scene: THREE.Scene, shadows: IAutoMovieSceneEnvironment["shadows"]) => void=(scene:THREE.Scene,shadows:IAutoMovieSceneEnvironment["shadows"]):void=>{
  const lights:Pick<IAutoMovieLight,"id"|"type"|"castShadow">[]=[];
  scene.traverse((object: THREE.Object3D): void => {
    const light: Pick<IAutoMovieLight, "type" | "id" | "castShadow"> | null=readAutoMovieShadowLightSource(object.name||object.uuid,object);
    if(light!==null)lights.push(light);
  });
  const profile: ReturnType<typeof resolveAutoMovieShadowProfile> = resolveAutoMovieShadowProfile({lights,shadows});
  if(!profile.success)throw new Error("Unsupported shadow profile: "+JSON.stringify(profile.violations));
};
