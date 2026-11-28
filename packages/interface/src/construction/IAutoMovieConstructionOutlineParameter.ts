/**
 * Select the scalar outline's source coordinate. Omission uses physical
 * station. A root coordinate is +√(s − pole) on a bottom domain or −√(pole − s)
 * on a top domain. An angle coordinate is 2 asin √((s − bottom)/(top − bottom))
 * on the closed endpoint interval.
 *
 * Author finite endpoint stations in metres and give the angle variant
 * increasing bounds. Engine outline and axis helpers use the same records after
 * converting endpoints to kernel millimetres. Radial tip closure sets its own
 * zero-value premise.
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
