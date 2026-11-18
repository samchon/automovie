import { samplePracticalSurfaceTrackMaterial } from "@automovie/engine";
import type { IAutoMovieShot } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * Apply an admitted shot's practical surface cues to built prop instances.
 *
 * Before drawing a frame of the shot, call this with its shot-local seconds in
 * [0, duration). Resolve scene node ids to the distinct model objects mounted
 * for those placements, for example by keeping the results supplied to
 * buildScene. Resolve each model-scoped material id to a prepared, geometry-
 * compatible material for that node and part. The host can use buildMaterial
 * with its existing texture resolver and retains ownership of those materials
 * and textures. An initial key can select the part's original material by
 * supplying that same reference.
 *
 * This updates only tracked parts. When reusing a mounted scene across shots,
 * restore its staged materials or author opening tracks for parts whose prior
 * shot changed their material.
 *
 * @throws {RangeError} The tracked shot sample is outside its local interval.
 * @throws {Error} A target has no distinct single-material mesh, or its selected variant is unavailable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame clock, caller's mounting and resolution roles, failure conditions, original material path and reused-scene reset requirement.
 * @evidence contracts/development/implementation.md#principled-implementation Samples each track independently, resolves the exact built node-part mesh and material, then swaps pointers only after complete frame preflight.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Engine owns the discrete key rule. Render resolves and validates target and variant references before applying the resulting assignments.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No lookup by display name, mesh traversal, material mutation, shared model rewrite or previous-frame dependency. Missing and aliased targets fail before any assignments.
 * @evidence contracts/development/implementation.md#efficient-algorithms One target lookup, logarithmic key selection and one variant resolution per track, with one temporary assignment per target. Untracked shots return immediately.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All frames use the caller's prepared references. Reapplying a selected material requires no conversion or copy.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No geometry, material or texture is allocated or disposed. Assignments borrow already-owned materials for live mesh slots and no auxiliary state persists.
 */
export function applyPracticalSurfaceMaterials(
  shot: IAutoMovieShot,
  seconds: number,
  resolveNode: (node: string) => IAutoMovieModelObject | undefined,
  resolveMaterial: (
    node: string,
    part: string,
    material: string,
  ) => THREE.Material | undefined,
): void {
  if (!shot.practicalSurfaces?.length) return;
  if (!Number.isFinite(seconds) || seconds < 0 || seconds >= shot.duration)
    throw new RangeError("Practical surface sample must be inside the shot");

  const assignments: Map<THREE.Mesh, THREE.Material> = new Map();
  for (const track of shot.practicalSurfaces) {
    const target: THREE.Object3D | undefined = resolveNode(
      track.node,
    )?.parts.get(track.part);
    if (
      !(target instanceof THREE.Mesh) ||
      Array.isArray(target.material) ||
      assignments.has(target)
    )
      throw new Error(
        `Practical surface "${track.node}" part "${track.part}" has no distinct single-material mesh`,
      );

    const selected: string = samplePracticalSurfaceTrackMaterial(
      track,
      seconds,
    );
    const material: THREE.Material | undefined = resolveMaterial(
      track.node,
      track.part,
      selected,
    );
    if (material === undefined)
      throw new Error(
        `Practical surface "${track.node}" part "${track.part}" has no prepared material "${selected}"`,
      );
    assignments.set(target, material);
  }

  for (const [target, material] of assignments) target.material = material;
}
