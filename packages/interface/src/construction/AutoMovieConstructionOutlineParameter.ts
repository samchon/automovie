/**
 * Optional station-to-root or station-to-angle coordinates for a scalar source curve. Omission means station itself.
 *
 * A parameter endpoint does not imply a zero scalar. World-coordinate origins can be nonzero there; radial part closure separately owns its zero-knot premise.
 *
 * @evidence contracts/development/design.md#principled-representation Uses the existing monotone root-distance or two-end angle parameter independently of the scalar being interpolated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two finite-endpoint records describe the actual supported changes of variable.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A change of parameter neither invents a radial closure nor sets a coordinate to zero.
 * @evidence contracts/development/common.md#meaningful-documentation States metre station units, omission meaning, parameter domain and separation from closure.
 */
export type AutoMovieConstructionOutlineParameter =
  | {
      /** Signed root distance: +sqrt(s-pole) at a bottom, -sqrt(pole-s) at a top. */
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
