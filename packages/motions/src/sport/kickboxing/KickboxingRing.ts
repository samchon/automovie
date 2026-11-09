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
 */
export namespace KickboxingRing {
  /** A ring. */
  export interface IRing {
    /** The centre on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** The side between the ropes, metres; positive. */
    size: number;

    /** The heading of the ring's +Z side, degrees about +Y. */
    yaw: number;
  }

  /** A corner's name. */
  export type Corner = "red" | "blue" | "neutralA" | "neutralB";

  /**
   * A corner's floor point, a margin inside the ropes along both sides.
   *
   * @param ring The ring.
   * @param corner Which corner.
   * @param margin How far inside the ropes, metres.
   * @returns World metres.
   */
  export function corner(ring: IRing, corner: Corner, margin: number = 0): IAutoMovieVector3 {
    const h: number = ring.size / 2 - margin;
    const local: Record<Corner, [number, number]> = { red: [-h, -h], blue: [h, h], neutralA: [h, -h], neutralB: [-h, h] };
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
   */
  export function inside(ring: IRing, point: IAutoMovieVector3, margin: number = 0): boolean {
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
   */
  export function clamp(ring: IRing, point: IAutoMovieVector3, margin: number = 0): IAutoMovieVector3 {
    const h: number = ring.size / 2 - margin;
    if (!(h >= 0)) throw new Error("A ring margin is less than half its size");
    const [x, z] = local(ring, point);
    return world(ring, Math.max(-h, Math.min(h, x)), Math.max(-h, Math.min(h, z)));
  }

  /** A ring-local point in world metres. */
  function world(ring: IRing, x: number, z: number): IAutoMovieVector3 {
    const r: number = (ring.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    return { x: ring.centre.x + x * c + z * s, y: ring.centre.y, z: ring.centre.z - x * s + z * c };
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
