import type { IAutoMovieTransform } from "@automovie/interface";
import { DRAWING_FIXTURE_NO_ROTATION as NO_ROTATION } from "./DRAWING_FIXTURE_NO_ROTATION";

/**
 * One small building whose every dimension is a round number, so a drawing derived from it can be checked by hand rather than by snapshot.
 *
 * The geometry is deliberately plain and deliberately varied: a slab below the plan cut, a wall through it, a beam above it, a footing far below it, a boundary that carries its own face and no element, a rectangular door void, a circular oculus authored as two half-turn arcs, and an opening with no geometry at all. Each of those is one branch of the derivation, and each has a size somebody can multiply in their head.
 *
 * World layout, in metres:
 *
 * - `floor-slab`: x 0..10, y -0.2..0, z 0..6
 * - `north-wall`: x 0..6, y 0..3, z 0..0.2
 * - `door-leaf`: x 1.05..1.95, y 0..2.1, z 0.075..0.125 (child of the wall)
 * - `roof-beam`: x 0..6, y 3..3.4, z 2.85..3.15
 * - `footing`: x 0..10, y -0.7..-0.5, z 0..6
 * - `parapet` boundary face: x 0..10, y 3..3.5, z 0..0.2
 */

/** A translation-only transform borrowing the fixture's shared identity rotation. */
export const canonicalDrawingPlace: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: NO_ROTATION,
  scale: { x: 1, y: 1, z: 1 },
});
