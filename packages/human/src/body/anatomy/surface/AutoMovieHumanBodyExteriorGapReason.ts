/**
 * Why a surface target of the numerical body request has no binding yet.
 *
 * - `missing-landmark`: a fixed anatomical point the survey definition needs
 *   is not registered on the source skin.
 * - `missing-rule`: the landmarks exist, but no measurement rule reads the
 *   quantity on the shaped skin.
 * - `missing-tissue-boundary`: the quantity is a tissue thickness or volume
 *   the one connected exterior has no boundary for.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes a missing source point, a missing instrument and a missing tissue layer, which have different owners and remedies.
 * @evidence contracts/common.md#clear-and-simple-design Three closed causes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts None of the causes admits an approximating instrument.
 * @evidence contracts/common.md#meaningful-documentation States each cause.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It asserts no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export type AutoMovieHumanBodyExteriorGapReason =
  | "missing-landmark"
  | "missing-rule"
  | "missing-tissue-boundary";
