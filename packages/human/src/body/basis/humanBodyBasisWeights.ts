import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderOrientationDistance } from "./humanBodyShoulderOrientationDistance";
import { resolveHumanBodyCouplings } from "./resolveHumanBodyCouplings";

/**
 * The control state one document asks of one admitted basis.
 *
 * This is the boundary between a document and the geometry: channel weights checked against their envelopes, the document's pose with the basis's declared couplings added (`resolveHumanBodyCouplings`), corrective activations computed from those weights and that coupled pose. It reads both inputs and mutates neither; the builder applies the result, posing the returned `pose` rather than the document's, and the measuring code uses the same function so a channel measured at +1 is exactly the channel the builder would evaluate at +1. The measurement path passes no pose, which leaves every coupling at its zero and every joint ramp off.
 *
 * The activation is the product form of `createHumanFaceBasisBuilder`: `min(1, weight * product of clamped driver sides)`, zero unless every driver is present. A channel driver contributes the ramp `clamp((side * weight - onset) / (full - onset), 0, 1)`, which with its defaults `onset = 0`, `full = 1` is the face builder's clamped side. A sum here would fire a corrective on one driver alone, which is the pose it was authored to leave untouched. A joint driver contributes the ramp `clamp((side * (clinical - neutral) - onset) / (full - onset), 0, 1)` read from the coupled clinical pose, an absent or `null` angle standing for the rest, so a girdle corrective fires on the elevation a coupling added exactly as on one the document wrote; the pose itself is validated later by the builder, so this reads angles without judging them. A scalar upper-arm driver reads TT total elevation from the separate shoulder goal; an orientation kernel reads the complete plane/elevation/axial-rotation goal. Their rest is the basis's fixed A-pose unless the caller passes `shoulderRest`, the shaped body's own rest per arm (`resolveHumanBodyShapedShoulderRest`). An omitted goal then means that rest for the kernels, the elevation drivers and the couplings alike, so omitting a goal and writing the rest as an explicit goal select the same deformation; a measurement path that has no shaped skeleton passes none. Old fixed-axis upper-arm drivers cannot pass basis admission. A TT orientation kernel contributes its clamped fall-off from its centre, divided by the sum of its family's kernels where that sum exceeds one: a family is the kernels of one humerus whose correctives' other inputs are identical, so the kernels solved at a lattice of poses interpolate between their corrections instead of stacking them, as pose space deformation interpolates the corrections solved at example poses (Lewis et al. 2000, doi:10.1145/344779.344862); here the interpolation is the normalized overlap of the kernels rather than a solve for radial-basis weights. Shapes interpolate the same way: correctives read by the same pose drivers and by channels were solved on different shapes in that pose, so each set of channels and sides they read is an example whose factor is the largest channel-ramp product among its correctives, and a body reaching several examples of one pose at once has their factors divided by their sum where it exceeds one: a mixed body wears a blend of its traits' corrections instead of their sum, and a body on one example alone wears it as solved.
 *
 * @evidence contracts/common.md#principled-implementation Named channel admission and shared clinical couplings feed multiplicative channel/joint ramps and TT rotation kernels; kernel families and shape examples normalize overlap above one rather than stacking full corrections.
 * @evidence contracts/common.md#clear-and-simple-design One control-state boundary returns admitted weights, coupled pose and sparse corrective activations, with an immutable basis plan separating table identity from per-document factors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown/nonfinite/out-of-envelope shape controls refuse; absent pose angles mean source rest, and numerical corrective blending does not admit a clinical pose or certify that authored geometry is physiological.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies driver ramps, shaped shoulder rest, multiplicative activation, kernel-family and shape-example normalization, same measurement/build ownership and later pose admission.
 * @evidence contracts/performance.md#efficient-algorithms Per-document maps and driver/family/example passes scale with actual channels, joints, pose rows and corrective inputs, plus coupling-owner lookup cost; fixed plan preparation performs input-filter/JSON work once per basis identity.
 * @evidence contracts/performance.md#reuse-equivalent-work A weak immutable-basis plan shares family/example keys among builder and repeated measurement evaluations, while same-document factors and sums are computed once and reused across corrective activations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak basis keys release unused plans; returned weights/pose/activations belong to the caller and factor/maps expire after the call, with no source geometry, external handles or background tasks owned here.
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
  const channels: Map<string, IAutoMovieHumanBodyBasis["channels"][number]> = new Map(
    basis.channels.map((channel: IAutoMovieHumanBodyBasis["channels"][number]): [string, IAutoMovieHumanBodyBasis["channels"][number]] => [channel.id, channel]),
  );
  const weights: Map<string, number> = new Map<string, number>();
  for (const [name, weight] of Object.entries(document.shape)) {
    const channel: IAutoMovieHumanBodyBasis["channels"][number] | undefined = channels.get(name);
    if (
      channel === undefined ||
      !Number.isFinite(weight) ||
      weight < channel.minimum ||
      weight > channel.maximum
    )
      throw new Error("Unsupported or out-of-domain body control: " + name);
    weights.set(name, weight);
  }
  const neutral: Map<IAutoMovieJointPose["bone"], IAutoMovieHumanBodyBasis["joints"][number]["neutral"]> = new Map(
    basis.joints.map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [IAutoMovieJointPose["bone"], IAutoMovieHumanBodyBasis["joints"][number]["neutral"]] => [joint.bone, joint.neutral]),
  );
  const pose: IAutoMovieJointPose[] = resolveHumanBodyCouplings(
    basis,
    document.pose ?? [],
    document.shoulders ?? [],
    shoulderRest,
  ).joints;
  const angles: Map<IAutoMovieJointPose["bone"], IAutoMovieJointPose> = new Map(pose.map((joint: IAutoMovieJointPose): [IAutoMovieJointPose["bone"], IAutoMovieJointPose] => [joint.bone, joint]));
  const shoulderAngles: Map<IAutoMovieHumanBodyShoulderPose["bone"], IAutoMovieHumanBodyShoulderPose> = new Map(
    (document.shoulders ?? []).map((shoulder: IAutoMovieHumanBodyShoulderPose): [IAutoMovieHumanBodyShoulderPose["bone"], IAutoMovieHumanBodyShoulderPose] => [shoulder.bone, shoulder]),
  );
  const shoulderNeutral: Map<IAutoMovieJointPose["bone"], NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]>["neutral"]> = new Map(
    basis.joints
      .filter((joint: IAutoMovieHumanBodyBasis["joints"][number]): boolean => joint.shoulder !== undefined)
      .map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [IAutoMovieJointPose["bone"], NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]>["neutral"]] => [
        joint.bone,
        shoulderRest.get(
          joint.bone as IAutoMovieHumanBodyShoulderPose["bone"],
        ) ?? joint.shoulder!.neutral,
      ]),
  );
  /** One shoulder kernel's value: the clamped fall-off from its centre. */
  const kernel: (input: Extract<CorrectiveInput, { shoulder: string }>) => number = (
    input: Extract<
      NonNullable<
        IAutoMovieHumanBodyBasis["correctives"]
      >[number]["inputs"][number],
      { shoulder: string }
    >,
  ): number => {
    const rest: NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]>["neutral"] = shoulderNeutral.get(input.shoulder)!;
    const posed: IAutoMovieHumanBodyShoulderPose = shoulderAngles.get(input.shoulder) ?? {
      bone: input.shoulder,
      ...rest,
    };
    const distance: number = humanBodyShoulderOrientationDistance(posed, {
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
  const ramp: (input: Exclude<Input, { shoulder: string }>) => number = (input: Exclude<Input, { shoulder: string }>): number => {
    const sign: number = input.side === "negative" ? -1 : 1;
    if ("bone" in input) {
      const shoulderAxis: boolean = input.axis === "elevation";
      const angle: number | null = shoulderAxis
        ? (shoulderAngles.get(input.bone as "leftUpperArm" | "rightUpperArm")
            ?.elevation ?? null)
        : (angles.get(input.bone)?.[
            input.axis as "flexion" | "abduction" | "twist"
          ] ?? null);
      const rest: number = shoulderAxis
        ? (shoulderNeutral.get(input.bone)?.elevation ?? 0)
        : (neutral.get(input.bone)?.[
            input.axis as "flexion" | "abduction" | "twist"
          ] ?? 0);
      const travel: number = sign * ((angle ?? rest) - rest);
      return Math.min(
        1,
        Math.max(0, (travel - input.onset) / (input.full - input.onset)),
      );
    }
    const weight: number = weights.get(input.channel) ?? 0;
    const onset: number = input.onset ?? 0;
    return Math.min(
      1,
      Math.max(0, (sign * weight - onset) / ((input.full ?? 1) - onset)),
    );
  };
  const correctives: Corrective[] = basis.correctives ?? [];
  // Shoulder kernels interpolate a pose space rather than add up in it: the
  // kernels of one family (one humerus, and every other input of their
  // corrective identical) are divided by their sum wherever it exceeds one,
  // so no pose wears more than one whole correction of a family, and a
  // kernel whose window reaches no other centre of its family is exactly
  // its own correction at its centre.
  const { families, examples: named }: ReturnType<typeof correctivePlan> = correctivePlan(basis);
  const values: number[][] = correctives.map((corrective: Corrective): number[] =>
    corrective.inputs.map((input: CorrectiveInput): number => ("shoulder" in input ? kernel(input) : 1)),
  );
  const sums: Map<string, number> = new Map<string, number>();
  families.forEach((keys: (string | null)[], c: number): void =>
    keys.forEach((key: string | null, at: number): void => {
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
  const shapes: ({ pose: string; example: string; factor: number } | null)[] = named.map((one: ReturnType<typeof correctivePlan>["examples"][number]): typeof shapes[number] =>
    one === null
      ? null
      : {
          pose: one.pose,
          example: one.example,
          factor: one.tissue.reduce((total: number, input: Extract<CorrectiveInput, { channel: string }>): number => total * ramp(input), 1),
        },
  );
  const examples: Map<string, Map<string, number>> = new Map<string, Map<string, number>>();
  for (const shape of shapes) {
    if (shape === null) continue;
    const found: Map<string, number> = examples.get(shape.pose) ?? new Map<string, number>();
    found.set(
      shape.example,
      Math.max(found.get(shape.example) ?? 0, shape.factor),
    );
    examples.set(shape.pose, found);
  }
  const shapeSums: Map<string, number> = new Map(
    [...examples].map(([pose, found]: [string, Map<string, number>]): [string, number] => [
      pose,
      [...found.values()].reduce((sum: number, factor: number): number => sum + factor, 0),
    ]),
  );
  const activations: { target: string; activation: number }[] = correctives.map((corrective: Corrective, c: number): { target: string; activation: number } => ({
    target: corrective.target,
    activation: Math.min(
      1,
      families[c].reduce(
        (total: number, key: string | null, at: number): number =>
          key === null
            ? total
            : total * (values[c][at] / Math.max(1, sums.get(key)!)),
        corrective.inputs.reduce(
          (total: number, input: CorrectiveInput): number => ("shoulder" in input ? total : total * ramp(input)),
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
 * What the corrective table alone fixes: each shoulder kernel's family key and each shape example's pose key, example key and channel drivers. None of it reads a weight or a pose, and the keys cost a JSON encoding per corrective, which the simple tier's inversions would otherwise pay on every one of their hundred-odd trial bodies. An admitted basis is immutable, so the plan is read once per basis and shared.
 */
function correctivePlan(basis: IAutoMovieHumanBodyBasis): {
  families: (string | null)[][];
  examples: ({
    pose: string;
    example: string;
    tissue: Extract<CorrectiveInput, { channel: string }>[];
  } | null)[];
} {
  const cached: ReturnType<typeof correctivePlan> | undefined = plans.get(basis);
  if (cached !== undefined) return cached;
  const correctives: Corrective[] = basis.correctives ?? [];
  const plan: ReturnType<typeof correctivePlan> = {
    families: correctives.map((corrective: Corrective): (string | null)[] =>
      corrective.inputs.map((input: CorrectiveInput, at: number): string | null =>
        "shoulder" in input
          ? input.shoulder +
            "|" +
            JSON.stringify(corrective.inputs.filter((_: CorrectiveInput, other: number): boolean => other !== at))
          : null,
      ),
    ),
    examples: correctives.map((corrective: Corrective): ReturnType<typeof correctivePlan>["examples"][number] => {
      const posed: Exclude<CorrectiveInput, { channel: string }>[] = corrective.inputs.filter(
        (input: CorrectiveInput): input is Exclude<CorrectiveInput, { channel: string }> =>
          !("channel" in input),
      );
      const tissue: Extract<CorrectiveInput, { channel: string }>[] = corrective.inputs.filter(
        (input: CorrectiveInput): input is Extract<CorrectiveInput, { channel: string }> =>
          "channel" in input,
      );
      if (posed.length === 0 || tissue.length === 0) return null;
      return {
        pose: posed
          .map((input: Exclude<CorrectiveInput, { channel: string }>): string =>
            "shoulder" in input
              ? `${input.shoulder}|${JSON.stringify(input.orientation)}`
              : `${input.bone}.${input.axis}.${input.side}`,
          )
          .sort((a: string, b: string): number => a.localeCompare(b))
          .join("+"),
        example: tissue
          .map((input: Extract<CorrectiveInput, { channel: string }>): string => `${input.channel}.${input.side}`)
          .sort((a: string, b: string): number => a.localeCompare(b))
          .join("+"),
        tissue,
      };
    }),
  };
  plans.set(basis, plan);
  return plan;
}

const plans: WeakMap<IAutoMovieHumanBodyBasis, ReturnType<typeof correctivePlan>> = new WeakMap<
  IAutoMovieHumanBodyBasis,
  ReturnType<typeof correctivePlan>
>();
