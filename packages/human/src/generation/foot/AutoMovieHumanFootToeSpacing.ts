import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";

type Vec3 = G.Vec3;

/**
 * The spacing between neighbouring toes: they touch. A toe's own breadth,
 * times {@link FILL} so it reaches its neighbours, is capped by a soft minimum
 * at half the distance to a neighbour's line less half the gap
 * ({@link GAP}), so two toes that would cross meet in a seam of the least
 * gap instead.
 */
export namespace AutoMovieHumanFootToeSpacing {
  /**
   * The half breadth limited by the neighbours.
   *
   * @param own The toe's own half breadth at this place, mm.
   * @param p The place on the toe's line, left frame.
   * @param neighbours The lines of the toes on either side of it.
   */
  export function limit(own: number, p: Vec3, neighbours: readonly AutoMovieHumanFootToeLines.ILine[]): number {
    let w: number = FILL * own;
    for (const n of neighbours) w = G.softMin(w, 0.5 * G.segmentDistance(p, n.head, n.tip) - 0.5 * GAP, SOFT);

    return w;
  }
}

/** Least gap between neighbouring toes, mm. Convention. */
const GAP: number = 0.6;

/** Softness of the limit, mm. Convention. */
const SOFT: number = 0.6;

/** A toe's own breadth over the spacing-limited one, so neighbours meet. Convention. */
const FILL: number = 1.3;
