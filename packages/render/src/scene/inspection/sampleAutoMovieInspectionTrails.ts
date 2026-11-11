import * as THREE from "three";

import type { IAutoMovieInspectionTrail } from "./IAutoMovieInspectionTrail.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";

/** Distance in metres within which every sample of a trail counts as one place: a micrometre, far below anything a picture shows. */
const STILL: number = 1e-6;

/**
 * Sample where every object a path pattern selects is, at each of a window's seconds, so a still can show the path it travels.
 *
 * The objects are the scene's objects of any kind, drawn or not, at the shallowest paths the pattern matches: a matched path whose parent path also matches is part of its parent's object. When several objects share a path, the first in scene order stands for it. For each second in `times`, `seek` places the subject and the world position of each object's origin is read, so any moving object is sampled, whatever its kind: a body's root or bone, a prop, a vehicle, a camera.
 *
 * Seconds are taken in ascending order. The scene is left as the last `seek` placed it, so the caller seeks the second it draws again. A trail whose every sample lies within a micrometre of its first is stationary.
 *
 * It throws when `times` is empty or holds a second that is not finite, and when the pattern matches no object.
 *
 * ```ts
 * const trails = sampleAutoMovieInspectionTrails({ scene, pattern: "hero/*Hand", times, seek: production.seek });
 * production.seek(seconds);
 * inspection.update([...production.marks?.(seconds) ?? [], ...markAutoMovieInspectionTrails(trails, seconds)]);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which objects are sampled and how shared paths resolve, what is read at each second, the order, the state the scene is left in, the stationary rule and its tolerance, and the refusals, and shows the sample, seek and draw order.
 * @evidence contracts/development/implementation.md#principled-implementation An object's travel is its origin's world position over time, read after three.js brings world matrices up to date, so the subject only seeks and the sampler needs to know nothing of what moves it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the objects once, then one seek and one read per second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is a stated micrometre, below any visible motion, not a value tuned to a case, and an empty match is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scene traversal to resolve paths, then per second one seek, one world-matrix pass and one read per object.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call samples the subject as it moves now.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; the scene and the seek are borrowed.
 */
export function sampleAutoMovieInspectionTrails(props: {
  /** The scene the subject is built into. */
  scene: THREE.Scene;

  /** Path pattern of the objects whose trails are sampled. */
  pattern: string;

  /** The film seconds to sample. */
  times: readonly number[];

  /** Place the subject at a film second. */
  seek: (seconds: number) => void;
}): IAutoMovieInspectionTrail[] {
  if (props.times.length === 0 || !props.times.every(Number.isFinite))
    throw new Error("Trail times must be one or more finite seconds");
  const times: number[] = [...props.times].sort(
    (a: number, b: number): number => a - b,
  );

  // The shallowest matched paths, each with its first object.
  const first: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();
  props.scene.traverse((object: THREE.Object3D): void => {
    const path: string = autoMovieInspectionPathOf(props.scene, object);
    if (!first.has(path)) first.set(path, object);
  });
  const objects: [string, THREE.Object3D][] = [...first].filter(
    ([path]: [string, THREE.Object3D]): boolean => {
      if (!matchAutoMovieInspectionPath(path, props.pattern)) return false;
      const names: string[] = path === "" ? [] : path.split("/");
      for (let depth: number = 0; depth < names.length; depth++)
        if (
          matchAutoMovieInspectionPath(
            names.slice(0, depth).join("/"),
            props.pattern,
          )
        )
          return false;
      return true;
    },
  );
  if (objects.length === 0)
    throw new Error(`Trail pattern "${props.pattern}" matches no object`);

  const positions: number[][] = objects.map((): number[] => []);
  const at: THREE.Vector3 = new THREE.Vector3();
  for (const seconds of times) {
    props.seek(seconds);
    props.scene.updateMatrixWorld(true);
    objects.forEach(([, object]: [string, THREE.Object3D], i: number): void => {
      object.getWorldPosition(at);
      positions[i]!.push(at.x, at.y, at.z);
    });
  }
  return objects.map(
    ([path]: [string, THREE.Object3D], i: number): IAutoMovieInspectionTrail => {
      const samples: number[] = positions[i]!;
      let stationary: boolean = true;
      for (let k: number = 3; k < samples.length && stationary; k += 3)
        stationary =
          Math.hypot(
            samples[k]! - samples[0]!,
            samples[k + 1]! - samples[1]!,
            samples[k + 2]! - samples[2]!,
          ) <= STILL;
      return { path, times: [...times], positions: samples, stationary };
    },
  );
}
