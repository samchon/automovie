import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIkInput as Input } from "./AutoMovieHumanClinicalIkInput";
import { AutoMovieHumanClinicalIkMath as MathIk } from "./AutoMovieHumanClinicalIkMath";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanTargetPoint as Point } from "./AutoMovieHumanTargetPoint";
import { admitAutoMovieHumanClinicalIk } from "./admitAutoMovieHumanClinicalIk";

/**
 * Synchronized block DLS for explicitly disjoint clinical channel groups.
 * Each finite-difference column perturbs the same coordinate of all groups;
 * each group's own residual then forms its normal system. This deliberately
 * uses an explicit block approximation, including coupling through shared
 * ancestors. It is not the Jacobian of independently perturbed
 * limbs and does not promise a monotone objective or a feasible contact.
 * At most 16 updates, eight groups and twelve coordinates per group are admitted.
 * Every call starts from its supplied seed; no previous-frame state is retained.
 */
export function solveAutoMovieHumanClinicalIkGroups(
  evaluate: Skeleton.PoseEvaluator,
  seed: IAutoMovieHumanPose,
  request: solveAutoMovieHumanClinicalIkGroups.IRequest,
): solveAutoMovieHumanClinicalIkGroups.IResult {
  if (
    !Array.isArray(request.groups) ||
    request.groups.length === 0 ||
    request.groups.length > 8
  )
    throw new Error("Grouped clinical IK requires 1–8 dense groups");
  const limit: number = request.iterations ?? 12;
  const tolerance: number = request.tolerance ?? 0.0015;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 16 ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0
  )
    throw new Error("Invalid grouped clinical IK work budget");
  const policy: NonNullable<Input.IRequest["step"]> = {
    differenceDegrees: 0.35,
    absoluteDamping: 1e-9,
    relativeDamping: 0.05,
    maximumDegrees: 25,
    componentwise: true,
    acceptance: "finite-update",
    minimumIterations: 1,
  };
  const admitted: ReturnType<typeof admitAutoMovieHumanClinicalIk>[] =
    Array.from(request.groups).map(
      (
        group: Input.IRequest,
      ): ReturnType<typeof admitAutoMovieHumanClinicalIk> =>
        admitAutoMovieHumanClinicalIk({ ...group, step: policy }),
    );
  const channels: string[] = admitted.flatMap(
    (group: (typeof admitted)[number]): string[] =>
      group.channels.map(
        ([path]: (typeof group.channels)[number]): string => path,
      ),
  );
  if (new Set(channels).size !== channels.length)
    throw new Error("Grouped clinical IK channels must be disjoint");
  const pose: IAutoMovieHumanPose = AutoMovieHumanStateAdmission.pose(seed);
  const values: number[][] = admitted.map(
    (group: (typeof admitted)[number]): number[] =>
      group.channels.map(
        ([path, minimum, maximum]: (typeof group.channels)[number]): number =>
          Math.max(minimum, Math.min(maximum, MathIk.read(pose, path))),
      ),
  );
  const priors: number[][] = admitted.map(
    (group: (typeof admitted)[number], index: number): number[] => {
      const reference: IAutoMovieHumanPose = request.groups[index]!.priorPose
        ? AutoMovieHumanStateAdmission.pose(request.groups[index]!.priorPose)
        : pose;
      return group.channels.map(
        ([path, minimum, maximum]: (typeof group.channels)[number]): number =>
          Math.max(minimum, Math.min(maximum, MathIk.read(reference, path))),
      );
    },
  );
  const targets: Input.ITarget[] = request.groups.flatMap(
    (group: (typeof request.groups)[number]): Input.ITarget[] => group.targets,
  );
  const bones: string[] = [...new Set(targets.flatMap(Point.references))];
  const project: Skeleton.ProjectionEvaluator = evaluate.project
    ? evaluate.project(bones)
    : evaluate;
  for (const [index, group] of admitted.entries())
    group.channels.forEach(
      ([path]: (typeof group.channels)[number], coordinate: number): void =>
        MathIk.write(pose, path, values[index]![coordinate]!),
    );
  const dimensions: number = Math.max(
    ...values.map((row: number[]): number => row.length),
  );
  let updates: number = 0;
  for (; updates < limit; updates++) {
    const output: Skeleton.IProjection = project(pose);
    const residuals: number[][] = request.groups.map(
      (group: (typeof request.groups)[number]): number[] =>
        MathIk.errors(output, group.targets),
    );
    if (
      updates > 0 &&
      MathIk.maximum(
        MathIk.errors(
          output,
          targets.filter(
            (target: (typeof targets)[number]): boolean => !target.preference,
          ),
          false,
        ),
      ) < tolerance
    )
      break;
    const columns: number[][][] = admitted.map((): number[][] => []);

    // Synchronize probes before any block is advanced; shared ancestors then
    // retain exactly the declared simultaneous-perturbation semantics.
    for (let coordinate: number = 0; coordinate < dimensions; coordinate++) {
      const steps: number[] = admitted.map(
        (group: (typeof admitted)[number], index: number): number => {
          if (coordinate >= group.channels.length) return 0;
          const [path, , maximum]: [string, number, number] =
            group.channels[coordinate]!;
          const value: number = values[index]![coordinate]!;
          const step: number =
            value + policy.differenceDegrees > maximum
              ? -policy.differenceDegrees
              : policy.differenceDegrees;
          MathIk.write(pose, path, value + step);
          return step;
        },
      );
      const moved: Skeleton.IProjection = project(pose);
      admitted.forEach(
        (group: (typeof admitted)[number], index: number): void => {
          if (coordinate >= group.channels.length) return;
          columns[index]!.push(
            MathIk.errors(moved, request.groups[index]!.targets).map(
              (value: number, row: number): number =>
                (value - residuals[index]![row]!) / steps[index]!,
            ),
          );
          MathIk.write(
            pose,
            group.channels[coordinate]![0],
            values[index]![coordinate]!,
          );
        },
      );
    }
    admitted.forEach(
      (group: (typeof admitted)[number], index: number): void => {
        const system: ReturnType<typeof MathIk.normal> = MathIk.normal(
          columns[index]!,
          residuals[index]!,
          values[index]!,
          priors[index]!,
          (request.groups[index]!.priorWeight ?? 0) ** 2,
          policy.absoluteDamping,
          policy.relativeDamping,
        );
        const direction: number[] = MathIk.linear(system.matrix, system.right);
        group.channels.forEach(
          (
            [path, minimum, maximum]: (typeof group.channels)[number],
            coordinate: number,
          ): void => {
            const value: number = Math.max(
              minimum,
              Math.min(
                maximum,
                values[index]![coordinate]! +
                  Math.max(
                    -policy.maximumDegrees,
                    Math.min(policy.maximumDegrees, direction[coordinate]!),
                  ),
              ),
            );
            values[index]![coordinate] = value;
            MathIk.write(pose, path, value);
          },
        );
      },
    );
  }
  const output: Skeleton.IOutput = evaluate(pose);
  return {
    pose,
    output,
    error: MathIk.maximum(
      MathIk.errors(
        output,
        targets.filter(
          (target: (typeof targets)[number]): boolean => !target.preference,
        ),
        false,
      ),
    ),
    iterations: updates,
  };
}

/** Explicit grouping and owned final observations for synchronized fitting. */
export namespace solveAutoMovieHumanClinicalIkGroups {
  /** Targets and box limits belong to each nonoverlapping block. */
  export interface IRequest {
    /** Nonempty groups; line constraints refuse before FK. Iteration settings inside a group do not override the common work budget. */ groups: Input.IRequest[];
    /** Maximum synchronized updates, 1..16; defaults to twelve. */ iterations?: number;
    /** Largest primary residual early-out, positive metres; defaults to 0.0015. */ tolerance?: number;
  }
  /** Actual final FK and residual, with independent pose storage. */
  export interface IResult {
    /** Complete independent clinical pose. */ pose: IAutoMovieHumanPose;
    /** Actual matching full FK. */ output: Skeleton.IOutput;
    /** Maximum primary error after the final update, metres. */ error: number;
    /** Synchronized updates performed. */ iterations: number;
  }
}
