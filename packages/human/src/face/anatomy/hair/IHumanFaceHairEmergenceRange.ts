/**
 * The exit elevations, in degrees above the scalp's tangent plane, that the
 * cited placement guide allows at one root.
 *
 * `lowest` is the convention the emergence owner uses for every root; it is
 * the lower end of the guide's range, blended from the frontal hairline to
 * the mid scalp by the hairline coverage. `highest` is the same blend of the
 * range tops. A root keeps `lowest` unless its stem provably cannot clear the
 * skin from it.
 *
 * @evidence contracts/common.md#principled-implementation Names exactly the elevation interval the cited source states, so a root's deviation stays within that source.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace a repeated pair of constants.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both ends come from the cited ranges; no subject or style picks them.
 * @evidence contracts/common.md#meaningful-documentation States each end's source, the blend and when the upper part is used.
 * @evidence contracts/modeling.md#spatial-conventions Elevations are degrees above the local tangent plane.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidence contracts/anatomy.md#anatomical-source Shapiro & Shapiro 2013, Proper Angle and Direction: mid scalp 30 to 45 degrees, frontal hairline 15 to 20; a placement guide without population or method.
 * @evidence contracts/anatomy.md#permitted-range The interval is the guide's stated range; nothing outside it is admitted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived from the chart position and hairline, not an authored control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairEmergenceRange {
  /** Lower end of the cited range at this root: the emergence convention. */
  lowest: number;

  /** Upper end of the cited range at this root (Shapiro & Shapiro 2013 range top). */
  highest: number;
}
