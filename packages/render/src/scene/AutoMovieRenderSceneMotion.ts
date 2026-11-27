import { applyTransform as applyTransformImplementation } from "./internal/applyTransform.js";
import { applyPose as applyPoseImplementation } from "./internal/applyPose.js";
import { applyExpression as applyExpressionImplementation } from "./internal/applyExpression.js";
import { applyObjectMotion as applyObjectMotionImplementation } from "./internal/applyObjectMotion.js";
import { applyObjectMotions as applyObjectMotionsImplementation } from "./internal/applyObjectMotions.js";
import { applyLightMotion as applyLightMotionImplementation } from "./internal/applyLightMotion.js";

import type * as THREE from "three";
import { invalidateAutoMovieSkinnedPose as invalidateAutoMovieSkinnedPoseImplementation } from "./internal/invalidateAutoMovieSkinnedPose.js";
import { type IAutoMovieRenderModelObject } from "./IAutoMovieRenderModelObject.js";
import { type AutoMovieHumanoidBone, type IAutoMovieRigLocalTransform, type IAutoMovieRigidTransform, type IAutoMovieTransform, type IAutoMoviePose, type IAutoMovieSkeleton, type IAutoMovieJointAxes, type IAutoMovieRestFrame, type IAutoMovieExpression, type IAutoMovieHumanVisemeWeights, type IAutoMovieClip, type IAutoMovieLight } from "@automovie/interface";
import { applyAutoMovieRigLocals as applyAutoMovieRigLocalsImplementation } from "./internal/applyAutoMovieRigLocals.js";
import { createAutoMoviePhysicalPoseAdapter as createAutoMoviePhysicalPoseAdapterImplementation } from "./internal/createAutoMoviePhysicalPoseAdapter.js";

/** Public operations for Auto Movie Render Scene Motion. */
export namespace AutoMovieRenderSceneMotion {
  /**
   * Start a new pose revision for every skinned mesh under `root`: their CPU
   * deformation and bounds recompute on the next query.
   *
   * Every writer of bones, morph influences or skin geometry calls this after
   * writing, so culling, shadows, framing and picking read the pose the shaders
   * draw rather than the one the bounds were last computed for. A foreign
   * `THREE.SkinnedMesh` gets the same treatment Three asks of an animated skin:
   * its bounds are cleared and recomputed when next read.
   *
   * @param root A built model's root, or any subtree containing skinned meshes.
   */
  export function invalidateSkinnedPose(root: THREE.Object3D): void {
    invalidateAutoMovieSkinnedPoseImplementation(root);
  }

  /**
   * Display complete evaluator-produced bone locals, including translations
   * caused by omitted intermediate joints. Values are absolute parent-relative
   * transforms, rather than deltas from the build's rest pose. `root` places the
   * model in its parent's frame. Every written scale becomes one.
   *
   * The map must contain exactly the target's mapped bone slots. Before any
   * mutation, rejects missing or extra slots, nonfinite components, malformed
   * tuples and quaternions whose squared norm differs from one by over 1e-6. An
   * empty map is valid for a nonrigged target. No quaternion is normalized.
   *
   * Refreshes local and world matrices, including changed ancestors, and
   * invalidates skinned bounds and CPU pose caches. The caller owns semantic
   * evaluation, morph weights, imported-runtime flushing and rendering.
   */
  export function applyRigLocals(target: IAutoMovieRenderModelObject, locals: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>, root: IAutoMovieRigLocalTransform): void {
    applyAutoMovieRigLocalsImplementation(target, locals, root);
  }

  /**
   * Apply solved world bone frames to an existing complete skin rig, retaining
   * unlisted bones' authored local transforms.
   */
  export function createPhysicalPoseAdapter(model: IAutoMovieRenderModelObject): (poses: Readonly<Record<string, IAutoMovieRigidTransform>>) => void {
    return createAutoMoviePhysicalPoseAdapterImplementation(model);
  }

  /**
   * Copy an admitted local TRS to a borrowed Three object: metre translation,
   * engine x/y/z/w quaternion and dimensionless scale. The host updates world
   * matrices when needed; this adapter does not normalize or repair source data.
   */
  export function applyTransform(obj: THREE.Object3D, t: IAutoMovieTransform): void {
    applyTransformImplementation(obj, t);
  }

  /**
   * Apply a {@link IAutoMoviePose} to a built model by running the engine's
   * forward kinematics and writing each bone's local rotation onto the
   * corresponding `THREE.Bone`. The pose's root transform (if any) is applied to
   * the model root.
   *
   * The engine owns the math (semantic angles → quaternions), so the viewer only
   * copies results onto `three.js` objects, keeping rendering a thin, swappable
   * layer over the deterministic core.
   *
   * `restFrames` optionally reads each joint angle as **clinical** and maps it
   * into the rig's rest-relative space before articulating (e.g. abduction 180
   * raises either arm overhead regardless of side); omit it to treat the pose's
   * angles as raw rig-space, the historical behaviour.
   *
   * Morph targets that `buildModel` recorded as pose-driven take the weights
   * `resolveMorphTargetWeights` computes from the same pose, so a corrective
   * follows every applied pose; expression-written targets are left alone. Every
   * skinned mesh then starts a new pose revision
   * ({@link invalidateAutoMovieSkinnedPose}), so its bounds and vertex queries
   * follow the pose the shader draws.
   *
   * Returns the skeleton bones the FK resolved but the model's bone map does not
   * carry (#1051). A deliberately partial imported map (a VRM without toes)
   * reports its unmapped bones every call: the host compares against what it
   * MEANT to map, so a typo in the bone map is distinguishable from an
   * intentional gap instead of both silently not articulating.
   */
  export function applyPose(target: IAutoMovieRenderModelObject, pose: IAutoMoviePose, skeleton: IAutoMovieSkeleton, jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>, restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>): AutoMovieHumanoidBone[] {
    return applyPoseImplementation(target, pose, skeleton, jointAxes, restFrames);
  }

