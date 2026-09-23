import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
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
 * later by the builder, so this reads angles without judging them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Refuses unsupported channels and out-of-envelope weights instead of clamping them.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Computes the `|weight| x endpoint` selection and the product corrective activation the evaluation order applies.
 */
export function humanBodyBasisWeights(
  basis: IAutoMovieHumanBodyBasis,
  document: Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose">,
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
  const pose = resolveHumanBodyCouplings(basis, document.pose ?? []).joints;
  const angles = new Map(pose.map((joint) => [joint.bone, joint]));
  const activations = (basis.correctives ?? []).map((corrective) => ({
    target: corrective.target,
    activation: Math.min(
      1,
      corrective.inputs.reduce((total, input) => {
        const sign = input.side === "negative" ? -1 : 1;
        if ("bone" in input) {
          const angle = angles.get(input.bone)?.[input.axis] ?? null;
          const rest = neutral.get(input.bone)?.[input.axis] ?? 0;
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
      }, corrective.weight),
    ),
  }));
  return { weights, activations, pose };
}
