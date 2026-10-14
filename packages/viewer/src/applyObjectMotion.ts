import { sampleClip } from "@automovie/engine";
import type { IAutoMovieClip } from "@automovie/interface";
import type * as THREE from "three";
import { applySampledObjectMotion } from "./applySampledObjectMotion.js";

/**
 * Drive scene objects from a world-space node clip: a shot's `objectMotion` (a projectile's baked flight, a prop following a bone) or its `cameraMotion`. Sample the clip at `seconds` and write each node channel straight onto the `THREE.Object3D` that `resolve` returns for that node: translation, rotation and scale onto the object's local transform, `weights` onto the morph influences of every morphable mesh beneath it. A node with no object or a non-node channel is skipped. Light changes ride the shot's `lightMotions` through {@link applyLightMotion}; the artifact gate refuses pointer tracks on a transform clip.
 *
 * World-space clip values therefore require matching parent coordinates, or a host conversion before this writer; it does not invert parent matrices.
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
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Uses the engine's sampleClip interpolation and applies its admitted node vectors to Three local transforms or indexed morph influences; clips must satisfy engine widths/quaternion conventions and the target parent frame must match their coordinates. Absent channels retain host state rather than restoring a rest pose.
 * @evidence contracts/common.md#clear-and-simple-design This single-clip entry delegates to the same sampled-channel writer as the sequence entry, so transform and morph semantics have one owner; it does not allocate or own a scene.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resolves each authored node id through the supplied scene lookup and skips unresolved/non-node channels by contract; no fixture ids, substituted methods or numeric compensations select behavior.
 * @evidence contracts/common.md#meaningful-documentation Documents seconds, world-space clip intent, the four applied node paths, missing-node tolerance, unchanged absent channels and the shared writer's current exhaustiveness limitation.
 * @evidence contracts/performance.md#efficient-algorithms Sampling scans clip channels and their engine key lookup; writing is linear in sampled channels plus descendant meshes for each weights channel, with the engine sample table as request-local storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the shared writer while sampling independently for the supplied clip/time; mutable scene targets and partial-channel effects make result caching unsafe here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows clip and resolved scene objects, retains no handles after the call and transfers no resource ownership; only temporary sample data and morph traversal callbacks are created.
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
  applySampledObjectMotion(sampleClip(clip, seconds), resolve);
};
