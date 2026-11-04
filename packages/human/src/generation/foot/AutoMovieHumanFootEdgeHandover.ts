import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The hand-over of a plantar contact edge's tangent and curvature from the
 * floor's to its neighbours', over the height of the heel's posterior corner.
 *
 * On the floor both edges are level with zero curvature, so the sole between
 * them is the flat contact plane. Behind the heel's contact the edges leave
 * the floor and run round the corner; there an edge is no longer the section's
 * lowest point, and it takes its neighbours' direction and derived curvature
 * in proportion to how far round the corner it stands: its height over the
 * corner's own height through a smoothstep, so the hand-over is C1 and spread
 * over the whole corner, not a few planes.
 */
export namespace AutoMovieHumanFootEdgeHandover {
  /**
   * An edge's curvature: none on the floor, the derived channel once round the
   * heel's corner.
   *
   * @param height The edge's height over the floor, mm.
   * @param corner The heel's posterior corner's height, mm.
   * @param derived The edge's derived curvature from its neighbours.
   */
  export function curvature(height: number, corner: number, derived: number): number {
    return G.smooth(height / corner) * derived;
  }

  /**
   * An edge's tangent, in the ring's sense: level (`[-1, 0]`) on the floor;
   * round the heel's corner it turns, by the same smoothstep, to the tangent of
   * the parabola through the edge and its two neighbours (Bessel's tangent:
   * each side's chord direction weighted by the other side's length, so the
   * nearer neighbour leads). Held level above the floor, the edge folded every
   * section above the heel's contact, a crease up the back of the heel along
   * the medial edge; the plain chord of the neighbours (Catmull-Rom) pointed
   * the edge at the far border, 75 mm off against the other edge's 22 mm, and
   * the sole's piece turned back on itself.
   *
   * @param height The edge's height over the floor, mm.
   * @param corner The heel's posterior corner's height, mm.
   * @param before The neighbour before the edge in the ring's sense.
   * @param edge The edge's own point.
   * @param after The neighbour after it.
   */
  export function tangent(height: number, corner: number, before: G.Vec2, edge: G.Vec2, after: G.Vec2): G.Vec2 {
    const w: number = G.smooth(height / corner);
    const d1: number = Math.hypot(edge[0] - before[0], edge[1] - before[1]) || 1;
    const d2: number = Math.hypot(after[0] - edge[0], after[1] - edge[1]) || 1;

    // Bessel's tangent: (d2 c1 + d1 c2) / (d1 + d2) with c1, c2 the unit chords.
    const bx: number = (d2 * (edge[0] - before[0])) / d1 + (d1 * (after[0] - edge[0])) / d2;
    const by: number = (d2 * (edge[1] - before[1])) / d1 + (d1 * (after[1] - edge[1])) / d2;

    // Turn by angle, not by a blend of the two vectors: they point nearly
    // opposite where the edge stands under its neighbours, and a blend
    // swings through zero (85 degrees between a fifth and a half of the
    // corner) instead of turning evenly.
    const from: number = Math.PI;
    let delta: number = Math.atan2(by, bx) - from;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    const angle: number = from + w * delta;

    return [Math.cos(angle), Math.sin(angle)];
  }
}
