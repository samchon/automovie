import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanClinicalIkConstraints as Constraints } from "./AutoMovieHumanClinicalIkConstraints";
import type { AutoMovieHumanClinicalIkInput } from "./AutoMovieHumanClinicalIkInput";
import { AutoMovieHumanClinicalIkMath as IkMath } from "./AutoMovieHumanClinicalIkMath";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanTargetPoint as TargetPoint } from "./AutoMovieHumanTargetPoint";
import { admitAutoMovieHumanClinicalIk } from "./admitAutoMovieHumanClinicalIk";
import { solveAutoMovieHumanClinicalIkGroups } from "./solveAutoMovieHumanClinicalIkGroups";

/** Bounded clinical fitting with shared target geometry, admission and numerical kernels. */
export namespace AutoMovieHumanClinicalIk {
  /** Explicit synchronized block approximation; see its ownership and coupling contract. */
  export function solveGroups(
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator,
    seed: IAutoMovieHumanPose,
    request: solveAutoMovieHumanClinicalIkGroups.IRequest,
  ): solveAutoMovieHumanClinicalIkGroups.IResult {
    return solveAutoMovieHumanClinicalIkGroups(evaluate, seed, request);
  }
  /** Public IBonePoint descriptor shared with grouped fitting. */
  export type IBonePoint = AutoMovieHumanClinicalIkInput.IBonePoint;
  /** Public IConstraint descriptor shared with grouped fitting. */
  export type IConstraint = AutoMovieHumanClinicalIkInput.IConstraint;
  /** Public ITarget descriptor shared with grouped fitting. */
  export type ITarget = AutoMovieHumanClinicalIkInput.ITarget;
  /** Public IRequest descriptor shared with grouped fitting. */
  export type IRequest = AutoMovieHumanClinicalIkInput.IRequest;
  /** Public IResult descriptor shared with grouped fitting. */
  export type IResult = AutoMovieHumanClinicalIkInput.IResult;

