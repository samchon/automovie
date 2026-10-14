/**
 * Subject-owned nasal attachment. The two cut populations are triangle ordinals on the measured host, fixed before a component deforms its openings.
 *
 * Every length is millimetres of one host frame (+X anatomical left, +Y up, +Z anterior). The nose component admits a socket through `resolvePortraitNoseSocket`, which requires finite centres, a nonnegative alar offset and positive influence radii, because the nasal relief divides by the radii.
 *
 * @evidence contracts/common.md#principled-implementation Source-owned skin vertices, cut-triangle populations and influence chart register the replaceable nose.
 * @evidence contracts/common.md#clear-and-simple-design Socket admission copies surface and cut ordinals without validating their residency; component fitting separately checks support-plane datums when depth scaling is active.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not recover attachment geometry from an image or prove anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation Head +X left, +Y up and +Z anterior frame uses millimetres; supportPlane names retained source datums.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Admission and component fitting execute at their actual owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One copied socket drives both depth influence and aperture construction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns index arrays/radius pair; the resolver returns independent copies retained by the component.
 *
 * @author Samchon
 */
export interface IPortraitNoseSocket {
  /** Nasal midline in the host frame, in mm. */
  midline: number;

  /** Tip influence centre Y, in mm. */
  tipY: number;

  /** Tip influence radii in X/Y, in mm; positive. */
  tipRadius: [number, number];

  /** Alar centres' distance from the midline, in mm; nonnegative. */
  alarOffset: number;

  /** Alar centre Y, in mm. */
  alarY: number;

  /** Alar influence radius, in mm; positive. */
  alarRadius: number;

  /** Host skin vertices that the component directly sculpts. */
  surface: number[];

  /** Original triangle ordinals for each nasal opening. */
  nostrils: number[][];

  /** Three retained skin datums spanning the nasal root and paired facial base. */
  supportPlane?: readonly number[];
}
