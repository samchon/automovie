import type { IAutoMovieQuadraticRow } from "@automovie/engine/math/IAutoMovieQuadraticRow";
import { refineAutoMovieQuadraticProgram } from "@automovie/engine/math/refineAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticProgram } from "@automovie/engine/math/solveAutoMovieQuadraticProgram";

import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

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
          values[i] = Math.max(
            channels[i]![1],
            Math.min(channels[i]![2], v + fraction * delta[i]!),
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

/** Admit and copy dense descriptors before touching either evaluator capability. */
function admit(
  input: readonly AutoMovieHumanClinicalIk.IConstraint[] | undefined,
  channels: [string, number, number][],
): AutoMovieHumanClinicalIk.IConstraint[] {
  if (input === undefined) return [];
  if (!Array.isArray(input))
    throw new Error("Clinical IK constraints require a dense array");
  const ranges: [string, number, number][] = channels.map(
    (row: [string, number, number]): [string, number, number] => [...row],
  );
  return Array.from(input).map(
    (
      item: AutoMovieHumanClinicalIk.IConstraint,
    ): AutoMovieHumanClinicalIk.IConstraint => {
      if (
        !item ||
        typeof item !== "object" ||
        (item.minimum === undefined && item.maximum === undefined) ||
        (item.minimum !== undefined && !Number.isFinite(item.minimum)) ||
        (item.maximum !== undefined && !Number.isFinite(item.maximum)) ||
        (item.minimum ?? -Infinity) > (item.maximum ?? Infinity)
      )
        throw new Error("Clinical IK constraint interval is invalid");
      if (item.kind === "channel") {
        const channel: [string, number, number] | undefined = ranges.find(
          (row: [string, number, number]): boolean => row[0] === item.channel,
        );
        if (!channel)
          throw new Error("Clinical IK constraint channel must be selected");
        channel[1] = Math.max(channel[1], item.minimum ?? -Infinity);
        channel[2] = Math.min(channel[2], item.maximum ?? Infinity);
        if (channel[1] > channel[2])
          throw new Error(
            "Clinical IK channel constraint has no clinical range",
          );
        return { ...item };
      }
      if (
        item.kind !== "line-offset" ||
        !item.line ||
        !bonePoint(item.point) ||
        !bonePoint(item.line.origin) ||
        !bonePoint(item.line.end) ||
        !finitePoint(item.normal) ||
        Math.abs(Math.hypot(...item.normal) - 1) > 1e-6
      )
        throw new Error(
          "Clinical IK line-offset requires finite bone points and a unit normal",
        );
      const copy: (
        point: AutoMovieHumanClinicalIk.IBonePoint,
      ) => AutoMovieHumanClinicalIk.IBonePoint = (
        point: AutoMovieHumanClinicalIk.IBonePoint,
      ): AutoMovieHumanClinicalIk.IBonePoint => ({
        bone: point.bone,
        ...(point.localPoint === undefined
          ? {}
          : { localPoint: [...point.localPoint] as Controls.MetrePoint }),
      });
      return {
        ...item,
        normal: [...item.normal],
        point: copy(item.point),
        line: { origin: copy(item.line.origin), end: copy(item.line.end) },
      };
    },
  );
}

/** Bone-point admission reads every coordinate, including sparse local tuples. */
function bonePoint(
  value: unknown,
): value is AutoMovieHumanClinicalIk.IBonePoint {
  if (!value || typeof value !== "object") return false;
  const point: AutoMovieHumanClinicalIk.IBonePoint =
    value as AutoMovieHumanClinicalIk.IBonePoint;
  return (
    typeof point.bone === "string" &&
    point.bone.length > 0 &&
    (point.localPoint === undefined || finitePoint(point.localPoint))
  );
}

/** Raw scalar readings and a separate arithmetic uncertainty, never a physical contact allowance. */
interface Measurement {
  /** Original values used by finite differences, QP rows and public diagnostics. */
  values: number[];
  /** Local Float64 projection error envelopes; channel readings remain exact. */
  roundoff: number[];
}

/** Actual FK values; moving origins and moving line directions share one snapshot. */
function measure(
  output: AutoMovieHumanSkeleton.IProjection,
  pose: IAutoMovieHumanPose,
  constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
): Measurement {
  const roundoff: number[] = [];
  const values: number[] = constraints.map(
    (item: AutoMovieHumanClinicalIk.IConstraint): number => {
      if (item.kind === "channel") {
        roundoff.push(0);
        return read(pose, item.channel);
      }
      const origin: Controls.MetrePoint = pointAt(output, item.line.origin);
      const end: Controls.MetrePoint = pointAt(output, item.line.end);
      const point: Controls.MetrePoint = pointAt(output, item.point);
      const axis: Controls.MetrePoint = Math3D.sub(
        end,
        origin,
      );
      const offset: Controls.MetrePoint = Math3D.sub(
        point,
        origin,
      );
      const length: number = Math.hypot(...axis);
      if (!(length > 0) || !Number.isFinite(length))
        throw new Error("Clinical IK line-offset has a degenerate line");
      const unit: number[] = axis.map((v: number): number => v / length);
      const along: number = offset.reduce(
        (sum: number, v: number, i: number): number => sum + v * unit[i]!,
        0,
      );
      const value: number = offset.reduce(
        (sum: number, v: number, i: number): number =>
          sum + (v - unit[i]! * along) * item.normal[i]!,
        0,
      );
      if (!Number.isFinite(value))
        throw new Error("Clinical IK line-offset arithmetic is not finite");
      roundoff.push(projectionRoundoff(
        pointMagnitude(output, item.line.origin) +
          pointMagnitude(output, item.line.end) +
          pointMagnitude(output, item.point),
        offset, item.normal, length,
      ));
      return value;
    },
  );
  return { values, roundoff };
}

/**
 * Bound only numerical equivalence of the original rigid-point projection.
 * Three point transforms use at most177 scalar quaternion/add operations;
 * differences, normalization and the two projections fit within a conservative
 * 256-rounding envelope. Normalization contributes its inverse-span condition.
 * The operands, not a metre/degree tolerance, set the scale. If the line loses
 * more than half Float64's relative precision, no roundoff admission is granted.
 * This does not bound an evaluator's anatomical error or change an interval.
 */
function projectionRoundoff(
  magnitude: number,
  offset: Controls.MetrePoint,
  normal: Controls.MetrePoint,
  length: number,
): number {
  const unit: number = Number.EPSILON / 2;
  const gamma: number = (256 * unit) / (1 - 256 * unit);
  const condition: number = (gamma * magnitude) / length;
  if (!Number.isFinite(condition) || condition > Math.sqrt(unit)) return 0;
  const displacement: number = offset.reduce((sum: number, value: number): number => sum + Math.abs(value), 0);
  const normalMagnitude: number = normal.reduce((sum: number, value: number): number => sum + Math.abs(value), 0);
  const allowance: number = gamma * normalMagnitude *
    (magnitude + displacement + (2 * magnitude * displacement) / length);
  return Number.isFinite(allowance) ? allowance : 0;
}

/** Absolute transform-operand magnitude retains cancellation that a final world point would hide. */
function pointMagnitude(
  output: AutoMovieHumanSkeleton.IProjection,
  point: AutoMovieHumanClinicalIk.IBonePoint,
): number {
  const placement: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
    (row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === point.bone,
  )!;
  const position: number = placement.position.reduce((sum: number, value: number): number => sum + Math.abs(value), 0);
  if (point.localPoint === undefined) return position;
  const quaternion: number = placement.rotation.reduce((sum: number, value: number): number => sum + Math.abs(value), 0);
  const local: number = point.localPoint.reduce((sum: number, value: number): number => sum + Math.abs(value), 0);
  return position + quaternion * quaternion * local;
}

/** Nonnegative physical interval distance, with no acceptance-band relaxation. */
function distance(
  value: number,
  item: { minimum?: number; maximum?: number },
): number {
  return Math.max(
    0,
    (item.minimum ?? -Infinity) - value,
    value - (item.maximum ?? Infinity),
  );
}

/** Compare original interval readings directly so positive subnormal violations cannot vanish by squaring. */
function satisfied(
  measured: Measurement,
  constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
): boolean {
  return measured.values.every(
    (value: number, i: number): boolean =>
      distance(value, constraints[i]!) <= measured.roundoff[i]!,
  );
}

/** Squared violation merit preserves a positive floor when its square would underflow. */
function violation(
  measured: Measurement,
  constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
): number {
  return measured.values.reduce(
    (sum: number, value: number, i: number): number => {
      const raw: number = distance(value, constraints[i]!);
      return sum + (raw <= measured.roundoff[i]! ? 0 : Math.max(Number.MIN_VALUE, raw * raw));
    },
    0,
  );
}

/** Residual auxiliaries encode J*delta-rNew=-r with the original damping.
 * Hard interval rows use the same FK derivatives and current clinical box.
 * Original-coordinate KKT polishing uses tolerance 1e-12 and at most eight
 * corrections per QP variable, without another native solve or FK. Rejected
 * polishing retains the original solved primal; another native status stalls
 * with actual final residuals. The caller caps the whole direction to twelve degrees
 * and checks nonlinear geometry, because a linearized row is not a certificate.
 */
function constrained(
  jacobian: number[][],
  residual: number[],
  gradient: number[][],
  measured: number[],
  constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
  previous: number[],
  bounds: { minimum: number; maximum: number }[],
): number[] {
  const n: number = previous.length;
  const ids: number[] = previous.map((_: number, i: number): number => i);
  const rows: IAutoMovieQuadraticRow[] = bounds.map(
    (
      bound: { minimum: number; maximum: number },
      i: number,
    ): IAutoMovieQuadraticRow => ({
      indices: [i],
      weights: [1],
      lower: bound.minimum - previous[i]!,
      upper: bound.maximum - previous[i]!,
    }),
  );
  for (let i: number = 0; i < residual.length; i++)
    rows.push({
      indices: [...ids, n + i],
      weights: [...jacobian.map((column: number[]): number => column[i]!), -1],
      lower: -residual[i]!,
      upper: -residual[i]!,
    });
  constraints.forEach(
    (item: AutoMovieHumanClinicalIk.IConstraint, i: number): void => {
      rows.push({
        indices: ids,
        weights: gradient.map((column: number[]): number => column[i]!),
        lower: item.minimum === undefined ? null : item.minimum - measured[i]!,
        upper: item.maximum === undefined ? null : item.maximum - measured[i]!,
      });
    },
  );
  const program: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
    diagonal: [
      ...previous.map((): number => 0.000002),
      ...residual.map((): number => 1),
    ],
    linear: new Array<number>(n + residual.length).fill(0),
    rows,
  };
  const native: ReturnType<typeof solveAutoMovieQuadraticProgram> =
    solveAutoMovieQuadraticProgram(program);
  if (native.status !== 1 || !native.primal.every(Number.isFinite))
    return previous.map((): number => 0);
  const result: ReturnType<typeof refineAutoMovieQuadraticProgram> =
    refineAutoMovieQuadraticProgram(program, native, {
      tolerance: 1e-12,
      maximumRefinements: 8 * program.diagonal.length,
    });
  return result.primal.slice(0, n);
}

