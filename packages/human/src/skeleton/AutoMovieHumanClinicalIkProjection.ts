import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIk } from "./AutoMovieHumanClinicalIk";
import type { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * Original rigid-point readings and separate local Float64 projection envelopes.
 * This preserves the upstream 727496d823 measurement contract: raw interval
 * violations remain public, exact channel misses receive no projection allowance,
 * poorly resolved lines fail closed, and a positive merit cannot square to zero.
 *
 * @evidence contracts/common.md#principled-implementation Retains the upstream transform-operand roundoff bound, inverse-span condition, raw values, direct interval comparison and positive-underflow merit floor.
 * @evidence contracts/common.md#clear-and-simple-design Projection and receipt arithmetic have one owner; the fitting loop chooses updates and the separate arithmetic owner builds its QP.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored interval or target tolerance is changed; channel roundoff is zero and meaningful or unresolved numerical violations remain visible.
 * @evidence contracts/common.md#meaningful-documentation States source contract, raw diagnostic ownership, local numerical equivalence and fail-closed limitations.
 * @evidence contracts/performance.md#efficient-algorithms Each reading scans its fixed three-dimensional operands and existing bone lookups; vectors remain linear in descriptor count, without dense geometric storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each measurement observes the current immutable FK snapshot; no receipt is cached across poses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned value/envelope arrays belong to one measurement; no evaluator, solver or foreign snapshot is retained.
 */
export namespace AutoMovieHumanClinicalIkProjection {
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
        return sum + (raw <= measured.roundoff[i]! ? 0 : Math.max(Number.MIN_VALUE, raw * raw));
      },
      0,
    );
  }

  /** Read a registered path without requiring clients to cast their pose. */
  export function read(pose: unknown, path: string): number {
    let value: unknown = pose;
    for (const part of path.split(".")) {
      if (typeof value !== "object" || value === null) return 0;
      value = Reflect.get(value, part);
    }
    return typeof value === "number" ? value : 0;
  }

  /** Resolve an admitted rigid point and refuse invalid FK, never substitute an origin. */
  export function pointAt(
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
  export function finitePoint(value: unknown): value is Controls.MetrePoint {
    return (
      Array.isArray(value) &&
      value.length === 3 &&
      [0, 1, 2].every((axis: number): boolean => Number.isFinite(value[axis]))
    );
  }
}
