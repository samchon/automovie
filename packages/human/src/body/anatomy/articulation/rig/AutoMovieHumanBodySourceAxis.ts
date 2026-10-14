/**
 * Closed named anatomical motion coordinates; signed values retain opposing directions.
 *
 * @evidence contracts/common.md#principled-implementation A closed literal union names physiological and source motion coordinates while signed values express opposing directions through each axis's registered frame.
 * @evidence contracts/common.md#clear-and-simple-design The axis vocabulary is shared by source goals and drivers instead of allowing arbitrary vertex or matrix edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These names identify supported coordinates; direction, neutral and range still come from the source axis rather than a universal hardcoded joint value.
 * @evidence contracts/common.md#meaningful-documentation The declaration documents closed coordinate names and signed-direction meaning, including the distinct longitudinal translation coordinate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Motion-name literals define a vocabulary without evaluating rotation or translation algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Axis names contain no completed trajectory or shared profile evaluation to invalidate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The coordinate union stores no per-bone state or retained motion resources.
 * @author Samchon
 */
export type AutoMovieHumanBodySourceAxis =
  | "flexion"
  | "abduction"
  | "twist"
  | "opposition"
  | "palmarAbduction"
  | "elevation"
  | "protraction"
  | "upwardRotation"
  | "longitudinalTranslation";
