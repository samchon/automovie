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
 * declare, a malformed workplane, luminaire or shading solid, a sky sample count
 * that is not a positive safe integer, or a malformed target. A null instant
 * makes the run an `artificial-light` run, otherwise it is `daylight`. The
 * settings digest covers the context's id, ground, north and occluders, the
 * resolved instant record, and every other field except `id`, `subject` and
 * `inputRevision`.
 *
 * @evidence contracts/common.md#principled-implementation A study is beam, isotropic sky and point-luminaire illuminance over one workplane at one declared instant, and every field that changes the answer is digested so identical requests seal identical runs.
 * @evidence contracts/common.md#clear-and-simple-design The read-only context is referenced rather than copied into the request, and building-owned shades stay a separate list from context occluders, so ownership is kept by which field a solid arrives in.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unimplemented sky model yields an `unsupported` run and a study with no emitter yields `not-run`, rather than a substituted model or a zero illuminance claim.
 * @evidence contracts/common.md#meaningful-documentation States every throw condition of the analyzer, how the instant decides the run domain, what the settings digest covers, that only `isotropic` is implemented, and that the sky sample count has no upper bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; the study costs grid cells times sky samples times solids, answered on `analyzeAutoMovieDaylight`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The analyzer builds the sky directions once per study and shares them across cells; the request itself carries no cached result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns it for one call; cells are capped at `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, but `diffuseSamples` has no upper bound, so the analyzer's direction array grows with it unchecked.
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
