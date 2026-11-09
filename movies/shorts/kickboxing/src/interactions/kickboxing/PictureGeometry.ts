import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The geometry the picture measures read off displayed bodies and the
 * delivered lens: speeds along sampled paths, a leg's knee flexion and
 * whether a point projects inside the frame, with the summary statistics
 * they report.
 *
 * ```ts
 * PictureGeometry.flexion({ hip, knee, ankle }); // degrees
 * PictureGeometry.inside(lens, point, { fieldOfView, aspect });
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#stance Stance knee flexion on the displayed legs.
 * @evidence docs/research/cinematography/fight-coverage.md#targets Points inside the delivered frame.
 */
export namespace PictureGeometry {
  /**
   * The peak speed of a point along its sampled path.
   *
   * @param path Instants and the point's world position, in time order.
   * @returns Metres per second.
   */
  export function peak(
    path: readonly { seconds: number; point: IAutoMovieVector3 }[],
  ): number {
    let most: number = 0;
    for (let k: number = 1; k < path.length; k++)
      most = Math.max(
        most,
        speed(
          path[k - 1]!.point,
          path[k]!.point,
          path[k]!.seconds - path[k - 1]!.seconds,
        ),
      );
    return most;
  }

  /**
   * Knee flexion of a displayed leg: the angle between thigh and shank.
   *
   * @param leg The leg's hip, knee and ankle joints.
   * @returns Degrees; 0 for a straight leg.
   */
  export function flexion(leg: {
    hip: IAutoMovieVector3;
    knee: IAutoMovieVector3;
    ankle: IAutoMovieVector3;
  }): number {
    const t: IAutoMovieVector3 = Vector3.subtract(leg.knee, leg.hip);
    const s: IAutoMovieVector3 = Vector3.subtract(leg.ankle, leg.knee);
    const c: number =
      Vector3.dot(t, s) / (Vector3.length(t) * Vector3.length(s));
    return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  }

  /**
   * Whether a world point projects inside the delivered frame.
   *
   * @param lens The lens position and look-at point.
   * @param point The point.
   * @param limits The vertical field of view (radians) and the frame aspect.
   * @returns True inside the frame.
   */
  export function inside(
    lens: { position: IAutoMovieVector3; target: IAutoMovieVector3 },
    point: IAutoMovieVector3,
    limits: { fieldOfView: number; aspect: number },
  ): boolean {
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(lens.target, lens.position),
    );
    const right: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(forward, { x: 0, y: 1, z: 0 }),
    );
    const up: IAutoMovieVector3 = Vector3.cross(right, forward);
    const v: IAutoMovieVector3 = Vector3.subtract(point, lens.position);
    const depth: number = Vector3.dot(v, forward);
    if (depth <= 0) return false;
    const tan: number = Math.tan(limits.fieldOfView / 2);
    return (
      Math.abs(Vector3.dot(v, up) / depth) <= tan &&
      Math.abs(Vector3.dot(v, right) / depth) <= tan * limits.aspect
    );
  }

  /**
   * Speed between two positions.
   *
   * @param a The earlier position.
   * @param b The later position.
   * @param dt Seconds between them.
   * @returns Metres per second; 0 without elapsed time.
   */
  export function speed(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    dt: number,
  ): number {
    return dt > 0 ? Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / dt : 0;
  }

  /**
   * The median of values.
   *
   * @param values At least one value.
   * @returns The middle value, or the mean of the two middle values.
   */
  export function median(values: readonly number[]): number {
    const sorted: number[] = [...values].sort((x, y) => x - y);
    const mid: number = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  /**
   * The mean of values.
   *
   * @param values At least one value.
   * @returns Their mean.
   */
  export function mean(values: readonly number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}
