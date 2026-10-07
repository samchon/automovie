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
 * shoulder goal and its A-pose rest, which is the basis's fixed A-pose unless
 * the caller passes `shoulderRest`, the shaped body's own rest per arm
 * (`resolveHumanBodyShapedShoulderRest`). An omitted goal then means that
 * rest for the kernels, the elevation drivers and the couplings alike, so
 * omitting a goal and writing the rest as an explicit goal select the same
 * deformation; a measurement path that has no shaped skeleton passes none. Old fixed-axis upper-arm
 * drivers cannot pass basis admission. A TT orientation kernel contributes
 * its clamped fall-off from its centre, divided by the sum of its family's
 * kernels where that sum exceeds one: a family is the kernels of one humerus
 * whose correctives' other inputs are identical, so the kernels solved at a
 * lattice of poses interpolate between their corrections instead of
 * stacking them, as pose space deformation interpolates the corrections
 * solved at example poses (Lewis et al. 2000); here the interpolation is the
 * normalized overlap of the kernels rather than a solve for radial-basis
 * weights. Shapes interpolate the same way: correctives read by the same
 * pose drivers and by channels were solved on different shapes in that pose,
 * so each set of channels and sides they read is an example whose factor is
 * the largest channel-ramp product among its correctives, and a body reaching
 * several examples of one pose at once has their factors divided by their
 * sum where it exceeds one: a mixed body wears a blend of its traits'
 * corrections instead of their sum, and a body on one example alone wears it
 * as solved.
 *
 * @evidence contracts/common.md#principled-implementation Channel weights are checked against their envelopes, then each corrective is the product form min(1, weight times the clamped ramps of all its drivers), so a corrective fires only where every driver is present, which a sum would not give. Shoulder kernels are clamped geodesic fall-offs in SO(3), normalised by the sum of their family where it exceeds one so kernels solved at neighbouring poses interpolate (the pose-space-deformation argument of Lewis et al. 2000, with normalised overlap in place of a radial-basis solve). The omitted shoulder goal is the shaped rest handed in by `shoulderRest`, else the basis's A-pose, and the kernels, elevation drivers and couplings read that one map, so the goal omitted and the goal written as the rest select one deformation. The premise is that no shaped rest sits inside a kernel support; admission guarantees it for the basis A-pose, and a measurement over 916 r16 shapes (channel extremes, macro corners and random mixes) found the nearest rest 29 degrees outside every support, but a different basis or shape space could break it and would then activate the kernel at rest.
 * @evidence contracts/common.md#clear-and-simple-design One function orders admission, coupling, kernels, ramps and the two normalisations; the per-basis corrective plan is memoised once because an admitted basis is immutable, and the shaped rest is one optional parameter owned by its own resolver rather than recomputed here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, fixture or measurement result is special-cased, and no foreign object is patched. The memoised plan is a WeakMap keyed by the immutable admitted basis. The optional rest map exists for an actual supported difference, a body whose arms hang off the A-pose, and a measurement path without a skeleton passes none.
 * @evidence contracts/common.md#meaningful-documentation States the product form, both ramp definitions, the kernel normalisation and its source, the shape-example blend, the meaning of an omitted goal under `shoulderRest`, and that the inputs are read and not mutated.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines and groups no part; it turns a document into channel weights and corrective activations.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive; the activations scale rows the evaluator applies later.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the body builder owns the posed form.
 */
