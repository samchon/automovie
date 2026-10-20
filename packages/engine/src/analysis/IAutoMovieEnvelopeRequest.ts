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
 * @evidence contracts/common.md#principled-implementation Supplies the boundary conditions of the steady-state network (indoor air and humidity, one outdoor air temperature from a declared instant) and the network itself, so heat flow and interior-surface condensation are both closed forms over it.
 * @evidence contracts/common.md#clear-and-simple-design One request feeds both the thermal and the moisture run, so the two runs share one validated input and one settings digest instead of two requests that could drift apart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No exterior temperature is assumed: a null instant or one without an outdoor temperature produces `not-run` runs naming the missing input.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every refused input and the `not-run` case, and each property states its role, bounds, and how the runs and targets use it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no runtime code; solving it is linear in assemblies, layers and bridges, a cost the analyzer states.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; the analyzer solves it once per call, and both runs read that one solution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned by the caller; the analyzer keeps nothing derived from it after returning the two runs.
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
