import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";

/**
 * The head's median back profile B: the forward place of the skin on the
 * back midline at a height, from the neck ring to the vertex.
 *
 * Over the opisthocranion it is the vault's ellipse about that point: half
 * its length behind the skull's centre, reaching the vertex. Under it one
 * quintic Hermite span runs down to the neck ring's back, taking the
 * opisthocranion's jet from the vault (place, a level tangent, the ellipse's
 * curvature `reach / top^2`) and the ring's from the neck (its place and
 * slope; the neck's chain publishes no station curvature, so the seam with it
 * is G1 and the span starts straight). So the back is C2 from the ring to the
 * vertex and the nape's turn is wherever the two jets put it. A vault share held at a
 * floor under the opisthocranion had left a corner there, the skin's back
 * stepping forward 27 mm in 30 mm and then out again to the neck, which read
 * as a ring round the back of the head.
 */
export namespace AutoMovieHumanHeadBackProfile {
  /** The profile's owners, calibration millimetres; x forward, y up. */
  export interface IProfile {
    /** Skull centre's forward place, midway from glabella to opisthocranion. */
    centre: number;

    /** The vault's reach behind the centre at the opisthocranion. */
    reach: number;

    /** Opisthocranion's height. */
    occiput: number;

    /** Vertex height. */
    vertex: number;

    /** The neck ring's back on the midline: height, forward place and `dx/dy`. */
    ring: { y: number; x: number; slope: number };
  }

  /**
   * Forward place of the back midline at a height.
   *
   * @param p The profile's owners.
   * @param y Height.
   */
  export function at(p: IProfile, y: number): number {
    const top: number = Math.max(1e-6, p.vertex - p.occiput);
    if (y >= p.occiput) {
      const u: number = Math.min(1, (y - p.occiput) / top);
      return p.centre - p.reach * Math.sqrt(Math.max(0, 1 - u * u));
    }
    const h: number = p.occiput - p.ring.y;
    if (y <= p.ring.y || h <= 0) return p.ring.x + p.ring.slope * (y - p.ring.y);
    return AutoMovieHumanSeam.quintic(
      [[p.ring.x], [p.ring.slope], [0]],
      [[p.centre - p.reach], [0], [p.reach / (top * top)]],
      h,
      (y - p.ring.y) / h,
    )[0]!;
  }
}
