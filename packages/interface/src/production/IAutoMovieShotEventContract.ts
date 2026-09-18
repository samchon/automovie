import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * A time-bounded event the shot source must implement.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieShotEventContract` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieShotEventContract` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieShotEventContract {
  /**
   * Stable event id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;

  /**
   * Event family.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `kind` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `kind` for the narrative intent story design ownership system contract.
   */
  kind: "contact" | "arrival" | "break" | "reveal" | "transition";

  /**
   * Inclusive finite event window inside the owning shot's duration.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `window` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `window` for the narrative intent story design ownership system contract.
   */
  window: {
    /** Earliest valid time. */
    from: number;

    /** Latest valid time. */
    to: number;
  };

  /**
   * Non-empty unique actor, formation or object ids involved.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `subjects` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `subjects` for the narrative intent story design ownership system contract.
   */
  subjects: string[];

  /**
   * Non-empty machine-checkable facts required at the realized event time.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `predicates` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `predicates` for the narrative intent story design ownership system contract.
   */
  predicates: IAutoMovieShotPredicate[];
}
