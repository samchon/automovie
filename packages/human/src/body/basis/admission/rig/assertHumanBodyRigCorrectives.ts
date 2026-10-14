import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";
import { humanBodyShoulderOrientationDistance } from "../../humanBodyShoulderOrientationDistance";
import { humanBodyShoulderReaches } from "../../humanBodyShoulderReaches";

/**
 * Admit pose-corrective joint and shoulder drivers after their rig joints.
 *
 * Joint ramp endpoints must fit a named mobile axis's declared neutral-relative reach, with the existing 1e-9-degree allowance on the full endpoint. TT shoulder kernels use SO(3) angular distance and exclude the declared fixed rest from their support; this does not establish zero activation at every shaped shoulder rest. Equivalent kernel centres may not multiply twice. This admits driver metadata, not document pose angles or whether the authored rest-space displacement preserves tissue volume or avoids contact. The joint map is returned for the subsequent coupling stage.
 *
 * @evidence contracts/common.md#principled-implementation Joint ramp endpoints fit declared neutral-relative mobile-axis reach with the existing 1e-9-degree full-endpoint allowance; TT kernels use admitted SO(3) centers, nested radii and zero activation at declared fixed rest. Centers whose quaternion dot deficit is below the distance helper's 1e-12 numerical-zero window are rejected, including some nearby distinct rotations rather than only exact equivalents.
 * @evidence contracts/common.md#clear-and-simple-design One corrective stage borrows admitted joint data and returns its joint map for later coupling checks while displacement physiology stays outside activation admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rotation-kernel coincidence cannot multiply a corrective twice; metadata admission neither admits document angles nor proves zero activation at shaped rest, tissue volume preservation or contact avoidance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives declared ramp bounds and numerical allowance, fixed-versus-shaped rest and separation from document pose and authored displacement validity.
 * @evidence contracts/performance.md#efficient-algorithms The J-joint map and D driver scans cost O(J+D); pairwise shoulder-kernel comparisons cost O(K²) per corrective and are needed to reject all equivalent centers.
 * @evidence contracts/performance.md#reuse-equivalent-work One joint map serves every corrective and the returned map feeds coupling admission without rebuilding joints.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Kernel arrays and local goals expire after checks; only the J-entry joint map escapes and owns references, without mutating joints or retaining tasks.
 */
export function assertHumanBodyRigCorrectives(
  basis: IAutoMovieHumanBodyBasis,
): Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBasis["joints"][number]> {
  // Driver metadata names a mobile axis and a neutral-relative ramp, with the
  // existing nanodegree allowance on its full endpoint. Actual document pose
  // admission remains downstream and is not performed by this guard.
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBasis["joints"][number]> = new Map(basis.joints.map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [AutoMovieHumanoidBone, IAutoMovieHumanBodyBasis["joints"][number]] => [joint.bone, joint]));
  for (const corrective of basis.correctives ?? [])
    for (const input of corrective.inputs) {
      if ("shoulder" in input) {
        const shoulder: IAutoMovieHumanBodyBasis["joints"][number]["shoulder"] = joints.get(input.shoulder)?.shoulder;
        const goal: Parameters<typeof humanBodyShoulderOrientationDistance>[1] = { bone: input.shoulder, ...input.orientation };
        const rest: Parameters<typeof humanBodyShoulderOrientationDistance>[0] | null =
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
      const joint: IAutoMovieHumanBodyBasis["joints"][number] | undefined = joints.get(input.bone);
      const range: { min: number; max: number } | null =
        input.axis === "elevation"
          ? (joint?.shoulder?.range[input.axis] ?? null)
          : (joint?.constraint?.[input.axis] ?? null);
      const neutral: number =
        input.axis === "elevation"
          ? (joint?.shoulder?.neutral[input.axis] ?? 0)
          : (joint?.neutral[input.axis] ?? 0);
      const reach: number | null =
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
    const kernels: Extract<NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number]["inputs"][number], { shoulder: string }>[] = corrective.inputs.filter(
      (input: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number]["inputs"][number]): input is Extract<typeof input, { shoulder: string }> =>
        "shoulder" in input,
    );
    for (let first: number = 0; first < kernels.length; first++)
      for (let second: number = first + 1; second < kernels.length; second++) {
        const a: typeof kernels[number] = kernels[first];
        const b: typeof kernels[number] = kernels[second];
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
