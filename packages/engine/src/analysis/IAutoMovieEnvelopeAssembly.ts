import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieEnvelopeLayer } from "./IAutoMovieEnvelopeLayer";

/**
 * One envelope build-up between the indoor air and the outdoor air.
 *
 * The production declares its own layers and its own surface films. A shipped
 * table of conductivities would be content this product does not sell; the
 * one-dimensional steady-state resistance network that turns them into a
 * transmittance is the capability it does.
 */
export interface IAutoMovieEnvelopeAssembly {
  /** Stable assembly identity within the request. */
  id: string;
  /** Building boundary this assembly realizes. */
  boundary: string;
  /** Layers from the interior face outward; at least one. */
  layers: readonly IAutoMovieEnvelopeLayer[];
  /** Interior surface film resistance in m^2*K/W; strictly positive. */
  interiorFilm: number;
  /** Exterior surface film resistance in m^2*K/W; strictly positive. */
  exteriorFilm: number;
  /** Area in m^2; strictly positive. */
  area: number;
  /** Representative world point on the interior face, for the field overlay. */
  position: IAutoMovieVector3;
}
