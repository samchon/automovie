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
 * Rse)` and an interior surface temperature, and reports one thermal and one
 * moisture sample at `position` under the assembly's id.
 *
 * @author Samchon
 */
export interface IAutoMovieEnvelopeAssembly {
  /** Stable assembly identity, unique within the request and reused as sample id. */
  id: string;

  /** Building boundary this assembly realizes; non-blank, not resolved here. */
  boundary: string;

  /** Layers from the interior face outward; at least one, ids unique. */
  layers: readonly IAutoMovieEnvelopeLayer[];

  /** Interior surface film resistance in m^2*K/W; finite, strictly positive. */
  interiorFilm: number;

  /** Exterior surface film resistance in m^2*K/W; finite, strictly positive. */
  exteriorFilm: number;

  /**
   * Area in m^2; finite and strictly positive. Weights the transmittance,
   * surface-temperature and condensation-margin means.
   */
  area: number;

  /** Representative world point on the interior face, for the field overlay. */
  position: IAutoMovieVector3;
}