/** Read a registered path without requiring clients to cast their pose. */
function read(pose: unknown, path: string): number {
  let value: unknown = pose;
  for (const part of path.split(".")) {
    if (typeof value !== "object" || value === null) return 0;
    value = Reflect.get(value, part);
  }
  return typeof value === "number" ? value : 0;
}

/** Write only a path already admitted against the public channel table. */
function write(pose: object, path: string, value: number): void {
  const parts: string[] = path.split(".");
  let node: object = pose;
  for (const part of parts.slice(0, -1)) {
    const child: unknown = Reflect.get(node, part);
    if (typeof child !== "object" || child === null)
      Reflect.set(
        node,
        part,
        node === pose && (part === "arms" || part === "legs")
          ? { left: {}, right: {} }
          : {},
      );
    node = Reflect.get(node, part) as object;
  }
  Reflect.set(node, parts[parts.length - 1]!, value);
}

/** Flatten positional residuals; all target coordinates must be finite. */
function errors(
  output: AutoMovieHumanSkeleton.IProjection,
  targets: AutoMovieHumanClinicalIk.ITarget[],
): number[] {
  return targets.flatMap(
    (target: AutoMovieHumanClinicalIk.ITarget): number[] => {
      const point: Controls.MetrePoint = pointAt(output, target);
      return point.map(
        (v: number, i: number): number => v - target.position[i]!,
      );
    },
  );
}

