import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanClinicalIkMath as Fit } from "./AutoMovieHumanClinicalIkMath";
import { AutoMovieHumanClinicalIkProjection as Projection } from "./AutoMovieHumanClinicalIkProjection";

/** Local names preserve the original fitting loop and its arithmetic owners. */
const { admit, constrained, errors, linear, maximum, write, limitStep }: typeof Fit = Fit;

/** Raw projection readings and envelopes retain their separate upstream meanings. */
const { distance, finitePoint, measure, read, satisfied, violation }: typeof Projection = Projection;

/** One original reading population and its independent arithmetic envelopes. */
type Measurement = Projection.Measurement;

/**
 * Bounded damped least-squares fitting of public clinical channels to joint
 * points carried by bones. Targets are in the evaluator's metre frame. It changes only named
 * channels, retains all other authored controls, and reports residual error;
 * a finite result is not proof of support, skin contact or collision freedom.
 */
export namespace AutoMovieHumanClinicalIk {
  /** A rigid point in one bone's bind-relative coordinates, in metres. */
  export interface IBonePoint {
    /** Bone whose actual FK carries this point. */ bone: Controls.Joint;
    /** Omission selects the joint centre. */ localPoint?: Controls.MetrePoint;
  }
  /** Inclusive generic intervals; at least one finite endpoint is required.
   * A line offset is normal dot (point-origin-axis*dot(point-origin,axis)),
   * with axis the unit same-FK end-origin vector. Static malformed descriptors
   * refuse before projection selection; actual missing/degenerate FK refuses
   * when evaluated. Channel intervals intersect, rather than replace, ROM.
   */
  export type IConstraint = (
    | {
        /** Intersect one selected clinical channel's original ROM, in degrees. */ kind: "channel";
        /** Must occur in this request's selected channels. */ channel: Controls.DegreeChannel;
      }
    | {
        /** Signed perpendicular offset from a moving three-point line, in metres. */ kind: "line-offset";
        /** Point whose perpendicular displacement is measured. */ point: IBonePoint;
        /** Same-FK line; coincident endpoints refuse instead of inventing an axis. */ line: {
          /** Moving line origin. */ origin: IBonePoint;
          /** Second moving point defining direction. */ end: IBonePoint;
        };
        /** Evaluator-frame vector of unit norm, admitted within 1e-6. */ normal: Controls.MetrePoint;
      }
  ) & {
    /** Inclusive lower endpoint in the descriptor's units. */ minimum?: number;
    /** Inclusive upper endpoint in the descriptor's units. */ maximum?: number;
  };
  /** One rigidly bone-bound point, including geometry-derived contact points. */
  export interface ITarget {
    /** Bone identifier present in the evaluator. */
    bone: Controls.Joint;
    /** Desired evaluator-frame point, metres. */
    position: Controls.MetrePoint;
    /** Bind-relative bone-local offset, metres; omission addresses the joint centre.
     * A rigid module vertex uses its stored local coordinates. A blended skin
     * vertex cannot be represented by attaching it to just one of its bones.
     */
    localPoint?: Controls.MetrePoint;
  }
  /** Explicit work and precision budget for one small clinical chain. */
  export type IRequest = (
    | {
        /** Named public clinical paths; each must be a registered degree channel. */
        channels: readonly Controls.DegreeChannel[];
        /** Explicit paths already select the anatomical work. */ chain?: never;
      }
    | {
        /** Anatomical selection instead of explicit channels; supplying both refuses. */
        chain: Controls.Chain;
        /** A chain already selects its canonical angular paths. */ channels?: never;
      }
  ) & {
    /** FK endpoints affected by those channels. */
    targets: ITarget[];
    /** Maximum Gauss-Newton updates, 1 through 16; default 4. */
    iterations?: number;
    /** Euclidean residual acceptance in metres; default 0.001. */
    tolerance?: number;
    /** Optional dense generic constraints; neither targets nor channels are replaced. */
    constraints?: readonly IConstraint[];
  };
  /** Owned fitted pose and its matching FK, including honest residuals. */
  export interface IResult {
    /** New independent pose; caller input is never mutated. */
    pose: IAutoMovieHumanPose;
    /** FK computed from exactly pose. */
    output: AutoMovieHumanSkeleton.IOutput;
    /** Largest target distance, metres; unreachable targets remain nonzero. */
    error: number;
    /** Updates performed; full FK evaluations also include finite differences. */
    iterations: number;
    /** Actual final descriptor values and nonnegative interval violations, in request order. */
    constraintValues: readonly {
      /** Actual value, in descriptor degrees or metres. */ value: number;
      /** Exact nonnegative interval distance in the same units. */ violation: number;
    }[];
    /** Every original interval holds up to local Float64 projection roundoff. Raw violations remain reported; this does not certify global feasibility. */
    constraintsSatisfied: boolean;
  }
  /**
   * Fit a small explicitly chosen chain using inward finite differences and
   * damped normal equations. Each step is bounded to twelve clinical degrees;
   * public range limits apply before every FK. Singular and unreachable poses
   * terminate with their residual rather than changing bone lengths or roots.
   * Optional intervals use a constrained Gauss-Newton step through Engine's
   * engine-owned TypeScript quadratic solver, with the same damping and literal point objective.
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
        (target: ITarget): boolean =>
          target !== null &&
          typeof target === "object" &&
          typeof target.bone === "string" &&
          target.bone.length > 0 &&
          finitePoint(target.position) &&
          (target.localPoint === undefined || finitePoint(target.localPoint)),
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
      !(tolerance > 0)
    )
      throw new Error("Clinical IK budget or tolerance is invalid");
    const constraints: IConstraint[] = admit(request.constraints, channels);
    const bones: string[] = [
      ...new Set([
        ...request.targets.map((target: ITarget): string => target.bone),
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
        Math.max(min, Math.min(max, read(pose, path))),
    );
    const apply: () => AutoMovieHumanSkeleton.IProjection =
      (): AutoMovieHumanSkeleton.IProjection => {
        channels.forEach(([path]: [string, number, number], i: number): void =>
          write(pose, path, values[i]!),
        );
        let candidate: AutoMovieHumanSkeleton.IProjection = trial(pose);
        let normalized: boolean = false;
        for (const clamp of candidate.clamped) {
          const index: number = selected.findIndex(
            (path: Controls.DegreeChannel): boolean => path === clamp.path,
          );
          if (index < 0) continue;
          values[index] = clamp.applied;
          write(pose, clamp.path, clamp.applied);
          normalized = true;
        }
        if (normalized) candidate = trial(pose);
        return candidate;
      };
    let output: AutoMovieHumanSkeleton.IProjection = apply();
    let residual: number[] = errors(output, request.targets);
    let measured: Measurement = measure(output, pose, constraints);
    let count: number = 0;
    for (
      ;
      count < limit &&
      (maximum(residual) > tolerance || !satisfied(measured, constraints));
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
          const forward: number = Math.min(0.15, interval.maximum - value);
          const backward: number = Math.min(0.15, value - interval.minimum);
          const step: number = forward >= backward ? forward : -backward;
          if (Math.abs(step) < 1e-10) {
            constraintDerivatives.push(measured.values.map((): number => 0));
            return residual.map((): number => 0);
          }
          values[column] = value + step;
          const candidate: AutoMovieHumanSkeleton.IProjection = apply();
          const moved: number[] = errors(candidate, request.targets);
          const applied: number = values[column]! - value;
          constraintDerivatives.push(
            measure(candidate, pose, constraints).values.map(
              (v: number, i: number): number =>
                Math.abs(applied) < 1e-10 ? 0 : (v - measured.values[i]!) / applied,
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
          write(pose, path, previous[index]!),
      );
      const matrix: number[][] = derivatives.map(
        (row: number[], i: number): number[] =>
          derivatives.map(
            (col: number[], j: number): number =>
              row.reduce(
                (sum: number, v: number, k: number): number =>
                  sum + v * col[k]!,
                0,
              ) + (i === j ? 0.000002 : 0),
          ),
      );
      const right: number[] = derivatives.map(
        (row: number[]): number =>
          -row.reduce(
            (sum: number, v: number, i: number): number =>
              sum + v * residual[i]!,
            0,
          ),
      );
      const delta: number[] =
        constraints.length === 0
          ? linear(matrix, right)
          : constrained(
              derivatives,
              residual,
              constraintDerivatives,
              measured.values,
              constraints,
              previous,
              intervals,
            );
      const scale: number = Math.min(
        1,
        12 / Math.max(12, ...delta.map(Math.abs)),
      );
      const cost: number = residual.reduce(
        (sum: number, v: number): number => sum + v * v,
        0,
      );
      const constraintCost: number = violation(measured, constraints);
      let accepted: boolean = false;
      for (let backtrack: number = 0; backtrack < 4; backtrack++) {
        const fraction: number = scale / 2 ** backtrack;
        previous.forEach((v: number, i: number): void => {
          values[i] = limitStep(
            v, delta[i]!, fraction, channels[i]![1], channels[i]![2],
          );
        });
        const candidate: AutoMovieHumanSkeleton.IProjection = apply();
        const next: number[] = errors(candidate, request.targets);
        const nextMeasured: Measurement = measure(candidate, pose, constraints);
        const nextViolation: number = violation(nextMeasured, constraints);
        const nextCost: number = next.reduce(
          (sum: number, v: number): number => sum + v * v,
          0,
        );
        if (
          constraintCost > 0
            ? nextViolation < constraintCost
            : nextViolation === 0 && nextCost < cost
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
      write(pose, clamp.path, clamp.applied);
    }

    // Only the final applied pose crosses the complete public snapshot boundary.
    const complete: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
    residual = errors(complete, request.targets);
    measured = measure(complete, pose, constraints);
    const constraintValues: { value: number; violation: number }[] =
      measured.values.map(
        (value: number, i: number): { value: number; violation: number } => ({
          value,
          violation: distance(value, constraints[i]!),
        }),
      );
    return {
      pose,
      output: complete,
      error: maximum(residual),
      iterations: count,
      constraintValues,
      constraintsSatisfied: satisfied(measured, constraints),
    };
  }
}
