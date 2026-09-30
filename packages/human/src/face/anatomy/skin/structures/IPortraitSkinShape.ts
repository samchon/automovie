import { portraitSkinParameters } from "../portraitSkinParameters";

/**
 * Optional scalar skin settings. Both sides use the same authored amounts but
 * follow their own live anatomical bindings and performance. Omitted values
 * take the documented parameter defaults; zero laxity and expression creasing
 * leave the underlying surface exactly unchanged. This is visible morphology,
 * not a biological age predictor or a viscoelastic simulation.
 *
 * @evidence contracts/common.md#principled-implementation The type is derived from the parameter table by mapped type, so the accepted names are exactly the table's ids and cannot drift from the editor's.
 * @evidence contracts/common.md#clear-and-simple-design One derived type with no duplicate list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It carries no behaviour.
 * @evidence contracts/common.md#meaningful-documentation States that both sides share the amounts, the defaults, the zero-laxity identity and that it is visible morphology, not an age predictor.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSkinShape is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSkinShape decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSkinShape constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSkinShape is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export type IPortraitSkinShape = Partial<
  Record<(typeof portraitSkinParameters)[number]["id"], number>
>;
