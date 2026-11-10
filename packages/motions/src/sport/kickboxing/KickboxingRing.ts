import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A bounded fighting area: a square ring on the floor, centred on a point
 * and turned by a heading, inside its ropes. Footwork and staging read it to
 * keep the fighters' stances inside the ropes and to find its corners.
 *
 * The ring is a square of `size` metres between the ropes (GLORY rings are
 * 6.1 to 7.3 m inside the ropes; the size is the production's). Corners are
 * named in the ring's own frame: the red and blue corners on one diagonal,
 * the two neutral corners on the other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ring's shape, frame, the source of its size range and the corner naming.
 * @evidence contracts/development/design.md#principled-representation A square on the floor as a centre, a side in metres and a heading in degrees, with corners as a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ring, its corners and the three queries footwork, staging and the knockdown count read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector; the size is the production's, not fixed here.
 */
export namespace KickboxingRing {
  /**
   * A ring.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation A centre in world metres, a side in metres (positive) and a heading in degrees about +Y; positivity is left to the queries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values every query reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IRing {
    /** The centre on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** The side between the ropes, metres; positive. */
    size: number;

    /** The heading of the ring's +Z side, degrees about +Y. */
    yaw: number;
  }

  /**
   * A corner's name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four corners; the namespace places them on the diagonals.
   * @evidence contracts/development/design.md#principled-representation A closed union of the four corners a ring has.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The corners the corner query and the knockdown count name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Corner = "red" | "blue" | "neutralA" | "neutralB";

  /**
   * A corner's floor point, a margin inside the ropes along both sides.
   *
   * @param ring The ring.
   * @param corner Which corner.
   * @param margin How far inside the ropes, metres.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the margin's meaning and the units.
   * @evidence contracts/development/implementation.md#principled-implementation The corner's ring-local coordinates rotated by the ring's heading and translated to its centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A table of local corners and one frame change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function corner(
    ring: IRing,
    corner: Corner,
    margin: number = 0,
  ): IAutoMovieVector3 {
    const h: number = ring.size / 2 - margin;
    const local: Record<Corner, [number, number]> = {
      red: [-h, -h],
      blue: [h, h],
      neutralA: [h, -h],
      neutralB: [-h, h],
    };
    const [x, z] = local[corner];
    return world(ring, x, z);
  }

  /**
   * Whether a floor point lies at least a margin inside the ropes.
   *
   * @param ring The ring.
   * @param point The point, world metres.
   * @param margin The margin, metres.
   * @returns True inside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test, the margin and the units.
   * @evidence contracts/development/implementation.md#principled-implementation The point in ring-local coordinates against the half side less the margin on both axes, with a 1e-12 m tolerance for rounding on the boundary.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame change and two comparisons.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function inside(
    ring: IRing,
    point: IAutoMovieVector3,
    margin: number = 0,
  ): boolean {
    const [x, z] = local(ring, point);
    const h: number = ring.size / 2 - margin;
    return Math.abs(x) <= h + 1e-12 && Math.abs(z) <= h + 1e-12;
  }

  /**
   * The nearest floor point at least a margin inside the ropes.
   *
   * @param ring The ring.
   * @param point The point, world metres.
   * @param margin The margin, metres; below half the size.
   * @returns World metres, at floor height.
   * @throws {Error} When the margin is half the size or more.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result, the margin's bound and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The nearest point of a square is the per-axis clamp of the point's ring-local coordinates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two frame changes around one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A margin leaving no area throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function clamp(
    ring: IRing,
    point: IAutoMovieVector3,
    margin: number = 0,
  ): IAutoMovieVector3 {
    const h: number = ring.size / 2 - margin;
    if (!(h >= 0)) throw new Error("A ring margin is less than half its size");
    const [x, z] = local(ring, point);
    return world(
      ring,
      Math.max(-h, Math.min(h, x)),
      Math.max(-h, Math.min(h, z)),
    );
  }

  /** A ring-local point in world metres. */
  function world(ring: IRing, x: number, z: number): IAutoMovieVector3 {
    const r: number = (ring.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    return {
      x: ring.centre.x + x * c + z * s,
      y: ring.centre.y,
      z: ring.centre.z - x * s + z * c,
    };
  }

  /** A world point in ring-local coordinates. */
  function local(ring: IRing, p: IAutoMovieVector3): [number, number] {
    const r: number = (ring.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    const dx: number = p.x - ring.centre.x;
    const dz: number = p.z - ring.centre.z;
    return [dx * c - dz * s, dx * s + dz * c];
  }
}
