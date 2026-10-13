import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairlineBoundary } from "./humanFaceHairlineBoundary";

/**
 * The depth of the hairline's transition zone, over which hair rises from the
 * first sparse single hairs to the full scalp. Shapiro & Shapiro (Facial Plast
 * Surg Clin North Am 21, 2013, 351-362) describe the frontal hairline as an
 * area about 2 to 3 cm deep whose most anterior zone, the transition zone, is
 * "the first 0.5 to 1.0 cm of the hairline"; the 2 to 3 cm is that whole
 * region and not the zone. The figures are a hair-restoration practice's
 * description of a natural hairline, not a morphometric measurement of native
 * zones, and the deeper end of the transition range is taken.
 */
const TRANSITION_METRES: number = 0.01;

/**
 * How much of the full scalp a neutral chart direction carries, in [0,1]: nothing outside the hairline, rising smoothly across the transition zone and one behind it. The zone is a depth in metres, so it is read as the polar angle that depth subtends at this direction's own distance from the chart origin.
 *
 * The ramp is the smoothstep of that fraction, which has zero slope at both ends. Scalp tint and root emergence consume this transition. Root sampling uses the shared polar boundary directly, not this coverage ramp, so this function does not promise a gradual spatial thinning of the root population.
 *
 * @evidence contracts/common.md#principled-implementation Inside-polar distance converts to a metre-depth fraction whose smoothstep ramps the existing tint/emergence transition.
 * @evidence contracts/common.md#clear-and-simple-design Both consumers share the same 0.01-metre construction depth.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The restoration-practice depth is a stated convention, not native-zone morphometry; root sampling uses the hard boundary and is not gradually thinned by this ramp.
 * @evidence contracts/common.md#meaningful-documentation Coverage ranges from zero outside to one inside and singular chart directions refuse.
 * @evidence contracts/performance.md#efficient-algorithms Fixed distance, angle, boundary and polynomial work is performed per point.
 * @evidence contracts/performance.md#reuse-equivalent-work One boundary and coverage owner serves both tint and emergence rather than duplicate ramps.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a dimensionless scalar escapes; no root population or cached field is created.
 */
export function humanFaceHairlineCoverage(
  direction: IAutoMovieVector3,
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
): number {
  const distance: number = Math.hypot(direction.x, direction.y, direction.z);
  if (!(distance > 0))
    throw new Error("A hairline coverage needs a nonsingular chart direction.");
  const polar: number = Math.acos(Math.max(-1, Math.min(1, direction.y / distance)));
  const inside: number =
    ((humanFaceHairlineBoundary(direction, hairline) - polar) * distance) /
    TRANSITION_METRES;
  if (inside <= 0) return 0;
  const ramp: number = Math.min(1, inside);
  return ramp * ramp * (3 - 2 * ramp);
}
