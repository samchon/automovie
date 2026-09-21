import { IAutoMovieFilmBuildContext } from "./IAutoMovieFilmBuildContext";
import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/**
 * Coding-agent-owned deterministic film module export.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieFilmSource` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieFilmSource` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieFilmSource {
  /**
   * Build one finished-film edit from frozen builder context.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `build` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `build` for the spec authoring source derivation state system contract.
   */
  build(context: IAutoMovieFilmBuildContext): IAutoMovieFilmEdit;
}