  /**
   * Apply a sampled automovie expression to a viewer model.
   *
   * VRM-style expression targets receive preset and ARKit names directly.
   * Imported meshes with `morphTargetDictionary` receive exact or
   * case-insensitive matching names; generated primitive models simply no-op.
   * Skinned meshes then start a new pose revision, because morphs precede
   * skinning and move their bounds.
   *
   * Optional dialogue viseme weights layer over the authored expression: each
   * MPEG-4 viseme maps onto one of the five mouth presets, and the presets' ARKit
   * channels are summed by weight, so `{ aa: 0.5, O: 0.5 }` opens `jawOpen` to
   * 0.5 × 1 + 0.5 × 0.6 = 0.8. The mouth layer's channels replace the authored
   * values of the same channels.
   */
  export function applyExpression(target: IAutoMovieRenderModelObject, expression: IAutoMovieExpression | null, visemes?: IAutoMovieHumanVisemeWeights): void {
    applyExpressionImplementation(target, expression, visemes);
  }

  /**
   * Drive scene objects from a world-space node clip: a shot's `objectMotion` (a
   * projectile's baked flight, a prop following a bone) or its `cameraMotion`.
   * Sample the clip at `seconds` and write each node channel straight onto the
   * `THREE.Object3D` that `resolve` returns for that node: translation, rotation
   * and scale onto the object's local transform, `weights` onto the morph
   * influences of every morphable mesh beneath it. A node with no object or a
   * non-node channel is skipped. Light changes ride the shot's `lightMotions`
   * through {@link applyLightMotion}; the artifact gate refuses pointer tracks on
   * a transform clip.
   *
   * World-space clip values therefore require matching parent coordinates, or a
   * host conversion before this writer; it does not invert parent matrices.
   *
   * The shared writer switches on all four current node paths, including morph
   * weights (#1357). Its void-returning switch has no exhaustive-type assertion;
   * adding a path to the interface still requires updating that writer.
   *
   * This is the render side of the engine's clip bakers ({@link compileLaunch},
   * `compileAttach`, `cameraMove`): the object rides its clip each frame, no rig
   * involved. Feeding a shot's `objectMotions` and `cameraMotion` through the
   * same helper keeps every demo's projectile/prop/camera on one code path.
   *
   * Only channels the clip CARRIES are written: a channel absent from the current
   * clip keeps the object's existing value, so a host that swaps clips mid-scene
   * must restore staged bases itself (the engine's `resolveFrame` falls back to
   * rest instead: it owns node rests; this helper does not).
   */
  export function applyObjectMotion(clip: IAutoMovieClip, seconds: number, resolve: (node: string) => THREE.Object3D | undefined): void {
    applyObjectMotionImplementation(clip, seconds, resolve);
  }

  /**
   * Apply a shot's object clips under the engine's per-channel authority rule. A
   * future-only channel writes nothing. As with {@link applyObjectMotion}, a
   * stateful host must restore staged bases before each seek/frame when no active
   * authority should leave the staged value visible. Samples write parent-local
   * transform fields, so their coordinate frame must match each resolved target.
   */
  export function applyObjectMotions(clips: readonly IAutoMovieClip[], seconds: number, resolve: (node: string) => THREE.Object3D | undefined): void {
    applyObjectMotionsImplementation(clips, seconds, resolve);
  }

  /**
   * Drive scene lights from a shot's `lightMotions`: evaluate the clips at
   * `seconds` through the engine's {@link resolveShotLighting} and write each
   * resolved light onto the `THREE.Light` that `resolve` returns for its **id**.
   *
   * The render side of #1348, and the reason the axis is not a false green: the
   * engine decides what the light IS at an instant and this writes it, so a
   * candle blown out at 1.6s dims in the viewer at 1.6s instead of holding its
   * staged glow for the whole film.
   *
   * Lights are resolved by id and never by position. `buildScene` adds them as
   * top-level children and the segmentation mask palette is keyed by top-level
   * child index, so an index-addressed light would silently re-target whenever
   * staging inserts one; {@link IAutoMovieRenderSceneObject.lights} is the id index
   * built for exactly this call.
   *
   * Every staged light is written, not only the ones a clip addresses, which is
   * the deliberate difference from {@link applyObjectMotion}. That helper owns no
   * rest poses, so it must leave an unaddressed channel alone; a light carries
   * its rest on the scene, so writing all of them makes the viewer's lighting a
   * pure function of scene, clips and time. A host swapping clips mid-scene gets
   * the staged light back instead of whatever the previous frame left behind.
   *
   * A light the host cannot resolve is skipped: the engine has already refused a
   * clip addressing a light the scene does not stage, so the only way to arrive
   * here unresolved is a host that built a subset of the scene.
   */
  export function applyLightMotion(lights: readonly IAutoMovieLight[], clips: readonly IAutoMovieClip[], seconds: number, resolve: (light: string) => THREE.Light | undefined): void {
    applyLightMotionImplementation(lights, clips, seconds, resolve);
  }
}