/** Resolve an admitted rigid point and refuse invalid FK, never substitute an origin. */
function pointAt(
  output: AutoMovieHumanSkeleton.IProjection,
  point: AutoMovieHumanClinicalIk.IBonePoint,
): Controls.MetrePoint {
  const at: AutoMovieHumanSkeleton.IPlacement | undefined = output.posed.find(
    (placement: AutoMovieHumanSkeleton.IPlacement): boolean =>
      placement.bone === point.bone,
  );
  if (
    !at ||
    !finitePoint(at.position) ||
    (point.localPoint !== undefined &&
      (!Array.isArray(at.rotation) ||
        at.rotation.length !== 4 ||
        ![0, 1, 2, 3].every((axis: number): boolean =>
          Number.isFinite(at.rotation[axis]),
        ) ||
        Math.abs(Math.hypot(...at.rotation) - 1) > 1e-6))
  )
    throw new Error(`Clinical IK target is missing or invalid: ${point.bone}`);
  return point.localPoint === undefined
    ? at.position
    : Math3D.add(at.position, Math3D.rotate(at.rotation, point.localPoint));
}

/** Read each required coordinate so sparse arrays cannot skip admission. */
function finitePoint(value: unknown): value is Controls.MetrePoint {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((axis: number): boolean => Number.isFinite(value[axis]))
  );
}

