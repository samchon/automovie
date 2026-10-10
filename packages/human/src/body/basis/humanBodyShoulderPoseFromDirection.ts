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
