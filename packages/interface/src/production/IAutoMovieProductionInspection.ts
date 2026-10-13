import { IAutoMovieCaptionReadabilityReport } from "./IAutoMovieCaptionReadabilityReport";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieProductionDesignInventory } from "./IAutoMovieProductionDesignInventory";
import { IAutoMovieProductionNextAction } from "./IAutoMovieProductionNextAction";
import { IAutoMovieProductionRenderStatus } from "./IAutoMovieProductionRenderStatus";

/** Compact project status for CLI and lint consumers. */
export interface IAutoMovieProductionInspection {
  /** Current project revision. */
  revision: number;

  /** Typed design inventory. */
  design: IAutoMovieProductionDesignInventory;

  /** Coding-agent and builder ownership status. */
  source: {
    /** Bound source modules that currently exist. */
    bound: string[];

    /** Bound source modules that are missing or unsafe. */
    missing: string[];

    /** Files under generated absent from its manifest. */
    unownedGenerated: string[];
  };

  /** Current structural and ownership diagnostics. */
  diagnostics: IAutoMovieDiagnostic[];

  /** Discovered render manifests. */
  renders: IAutoMovieProductionRenderStatus[];

  /**
   * Current caption readability measurements and outcomes for the film edit.
   *
   * This report is outside the generated edit so a production declaring no
   * profile retains byte-identical compiled output while still exposing a
   * measure-only result.
   */
  captionReadability: IAutoMovieCaptionReadabilityReport;

  /** Ordered concrete corrections. */
  nextActions: IAutoMovieProductionNextAction[];
}
