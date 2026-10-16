import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_RINGS } from "./AUTOMOVIE_HUMAN_RINGS";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";

/**
 * Frame and ring-order calculations shared by generated cage stations.
 *
 * These pure calculations own the distal winding convention and the station's
 * orthonormal axes. Lengths keep their caller's unit, directions are unit
 * vectors in that same frame, and angles are radians. They do not retain or
 * emit cage vertices; AutoMovieHumanCageBuilder keeps the existing public
 * aliases so callers share one calculation without a consumer migration.
 */
export namespace AutoMovieHumanCageFrame {
  /**
   * Layout index of each build-order position of a junction ring.
   *
   * Build order runs counterclockwise about the site axis pointing distally, from the start mark. The proximal part's ring normal is that axis, so its layout order is the build order; the distal part's normal is reversed, so build position `k` is layout vertex `(count - k) % count`.
   *
   * @param layout The part's ring layout at the site
   * @returns Layout index per build position
   */
  export function buildOrder(layout: IAutoMovieHumanRingLayout): number[] {
    const n: number = layout.count;
    const distal: boolean = isDistal(layout);
    return Array.from({ length: n }, (_: unknown, k: number): number =>
      distal ? (n - k) % n : k,
    );
  }

  /**
   * Unit direction of each build-order position of a junction ring.
   *
   * @param layout The part's ring layout at the site
   * @returns Direction per build position
   */
  export function buildDirections(
    layout: IAutoMovieHumanRingLayout,
  ): IAutoMovieVector3[] {
    return buildOrder(layout).map(
      (j: number): IAutoMovieVector3 => layout.directions[j]!,
    );
  }

  /**
   * Positions of a station: each direction scaled by the radius it is given, from an origin.
   *
   * @param origin Centre of the station
   * @param directions Unit directions in build order
   * @param radius Distance along each direction, by its index
   * @returns The positions
   */
  export function around(
    origin: IAutoMovieVector3,
    directions: IAutoMovieVector3[],
    radius: (k: number) => number,
  ): IAutoMovieVector3[] {
    return directions.map(
      (d: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(origin, [d, radius(k)]),
    );
  }

  /**
   * Rotate a vector about a unit axis by the right-hand rule.
   *
   * @param v The vector
   * @param axis Unit axis
   * @param angle Radians
   * @returns The rotated vector
   */
  export function rotate(
    v: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    angle: number,
  ): IAutoMovieVector3 {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return AutoMovieHumanVector.offset(
      AutoMovieHumanVector.of(0, 0, 0),
      [v, c],
      [AutoMovieHumanVector.cross(axis, v), s],
      [axis, AutoMovieHumanVector.dot(axis, v) * (1 - c)],
    );
  }

  /**
   * Signed angle from one vector to another about a unit axis, both perpendicular to it.
   *
   * @param from Start vector
   * @param to End vector
   * @param axis Unit axis
   * @returns Radians in (-π, π], counterclockwise positive
   */
  export function angle(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    axis: IAutoMovieVector3,
  ): number {
    return Math.atan2(
      AutoMovieHumanVector.dot(AutoMovieHumanVector.cross(from, to), axis),
      AutoMovieHumanVector.dot(from, to),
    );
  }

  /**
   * Distance from the centre to an ellipse along a direction at an angle from its first semi-axis.
   *
   * @param a Semi-axis along the angle's zero
   * @param b Semi-axis a quarter turn on
   * @param angle Radians
   * @returns The radius
   */
  export function ellipse(a: number, b: number, angle: number): number {
    return (a * b) / Math.hypot(b * Math.cos(angle), a * Math.sin(angle));
  }

  /**
   * Counterclockwise loop of directions about an axis, starting at a reference, for an intermediate station.
   *
   * @param axis Unit axis
   * @param reference Unit direction perpendicular to the axis
   * @param count Number of directions
   * @returns The directions
   */
  export function turn(
    axis: IAutoMovieVector3,
    reference: IAutoMovieVector3,
    count: number,
  ): IAutoMovieVector3[] {
    const binormal: IAutoMovieVector3 = AutoMovieHumanVector.cross(
      axis,
      reference,
    );
    return Array.from(
      { length: count },
      (_: unknown, k: number): IAutoMovieVector3 => {
        const angle: number = (2 * Math.PI * k) / count;
        return AutoMovieHumanVector.offset(
          AutoMovieHumanVector.of(0, 0, 0),
          [reference, Math.cos(angle)],
          [binormal, Math.sin(angle)],
        );
      },
    );
  }
}

/** Whether a layout belongs to its site's distal part. */
const isDistal: (layout: IAutoMovieHumanRingLayout) => boolean = (layout: IAutoMovieHumanRingLayout): boolean =>
  AUTOMOVIE_HUMAN_RINGS[layout.site].distal === layout.part;
