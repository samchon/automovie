import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";

/**
 * A derived metric target and the contact it is walked against.
 *
 * Interpolation can give a strand a length different from its regional length; the integrator and the curve start then walk that length against this contact instead of deriving their own.
 *
 * @evidence contracts/common.md#principled-implementation A derived target length and its exact contact instance override regional derivation together when interpolation changes strand metric.
 * @evidence contracts/common.md#clear-and-simple-design Two fields keep metric and contact coupled between curve-start preparation and walking without another length resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An explicit interpolated target is supported derived geometry, not a shortened length chosen to hide a failed free-clearance transition.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies metre target length, associated contact and the post-interpolation reason for supplying this pair.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This metric/contact pair selects no integration algorithm or resampling density; the consuming walker owns station generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same pair is consumed by curve start and integration so neither independently rederives a different regional contact target.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing lock retains the contact reference for its walk; this pair owns no second collider or background task.
 *
 * @author Samchon
 */
export interface IHumanFaceHairMetric {
  /** Target curve length in metres. */
  length: number;

  /** Contact the length is walked against. */
  contact: IHumanFaceHairContact;
}
