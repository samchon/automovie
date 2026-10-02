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
 *
 * @evidence contracts/common.md#principled-implementation The depth of the
 *   transition zone is a length, so it is turned into a polar angle as arc =
 *   angle * distance at the direction's own distance from the chart origin. That
 *   holds while the zone is small against that distance (1 cm against a head
 *   radius of some ten centimetres), where the sphere's arc is well
 *   approximated. The ramp is the smoothstep r^2 (3 - 2r), which has zero slope
 *   at both ends, so the scalar coverage has no endpoint slope jump. A
 *   zero-length direction refuses because its polar angle does not exist.
 * @evidence contracts/common.md#clear-and-simple-design One transition ramp
 *   shared by scalp tint and emergence; the sampler's polar boundary remains
 *   with humanFaceHairlineBoundary rather than this coverage function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style; the value depends only on the direction and the
 *   layer's hairline.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the ramp, the metre-to-angle conversion and where the zone depth comes from
 *   and what it is not.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The direction is a
 *   neutral head-frame vector in metres from the chart origin; the transition
 *   depth is metres; the boundary and the polar angle are radians from +Y. The
 *   one conversion is arc length to angle at the direction's distance.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidence contracts/anatomy.md#anatomical-source The transition depth is
 *   Shapiro & Shapiro, Facial Plast Surg Clin North Am 21 (2013) 351-362, which
 *   I read: the transition zone is the first 0.5 to 1.0 cm of the frontal
 *   hairline, inside an area about 2 to 3 cm deep. The value is a
 *   hair-restoration surgeon's description of a natural hairline, not a
 *   measurement of a sampled population, and the deeper end, 1 cm, is set by
 *   convention. No morphometric study of native zones was read, so the value is
 *   not fitted to any population.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or
 *   bounds no anatomical quantity; it returns a coverage in [0, 1] from a
 *   boundary the document supplies.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
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
