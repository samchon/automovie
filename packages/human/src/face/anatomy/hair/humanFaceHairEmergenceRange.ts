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
 *
 * @evidence contracts/common.md#principled-implementation Each end is the coverage-weighted blend of two sourced figures, so it lies between them; the lower end is the existing emergence convention.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the cited angles and their blend, read by the emergence direction and the obstacle-aware root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or style changes either end; the unmodelled temporal figure is stated, not guessed.
 * @evidence contracts/common.md#meaningful-documentation States the source, its limits, the convention and the role of the range tops.
 * @evidence contracts/modeling.md#spatial-conventions Elevations are degrees above the local tangent plane; the chart is neutral head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Reads the hairstyle hairline without defining a channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidence contracts/anatomy.md#anatomical-source Shapiro & Shapiro 2013, section Proper Angle and Direction: mid scalp 30 to 45, frontal hairline 15 to 20, temporal 5 to 10 degrees; a placement guide with no population or method.
 * @evidence contracts/anatomy.md#permitted-range Both ends lie inside the cited ranges for the root's coverage.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived from chart and hairline, not an authored control.
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
