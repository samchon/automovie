import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * One deliverable the production must eventually materialize.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieProductionDeliverable` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieProductionDeliverable` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieProductionDeliverable {
  /**
   * Non-blank id, unique within this production.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;
  /**
   * Output class.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `kind` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `kind` for the narrative intent story design ownership system contract.
   */
  kind: "preview" | "feature" | "guide-pass" | "captions" | "audio-mix";
  /**
   * Structural render pass owned by a guide-pass deliverable.
   *
   * Omitted only for legacy production records, which retain the pose default.
   * New production contracts declare one pass per guide deliverable so depth,
   * normal, mask, outline, and pose outputs have distinct typed ownership.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `pass` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `pass` for the narrative intent story design ownership system contract.
   */
  pass?: Exclude<AutoMovieGuidePass, "beauty">;
  /**
   * Whether final compilation requires the deliverable.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `required` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `required` for the narrative intent story design ownership system contract.
   */
  required: boolean;
}
