import {
  IAutoMovieAnalysisTarget,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieAnalysisLuminaire } from "./IAutoMovieAnalysisLuminaire";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { IAutoMovieAnalysisWorkplane } from "./IAutoMovieAnalysisWorkplane";

/**
 * Everything one daylight or artificial-light study is configured with.
 *
 * `analyzeAutoMovieDaylight` throws on a blank id, subject, revision or sky
 * name, an invalid environment context, an instant the context does not
 * declare, a malformed workplane, luminaire or shading solid, or a malformed
 * target. A null instant makes the run an `artificial-light` run, otherwise it
 * is `daylight`. The settings digest covers the context's id, ground, north and
 * occluders, the resolved instant record, and every other field except `id`,
 * `subject` and `inputRevision`.
 *
 * @author Samchon
 */
export interface IAutoMovieDaylightRequest {
  /** Stable run identity; non-blank. */
  id: string;

  /** Logical space or surface being studied; non-blank. */
  subject: string;

  /** Design revision being read; non-blank. */
  inputRevision: string;

  /**
   * Read-only external world, validated in full on every study; its occluders
   * block rays alongside {@link shades}.
   */
  context: IAutoMovieEnvironmentContext;

  /**
   * Instant id of {@link context} to study, or null for an
   * artificial-light-only study.
   */
  instant: string | null;

  /** Measurement grid. */
  workplane: IAutoMovieAnalysisWorkplane;

  /**
   * Building-owned convex shading solids such as a canopy or a fin; ids unique
   * within this list.
   */
  shades: readonly IAutoMovieAnalysisSolid[];

  /** Artificial sources contributing to the same plane; ids unique. */
  luminaires: readonly IAutoMovieAnalysisLuminaire[];

  /**
   * Sky luminance distribution requested; only `isotropic` is implemented, and
   * any other non-blank name yields an `unsupported` run.
   */
  sky: string;

  /**
   * Sky-vault sample count per measurement point; a positive safe integer with
   * no upper bound.
   */
  diffuseSamples: number;

  /** Targets the production declares for this study. */
  targets: readonly IAutoMovieAnalysisTarget[];
}
