import { Quaternion, Vector3 } from "@automovie/engine";
import { humanBodyShoulderPoseFromDirection } from "@automovie/human/body/basis/humanBodyShoulderPoseFromDirection";
import { humanBodyShoulderTtRotation } from "@automovie/human/body/basis/humanBodyShoulderTtRotation";
import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";

import type { IBodyShoulderInterpolationInput } from "./IBodyShoulderInterpolationInput";

/**
 * Sample the shortest physical orientation path from a shaped rest to a TT goal.
 * Endpoints retain the exact authored angle triples, including pole gauges.
 * Intermediate TT coordinates describe the slerped orientation; they do not
 * linearly interpolate plane/Euler axes. Both endpoint poses are admitted by
 * the caller, which still judges intermediate range/geometry refusals.
 *
 * @evidence contracts/common.md#principled-implementation Shared TT rotation/readout and engine slerp preserve the whole physical orientation, not just elevation or a fixed neutral.
 * @evidence contracts/common.md#clear-and-simple-design One slerp, tilt readout and signed axial readout own the intermediate pose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint representations remain exact; no pose preset or photograph supplies a path.
 * @evidence contracts/common.md#meaningful-documentation States actual sampler authority, endpoint admission and intermediate range validation.
 */
export function interpolateBodyShoulderPose(
  input: IBodyShoulderInterpolationInput,
): IAutoMovieHumanBodyShoulderPose {
  if (
    !Number.isFinite(input.fraction) ||
    input.fraction < 0 ||
    input.fraction > 1
  )
    throw new Error("A shoulder sample fraction must be finite and in [0,1].");
  if (input.from.bone !== input.to.bone)
    throw new Error("A shoulder sample needs the same humerus at both ends.");
  if (input.fraction === 0) return { ...input.from };
  if (input.fraction === 1) return { ...input.to };
  const rotation = Quaternion.normalize(
    Quaternion.slerp(
      humanBodyShoulderTtRotation(input.from),
      humanBodyShoulderTtRotation(input.to),
      input.fraction,
    ),
  );
  const direction = Quaternion.rotateVector(rotation, Vector3.create(0, -1, 0));
  const tilt = humanBodyShoulderPoseFromDirection({
    bone: input.to.bone,
    direction,
  });
  const torsion = Quaternion.multiply(
    rotation,
    Quaternion.inverse(humanBodyShoulderTtRotation(tilt)),
  );
  const signed =
    (2 *
      Math.atan2(
        torsion.x * direction.x +
          torsion.y * direction.y +
          torsion.z * direction.z,
        torsion.w,
      ) *
      180) /
    Math.PI;
  const side = input.to.bone === "leftUpperArm" ? 1 : -1;
  const wrap = (degrees: number): number =>
    ((((degrees + 180) % 360) + 360) % 360) - 180;
  return {
    ...tilt,
    plane: wrap(tilt.plane),
    axialRotation: wrap(-side * signed),
  };
}
