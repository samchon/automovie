import type { IAutoMovieConstructionAngleParameter } from "./IAutoMovieConstructionAngleParameter";
import type { IAutoMovieConstructionArcParameter } from "./IAutoMovieConstructionArcParameter";
import type { IAutoMovieConstructionPhaseParameter } from "./IAutoMovieConstructionPhaseParameter";

/**
 * How a join's intersection curve is measured over its one turn, discriminated
 * on `type`; the widths are functions of it and the blend's columns stand at
 * its uniform values.
 *
 * - `phase`: the part's own phase, for a part whose every phase line crosses the
 *   host once near the curve (a limb, a digit, a neck). The part's rail stays
 *   on its own station lines.
 * - `angle`: the angle about an axis through the contact's footprint, for a part
 *   lying along its host whose footprint is round enough that every half plane
 *   about its centre meets the curve once (a muscle head, a nail fold).
 * - `arc`: the curve's own arclength over its length, for a long thin part along
 *   its host (a lid, a lip, a helix rim, a groove).
 *
 * Under `angle` and `arc` the part's rail leaves the curve square to it in the
 * part's chart, and both rails settle in the normal section through the curve
 * point.
 */
export type IAutoMovieConstructionParameter =
  | IAutoMovieConstructionPhaseParameter
  | IAutoMovieConstructionAngleParameter
  | IAutoMovieConstructionArcParameter;
