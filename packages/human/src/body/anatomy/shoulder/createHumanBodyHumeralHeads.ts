import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";
import { placeHumanBodyHumeralHead } from "./placeHumanBodyHumeralHead";

/**
 * Instantiate left and right humeral articular heads in the posed body frame.
 *
 * Henninger Lab's shoulder CT v1.11 landing page describes CT meshes, demographic/landmark data and humeral-head radius fields: https://zenodo.org/records/19077748 . It does not publish this implementation's regression or establish its quoted fit errors. The retained implementation provenance reports 211 rows from 147 subjects aged 18–79 with no recorded pathology, stature and recorded binary sex, and subject-grouped leave-out errors of 1.13 mm mean absolute and 2.79 mm at the 95th percentile. Those cohort-selection and error claims have not been reproduced here or verified from the landing page; no licence claim is inferred from it. They are not an individual's safe bone dimensions. An intermediate sex control interpolates the two fitted log priors rather than supplying an observed intermediate anatomy.
 *
 * HHR is millimetres in the retained regression and converted to metres here. The existing rig's posed glenohumeral joint centre supplies each sphere's centre in the body's Y-up, Z-forward frame. A head-to-elbow rig line does not register a CT humeral shaft frame; no shaft-centre discrepancy has been measured in this checkout. This component creates only a head, and the caller must verify that centre against the current skin before using it as a collision boundary.
 *
 * A direct anatomical radius in millimetres takes precedence side by side. Without one, the retained prior is available only at ages 18 through 79 years and statures 1.321 through 1.93 metres, both endpoints included; other inputs omit that side rather than extrapolating. The input is read only and each result owns its position record. The coefficients are retained population-fitted parameters. Their original cohort fit and quoted prediction errors have not been reproduced in this checkout; they remain an unverified provenance limitation rather than an individual's measured radius or validated clearance.
 *
 * @evidence contracts/common.md#principled-implementation Side-specific radii override a population-fitted log-radius estimate within its stated adult age/stature range; every admitted radius is converted from millimeters and placed at the posed rig joint.
 * @evidence contracts/common.md#clear-and-simple-design This legacy estimation entry owns demographic range and direct-radius precedence while the shared placement helper owns radius/joint admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed coefficients represent a population fit, not per-subject anatomy; interpolation and unverified cohort-fit provenance are explicit, and out-of-range priors are omitted.
 * @evidence contracts/common.md#meaningful-documentation The prose gives supplied-radius precedence, sampled limits, units, source/frame limitations and unreproduced prediction-error provenance.
 * @evidence contracts/performance.md#efficient-algorithms Two sides share one constant-size prior evaluation; each head requires an O(B) first-match scan of the B posed bones.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides reuse the same demographic prior within the call, but posed bone inputs prevent reuse based on radius or identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most two head records and copied centers escape; the borrowed bones and local estimation values are not retained.
 */
export function createHumanBodyHumeralHeads(input: {
  ageYears: number;
  sex: number;
  statureMetres: number;
  bones: IAutoMovieHumanBodyBuild["bones"];
  radii?: IAutoMovieHumanBodyBasisDocument["humeralHeads"];
}): IAutoMovieHumanBodyHumeralHead[] {
  const { ageYears, sex, statureMetres, bones, radii }: typeof input = input;
  if (
    ![ageYears, sex, statureMetres].every(Number.isFinite) ||
    ageYears < 0 ||
    sex < -1 ||
    sex > 1 ||
    statureMetres <= 0
  )
    throw new Error(
      "Humeral-head estimation needs finite body identity, nonnegative age and positive stature.",
    );
  if (
    radii !== undefined &&
    Object.values(radii).some(
      (radius: number): boolean => !Number.isFinite(radius) || radius <= 0,
    )
  )
    throw new Error(
      "Measured humeral-head radii must be finite positive millimetres.",
    );
  const withinPrior: boolean =
    ageYears >= 18 &&
    ageYears <= 79 &&
    statureMetres >= 1.321 &&
    statureMetres <= 1.93;
  const male: number = (sex + 1) / 2;
  const priorMetres: number | null = withinPrior
    ? Math.exp(
        3.1104263552415503 +
          0.41336708470584255 * Math.log(statureMetres / 1.7) +
          0.10963013823784803 * male,
      ) / 1000
    : null;
  return (["leftUpperArm", "rightUpperArm"] as const).flatMap(
    (
      bone: IAutoMovieHumanBodyHumeralHead["bone"],
    ): IAutoMovieHumanBodyHumeralHead[] => {
      const measuredMillimetres: number | undefined =
        bone === "leftUpperArm"
          ? radii?.leftRadiusMillimetres
          : radii?.rightRadiusMillimetres;
      const radiusMetres: number | null =
        measuredMillimetres === undefined
          ? priorMetres
          : measuredMillimetres / 1000;
      if (radiusMetres === null) return [];
      return [
        placeHumanBodyHumeralHead({
          bone,
          radiusMetres,
          source:
            measuredMillimetres === undefined ? "adult-ct-prior" : "measured",
          bones,
        }),
      ];
    },
  );
}
