import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * One paired strap muscle from pubis toward costal cartilages and xiphoid. Tendinous intersections do not turn an abdominal skin groove into a separate muscle. One side's muscle belly accepts named volume or MRI fat fraction only.
 *
 * @evidence contracts/common.md#principled-implementation Rectus abdominis adopts shared independent volume/PDFF quantities for one side's abdominal strap belly.
 * @evidence contracts/common.md#clear-and-simple-design The trunk member owns the belly identity while common muscle measurement types retain target and acquisition definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tendinous intersections or visible skin grooves cannot fabricate separately measured abdominal muscle components.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies pubic-to-costal/xiphoid scope and excludes skin-groove interpretations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rectus quantity typing selects no abdominal intersection segmentation or strap-mesh method.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The abdominal strap alias caches no rectus-belly integration or tendon-intersection reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Rectus metadata acquires no abdominal groove geometry or muscle-generation task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRectusAbdominisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
