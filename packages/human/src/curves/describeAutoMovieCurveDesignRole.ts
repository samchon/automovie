import type { IAutoMovieHumanConstructionNet as Net } from "../structures/IAutoMovieHumanConstructionNet";
import { describeAutoMovieArmCurveRole } from "./arms/describeAutoMovieArmCurveRole";
import { describeAutoMovieFaceCurveRole } from "./face/describeAutoMovieFaceCurveRole";
import { describeAutoMovieFootCurveRole } from "./feet/describeAutoMovieFootCurveRole";
import { describeAutoMovieHandCurveRole } from "./hands/describeAutoMovieHandCurveRole";
import { describeAutoMovieLegCurveRole } from "./legs/describeAutoMovieLegCurveRole";

/** Classify established regional course names for inspection, without changing geometry.
 *
 * Regional owners classify only their emitted names; the part key routes to that owner's vocabulary. The torso's axillary internal core and shared jet continuations are engineering construction, not exterior contours. Section, guide and feature labels describe generating responsibilities, not clinical or skin-surface acceptance. Unclassified courses retain an explicit unspecified role.
 */
export function describeAutoMovieCurveDesignRole(
  part: string,
  name: string,
): NonNullable<Net.ICurve["designRole"]> {
  if (part.endsWith("-engineeringClosure")) return "engineering-closure";
  if (part === "arms") return describeAutoMovieArmCurveRole(name);
  if (part === "head" || part === "ear" || part === "face")
    return describeAutoMovieFaceCurveRole(name);
  if (part === "hands") return describeAutoMovieHandCurveRole(name);
  if (part === "leg") return describeAutoMovieLegCurveRole(name);
  if (part === "foot") return describeAutoMovieFootCurveRole(name);
  if (part === "chest-waist-shoulder") {
    if (
      name === "axillaryThorax.section" ||
      name.includes(".sharedJetContinuation") ||
      name.startsWith("neck.sharedJetColumn")
    )
      return "engineering-closure";
    if (name.endsWith(".section") || name.startsWith("canonical."))
      return "section";
    if (name.endsWith(".meridian")) return "guide";
    if (/^(left|right)\.neckApproach(Anterior|Posterior)\.guide$/.test(name))
      return "guide";
    if (
      /^(left|right|median)\.upperThorax(Anterior|Posterior)\.(cross(0\.25|0\.5|0\.75)|rise(0\.3333333333333333|0\.6666666666666666))\.guide$/.test(
        name,
      )
    )
      return "guide";
    if (
      name === "upperSternalColumn" ||
      name === "upperSpinalColumn" ||
      /^(left|right)\.(pairedMassLowerBorder\.proxy|trapeziusDeltoidCrest|clavicleAnteriorDeltoid|scapularPosteriorDeltoid|axillaryFloor|anteriorAxillaryFold|posteriorAxillaryFold)$/.test(
        name,
      )
    )
      return "feature";
  }
  return "unspecified";
}
