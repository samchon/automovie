import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IHumanFaceHairEmergenceRange } from "./IHumanFaceHairEmergenceRange";
import { humanFaceHairlineCoverage } from "./humanFaceHairlineCoverage";

/**
 * Exit angles from the scalp, measured from the surface rather than from its
 * normal. A follicle is not a pin. Shapiro & Shapiro (Facial Plast Surg Clin
 * North Am 21, 2013, 351-362, "Proper Angle and Direction") state that in the
 * mid scalp hair usually exits at 30 to 45 degrees, at the frontal hairline at
 * 15 to 20, and toward the temporal hairline at almost flat, 5 to 10. They
 * write these as a surgeon's placement guide for transplanted hairlines and
 * give no population, sample or measurement method.
 *
 * The emergence convention takes the lower end of each range, so roots stay
 * near the scalp and contact holds them there instead of the field pushing them
 * down. The range tops bound how far a root may rise when its stem cannot
 * clear the skin from the lower end. The temporal 5 to 10 degrees is not
 * modelled: the sources give no occipital figure, so a per-azimuth field would
 * be this project's own invention rather than theirs.
 */
const SCALP_DEGREES: number = 30;
const HAIRLINE_DEGREES: number = 15;
const SCALP_TOP_DEGREES: number = 45;
const HAIRLINE_TOP_DEGREES: number = 20;

/**
 * The cited exit-elevation interval at one root: both ends blended from the frontal hairline to the mid scalp by the hairline's own coverage ramp, the same ramp every other hairline rule reads, so each end stays between its two sourced figures.
 *
 * @evidence contracts/common.md#principled-implementation Shared hairline coverage blends the existing lower and upper placement-convention elevations.
 * @evidence contracts/common.md#clear-and-simple-design Integration uses this interval only when an explicit authored emergence elevation is absent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The stored surgeon-placement ranges are not native-population measurements, and no temporal/occipital field is invented.
 * @evidence contracts/common.md#meaningful-documentation Lowest/highest are degrees, with frontal-to-mid-scalp blending driven by neutral chart metres.
 * @evidence contracts/performance.md#efficient-algorithms One coverage evaluation and two affine blends take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same coverage owner also drives scalp tint, avoiding a separate emergence hairline ramp.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the small interval escapes and no geometry/query state is acquired.
 */
export function humanFaceHairEmergenceRange(
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
  chart: IAutoMovieVector3,
): IHumanFaceHairEmergenceRange {
  const coverage: number = humanFaceHairlineCoverage(chart, hairline);
  return {
    lowest: HAIRLINE_DEGREES + (SCALP_DEGREES - HAIRLINE_DEGREES) * coverage,
    highest:
      HAIRLINE_TOP_DEGREES +
      (SCALP_TOP_DEGREES - HAIRLINE_TOP_DEGREES) * coverage,
  };
}
