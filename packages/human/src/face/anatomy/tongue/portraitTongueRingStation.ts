import { portraitTongueRows } from "./portraitTongueRows";

/**
 * The longitudinal station of a lingual ring: zero at the anterior pole and
 * one at the posterior pole, `(1 - cos(pi * ring / rows)) / 2` for ring
 * `ring` in `[0, rows]`.
 *
 * The rings are spaced by the angle of the closing ellipse and not evenly in
 * length. A rounded pole has a vertical tangent, so evenly spaced rings would
 * join the pole to the first ring by one flat cone and leave a visible nub at
 * the tip of a small tongue; angle spacing puts rings where the outline
 * turns quickest, and gives the mid-body ring the exact station one half.
 * `buildPortraitTongue` places its rings here and `portraitTongueStation`
 * reads them back, so the two share one spacing.
 *
 * @evidence contracts/common.md#principled-implementation For the closing ellipse parameterized by angle theta the station is (1 - cos theta)/2, so the width envelope at a ring is exactly sin theta and the mid-body ring lands at one half; spacing rings by angle is the standard way to sample a curve whose tangent is vertical at its poles, where even spacing in length leaves the first segment as a flat cone.
 * @evidence contracts/common.md#clear-and-simple-design One function that the builder places rings by and the station function reads back, so the spacing has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the spacing is analytic.
 * @evidence contracts/common.md#meaningful-documentation The comment states the formula, why rings are angle spaced and which two declarations share it.
 * @evidence contracts/modeling.md#emitted-geometry The function changes where rings sit and not how many there are; the ring count stays the resolution constant `portraitTongueRows`.
 * @evidence contracts/modeling.md#spatial-conventions The argument is a ring index and the result a unitless station from tip to root.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function maps an index and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidence contracts/modeling.md#shared-boundaries The builder and the jaw weighting read the same ring stations, so the weight applies to the stations the surface actually has.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 * @author Samchon
 */
export const portraitTongueRingStation = (ring: number): number =>
  (1 - Math.cos((Math.PI * ring) / portraitTongueRows)) / 2;
