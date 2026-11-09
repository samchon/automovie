import type { IAutoMovieConstructionAngleParameter } from "./IAutoMovieConstructionAngleParameter";
import type { IAutoMovieConstructionArcParameter } from "./IAutoMovieConstructionArcParameter";
import type { IAutoMovieConstructionPhaseParameter } from "./IAutoMovieConstructionPhaseParameter";

/**
 * How a join's intersection curve is measured over its one turn, discriminated on `type`; the widths are functions of it and the blend's columns stand at its uniform values.
 *
 * - `phase`: the part's own phase, for a part whose every phase line crosses the host once near the curve (a limb, a digit, a neck). The part's rail stays on its own station lines.
 * - `angle`: the angle about an axis through the contact's footprint, for a part lying along its host whose footprint is round enough that every half plane about its centre meets the curve once (a muscle head, a nail fold).
 * - `arc`: the curve's own arclength over its length, for a long thin part along its host (a lid, a lip, a helix rim, a groove).
 *
 * Under `angle` and `arc` the part's rail leaves the curve square to it in the part's chart, and both rails settle in the normal section through the curve point.
 *
 * @evidence contracts/development/design.md#principled-representation Each parameter closes the curve's system of three meeting equations with a fourth equation, so the curve and its jets are functions of one number; the three cover a graph over the part's phase, a star-shaped footprint and any closed curve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three closed kinds, the angle's axis its only data, replace per-feature tracing code.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A parameter whose level sets the curve does not cross once is reported as a singular solve, never stepped over.
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's use, the rail rule each implies and what the widths and columns depend on.
 */
export type AutoMovieConstructionParameter =
  | IAutoMovieConstructionPhaseParameter
  | IAutoMovieConstructionAngleParameter
  | IAutoMovieConstructionArcParameter;
