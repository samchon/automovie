/**
 * Enables the development claims that the commissioned production uses.
 *
 * Enabled stages check declaration comments against the shared
 * `contracts/development` checklists. Omitted stages stay disabled except when
 * composition automatically selects an existing review catalog.
 */
export interface IAutoMovieEvidenceDevelopmentProps {
  /**
   * Checks entity declarations under `src/entities`. When a narrative route has
   * subject records, enabling entities or composition connects those records to
   * the entity types.
   */
  entities?: "disabled" | "evidence";

  /**
   * Checks behavior callables under `src/laws`, `src/interactions` and
   * `src/consequences`. Cite the study passage for a law informed by study.
   */
  behaviors?: "disabled" | "evidence";

  /**
   * Checks scene and film callables under `src/composition`. Scenes cite
   * screenplay sections and beats. Films cite the screenplay scene files they
   * order. The catalog has a separate claim.
   */
  composition?: "disabled" | "evidence";

  /**
   * Checks the review catalog's case and film callables. Enabling the stage
   * requires case sources, the catalog film and its acceptance record. Omission
   * selects an existing catalog when composition is enabled. Set `"disabled"`
   * to override that default.
   */
  catalog?: "disabled" | "evidence";
}
