import type { AutoMovieProductionLanguage } from "@automovie/evidence";

/**
 * Project-owned values interpolated into the scaffold's `{{...}}` tokens.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Keeps the generated project's portable identity in explicit source input.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Carries that portable identity into deterministic scaffold derivation.
 * @author Samchon
 */
export interface IAutoMovieScaffoldProps {
  /**
   * The created project's package name (replaces `{{name}}`).
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Restricts the name to a portable project identity rather than a host-private path.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes the project identity an explicit source input to scaffold derivation.
   */
  name: string;
  /** Exact language contract installed into `docs/language`. */
  language: AutoMovieProductionLanguage;
}
