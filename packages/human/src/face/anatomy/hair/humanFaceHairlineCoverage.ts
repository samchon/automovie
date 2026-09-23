import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairlineBoundary } from "./humanFaceHairlineBoundary";

/**
 * The depth of the hairline's transition zone, over which hair rises from the
 * first sparse single hairs to the full scalp: the hair restoration literature
 * puts it at the first 0.5 to 1.0 cm of the hairline (Shapiro & Shapiro,
 * Facial Plast Surg Clin North Am 2013; Marwah & Mysore, J Cutan Aesthet Surg
 * 2018), and its own 2 to 3 cm figure is the whole frontal hairline region,
 * transition zone and defined zone and frontal tuft together, which an earlier
 * reading of this constant took for the zone. No morphometric study has
 * measured a native zone, so the deeper end of the surgical convention is used
 * rather than a number of this project's own.
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
 * ends, so neither the boundary nor the full scalp shows a seam. Root
 * sampling thins its population by this and the scalp takes the hair's colour
 * by it, which is what makes a hairline one boundary rather than two.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Reads one shared hairline transition for every identity, with no per-person edge.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair States the transition depth and the smoothstep both the population and the scalp colour read.
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
