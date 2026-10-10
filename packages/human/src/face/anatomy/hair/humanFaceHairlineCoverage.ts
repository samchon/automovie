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
const TRANSITION_METRES = 0.01;

/**
 * How much of the full scalp a neutral chart direction carries, in [0,1]:
 * nothing outside the hairline, rising smoothly across the transition zone
 * and one behind it. The zone is a depth in metres, so it is read as the
 * polar angle that depth subtends at this direction's own distance from the
 * chart origin.
 *
 * The ramp is the smoothstep of that fraction, which has zero slope at both
 * ends. Scalp tint and root emergence consume this transition. Root sampling
 * uses the shared polar boundary directly, not this coverage ramp, so this
 * function does not promise a gradual spatial thinning of the root population.
 */
export function humanFaceHairlineCoverage(
  direction: IAutoMovieVector3,
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
): number {
  const distance = Math.hypot(direction.x, direction.y, direction.z);
  if (!(distance > 0))
    throw new Error("A hairline coverage needs a nonsingular chart direction.");
  const polar = Math.acos(Math.max(-1, Math.min(1, direction.y / distance)));
  const inside =
    ((humanFaceHairlineBoundary(direction, hairline) - polar) * distance) /
    TRANSITION_METRES;
  if (inside <= 0) return 0;
  const ramp = Math.min(1, inside);
  return ramp * ramp * (3 - 2 * ramp);
}
