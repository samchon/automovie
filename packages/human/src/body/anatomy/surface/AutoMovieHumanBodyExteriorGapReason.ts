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
 * @author Samchon
 */
export type AutoMovieHumanBodyExteriorGapReason =
  | "missing-landmark"
  | "missing-rule"
  | "missing-tissue-boundary";
