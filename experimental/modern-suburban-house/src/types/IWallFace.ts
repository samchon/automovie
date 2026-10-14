import type { IWallPoint } from "./IWallPoint";
import type { IWallHole } from "./IWallHole";

/**
 * The assigned wall body's pre-cut face, shared by emitted geometry and built-environment opening/junction inspection. Outline vertices use the wall's running coordinate and world height; holes remain rough wall voids rather than frame, leaf or glazing models.
 *
 * A partition retains one body and its opening host; the garage/main exterior contact may retain its separately assigned lower wall and upper siding faces. This erased record preserves those caller decisions without creating a second boundary or validating the supplied polygon.
 *
 * @author Samchon
 */
export interface IWallFace {
  /** World horizontal axis along which the wall runs. */
  axis: "x" | "z";

  /** Caller-authored world-metre band across that axis, locating the two faces of the same wall body. */
  across: readonly [number, number];

  /** Full perimeter before void cutting, including caller-authored sloped tops and door notches. */
  outline: readonly IWallPoint[];

  /** Door, window or passage rough cuts hosted by this wall; fills remain separate model authoring. */
  holes: readonly IWallHole[];
}
