import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * Read the current TT tilt of an admitted unit humeral direction. The resolver supplies its shaped rest frame's local +Y direction; corrective sampling supplies the same readout, rather than copying a fixed neutral. Direction is in the builder's Y-up, Z-forward, +X-left metre frame. Its length is one, elevation is from hanging and axial rotation is zero: one axis direction alone cannot measure torsion. This is the resolver's existing geometric convention, not an anatomical frame or population estimate.
 *
 * @evidence contracts/common.md#principled-implementation Side-aware atan2 reads the humeral direction's elevation plane and clamped acos reads elevation from -Y, with axial rotation fixed to the unmeasured-direction convention zero.
 * @evidence contracts/common.md#clear-and-simple-design A single geometric conversion returns the selected humerus and three named TT angles for shaped-rest and corrective consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callers supply an admitted unit direction; clamping protects inverse-cosine roundoff rather than admitting arbitrary vectors, and one direction cannot establish torsion or clinical reach.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies metre-frame axes, unit-vector premise, elevation origin and why zero axial rotation is a geometric convention.
 * @evidence contracts/performance.md#efficient-algorithms Two trigonometric reads and fixed scalar arithmetic use constant work and one returned pose record regardless of source geometry size.
 * @evidence contracts/performance.md#reuse-equivalent-work Skeleton-rest and corrective sampling reuse this same conversion instead of copying fixed neutral angles; no cache assumes changing directions are equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned small angle record escapes, with no retained input vector, surface buffer, external handle or asynchronous task.
 */
export function humanBodyShoulderPoseFromDirection(input: {
  bone: "leftUpperArm" | "rightUpperArm";
  direction: IAutoMovieVector3;
}): IAutoMovieHumanBodyShoulderPose {
  const side: number = input.bone === "leftUpperArm" ? 1 : -1;
  return {
    bone: input.bone,
    plane:
      (Math.atan2(input.direction.z, side * input.direction.x) * 180) / Math.PI,
    elevation:
      (Math.acos(Math.max(-1, Math.min(1, -input.direction.y))) * 180) /
      Math.PI,
    axialRotation: 0,
  };
}
