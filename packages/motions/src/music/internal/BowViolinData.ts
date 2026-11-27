import type { IAutoMovieVector3 } from "@automovie/interface";

export namespace BowViolinData {
  /*
   * The bar frame's +X points from bridge to nut.
   */
  export const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

  /*
   * The outward axis of the violin's string bar.
   */
  export const Y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /*
   * Raised clearance before and after the stroke in metres, provisional.
   */
  export const CLEARANCE: number = 0.035;
}