  /**
   * Fit a small explicitly chosen chain using inward finite differences and
   * damped normal equations. Each step is bounded to twelve clinical degrees;
   * public range limits apply before every FK. Singular and unreachable poses
   * terminate with their residual rather than changing bone lengths or roots.
   * Optional intervals use a constrained Gauss-Newton step through Engine's
   * pinned quadratic solver, with the same damping and literal point objective.
   * Infeasible seeds first require decreasing squared interval violation;
   * feasible seeds require actual feasibility and decreasing squared endpoint
   * error. Four backtracks bound each update; a stalled linearization reports
   * unresolved final constraints, never a global infeasibility certificate.
   * Every linearization consumes the evaluator's applied
   * values for conditional limits, such as tibial rotation at an extended knee;
   * untouched authored regions retain their inputs and observable clamp rows.
   * Conditional normalization can add one FK per trial; O(N²+N(T+C)) temporary
   * JavaScript numbers plus the Engine solver workspace are used;
   * failed steps leave the last accepted FK intact. Prepared fixed-bone projections
   * share the full FK law and retain all clamp rows; plain callable evaluators
   * remain supported. One complete owned public snapshot is made at the final
   * applied pose, including unresolved results; trial exterior data is not copied.
   */
  export function solve(
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator,
    seed: IAutoMovieHumanPose,
    request: IRequest,
  ): IResult {
    const {
      selected,
      channels,
      constraints,
      stepPolicy,
      limit,
      tolerance,
    }: ReturnType<typeof admitAutoMovieHumanClinicalIk> =
      admitAutoMovieHumanClinicalIk(request);
    const bones: string[] = [
      ...new Set([
        ...request.targets.map((target: ITarget): string => target.bone),
        ...request.targets.flatMap((target: ITarget): string[] =>
          TargetPoint.references(target),
        ),
        ...constraints.flatMap((item: IConstraint): string[] =>
          item.kind === "channel"
            ? []
            : [item.point.bone, item.line.origin.bone, item.line.end.bone],
        ),
      ]),
    ];
    let trial: AutoMovieHumanSkeleton.ProjectionEvaluator = evaluate;
    if (evaluate.project) {
      try {
        trial = evaluate.project(bones);
      } catch (error: unknown) {
        throw new Error(
          `Clinical IK target is missing or invalid: ${request.targets.map((target: ITarget): string => target.bone).join(", ")} (${String(error)})`,
        );
      }
    }
    const pose: IAutoMovieHumanPose = AutoMovieHumanStateAdmission.pose(seed);
    const values: number[] = channels.map(
      ([path, min, max]: [string, number, number]): number =>
        Math.max(min, Math.min(max, IkMath.read(pose, path))),
    );
    const priorPose: IAutoMovieHumanPose = request.priorPose
      ? AutoMovieHumanStateAdmission.pose(request.priorPose)
      : pose;
    const prior: number[] = channels.map(
      ([path, minimum, maximum]: [string, number, number]): number =>
        Math.max(minimum, Math.min(maximum, IkMath.read(priorPose, path))),
    );
    const priorSquared: number = (request.priorWeight ?? 0) ** 2;
    const apply: () => AutoMovieHumanSkeleton.IProjection =
      (): AutoMovieHumanSkeleton.IProjection => {
        channels.forEach(([path]: [string, number, number], i: number): void =>
          IkMath.write(pose, path, values[i]!),
        );
        let candidate: AutoMovieHumanSkeleton.IProjection = trial(pose);
        let normalized: boolean = false;
        for (const clamp of candidate.clamped) {
          const index: number = selected.findIndex(
            (path: Controls.DegreeChannel): boolean => path === clamp.path,
          );
          if (index < 0) continue;
          values[index] = clamp.applied;
          IkMath.write(pose, clamp.path, clamp.applied);
          normalized = true;
        }
        if (normalized) candidate = trial(pose);
        return candidate;
      };
    let output: AutoMovieHumanSkeleton.IProjection = apply();
    let residual: number[] = IkMath.errors(output, request.targets);
    let measured: Constraints.Measurement = Constraints.measure(
      output,
      pose,
      constraints,
    );
    let count: number = 0;
    for (
      ;
      count < limit &&
      (count < (stepPolicy.minimumIterations ?? 0) ||
        IkMath.maximum(
          IkMath.errors(
            output,
            request.targets.filter(
              (target: ITarget): boolean => !target.preference,
            ),
            false,
          ),
        ) > tolerance ||
        !Constraints.satisfied(measured, constraints));
      count++
    ) {
      const previous: number[] = [...values];
      const intervals: { minimum: number; maximum: number }[] = selected.map(
        (
          path: Controls.DegreeChannel,
          i: number,
        ): { minimum: number; maximum: number } => {
          const bounds: { minimum: number; maximum: number } = Controls.bounds(
            path,
            pose,
          );
          return {
            minimum: Math.max(bounds.minimum, channels[i]![1]),
            maximum: Math.min(bounds.maximum, channels[i]![2]),
          };
        },
      );
      if (
        intervals.some(
          (interval: { minimum: number; maximum: number }): boolean =>
            interval.minimum > interval.maximum,
        )
      )
        break;
      const constraintDerivatives: number[][] = [];
      const derivatives: number[][] = channels.map(
        (_: [string, number, number], column: number): number[] => {
          values.splice(0, values.length, ...previous);
          const value: number = previous[column]!;
          const interval: { minimum: number; maximum: number } =
            intervals[column]!;
          const forward: number = Math.min(
            stepPolicy.differenceDegrees,
            interval.maximum - value,
          );
          const backward: number = Math.min(
            stepPolicy.differenceDegrees,
            value - interval.minimum,
          );
          const step: number = forward >= backward ? forward : -backward;
          if (Math.abs(step) < 1e-10) {
            constraintDerivatives.push(measured.values.map((): number => 0));
            return residual.map((): number => 0);
          }
          values[column] = value + step;
          const candidate: AutoMovieHumanSkeleton.IProjection = apply();
          const moved: number[] = IkMath.errors(candidate, request.targets);
          const applied: number = values[column]! - value;
          constraintDerivatives.push(
            Constraints.measure(candidate, pose, constraints).values.map(
              (v: number, i: number): number =>
                Math.abs(applied) < 1e-10
                  ? 0
                  : (v - measured.values[i]!) / applied,
            ),
          );
          return moved.map((v: number, i: number): number =>
            Math.abs(applied) < 1e-10 ? 0 : (v - residual[i]!) / applied,
          );
        },
      );
      values.splice(0, values.length, ...previous);
      channels.forEach(
        ([path]: [string, number, number], index: number): void =>
          IkMath.write(pose, path, previous[index]!),
      );
      const { matrix, right }: ReturnType<typeof IkMath.normal> = IkMath.normal(
        derivatives,
        residual,
        previous,
        prior,
        priorSquared,
        stepPolicy.absoluteDamping,
        stepPolicy.relativeDamping,
      );
      const delta: number[] =
        constraints.length === 0 || request.step !== undefined
          ? IkMath.linear(matrix, right)
          : Constraints.constrained(
              derivatives,
              residual,
              constraintDerivatives,
              measured.values,
              constraints,
              previous,
              intervals,
              prior,
              priorSquared,
            );
      const scale: number = Math.min(
        1,
        stepPolicy.maximumDegrees /
          Math.max(stepPolicy.maximumDegrees, ...delta.map(Math.abs)),
      );
      const cost: number = residual.reduce(
        (sum: number, v: number): number => sum + v * v,
        0,
      );
      const priorCost: number =
        priorSquared *
        previous.reduce(
          (sum: number, value: number, i: number): number =>
            sum + (value - prior[i]!) ** 2,
          0,
        );
      const constraintCost: number = Constraints.violation(
        measured,
        constraints,
      );
      let accepted: boolean = false;
      for (
        let backtrack: number = 0;
        backtrack < (stepPolicy.acceptance === "finite-update" ? 1 : 4);
        backtrack++
      ) {
        const fraction: number =
          (stepPolicy.componentwise ? 1 : scale) / 2 ** backtrack;
        previous.forEach((v: number, i: number): void => {
          values[i] = Math.max(
            channels[i]![1],
            Math.min(
              channels[i]![2],
              v +
                fraction *
                  (stepPolicy.componentwise
                    ? Math.max(
                        -stepPolicy.maximumDegrees,
                        Math.min(stepPolicy.maximumDegrees, delta[i]!),
                      )
                    : delta[i]!),
            ),
          );
        });
        const candidate: AutoMovieHumanSkeleton.IProjection = apply();
        const next: number[] = IkMath.errors(candidate, request.targets);
        const nextMeasured: Constraints.Measurement = Constraints.measure(
          candidate,
          pose,
          constraints,
        );
        const nextViolation: number = Constraints.violation(
          nextMeasured,
          constraints,
        );
        const nextCost: number = next.reduce(
          (sum: number, v: number): number => sum + v * v,
          0,
        );
        if (
          (stepPolicy.acceptance === "finite-update" &&
            next.every(Number.isFinite) &&
            nextViolation === 0) ||
          (constraintCost > 0
            ? nextViolation < constraintCost
            : nextViolation === 0 &&
              nextCost +
                priorSquared *
                  values.reduce(
                    (sum: number, value: number, i: number): number =>
                      sum + (value - prior[i]!) ** 2,
                    0,
                  ) <
                cost + priorCost)
        ) {
          output = candidate;
          residual = next;
          measured = nextMeasured;
          accepted = true;
          break;
        }
      }
      if (!accepted) {
        previous.forEach((v: number, i: number): void => {
          values[i] = v;
        });
        apply();
        break;
      }
    }
    for (const clamp of output.clamped) {
      if (
        !selected.some(
          (path: Controls.DegreeChannel): boolean => path === clamp.path,
        )
      )
        continue;
      IkMath.write(pose, clamp.path, clamp.applied);
    }

    // Only the final applied pose crosses the complete public snapshot boundary.
    const complete: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
    residual = IkMath.errors(complete, request.targets);
    measured = Constraints.measure(complete, pose, constraints);
    const constraintValues: { value: number; violation: number }[] =
      measured.values.map(
        (value: number, i: number): { value: number; violation: number } => ({
          value,
          violation: Constraints.distance(value, constraints[i]!),
        }),
      );
    return {
      pose,
      output: complete,
      error: IkMath.maximum(IkMath.errors(complete, request.targets, false)),
      iterations: count,
      constraintValues,
      constraintsSatisfied: Constraints.satisfied(measured, constraints),
    };
  }
}
