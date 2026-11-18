import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { rotationVectorJacobian } from "../math/rotationVectorJacobian";
import { MotionTrajectoryInterval } from "./MotionTrajectoryInterval";
import type { MotionTrajectoryRead } from "./MotionTrajectoryRead";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import { samplePoseVelocity } from "./samplePoseVelocity";

/**
 * Numeric quaternion projections shared by full and orientation-only reads.
 * Returned internal readers may borrow their numeric records; the public
 * trajectory boundary copies every quaternion before returning it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States internal borrowing, public copying, held endpoints and the fixed/adaptive numeric inputs.
 * @evidence contracts/development/design.md#principled-representation Completed knot orientations/rates or dense rotation coefficients define the same curve independently of vector-state interpolation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface MotionTrajectoryRead consumes both factories for its existing at and optional orientation projections.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No RHS, shape history, physical budget or second orientation representation is retained.
 */
export namespace MotionTrajectoryQuaternion {
  /**
   * Project fixed knots through a cubic with exact endpoint body derivatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads seconds, holds endpoints and lends the internally retained quaternion to the copying public owner.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original shortest endpoint rotation vector and cubic Hermite weights, with Jr^-1 of the endpoint body rate rather than a truncated differential; the start derivative is the start body rate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Locate the interval, reuse its endpoint differential and evaluate the same body exponential.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No vector state is read and no interpolation grid or angular tolerance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) lookup and quaternion work, with one previous-time and one previous-interval record; no n-component vector interpolation is performed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Full and quaternion-only playback share one exact-time numeric quaternion reader; an immutable interval shares its rotation vector and endpoint slope.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains numeric knot orientations/rates and fixed-size previous records only; public callers receive copies and no physical callback enters this scope.
   */
  export function fixed(props: MotionTrajectoryRead.IFixed): (time: number) => IAutoMovieQuaternion | null {
    const { t0, t1, h, times, qs, ks, oriented }: MotionTrajectoryRead.IFixed = props;
    let interval: { index: number; vector: IAutoMovieVector3; slope: IAutoMovieVector3 } | undefined;
    return remembered((time: number): IAutoMovieQuaternion | null => {
      if (!oriented) return null;
      const t: number = Math.max(t0, Math.min(t1, time));
      const i: number = Math.min(times.length - 2, Math.floor((t - t0) / h));
      const span: number = times[i + 1]! - times[i]!;
      const u: number = (t - times[i]!) / span;
      if (u >= 1) return qs[i + 1]!;
      if (interval === undefined || interval.index !== i) {
        const vector: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
          Quaternion.multiply(Quaternion.inverse(qs[i]!), qs[i + 1]!),
        );
        const slope: IAutoMovieVector3 | null = rotationVectorJacobian.inverse(vector, ks[i + 1]!.w!);
        if (slope === null) throw new Error("The fixed orientation's endpoint differential is not representable");
        interval = { index: i, vector, slope };
      }
      const u2: number = u * u;
      const u3: number = u2 * u;
      const h10: number = u3 - 2 * u2 + u;
      const h01: number = -2 * u3 + 3 * u2;
      const h11: number = u3 - u2;
      const slope0: number = h10 * span;
      const slope1: number = h11 * span;
      const w0: IAutoMovieVector3 = ks[i]!.w!;
      return MotionTrajectoryRotation.turn(qs[i]!, {
        x: slope0 * w0.x + h01 * interval.vector.x + slope1 * interval.slope.x,
        y: slope0 * w0.y + h01 * interval.vector.y + slope1 * interval.slope.y,
        z: slope0 * w0.z + h01 * interval.vector.z + slope1 * interval.slope.z,
      });
    });
  }

  /**
   * Project accepted dense rotation coefficients without the vector block.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads film seconds and preserves the dense reader's held-end and NaN branch behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same accepted interval, polynomial and exponential as the full state reader, including the optional paired quintic coefficient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the common numeric interval, hold the endpoint or evaluate its quaternion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No vector interpolation, physical reevaluation or alternative q curve is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(log A) lookup for A accepted steps and constant quaternion work; one exact-time read is reused.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Full and projected readers consume one quaternion owner and common numeric interval locator. A full read's identical search/share is reused rather than repeated for its quaternion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the numeric interval reader, endpoint q and one previous quaternion; its factory captures completed numeric steps only, never builder props, RHS or shape history.
   */
  export function dense(
    locate: ReturnType<typeof MotionTrajectoryInterval>, end: IAutoMovieQuaternion | null,
  ): (time: number) => IAutoMovieQuaternion | null {
    return remembered((time: number): IAutoMovieQuaternion | null => {
      const located: ReturnType<typeof locate> = locate(time);
      if (located === undefined) return end;
      const { step, u }: typeof located = located;
      return step.q === null ? null : MotionTrajectoryRotation.turn(
        step.q, MotionTrajectoryRotation.curve(step.turns, u),
      );
    });
  }

  /** Lend one exact requested time; the public owner always copies the result. */
  function remembered(read: (time: number) => IAutoMovieQuaternion | null): (time: number) => IAutoMovieQuaternion | null {
    let previous: number | undefined;
    let value: IAutoMovieQuaternion | null | undefined;
    return (time: number): IAutoMovieQuaternion | null => {
      if (value === undefined || !Object.is(previous, time)) {
        value = read(time);
        previous = time;
      }
      return value;
    };
  }
}
