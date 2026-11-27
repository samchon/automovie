import { AutoMovieEngineSequence } from "@automovie/engine";
import type { IAutoMovieClip } from "@automovie/interface";
import type * as THREE from "three";

import { applySampledObjectMotion } from "./applySampledObjectMotion.js";

/*
 * Drive scene objects from a world-space node clip: a shot's `objectMotion` (a
 * projectile's baked flight, a prop following a bone) or its `cameraMotion`.
 * Sample the clip at `seconds` and write each node channel straight onto the
 * `THREE.Object3D` that `resolve` returns for that node: translation, rotation
 * and scale onto the object's local transform, `weights` onto the morph
 * influences of every morphable mesh beneath it. A node with no object or a
 * non-node channel is skipped. Light changes ride the shot's `lightMotions`
 * through applyLightMotion; the artifact gate refuses pointer tracks on
 * a transform clip.
 *
 * World-space clip values therefore require matching parent coordinates, or a
 * host conversion before this writer; it does not invert parent matrices.
 *
 * The shared writer switches on all four current node paths, including morph
 * weights (#1357). Its void-returning switch has no exhaustive-type assertion;
 * adding a path to the interface still requires updating that writer.
 *
 * This is the render side of the engine's clip bakers (compileLaunch,
 * `compileAttach`, `cameraMove`): the object rides its clip each frame, no rig
 * involved. Feeding a shot's `objectMotions` and `cameraMotion` through the
 * same helper keeps every demo's projectile/prop/camera on one code path.
 *
 * Only channels the clip CARRIES are written: a channel absent from the current
 * clip keeps the object's existing value, so a host that swaps clips mid-scene
 * must restore staged bases itself (the engine's `resolveFrame` falls back to
 * rest instead: it owns node rests; this helper does not).
 */
export const applyObjectMotion: (
  clip: IAutoMovieClip,
  seconds: number,
  resolve: (node: string) => THREE.Object3D | undefined,
) => void = (
  clip: IAutoMovieClip,
  seconds: number,
  resolve: (node: string) => THREE.Object3D | undefined,
): void => {
  applySampledObjectMotion(AutoMovieEngineSequence.sampleClip(clip, seconds), resolve);
};
