/**
 * Optional station-to-root or station-to-angle coordinates for a scalar source
 * curve. Omission means station itself.
 *
 * A parameter endpoint does not imply a zero scalar. World-coordinate origins
 * can be nonzero there; radial part closure separately owns its zero-knot
 * premise.
 */
export type IAutoMovieConstructionOutlineParameter =
  | {
      /**
       * Signed root distance: +sqrt(s-pole) at a bottom, -sqrt(pole-s) at a
       * top.
       */
      type: "root";

      /** Parameter endpoint station, metres. */
      pole: number;

      /** Which end bounds the parameter domain. */
      end: "bottom" | "top";
    }
  | {
      /** Angle 2 asin(sqrt((s-bottom)/(top-bottom))) on the endpoint interval. */
      type: "angle";

      /** Bottom parameter endpoint, metres. */
      bottom: number;

      /** Top parameter endpoint, metres, strictly above bottom. */
      top: number;
    };
