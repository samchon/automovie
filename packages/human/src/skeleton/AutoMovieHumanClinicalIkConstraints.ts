import type { IAutoMovieQuadraticRow } from "@automovie/engine/math/IAutoMovieQuadraticRow";
import { refineAutoMovieQuadraticProgram } from "@automovie/engine/math/refineAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticProgram } from "@automovie/engine/math/solveAutoMovieQuadraticProgram";

import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIkInput as AutoMovieHumanClinicalIk } from "./AutoMovieHumanClinicalIkInput";
import { AutoMovieHumanClinicalIkMath as IkMath } from "./AutoMovieHumanClinicalIkMath";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** Admission, nonlinear measurements and constrained directions for the same public IK objective. */
export namespace AutoMovieHumanClinicalIkConstraints {
  /** Admit and copy dense descriptors before touching either evaluator capability. */
  export function admit(
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
          !IkMath.bonePoint(item.point) ||
          !IkMath.bonePoint(item.line.origin) ||
          !IkMath.bonePoint(item.line.end) ||
          !IkMath.finitePoint(item.normal) ||
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

  /** Raw scalar readings and a separate arithmetic uncertainty, never a physical contact allowance. */
  export interface Measurement {
    /** Original values used by finite differences, QP rows and public diagnostics. */
    values: number[];
    /** Local Float64 projection error envelopes; channel readings remain exact. */
    roundoff: number[];
  }

  /** Actual FK values; moving origins and moving line directions share one snapshot. */
  export function measure(
    output: AutoMovieHumanSkeleton.IProjection,
    pose: IAutoMovieHumanPose,
    constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
  ): Measurement {
    const roundoff: number[] = [];
    const values: number[] = constraints.map(
      (item: AutoMovieHumanClinicalIk.IConstraint): number => {
        if (item.kind === "channel") {
          roundoff.push(0);
          return IkMath.read(pose, item.channel);
        }
        const origin: Controls.MetrePoint = IkMath.pointAt(
          output,
          item.line.origin,
        );
        const end: Controls.MetrePoint = IkMath.pointAt(output, item.line.end);
        const point: Controls.MetrePoint = IkMath.pointAt(output, item.point);
        const axis: Controls.MetrePoint = Math3D.sub(end, origin);
        const offset: Controls.MetrePoint = Math3D.sub(point, origin);
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
        roundoff.push(
          projectionRoundoff(
            pointMagnitude(output, item.line.origin) +
              pointMagnitude(output, item.line.end) +
              pointMagnitude(output, item.point),
            offset,
            item.normal,
            length,
          ),
        );
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
  export function projectionRoundoff(
    magnitude: number,
    offset: Controls.MetrePoint,
    normal: Controls.MetrePoint,
    length: number,
  ): number {
    const unit: number = Number.EPSILON / 2;
    const gamma: number = (256 * unit) / (1 - 256 * unit);
    const condition: number = (gamma * magnitude) / length;
    if (!Number.isFinite(condition) || condition > Math.sqrt(unit)) return 0;
    const displacement: number = offset.reduce(
      (sum: number, value: number): number => sum + Math.abs(value),
      0,
    );
    const normalMagnitude: number = normal.reduce(
      (sum: number, value: number): number => sum + Math.abs(value),
      0,
    );
    const allowance: number =
      gamma *
      normalMagnitude *
      (magnitude + displacement + (2 * magnitude * displacement) / length);
    return Number.isFinite(allowance) ? allowance : 0;
  }

  /** Absolute transform-operand magnitude retains cancellation that a final world point would hide. */
  export function pointMagnitude(
    output: AutoMovieHumanSkeleton.IProjection,
    point: AutoMovieHumanClinicalIk.IBonePoint,
  ): number {
    const placement: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
      (row: AutoMovieHumanSkeleton.IPlacement): boolean =>
        row.bone === point.bone,
    )!;
    const position: number = placement.position.reduce(
      (sum: number, value: number): number => sum + Math.abs(value),
      0,
    );
    if (point.localPoint === undefined) return position;
    const quaternion: number = placement.rotation.reduce(
      (sum: number, value: number): number => sum + Math.abs(value),
      0,
    );
    const local: number = point.localPoint.reduce(
      (sum: number, value: number): number => sum + Math.abs(value),
      0,
    );
    return position + quaternion * quaternion * local;
  }

  /** Nonnegative physical interval distance, with no acceptance-band relaxation. */
  export function distance(
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
  export function satisfied(
    measured: Measurement,
    constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
  ): boolean {
    return measured.values.every(
      (value: number, i: number): boolean =>
        distance(value, constraints[i]!) <= measured.roundoff[i]!,
    );
  }

  /** Squared violation merit preserves a positive floor when its square would underflow. */
  export function violation(
    measured: Measurement,
    constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
  ): number {
    return measured.values.reduce(
      (sum: number, value: number, i: number): number => {
        const raw: number = distance(value, constraints[i]!);
        return (
          sum +
          (raw <= measured.roundoff[i]!
            ? 0
            : Math.max(Number.MIN_VALUE, raw * raw))
        );
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
  export function constrained(
    jacobian: number[][],
    residual: number[],
    gradient: number[][],
    measured: number[],
    constraints: readonly AutoMovieHumanClinicalIk.IConstraint[],
    previous: number[],
    bounds: { minimum: number; maximum: number }[],
    prior: number[],
    priorSquared: number,
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
        weights: [
          ...jacobian.map((column: number[]): number => column[i]!),
          -1,
        ],
        lower: -residual[i]!,
        upper: -residual[i]!,
      });
    constraints.forEach(
      (item: AutoMovieHumanClinicalIk.IConstraint, i: number): void => {
        rows.push({
          indices: ids,
          weights: gradient.map((column: number[]): number => column[i]!),
          lower:
            item.minimum === undefined ? null : item.minimum - measured[i]!,
          upper:
            item.maximum === undefined ? null : item.maximum - measured[i]!,
        });
      },
    );
    const program: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
      diagonal: [
        ...previous.map((): number => 0.000002 + priorSquared),
        ...residual.map((): number => 1),
      ],
      linear: [
        ...previous.map(
          (value: number, i: number): number =>
            priorSquared * (value - prior[i]!),
        ),
        ...residual.map((): number => 0),
      ],
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
}