export function humanBodyBasisWeights(
  basis: IAutoMovieHumanBodyBasis,
  document: Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose"> & {
    shoulders?: IAutoMovieHumanBodyShoulderPose[];
  },
  shoulderRest: ReadonlyMap<
    IAutoMovieHumanBodyShoulderPose["bone"],
    IAutoMovieHumanBodyShoulderPose
  > = new Map(),
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
    shoulderRest,
  ).joints;
  const angles = new Map(pose.map((joint) => [joint.bone, joint]));
  const shoulderAngles = new Map(
    (document.shoulders ?? []).map((shoulder) => [shoulder.bone, shoulder]),
  );
  const shoulderNeutral = new Map(
    basis.joints
      .filter((joint) => joint.shoulder !== undefined)
      .map((joint) => [
        joint.bone,
        shoulderRest.get(
          joint.bone as IAutoMovieHumanBodyShoulderPose["bone"],
        ) ?? joint.shoulder!.neutral,
      ]),
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
  type Input = NonNullable<
    IAutoMovieHumanBodyBasis["correctives"]
  >[number]["inputs"][number];
  /** One joint or channel driver's clamped ramp. */
  const ramp = (input: Exclude<Input, { shoulder: string }>): number => {
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
      return Math.min(
        1,
        Math.max(0, (travel - input.onset) / (input.full - input.onset)),
      );
    }
    const weight = weights.get(input.channel) ?? 0;
    const onset = input.onset ?? 0;
    return Math.min(
      1,
      Math.max(0, (sign * weight - onset) / ((input.full ?? 1) - onset)),
    );
  };
  const correctives = basis.correctives ?? [];
  // Shoulder kernels interpolate a pose space rather than add up in it: the
  // kernels of one family (one humerus, and every other input of their
  // corrective identical) are divided by their sum wherever it exceeds one,
  // so no pose wears more than one whole correction of a family, and a
  // kernel whose window reaches no other centre of its family is exactly
  // its own correction at its centre.
  const { families, examples: named } = correctivePlan(basis);
  const values = correctives.map((corrective) =>
    corrective.inputs.map((input) => ("shoulder" in input ? kernel(input) : 1)),
  );
  const sums = new Map<string, number>();
  families.forEach((keys, c) =>
    keys.forEach((key, at) => {
      if (key !== null) sums.set(key, (sums.get(key) ?? 0) + values[c][at]);
    }),
  );
  // Shapes interpolate the same way: a corrective read by a pose and by
  // channels was solved on one shape in that pose, so the correctives of one
  // pose (the same joint axes and sides, the same kernel centres) solved on
  // different shapes are examples of one correction across the shape space.
  // Each example is named by the channels and sides it reads; its factor is
  // the largest channel-ramp product among its correctives (a ramp midpoint
  // and its re-solves are one example), and where a body reaches several
  // examples at once their factors are divided by their sum when it exceeds
  // one, so a mixed body wears a blend of the corrections solved on its
  // traits rather than all of them added. A body on one example's channels
  // alone reads a sum of at most one and wears that example as solved.
  const shapes = named.map((one) =>
    one === null
      ? null
      : {
          pose: one.pose,
          example: one.example,
          factor: one.tissue.reduce((total, input) => total * ramp(input), 1),
        },
  );
  const examples = new Map<string, Map<string, number>>();
  for (const shape of shapes) {
    if (shape === null) continue;
    const found = examples.get(shape.pose) ?? new Map<string, number>();
    found.set(
      shape.example,
      Math.max(found.get(shape.example) ?? 0, shape.factor),
    );
    examples.set(shape.pose, found);
  }
  const shapeSums = new Map(
    [...examples].map(([pose, found]) => [
      pose,
      [...found.values()].reduce((sum, factor) => sum + factor, 0),
    ]),
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
        corrective.inputs.reduce(
          (total, input) => ("shoulder" in input ? total : total * ramp(input)),
          corrective.weight,
        ) /
          (shapes[c] === null
            ? 1
            : Math.max(1, shapeSums.get(shapes[c]!.pose)!)),
      ),
    ),
  }));
  return { weights, activations, pose };
}

type Corrective = NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number];
type CorrectiveInput = Corrective["inputs"][number];

/**
 * What the corrective table alone fixes: each shoulder kernel's family key
 * and each shape example's pose key, example key and channel drivers. None of
 * it reads a weight or a pose, and the keys cost a JSON encoding per
 * corrective, which the simple tier's inversions would otherwise pay on
 * every one of their hundred-odd trial bodies. An admitted basis is
 * immutable, so the plan is read once per basis and shared.
 */
function correctivePlan(basis: IAutoMovieHumanBodyBasis): {
  families: (string | null)[][];
  examples: ({
    pose: string;
    example: string;
    tissue: Extract<CorrectiveInput, { channel: string }>[];
  } | null)[];
} {
  const cached = plans.get(basis);
  if (cached !== undefined) return cached;
  const correctives = basis.correctives ?? [];
  const plan = {
    families: correctives.map((corrective) =>
      corrective.inputs.map((input, at) =>
        "shoulder" in input
          ? input.shoulder +
            "|" +
            JSON.stringify(corrective.inputs.filter((_, other) => other !== at))
          : null,
      ),
    ),
    examples: correctives.map((corrective) => {
      const posed = corrective.inputs.filter(
        (input): input is Exclude<CorrectiveInput, { channel: string }> =>
          !("channel" in input),
      );
      const tissue = corrective.inputs.filter(
        (input): input is Extract<CorrectiveInput, { channel: string }> =>
          "channel" in input,
      );
      if (posed.length === 0 || tissue.length === 0) return null;
      return {
        pose: posed
          .map((input) =>
            "shoulder" in input
              ? `${input.shoulder}|${JSON.stringify(input.orientation)}`
              : `${input.bone}.${input.axis}.${input.side}`,
          )
          .sort((a, b) => a.localeCompare(b))
          .join("+"),
        example: tissue
          .map((input) => `${input.channel}.${input.side}`)
          .sort((a, b) => a.localeCompare(b))
          .join("+"),
        tissue,
      };
    }),
  };
  plans.set(basis, plan);
  return plan;
}

const plans = new WeakMap<
  IAutoMovieHumanBodyBasis,
  ReturnType<typeof correctivePlan>
>();
