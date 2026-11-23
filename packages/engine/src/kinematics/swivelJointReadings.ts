import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
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
 */
export namespace swivelJointReadings {
  /**
   * A clinical axis.
   */
  export type Axis = "flexion" | "abduction" | "twist";

  /**
   * How an axis is read: the middle angle's sine, or an outer angle's vector
   * and the sign its rest-relative angle takes.
   */
  export type IRead =
    | { sine: IAutoMovieSwivelArcs.ISinusoid }
    | { y: IAutoMovieSwivelArcs.ISinusoid; x: IAutoMovieSwivelArcs.ISinusoid; turn: 1 | -1 };

  /** The three clinical axes, in the order a constraint lists them. */
  export const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];

  /**
   * Read a joint's three angles as sinusoids of the swivel.
   *
   * @param basis The joint's clinical basis, admitted and normalized (`normalizeJointAxes`).
   * @param rotation The joint's bone-local rotation at a swivel, degrees: a fixed rotation turned about a fixed axis by the swivel.
   * @returns Each axis's reading.
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
    const entry = (i: number, j: number): IAutoMovieSwivelArcs.ISinusoid => {
      const [zero, quarter, half] = sampled.map(
        (m: number[][]): number => m[i]![j]!,
      ) as [number, number, number];
      return swivelArcs.fitted(zero, quarter, half);
    };
    // On the handed clinical basis, F·A·T is Rx(f)·Ry(a)·Rz(t).
    if (basis.rotationOrder === "flexion-abduction-twist")
      return {
        flexion: { y: swivelArcs.scaled(entry(1, 2), -1), x: entry(2, 2), turn: 1 },
        abduction: { sine: entry(0, 2) },
        twist: { y: swivelArcs.scaled(entry(0, 1), -1), x: entry(0, 0), turn: handed },
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
