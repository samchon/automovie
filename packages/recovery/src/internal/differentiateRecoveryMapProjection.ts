import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryMapLocalCurvature } from "../structures/internal/IAutoMovieRecoveryMapLocalCurvature";
import { differentiateRecoveryMapTangent } from "./differentiateRecoveryMapTangent";

/**
 * Differentiate the map's current-radius pinhole chart at current pixels.
 * A null tangent denotes six ordinary camera coordinates; an empty tangent
 * denotes the fixed camera, and two directions denote the seed sphere chart.
 *
 * @evidence contracts/common.md#principled-implementation Quotient Hessians compose with left-Exp rotation, independent additive translation and world points. The seed uses Exp(omega)R(X+dX)+r*normalize(t+Bz), r=norm(t) fixed at the current base. Its actual first derivative is P_t B and second derivative r*D2N(t)[B_i,B_j]; current pixels remain RX+t without an exact-unit or exact-orthonormal assumption.
 * @evidence contracts/common.md#clear-and-simple-design This optional second-order geometry owner returns one at-most-nine-dimensional local record; the existing projection/linearization continues to own original physical rows and rank data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite differences, known Hessian, pose differencing, depth clamp or exception catch supplies curvature. Nonrepresentable arithmetic returns null before model selection; malformed chart dimensions throw.
 * @evidence contracts/common.md#meaningful-documentation Local order is rotation, raw translation coefficients or additive translation, then world point. The seed shares the map's current-radius zero/first/second chart; lagged multipliers and Float arithmetic still supply no exact current-KKT Hessian, uniform accuracy or conditioning certificate.
 * @evidence contracts/performance.md#efficient-algorithms Fixed dimensions at most9 bound coordinate formation and two pixel Hessians by constant work per observation, within the caller's prepaid131072 visit allowance. Three-term coordinate and nine-term quotient contractions require no full-state matrix.
 * @evidence contracts/performance.md#reuse-equivalent-work Current rotated point, depth, quotient derivatives and one chart differential supply both pixels and all local first/second derivatives in this separately charged geometry pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed scratch holds at most3x9 first and3x9x9 second coordinate entries beside two9x9 output Hessians and two3-coordinate seed differential tuples. This remains within the admitted optional local scratch; all scratch expires at return and the caller consumes one record before the next observation.
 */
