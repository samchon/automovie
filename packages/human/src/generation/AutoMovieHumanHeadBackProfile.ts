import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";

/**
 * The head's analytic median back authoring profile B: forward place on the
 * back midline at a height, from the neck ring to the vertex.
 *
 * Over the retained horizontal-tangent reference it is an ellipse reaching
 * the vertex. Under it one quintic Hermite span runs down to the neck ring's
 * back, taking the reference's template jet (place, a level tangent,
 * curvature `reach / top^2`) and the ring's from the neck (its place and
 * slope; the neck's chain publishes no station curvature, so the seam with it
 * is G1 and the span starts straight). The template is C2 through that
 * reference; its Y derivative is singular at the crown pole. The emitted
 * original curve is prepared separately by the engine. HeadCaliper closes
 * its maximum g-to-posterior chord; that point need not be the template's
 * horizontal tangent. A vault share held at a floor under the reference had
 * left a corner there, the skin's back
 * stepping forward 27 mm in 30 mm and then out again to the neck, which read
 * as a ring round the back of the head.
 */
export namespace AutoMovieHumanHeadBackProfile {
  /** The profile's owners, calibration millimetres; x forward, y up. */
  export interface IProfile {
    /** Retained cranial axis's forward place; not necessarily the g/op midpoint. */
    centre: number;

    /** Posterior reach behind the axis at the template's reference height. */
    reach: number;

    /** Retained horizontal-tangent reference height, distinct from the maximizing g-to-posterior caliper point. */
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
