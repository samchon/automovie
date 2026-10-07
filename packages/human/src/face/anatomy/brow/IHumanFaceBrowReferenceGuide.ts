/**
 * One shaft's derived finite guide on the shape-only source reference.
 * Stations are head-frame metres before native seating, not personal curve
 * inputs. The original population ordinal survives thinning and registration.
 *
 * @evidence contracts/common.md#principled-implementation Original shaft identity accompanies its derived reference stations before source support is selected.
 * @evidence contracts/common.md#clear-and-simple-design One ordinal and one ordered point population are shared by source preparation and runtime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual derived stations rather than a substituted expected curve.
 * @evidence contracts/common.md#meaningful-documentation States reference frame, units, derived ownership and retained population identity.
 * @evidence contracts/modeling.md#spatial-conventions Stations are head-frame metres on the shape-only reference.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The shaft mesh owner defines displayed parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries derived output rather than authoring channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries reference stations; the shaft mesh owner emits geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The registration and walker owners construct native joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled brow owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no measured follicle or anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The input profile and emitted contact owners admit their quantities.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived stations are not personal sculpt inputs.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowReferenceGuide {
  /** Original population ordinal, independent of surviving guide count. */
  index: number;

  /** Ordered reference 3D stations at the requested shaft resolution. */
  points: readonly (readonly number[])[];
}
