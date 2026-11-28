import type { AutoMovieEvidenceProductionStage } from "./AutoMovieEvidenceProductionStage";

/** Controls whether Evidence checks the selected narrative layers. */
export interface IAutoMovieEvidenceProductionConstruction {
  /**
   * Controls the long route's settings outline. It follows settings when
   * omitted. Checks that settings files appear in the outline stay on
   * settings.
   */
  index?: AutoMovieEvidenceProductionStage;

  /** Controls the settings source layer on the long route. */
  settings: AutoMovieEvidenceProductionStage;

  /** Controls the brief source layer on the short route. Omission disables it. */
  brief?: AutoMovieEvidenceProductionStage;

  /** Controls long-route treatments and checks their relationship to settings. */
  treatments: AutoMovieEvidenceProductionStage;

  /** Controls long-route scripts and checks their realization of treatments. */
  scripts: AutoMovieEvidenceProductionStage;

  /**
   * Controls screenplay construction. Checks relate a short's scenes to its
   * brief, and a long work's scenes to its scripts and treatments.
   */
  screenplay: AutoMovieEvidenceProductionStage;
}
