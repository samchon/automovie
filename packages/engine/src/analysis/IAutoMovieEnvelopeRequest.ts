import {
  IAutoMovieAnalysisTarget,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";

import { IAutoMovieEnvelopeAssembly } from "./IAutoMovieEnvelopeAssembly";
import { IAutoMovieEnvelopeBridge } from "./IAutoMovieEnvelopeBridge";
import { IAutoMovieIndoorCondition } from "./IAutoMovieIndoorCondition";

/**
 * Everything one envelope study is configured with.
 *
 * `analyzeAutoMovieEnvelope` throws on a blank id, subject or revision, an
 * invalid context, an undeclared instant, a non-finite indoor temperature, an
 * indoor humidity outside `[0, 1]`, no assembly or more than
 * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, a malformed assembly, layer or bridge, or a
 * malformed target. A null instant, or one without an outdoor air temperature,
 * yields two `not-run` runs.
 *
 * @author Samchon
 */
export interface IAutoMovieEnvelopeRequest {
  /** Stable study identity; the runs are `<id>.thermal` and `<id>.moisture`. */
  id: string;

  /** Logical space the envelope encloses; non-blank. */
  subject: string;

  /** Design revision being read; non-blank. */
  inputRevision: string;

  /** Read-only external world, validated in full on every study. */
  context: IAutoMovieEnvironmentContext;

  /**
   * Instant of {@link context} supplying the exterior air temperature, or null
   * when none is studied.
   */
  instant: string | null;

  /** Indoor air the interior films face. */
  indoor: IAutoMovieIndoorCondition;

  /**
   * Envelope build-ups; at least one, at most `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`,
   * ids unique.
   */
  assemblies: readonly IAutoMovieEnvelopeAssembly[];

  /** Linear thermal bridges; may be empty, ids unique. */
  bridges: readonly IAutoMovieEnvelopeBridge[];

  /**
   * Targets the production declares for this study, matched against the union
   * of both runs' metric keys.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
