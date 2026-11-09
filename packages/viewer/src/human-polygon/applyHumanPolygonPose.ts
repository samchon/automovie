import type * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";

/**
 * Apply one complete evaluated body-frame pose to the actual flat polygon
 * groups and their diagnostics. Each local probe is a registered rest point
 * minus its bone's rest joint; the actor parent transform composes once.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Builds an admitted bone placement map before any write, rejects missing/duplicate slots, malformed/nonfinite tuples and squared quaternion norm error above 1e-6, then copies each bind-relative body transform to both existing groups and refreshes ancestor/subtree matrices. Required identities come from the fixed rest descriptor, including custom bones; normalization and parent-FK recomposition are deliberately absent.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One adapter owns complete-pose admission and actual group writes; fixed shape generation, clinical evaluation and actor-root placement stay with their respective owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual authored bone ids and mesh frames, without humanoid casts, hidden scale or contact-proxy substitutions.
 * @evidence contracts/development/common.md#meaningful-documentation Gives atomic admission, numerical tolerance, flat-group frame, local probe convention and actor-root ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(B+G+A+O) work for B supplied/required bones, G bound groups, A ancestors and O subtree nodes; one O(B) temporary map avoids repeated placement scans and no geometry is rebuilt.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses actual groups, geometry and matrices; mutable pose records are revalidated rather than cached by identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Placement references live only in the call-local map; no GPU object, clock, task or retained cache is acquired.
 */
export function applyHumanPolygonPose(
  object: THREE.Group,
  bindings: ReadonlyMap<string, readonly THREE.Object3D[]>,
  required: readonly string[],
  output: Pick<AutoMovieHumanPolygon.IInput, "posed">,
): void {
  const placements: Map<string, AutoMovieHumanPolygon.IPlacement> = new Map();
  for (const placement of output.posed) {
    const p: AutoMovieHumanPolygon.IPlacement["position"] = placement.position;
    const q: AutoMovieHumanPolygon.IPlacement["rotation"] = placement.rotation;
    if (
      placements.has(placement.bone) ||
      p.length !== 3 ||
      q.length !== 4 ||
      !Number.isFinite(p[0]) ||
      !Number.isFinite(p[1]) ||
      !Number.isFinite(p[2]) ||
      !Number.isFinite(q[0]) ||
      !Number.isFinite(q[1]) ||
      !Number.isFinite(q[2]) ||
      !Number.isFinite(q[3]) ||
      Math.abs(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2 - 1) > 1e-6
    )
      throw new Error(
        `Invalid or duplicate polygon placement: ${placement.bone}`,
      );
    placements.set(placement.bone, placement);
  }
  for (const bone of required)
    if (!placements.has(bone))
      throw new Error(`Missing polygon placement: ${bone}`);

  for (const [bone, targets] of bindings) {
    const placement: AutoMovieHumanPolygon.IPlacement = placements.get(bone)!;
    for (const target of targets) {
      target.position.set(...placement.position);
      target.quaternion.set(...placement.rotation);
      target.updateMatrix();
    }
  }
  object.updateWorldMatrix(true, true);
}
