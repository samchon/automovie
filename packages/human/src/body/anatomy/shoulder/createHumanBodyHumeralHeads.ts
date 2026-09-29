import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";
import { placeHumanBodyHumeralHead } from "./placeHumanBodyHumeralHead";

/**
 * Instantiate left and right humeral articular heads in the posed body frame.
 *
 * Henninger Lab's shoulder CT v1.11 reports sphere-fitted humeral-head radii
 * (HHR) and subject stature for adult shoulders, CC BY 4.0:
 * https://zenodo.org/records/19077748 . The log-radius allometry below was
 * fitted to 211 rows from 147 subjects aged 18–79 with no recorded pathology,
 * using stature and recorded binary sex. Leaving both sides of each subject
 * out together gave 1.13 mm mean absolute and 2.79 mm 95th-percentile error.
 * These are within-sample prediction errors, not an individual's safe bone
 * dimensions. An intermediate sex control interpolates the two fitted log
 * priors; the CT cohort did not directly observe that intermediate anatomy.
 *
 * HHR is millimetres in the source regression and converted to metres here.
 * The existing rig's posed glenohumeral joint centre supplies each sphere's
 * centre in the body's Y-up, Z-forward frame. A two-joint rig cannot supply
 * the humeral shaft's anatomical frame: CT shaft centres miss the straight
 * head-to-elbow line by several millimetres. This component consequently
 * creates only a head, and the caller must verify that centre against the
 * current skin before using it as a collision boundary.
 *
 * A direct anatomical radius in millimetres takes precedence side by side.
 * Without one, ages or heights outside the sampled adult range omit that
 * side rather than extrapolating to children or unusually large bodies.
 * The input is read only and each result owns its position record.
 */
export function createHumanBodyHumeralHeads(input: {
  ageYears: number;
  sex: number;
  statureMetres: number;
  bones: IAutoMovieHumanBodyBuild["bones"];
  radii?: IAutoMovieHumanBodyBasisDocument["humeralHeads"];
}): IAutoMovieHumanBodyHumeralHead[] {
  const { ageYears, sex, statureMetres, bones, radii } = input;
  if (
    ![ageYears, sex, statureMetres].every(Number.isFinite) ||
    ageYears < 0 ||
    sex < -1 ||
    sex > 1 ||
    statureMetres <= 0
  )
    throw new Error("Humeral-head estimation needs finite body identity, nonnegative age and positive stature.");
  if (
    radii !== undefined &&
    Object.values(radii).some(
      (radius) => !Number.isFinite(radius) || radius <= 0,
    )
  )
    throw new Error("Measured humeral-head radii must be finite positive millimetres.");
  const withinPrior =
    ageYears >= 18 &&
    ageYears <= 79 &&
    statureMetres >= 1.321 &&
    statureMetres <= 1.93;
  const male = (sex + 1) / 2;
  const priorMetres = withinPrior
    ? Math.exp(
        3.1104263552415503 +
          0.41336708470584255 * Math.log(statureMetres / 1.7) +
          0.10963013823784803 * male,
      ) / 1000
    : null;
  return (["leftUpperArm", "rightUpperArm"] as const).flatMap((bone) => {
    const measuredMillimetres =
      bone === "leftUpperArm"
        ? radii?.leftRadiusMillimetres
        : radii?.rightRadiusMillimetres;
    const radiusMetres =
      measuredMillimetres === undefined
        ? priorMetres
        : measuredMillimetres / 1000;
    if (radiusMetres === null) return [];
    return [placeHumanBodyHumeralHead({
      bone,
      radiusMetres,
      source:
        measuredMillimetres === undefined ? "adult-ct-prior" : "measured",
      bones,
    })];
  });
}
