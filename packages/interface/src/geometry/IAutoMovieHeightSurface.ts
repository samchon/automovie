import type { IAutoMovieHeightRule } from "./IAutoMovieHeightRule";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Structural height recipe shared by authored scene surfaces and built
 * supports.
 */
export interface IAutoMovieHeightSurface {
  /**
   * Optional general height rule. When supplied it takes precedence over the
   * anchor and ramp fields.
   */
  readonly height?: IAutoMovieHeightRule | undefined;

  /**
   * First endpoint of the anchored spelling. Its Y is the flat datum when the
   * optional ramp is absent. An absent anchor reads zero.
   */
  readonly anchor?: IAutoMovieVector3 | undefined;

  /**
   * Optional second endpoint of the anchor ramp. Null and omission both retain
   * the anchor height.
   *
   * A noncoincident anchor pair defines an affine height along its XZ axis.
   * Squared horizontal spans below 1e-9 square metres use the first anchor
   * height.
   */
  readonly rampTo?: IAutoMovieVector3 | null | undefined;
}
