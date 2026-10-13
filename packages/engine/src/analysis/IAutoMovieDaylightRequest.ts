import {
  IAutoMovieAnalysisTarget,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieAnalysisLuminaire } from "./IAutoMovieAnalysisLuminaire";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { IAutoMovieAnalysisWorkplane } from "./IAutoMovieAnalysisWorkplane";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation Separates the read-only context (sun, sky, neighbours) from building-owned shades and fittings, so one occlusion routine serves both while the run never reports context geometry as the building's.
 * @evidence contracts/common.md#clear-and-simple-design One request type covers daylight and artificial light; a null instant selects the `artificial-light` domain instead of requiring a second request type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unimplemented sky name yields an honest `unsupported` run while malformed geometry throws, keeping capability statements apart from authoring errors.
 * @evidence contracts/common.md#meaningful-documentation States the refusals, how the domain follows the instant, the single implemented sky, the uncapped sky sample count, and what the settings digest covers.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record; work scales with cells times `diffuseSamples` times solid planes, and `diffuseSamples` has no upper bound, a cost of the analyzer. Each request is solved once into one sealed run, and the engine keeps no cache keyed by request content. Owned by the caller; the analyzer derives per-study arrays from it and releases them once the run is returned.
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
