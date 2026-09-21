import { portraitSkinParameters } from "../portraitSkinParameters";

/**
 * Optional scalar skin settings. Both sides use the same authored amounts but
 * follow their own live anatomical bindings and performance. Omitted values
 * take the documented parameter defaults; zero laxity and expression creasing
 * leave the underlying surface exactly unchanged. This is visible morphology,
 * not a biological age predictor or a viscoelastic simulation.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-condition Separates persistent skin condition from transient expression folds.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition Declares one numerical skin layer on the shared anatomical surface.
 */
export type IPortraitSkinShape = Partial<
  Record<(typeof portraitSkinParameters)[number]["id"], number>
>;
