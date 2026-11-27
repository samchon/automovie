import type { AutoMovieEvidenceProductionStage } from "./AutoMovieEvidenceProductionStage";

/** Selects each layer's construction stage and its native parent references. */
export interface IAutoMovieEvidenceProductionConstruction {
  /**
   * Sets the long-route settings outline document's own construction stage.
   *
   * The outline's part principle and arrangement obligation claims follow this
   * stage, so the outline's evidence can open or close apart from the settings
   * files. The file-to-outline-entry claim stays on the settings stage.
   * Omitted, the outline follows the settings stage.
   */
  index?: AutoMovieEvidenceProductionStage;

  /** Settings is the long route's source layer and has no upstream references. */
  settings: AutoMovieEvidenceProductionStage;

  /**
   * Sets the short route's brief construction stage.
   *
   * The brief is the short route's source layer and has no upstream references.
   * Omitted, it is disabled.
   */
  brief?: AutoMovieEvidenceProductionStage;

  /**
   * Sets the treatments construction stage.
   *
   * Requires the approved settings construction.
   */
  treatments: AutoMovieEvidenceProductionStage;

  /**
   * Sets the scripts construction stage.
   *
   * Requires the approved treatments construction.
   */
  scripts: AutoMovieEvidenceProductionStage;

  /**
   * Sets the screenplay construction stage.
   *
   * Requires approved scripts and treatments construction in long productions.
   * Short productions require approved brief construction, and compact short
   * productions approved settings construction.
   */
  screenplay: AutoMovieEvidenceProductionStage;
}
