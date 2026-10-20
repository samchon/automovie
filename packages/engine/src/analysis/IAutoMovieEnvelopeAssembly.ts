import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieEnvelopeLayer } from "./IAutoMovieEnvelopeLayer";

/**
 * One envelope build-up between the indoor air and the outdoor air.
 *
 * The production declares its own layers and its own surface films. A shipped
 * table of conductivities would be content this product does not sell; the
 * one-dimensional steady-state resistance network that turns them into a
 * transmittance is the capability it does.
 *
 * `analyzeAutoMovieEnvelope` turns it into `U = 1 / (Rsi + sum(t / lambda) +
 * Rse)` and an interior surface temperature. When the instant supplies an
 * outdoor air temperature, it reports one thermal sample at `position` under
 * the assembly's id, plus one moisture sample there when the indoor air has a
 * dew point; otherwise both runs are `not-run` with no samples.
 *
 * @evidence contracts/common.md#principled-implementation One-dimensional steady-state conduction through a series resistance network, `U = 1 / (Rsi + sum(t / lambda) + Rse)`, which holds for homogeneous parallel layers away from edges; bridges are carried separately by the request.
 * @evidence contracts/common.md#clear-and-simple-design The assembly holds its own layers, both films, an area and a sample point, so the analyzer solves each assembly independently and then area-weights them without any shared table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine ships no conductivity or film table; the production declares every value, and the boundary name is carried, not resolved or defaulted.
 * @evidence contracts/common.md#meaningful-documentation States the transmittance law, the samples reported and when either is absent, the m^2*K/W and m^2 units, the positivity rules, what the area weights, and that layer order does not change the sum.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; each assembly costs one pass over its layers inside `analyzeAutoMovieEnvelope`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Solved once per envelope study; no transmittance is cached across studies because films and layers are the request's own.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned by the request for one call; assemblies are capped at `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` per study while layers per assembly have no bound of their own.
 */
export interface IAutoMovieEnvelopeAssembly {
  /** Stable assembly identity, unique within the request and reused as sample id. */
  id: string;

  /** Building boundary this assembly realizes; non-blank, not resolved here. */
  boundary: string;

  /**
   * Layers from the interior face outward; at least one, ids unique. The
   * series sum does not depend on their order.
   */
  layers: readonly IAutoMovieEnvelopeLayer[];

  /** Interior surface film resistance in m^2*K/W; finite, strictly positive. */
  interiorFilm: number;

  /** Exterior surface film resistance in m^2*K/W; finite, strictly positive. */
  exteriorFilm: number;

  /**
   * Area in m^2; finite and strictly positive. Weights the transmittance,
   * surface-temperature and condensation-margin means and scales the fabric
   * heat loss.
   */
  area: number;

  /** Representative world point on the interior face, for the field overlay. */
  position: IAutoMovieVector3;
}
