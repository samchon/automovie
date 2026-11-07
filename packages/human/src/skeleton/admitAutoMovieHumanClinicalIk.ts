import { AutoMovieHumanClinicalIkConstraints as Constraints } from "./AutoMovieHumanClinicalIkConstraints";
import type { AutoMovieHumanClinicalIkInput } from "./AutoMovieHumanClinicalIkInput";
import { AutoMovieHumanClinicalIkMath as IkMath } from "./AutoMovieHumanClinicalIkMath";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import { AutoMovieHumanTargetPoint as TargetPoint } from "./AutoMovieHumanTargetPoint";

/** Admit the complete numerical policy and static descriptors before selecting or evaluating FK. */
export function admitAutoMovieHumanClinicalIk(
  request: AutoMovieHumanClinicalIkInput.IRequest,
): {
  selected: readonly Controls.DegreeChannel[];
  channels: [string, number, number][];
  constraints: AutoMovieHumanClinicalIkInput.IConstraint[];
  stepPolicy: NonNullable<AutoMovieHumanClinicalIkInput.IRequest["step"]>;
  limit: number;
  tolerance: number;
} {
  if ((request.chain === undefined) === (request.channels === undefined))
    throw new Error(
      "Clinical IK requires exactly one typed channel list or anatomical chain",
    );
  const selected: readonly Controls.DegreeChannel[] = request.chain
    ? Controls.chain(request.chain)
    : request.channels!;
  if (!Array.isArray(selected))
    throw new Error("Clinical IK requires a dense channel array");
  const channels: [string, number, number][] = Array.from(selected).map(
    (path: string): [string, number, number] => {
      if (!Controls.isChannel(path))
        throw new Error(
          `Clinical IK requires a registered angular channel: ${path}`,
        );
      const interval: { minimum: number; maximum: number } =
        Controls.bounds(path);
      return [path, interval.minimum, interval.maximum];
    },
  );
  if (
    channels.length === 0 ||
    channels.length > 12 ||
    new Set(selected).size !== channels.length ||
    !Array.isArray(request.targets) ||
    request.targets.length === 0
  )
    throw new Error(
      "Clinical IK requires 1–12 unique channels and at least one target",
    );
  if (
    !Array.from(request.targets).every(
      (target: AutoMovieHumanClinicalIkInput.ITarget): boolean =>
        target !== null &&
        typeof target === "object" &&
        typeof target.bone === "string" &&
        target.bone.length > 0 &&
        IkMath.finitePoint(target.position) &&
        IkMath.bonePoint(target) &&
        TargetPoint.valid(target) &&
        (target.weight === undefined ||
          (Number.isFinite(target.weight) && target.weight > 0)) &&
        (target.preference === undefined ||
          typeof target.preference === "boolean"),
    )
  )
    throw new Error("Clinical IK requires finite three-coordinate targets");
  const limit: number = request.iterations ?? 4;
  const tolerance: number = request.tolerance ?? 0.001;
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 16 ||
    !Number.isFinite(tolerance) ||
    !(tolerance > 0) ||
    (request.priorWeight !== undefined &&
      (!Number.isFinite(request.priorWeight) || request.priorWeight < 0))
  )
    throw new Error("Clinical IK budget or tolerance is invalid");
  const constraints: AutoMovieHumanClinicalIkInput.IConstraint[] =
    Constraints.admit(request.constraints, channels);
  const stepPolicy: NonNullable<
    AutoMovieHumanClinicalIkInput.IRequest["step"]
  > = request.step ?? {
    differenceDegrees: 0.15,
    absoluteDamping: 0.000002,
    relativeDamping: 0,
    maximumDegrees: 12,
    componentwise: false,
    acceptance: "decreasing-objective",
  };
  if (
    !request.targets.some(
      (target: AutoMovieHumanClinicalIkInput.ITarget): boolean =>
        !target.preference,
    ) ||
    !Number.isFinite(stepPolicy.differenceDegrees) ||
    stepPolicy.differenceDegrees <= 0 ||
    stepPolicy.differenceDegrees > 1 ||
    !Number.isFinite(stepPolicy.absoluteDamping) ||
    stepPolicy.absoluteDamping <= 0 ||
    !Number.isFinite(stepPolicy.relativeDamping) ||
    stepPolicy.relativeDamping < 0 ||
    !Number.isFinite(stepPolicy.maximumDegrees) ||
    stepPolicy.maximumDegrees <= 0 ||
    stepPolicy.maximumDegrees > 45 ||
    typeof stepPolicy.componentwise !== "boolean" ||
    !["finite-update", "decreasing-objective"].includes(
      stepPolicy.acceptance,
    ) ||
    !Number.isSafeInteger(stepPolicy.minimumIterations ?? 0) ||
    (stepPolicy.minimumIterations ?? 0) < 0 ||
    (stepPolicy.minimumIterations ?? 0) > limit ||
    (request.step !== undefined &&
      constraints.some(
        (constraint: AutoMovieHumanClinicalIkInput.IConstraint): boolean =>
          constraint.kind !== "channel",
      ))
  )
    throw new Error("Invalid clinical IK numerical policy or primary goals");
  if (request.step)
    for (const constraint of constraints)
      if (constraint.kind === "channel") {
        const channel: [string, number, number] = channels.find(
          ([path]: (typeof channels)[number]): boolean =>
            path === constraint.channel,
        )!;
        channel[1] = Math.max(channel[1], constraint.minimum ?? -Infinity);
        channel[2] = Math.min(channel[2], constraint.maximum ?? Infinity);
        if (channel[1] > channel[2])
          throw new Error("Empty clinical IK numerical box");
      }

  return { selected, channels, constraints, stepPolicy, limit, tolerance };
}
