import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";
import { humanBodyShoulderOrientationDistance } from "../../humanBodyShoulderOrientationDistance";
import { humanBodyShoulderReaches } from "../../humanBodyShoulderReaches";

/**
 * Admit pose-corrective joint and shoulder drivers after their rig joints.
 *
 * A ramp can fire only on an axis and angle within clinical reach. TT
 * shoulder kernels use SO(3) angular distance and have zero rest
 * activation; equivalent kernel centres may not multiply twice. This
 * validates the declared activation domain, not whether the authored
 * rest-space displacement preserves tissue volume or avoids contact.
 * The joint map is returned for the subsequent coupling stage.
 */
export function assertHumanBodyRigCorrectives(
  basis: IAutoMovieHumanBodyBasis,
): Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBasis["joints"][number]> {
  // A joint driver names a mobile axis and a ramp that lies within the
  // clinical reach on its side of the rest, so a corrective cannot be armed
  // by an angle the pose validator would refuse or by an axis that never moves.
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  for (const corrective of basis.correctives ?? [])
    for (const input of corrective.inputs) {
      if ("shoulder" in input) {
        const shoulder = joints.get(input.shoulder)?.shoulder;
        const goal = { bone: input.shoulder, ...input.orientation };
        const rest =
          shoulder === undefined
            ? null
            : { bone: input.shoulder, ...shoulder.neutral };
        if (
          shoulder === undefined ||
          goal.plane < -180 ||
          goal.plane >= 180 ||
          !humanBodyShoulderReaches(shoulder, goal) ||
          !Number.isFinite(input.innerDegrees) ||
          !Number.isFinite(input.outerDegrees) ||
          input.innerDegrees < 0 ||
          input.innerDegrees >= input.outerDegrees ||
          input.outerDegrees > 180 ||
          (rest !== null &&
            humanBodyShoulderOrientationDistance(rest, goal) <
              input.outerDegrees)
        )
          throw new Error(
            "A body shoulder corrective needs an admitted TT centre, finite nested geodesic radii and zero rest activation: " +
              corrective.id,
          );
        continue;
      }
      if (!("bone" in input)) continue;
      const joint = joints.get(input.bone);
      const range =
        input.axis === "elevation"
          ? (joint?.shoulder?.range[input.axis] ?? null)
          : (joint?.constraint?.[input.axis] ?? null);
      const neutral =
        input.axis === "elevation"
          ? (joint?.shoulder?.neutral[input.axis] ?? 0)
          : (joint?.neutral[input.axis] ?? 0);
      const reach =
        joint === undefined || range === null
          ? null
          : input.side === "positive"
            ? range.max - neutral
            : neutral - range.min;
      if (
        reach === null ||
        !Number.isFinite(input.onset) ||
        !Number.isFinite(input.full) ||
        input.onset < 0 ||
        input.full <= input.onset ||
        input.full > reach + 1e-9
      )
        throw new Error(
          "A body joint driver needs a mobile axis and a ramp inside its clinical reach: " +
            corrective.id +
            " " +
            input.bone +
            "." +
            input.axis +
            ` onset ${input.onset} full ${input.full} reach ${reach}`,
        );
    }
  for (const corrective of basis.correctives ?? []) {
    const kernels = corrective.inputs.filter(
      (input): input is Extract<typeof input, { shoulder: string }> =>
        "shoulder" in input,
    );
    for (let first = 0; first < kernels.length; first++)
      for (let second = first + 1; second < kernels.length; second++) {
        const a = kernels[first];
        const b = kernels[second];
        if (
          a.shoulder === b.shoulder &&
          humanBodyShoulderOrientationDistance(
            { bone: a.shoulder, ...a.orientation },
            { bone: b.shoulder, ...b.orientation },
          ) === 0
        )
          throw new Error(
            "A body corrective cannot multiply equivalent shoulder orientation kernels: " +
              corrective.id,
          );
      }
  }
  return joints;
}