/** Largest three-dimensional target residual in metres. */
function maximum(residual: number[]): number {
  let value: number = 0;
  for (let i: number = 0; i < residual.length; i += 3)
    value = Math.max(
      value,
      Math.hypot(residual[i]!, residual[i + 1]!, residual[i + 2]!),
    );
  return value;
}

/** Pivoted elimination of the small damped positive-definite normal system. */
function linear(matrix: number[][], right: number[]): number[] {
  const n: number = right.length;
  const a: number[][] = matrix.map((row: number[], i: number): number[] => [
    ...row,
    right[i]!,
  ]);
  for (let c: number = 0; c < n; c++) {
    let pivot: number = c;
    for (let r: number = c + 1; r < n; r++)
      if (Math.abs(a[r]![c]!) > Math.abs(a[pivot]![c]!)) pivot = r;
    [a[c], a[pivot]] = [a[pivot]!, a[c]!];
    const divisor: number = a[c]![c]!;
    if (Math.abs(divisor) < 1e-14)
      return Array.from({ length: n }, (): number => 0);
    for (let j: number = c; j <= n; j++) a[c]![j] = a[c]![j]! / divisor;
    for (let r: number = 0; r < n; r++) {
      if (r === c) continue;
      const factor: number = a[r]![c]!;
      for (let j: number = c; j <= n; j++)
        a[r]![j] = a[r]![j]! - factor * a[c]![j]!;
    }
  }
  return a.map((row: number[]): number => row[n]!);
}
