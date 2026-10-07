import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * Read the current TT tilt of an admitted unit humeral direction.
 * The resolver supplies its shaped rest frame's local +Y direction; corrective
 * sampling supplies the same readout, rather than copying a fixed neutral.
 * Direction is in the builder's Y-up, Z-forward, +X-left metre frame. Its
 * length is one, elevation is from hanging and axial rotation is zero: one
 * axis direction alone cannot measure torsion. This is the resolver's existing
 * geometric convention, not an anatomical frame or population estimate.
 *
 * @evidence contracts/common.md#principled-implementation One direction readout owns the current rest tilt used by both resolver and corrective sampler without introducing a fixed shape-independent A-pose.
 * @evidence contracts/common.md#clear-and-simple-design Side-aware atan2 and the existing clamped acos read tilt; the result is a fresh record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No trait, pose preset or measured-looking default bypasses the supplied shaped frame.
 * @evidence contracts/common.md#meaningful-documentation States the actual consumers, unit-direction precondition, shared axes, degrees and unmeasured torsion.
 * @evidence contracts/modeling.md#spatial-conventions Input is the admitted rest unit direction in the body frame; output tilt is degrees and zero torsion retains the prior rest convention.
 */
export function humanBodyShoulderPoseFromDirection(input: {
  bone: "leftUpperArm" | "rightUpperArm";
  direction: IAutoMovieVector3;
}): IAutoMovieHumanBodyShoulderPose {
  const side = input.bone === "leftUpperArm" ? 1 : -1;
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
