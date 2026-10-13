import { IAutoMovieWorldSurface } from "@automovie/interface";

import { surfaceHeightAt } from "./space/surfaceHeightAt";

/**
 * Evaluate one production-world height rule at an XZ point.
 *
 * The footprint is not consulted: this answers what the rule says, and
 * {@link worldGroundSurface} answers where the rule applies. A `heightfield`
 * clamps to its edge samples outside its own lattice, so the answer stays a
 * finite number wherever it is asked.
 *
 * The world spelling of {@link surfaceHeightAt}, which is where the arithmetic
 * lives. A scene's standable patch carries the same {@link IAutoMovieHeightRule}
 * and is read by that same function, so terrain a crowd is placed on and ground
 * a performer plants a foot on cannot answer differently.
 */
export const worldSurfaceHeight = (
  surface: IAutoMovieWorldSurface,
  point: { x: number; z: number },
): number => surfaceHeightAt(surface, point.x, point.z);
