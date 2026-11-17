import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { swivelArcs } from "./swivelArcs";

/**
 * How a joint's three clinical angles read from its rotation as a swivel
 * turns it: for a bone-local rotation that is a fixed rotation turned about a
 * fixed axis by the swivel, every entry of its matrix on the clinical basis
 * is `a + b cos ψ + c sin ψ` (Rodrigues' formula between two fixed
 * rotations), fitted exactly from the rotation at 0, 90 and 180 degrees, and
 * each clinical angle is read from those entries as
 * `decomposeJointRotationOnBasis` reads it: the middle angle of the
 * composition by its sine, an outer angle by the vector `atan2` takes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise on the rotation, why each entry is a sinusoid and how each angle is read from the entries.
 * @evidence contracts/development/design.md#principled-representation An angle is the sinusoid of its sine, or the two sinusoids of its vector with the sign its rest-relative angle takes; a joint is its three angles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading of one joint and the rest-relative form of a clinical interval: what a range's refused arcs and an immobile axis's roots share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exact fits from three rotations, never sampling; the composition order is the decomposition's own.
 */
export namespace swivelJointReadings {
  /**
   * A clinical axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three clinical axes.
   * @evidence contracts/development/design.md#principled-representation The interface's own three axis names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No alias or index stands for an axis.
   */
  export type Axis = "flexion" | "abduction" | "twist";

  /**
   * How an axis is read: the middle angle's sine, or an outer angle's vector
   * and the sign its rest-relative angle takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both forms and what `turn` is.
   * @evidence contracts/development/design.md#principled-representation The middle angle is `asin` of one entry and an outer angle `atan2` of two, as the decomposition reads them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One sinusoid, or two and a sign.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The two forms are a discriminated union; neither is optional in the other.
   */
  export type IRead =
    | { sine: swivelArcs.ISinusoid }
    | { y: swivelArcs.ISinusoid; x: swivelArcs.ISinusoid; turn: 1 | -1 };

  /** The three clinical axes, in the order a constraint lists them. */
  export const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];

  /**
   * Read a joint's three angles as sinusoids of the swivel.
   *
   * @param basis The joint's clinical basis, admitted and normalized (`normalizeJointAxes`).
   * @param rotation The joint's bone-local rotation at a swivel, degrees: a fixed rotation turned about a fixed axis by the swivel.
   * @returns Each axis's reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise on the rotation and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The entries `axis_i · (R axis_j)` are exact sinusoids of the swivel, fitted from three rotations; a distal twist composes Ry(a)·Rx(f)·Rz(t), with flexion in the middle, and a proximal one Rz(t)·Ry(a)·Rx(f), with abduction in the middle, as `decomposeJointRotationOnBasis` reads them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entries are sampled once and each axis names the entries it reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampling beyond the three rotations that determine a sinusoid; the handedness correction is the decomposition's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three rotations and nine dot products each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit is `swivelArcs.fitted`; one reading serves every bound and root of its joint.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned record.
   */
  export function of(
    basis: IAutoMovieJointAxes,
    rotation: (swivel: number) => IAutoMovieQuaternion,
  ): Record<Axis, IRead> {
    const handed: 1 | -1 =
      Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
        ? 1
        : -1;
    const axes: IAutoMovieVector3[] = [
      basis.flexion,
      basis.abduction,
      Vector3.scale(basis.twist, handed),
    ];

    // The entries R'[i][j] = axis_i · (R axis_j) at swivels 0, 90 and 180.
    const sampled: number[][][] = [0, 90, 180].map(
      (swivel: number): number[][] => {
        const q: IAutoMovieQuaternion = rotation(swivel);
        const turned: IAutoMovieVector3[] = axes.map(
          (axis: IAutoMovieVector3): IAutoMovieVector3 =>
            Quaternion.rotateVector(q, axis),
        );
        return axes.map((row: IAutoMovieVector3): number[] =>
          turned.map((column: IAutoMovieVector3): number =>
            Vector3.dot(row, column),
          ),
        );
      },
    );
    const entry = (i: number, j: number): swivelArcs.ISinusoid => {
      const [zero, quarter, half] = sampled.map(
        (m: number[][]): number => m[i]![j]!,
      ) as [number, number, number];
      return swivelArcs.fitted(zero, quarter, half);
    };
    return basis.twistPlacement === "distal"
      ? {
          flexion: { sine: swivelArcs.scaled(entry(1, 2), -1) },
          abduction: { y: entry(0, 2), x: entry(2, 2), turn: 1 },
          twist: { y: entry(1, 0), x: entry(1, 1), turn: handed },
        }
      : {
          flexion: { y: entry(2, 1), x: entry(2, 2), turn: 1 },
          abduction: { sine: swivelArcs.scaled(entry(2, 0), -1) },
          twist: { y: entry(1, 0), x: entry(0, 0), turn: handed },
        };
  }

  /**
   * A clinical interval as rest-relative degrees, ordered (the inverse of
   * `toClinicalAngle`).
   *
   * @param range The clinical interval, degrees.
   * @param frame The axis's rest frame; omitted, the interval is already rest-relative.
   * @returns Its two ends, the lesser first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the conversion and the order of the result.
   * @evidence contracts/development/implementation.md#principled-implementation A clinical angle is the neutral plus the sign times the rest-relative one, inverted at both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ends converted and ordered.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent frame is the identity map, not a guess.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rig(
    range: IAutoMovieAngleRange,
    frame: IAutoMovieAxisFrame | undefined,
  ): [number, number] {
    const sign: number = frame?.sign ?? 1;
    const neutral: number = frame?.neutral ?? 0;
    const ends: number[] = [
      (range.min - neutral) * sign,
      (range.max - neutral) * sign,
    ];
    return [Math.min(...ends), Math.max(...ends)];
  }
}
