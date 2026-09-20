import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declared balance window for center-of-mass support validation.
 *
 * The support hull is explicit because stance semantics are action-level facts:
 * a jump, kneel, hand plant, or one-foot balance all need different contact
 * points even when the same skeleton is sampled.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieBalanceSupportWindow` identifies the motion interval and contact bones whose support failure can be traced back to one declaration.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieBalanceSupportWindow` groups the center source, support set, time bounds, and margin that define one balance-validation scope.
 * @author Samchon
 */
export interface IAutoMovieBalanceSupportWindow {
  /**
   * Center-of-mass source. **Omit** (the default and recommended form) to use
   * the segment-mass-weighted whole-body COM over the resolved pose,
   * trustworthy for a lean, reach, or crouch, where the real COM shifts far
   * from the pelvis. Provide a bone to override with a single-bone proxy (the
   * pre-#1184 coarse behavior) for a rig or stance where a specific point is
   * the intended COM.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `centerBone` names the optional single-bone center proxy responsible for a support-distance observation.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `centerBone` distinguishes an explicit bone source from the default weighted whole-body center calculation.
   */
  centerBone?: AutoMovieHumanoidBone;

  /**
   * Ordered support contact bones projected onto the horizontal XZ plane.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `supportBones` identifies the declared contact landmarks from which the failing support hull was formed.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `supportBones` preserves stable bone identities rather than an incidental order of resolved world points.
   */
  supportBones: readonly AutoMovieHumanoidBone[];

  /**
   * Inclusive start time in seconds.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `start` locates the inclusive film-clock boundary at which this support declaration begins to govern the motion.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `start` provides the lower endpoint used to derive the window's deterministic sample positions.
   */
  start: number;

  /**
   * Inclusive end time in seconds.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `end` locates the inclusive film-clock boundary after which this support declaration no longer applies.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `end` provides the upper endpoint checked against duration before balance samples are addressed.
   */
  end: number;

  /**
   * Allowed projected COM distance outside the support hull in meters.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `margin` records the permitted meter overhang against which each center-to-hull distance is reported.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `margin` keeps the expected support tolerance separate from the observed projected distance.
   */
  margin?: number;
}
