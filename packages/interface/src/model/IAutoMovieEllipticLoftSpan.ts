import type { IAutoMoviePhysicalYInterval } from "./IAutoMoviePhysicalYInterval";

/** Aligned elliptical section profiles over one physical Y interval. */
export interface IAutoMovieEllipticLoftSpan {
  /** Physical Y interval of this span, in metres. */
  interval: IAutoMoviePhysicalYInterval;

  /** Positive X half-axis Bernstein controls, lower station to upper. */
  radiusX: [number, number, number, number];

  /** Positive Z half-axis controls in the same station chart. */
  radiusZ: [number, number, number, number];

  /** Section-centre X controls in metres. */
  centreX: [number, number, number, number];

  /** Section-centre Z controls in metres. */
  centreZ: [number, number, number, number];
}