export function differentiateRecoveryMapProjection(
  pose: IAutoMovieRecoveryMapPose,
  point: readonly [number, number, number],
  intrinsic: readonly number[],
  tangent: readonly (readonly [number, number, number])[] | null,
): IAutoMovieRecoveryMapLocalCurvature | null {
  if (
    pose.rotation.length !== 9 ||
    pose.translation.length !== 3 ||
    point.length !== 3 ||
    intrinsic.length !== 9 ||
    (tangent !== null && tangent.length !== 0 && tangent.length !== 2)
  )
    throw new Error("camera-curvature: finite owned local chart required");
  for (const values of [pose.rotation, pose.translation, point, intrinsic])
    for (let at: number = 0; at < values.length; at++)
      if (!Number.isFinite(values[at]))
        throw new Error("camera-curvature: finite owned local chart required");
  if (tangent !== null)
    for (let axis: number = 0; axis < tangent.length; axis++) {
      const row: readonly number[] | undefined = tangent[axis];
      if (row?.length !== 3)
        throw new Error("camera-curvature: finite owned local chart required");
      for (let at: number = 0; at < 3; at++)
        if (!Number.isFinite(row[at]))
          throw new Error(
            "camera-curvature: finite owned local chart required",
          );
    }
  const count: number = tangent === null ? 6 : tangent.length === 0 ? 0 : 5;
  const width: number = count + 3;
  const rotated: [number, number, number] = AutoMovieMatrix3.apply(
    pose.rotation,
    point,
  );
  const q: number[] = rotated.map(
    (value: number, axis: number): number => value + pose.translation[axis]!,
  );
  if (!q.every(Number.isFinite) || !(q[2]! > 0)) return null;
  const x: number = q[0]! / q[2]!,
    y: number = q[1]! / q[2]!;
  const pixel: [number, number] = [
    intrinsic[0]! * x + intrinsic[1]! * y + intrinsic[2]!,
    intrinsic[4]! * y + intrinsic[5]!,
  ];
  const gradient: number[][] = [
    [
      intrinsic[0]! / q[2]!,
      intrinsic[1]! / q[2]!,
      -(intrinsic[0]! * x + intrinsic[1]! * y) / q[2]!,
    ],
    [0, intrinsic[4]! / q[2]!, (-intrinsic[4]! * y) / q[2]!],
  ];
  const first: number[][] = Array.from({ length: 3 }, (): number[] =>
    new Array<number>(width).fill(0),
  );
  const second: number[][][] = Array.from({ length: 3 }, (): number[][] =>
    Array.from({ length: width }, (): number[] =>
      new Array<number>(width).fill(0),
    ),
  );
  const cross: (
    axis: number,
    value: readonly number[],
    component: number,
  ) => number = (
    axis: number,
    value: readonly number[],
    component: number,
  ): number =>
    component === (axis + 1) % 3
      ? -value[(axis + 2) % 3]!
      : component === (axis + 2) % 3
        ? value[(axis + 1) % 3]!
        : 0;
  if (count > 0) {
    for (let axis: number = 0; axis < 3; axis++)
      for (let component: number = 0; component < 3; component++) {
        first[component]![axis] = cross(axis, rotated, component);
        for (let other: number = 0; other < 3; other++)
          second[component]![axis]![other] =
            ((component === other ? rotated[axis]! : 0) +
              (component === axis ? rotated[other]! : 0)) /
              2 -
            (axis === other ? rotated[component]! : 0);
      }
    if (tangent === null) {
      for (let axis: number = 0; axis < 3; axis++) first[axis]![3 + axis] = 1;
    } else {
      const norm: number = Math.hypot(...pose.translation);
      if (!(norm > 0) || !Number.isFinite(norm)) return null;
      const squared: number = norm * norm,
        fourth: number = squared * squared;
      const products: number[] = tangent.map((row: readonly number[]): number =>
        row.reduce(
          (sum: number, value: number, axis: number): number =>
            sum + value * pose.translation[axis]!,
          0,
        ),
      );
      if (![squared, fourth, ...products].every(Number.isFinite)) return null;
      const differential: [number, number, number][] | null =
        differentiateRecoveryMapTangent(pose.translation, tangent);
      if (differential === null) return null;
      for (let axis: number = 0; axis < 2; axis++)
        for (let component: number = 0; component < 3; component++) {
          first[component]![3 + axis] = differential[axis]![component]!;
          for (let other: number = 0; other < 2; other++) {
            const dot: number = tangent[axis]!.reduce(
              (sum: number, value: number, at: number): number =>
                sum + value * tangent[other]![at]!,
              0,
            );
            second[component]![3 + axis]![3 + other] =
              -(
                tangent[axis]![component]! * products[other]! +
                tangent[other]![component]! * products[axis]! +
                pose.translation[component]! * dot
              ) /
                squared +
              (3 *
                pose.translation[component]! *
                products[axis]! *
                products[other]!) /
                fourth;
          }
        }
    }
  }
  for (let axis: number = 0; axis < 3; axis++) {
    const column: number[] = [
      pose.rotation[axis]!,
      pose.rotation[3 + axis]!,
      pose.rotation[6 + axis]!,
    ];
    for (let component: number = 0; component < 3; component++) {
      first[component]![count + axis] = column[component]!;
      if (count > 0)
        for (let rotation: number = 0; rotation < 3; rotation++) {
          const mixedDerivative: number = cross(rotation, column, component);
          second[component]![count + axis]![rotation] = mixedDerivative;
          second[component]![rotation]![count + axis] = mixedDerivative;
        }
    }
  }
  const jacobian: number[][] = [],
    hessians: number[][][] = [];
  for (let pixelAxis: number = 0; pixelAxis < 2; pixelAxis++) {
    const local: number[] = new Array<number>(width).fill(0);
    const hessian: number[][] = Array.from({ length: width }, (): number[] =>
      new Array<number>(width).fill(0),
    );
    for (let axis: number = 0; axis < width; axis++) {
      for (let component: number = 0; component < 3; component++)
        local[axis]! +=
          gradient[pixelAxis]![component]! * first[component]![axis]!;
      for (let other: number = axis; other < width; other++) {
        let value: number = 0;
        for (let component: number = 0; component < 3; component++) {
          value +=
            gradient[pixelAxis]![component]! *
            second[component]![axis]![other]!;
          for (let next: number = 0; next < 3; next++) {
            const quotient: number =
              -(
                (next === 2 ? gradient[pixelAxis]![component]! : 0) +
                (component === 2 ? gradient[pixelAxis]![next]! : 0)
              ) / q[2]!;
            value += first[component]![axis]! * quotient * first[next]![other]!;
          }
        }
        hessian[other]![axis] = value;
        hessian[axis]![other] = value;
      }
    }
    if (
      !local.every(Number.isFinite) ||
      hessian.some((row: number[]): boolean => !row.every(Number.isFinite))
    )
      return null;
    jacobian.push(local);
    hessians.push(hessian);
  }
  if (!pixel.every(Number.isFinite)) return null;
  return { pixel, jacobian, hessians };
}
