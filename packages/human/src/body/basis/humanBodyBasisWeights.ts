import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderOrientationDistance } from "./humanBodyShoulderOrientationDistance";
import { resolveHumanBodyCouplings } from "./resolveHumanBodyCouplings";

/**
 * The control state one document asks of one admitted basis.
 *
 * This is the boundary between a document and the geometry: channel weights
 * checked against their envelopes, the document's pose with the basis's
 * declared couplings added (`resolveHumanBodyCouplings`), corrective
 * activations computed from those weights and that coupled pose. It reads both
 * inputs and mutates neither; the builder applies the result, posing the
 * returned `pose` rather than the document's, and the measuring code uses the
 * same function so a channel measured at +1 is exactly the channel the builder
 * would evaluate at +1. The measurement path passes no pose, which leaves
 * every coupling at its zero and every joint ramp off.
 *
 * The activation is the product form of `createHumanFaceBasisBuilder`:
 * `min(1, weight * product of clamped driver sides)`, zero unless every driver
 * is present. A channel driver contributes the ramp
 * `clamp((side * weight - onset) / (full - onset), 0, 1)`, which with its
 * defaults `onset = 0`, `full = 1` is the face builder's clamped side. A sum here would fire a corrective on one driver alone, which is
 * the pose it was authored to leave untouched. A joint driver contributes the
 * ramp `clamp((side * (clinical - neutral) - onset) / (full - onset), 0, 1)`
 * read from the coupled clinical pose, an absent or `null` angle standing
 * for the rest, so a girdle corrective fires on the elevation a coupling
 * added exactly as on one the document wrote; the pose itself is validated
 * later by the builder, so this reads angles without judging them. Upper-arm
 * drivers read TT total elevation or axial rotation from the separate
 * shoulder goal and its measured A-pose rest. Old fixed-axis upper-arm
 * drivers cannot pass basis admission. A TT orientation kernel contributes
 * its clamped fall-off from its centre, divided by the sum of its family's
 * kernels where that sum exceeds one: a family is the kernels of one humerus
 * whose correctives' other inputs are identical, so the kernels solved at a
 * lattice of poses interpolate between their corrections (pose space
 * deformation, Lewis et al. 2000) instead of stacking them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Refuses unsupported channels and out-of-envelope weights instead of clamping them.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Computes the `|weight| x endpoint` selection and the product corrective activation the evaluation order applies.
 */
export function humanBodyBasisWeights(
  basis: IAutoMovieHumanBodyBasis,
  document: Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose"> & {
    shoulders?: IAutoMovieHumanBodyShoulderPose[];
  },
): {
  weights: Map<string, number>;
  activations: { target: string; activation: number }[];

  /** The document's pose with the declared couplings added; what the builder poses. */
  pose: IAutoMovieJointPose[];
} {
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  const weights = new Map<string, number>();
  for (const [name, weight] of Object.entries(document.shape)) {
    const channel = channels.get(name);
    if (
      channel === undefined ||
      !Number.isFinite(weight) ||
      weight < channel.minimum ||
      weight > channel.maximum
    )
      throw new Error("Unsupported or out-of-domain body control: " + name);
    weights.set(name, weight);
  }
  const neutral = new Map(
    basis.joints.map((joint) => [joint.bone, joint.neutral]),
  );
  const pose = resolveHumanBodyCouplings(
    basis,
    document.pose ?? [],
    document.shoulders ?? [],
  ).joints;
  const angles = new Map(pose.map((joint) => [joint.bone, joint]));
  const shoulderAngles = new Map(
    (document.shoulders ?? []).map((shoulder) => [shoulder.bone, shoulder]),
  );
  const shoulderNeutral = new Map(
    basis.joints
      .filter((joint) => joint.shoulder !== undefined)
      .map((joint) => [joint.bone, joint.shoulder!.neutral]),
  );
  /** One shoulder kernel's value: the clamped fall-off from its centre. */
  const kernel = (
    input: Extract<
      NonNullable<
        IAutoMovieHumanBodyBasis["correctives"]
      >[number]["inputs"][number],
      { shoulder: string }
    >,
  ): number => {
    const rest = shoulderNeutral.get(input.shoulder)!;
    const posed = shoulderAngles.get(input.shoulder) ?? {
      bone: input.shoulder,
      ...rest,
    };
    const distance = humanBodyShoulderOrientationDistance(posed, {
      bone: input.shoulder,
      ...input.orientation,
    });
    return Math.min(
      1,
      Math.max(
        0,
        (input.outerDegrees - distance) /
          (input.outerDegrees - input.innerDegrees),
      ),
    );
  };
  /** The product of one corrective's ramps other than its shoulder kernels. */
  const ramps = (
    corrective: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number],
  ): number =>
    corrective.inputs.reduce((total, input) => {
      if ("shoulder" in input) return total;
      const sign = input.side === "negative" ? -1 : 1;
      if ("bone" in input) {
        const shoulderAxis = input.axis === "elevation";
        const angle = shoulderAxis
          ? (shoulderAngles.get(input.bone as "leftUpperArm" | "rightUpperArm")
              ?.elevation ?? null)
          : (angles.get(input.bone)?.[
              input.axis as "flexion" | "abduction" | "twist"
            ] ?? null);
        const rest = shoulderAxis
          ? (shoulderNeutral.get(input.bone)?.elevation ?? 0)
          : (neutral.get(input.bone)?.[
              input.axis as "flexion" | "abduction" | "twist"
            ] ?? 0);
        const travel = sign * ((angle ?? rest) - rest);
        return (
          total *
          Math.min(
            1,
            Math.max(0, (travel - input.onset) / (input.full - input.onset)),
          )
        );
      }
      const weight = weights.get(input.channel) ?? 0;
      const onset = input.onset ?? 0;
      return (
        total *
        Math.min(
          1,
          Math.max(0, (sign * weight - onset) / ((input.full ?? 1) - onset)),
        )
      );
    }, corrective.weight);
  // Shoulder kernels interpolate a pose space rather than add up in it: the
  // kernels of one family (one humerus, and every other input of their
  // corrective identical) are divided by their sum wherever it exceeds one,
  // so no pose wears more than one whole correction of a family, and a
  // kernel whose window reaches no other centre of its family is exactly
  // its own correction at its centre.
  const correctives = basis.correctives ?? [];
  const families = correctives.map((corrective) =>
    corrective.inputs.map((input, at) =>
      "shoulder" in input
        ? input.shoulder +
          "|" +
          JSON.stringify(corrective.inputs.filter((_, other) => other !== at))
        : null,
    ),
  );
  const values = correctives.map((corrective) =>
    corrective.inputs.map((input) => ("shoulder" in input ? kernel(input) : 1)),
  );
  const sums = new Map<string, number>();
  families.forEach((keys, c) =>
    keys.forEach((key, at) => {
      if (key !== null) sums.set(key, (sums.get(key) ?? 0) + values[c][at]);
    }),
  );
  const activations = correctives.map((corrective, c) => ({
    target: corrective.target,
    activation: Math.min(
      1,
      families[c].reduce(
        (total, key, at) =>
          key === null
            ? total
            : total * (values[c][at] / Math.max(1, sums.get(key)!)),
        ramps(corrective),
      ),
    ),
  }));
  return { weights, activations, pose };
}
