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
const SCALP_DEGREES = 30;
const HAIRLINE_DEGREES = 15;
const SCALP_TOP_DEGREES = 45;
const HAIRLINE_TOP_DEGREES = 20;

/**
 * The cited exit-elevation interval at one root: both ends blended from the
 * frontal hairline to the mid scalp by the hairline's own coverage ramp, the
 * same ramp every other hairline rule reads, so each end stays between its two
 * sourced figures.
 */
export function humanFaceHairEmergenceRange(
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
  chart: IAutoMovieVector3,
): IHumanFaceHairEmergenceRange {
  const coverage = humanFaceHairlineCoverage(chart, hairline);
  return {
    lowest: HAIRLINE_DEGREES + (SCALP_DEGREES - HAIRLINE_DEGREES) * coverage,
    highest:
      HAIRLINE_TOP_DEGREES +
      (SCALP_TOP_DEGREES - HAIRLINE_TOP_DEGREES) * coverage,
  };
}
