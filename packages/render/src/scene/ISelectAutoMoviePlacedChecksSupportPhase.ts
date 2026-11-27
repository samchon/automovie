import type { Object3D } from "three";
import type { IAutoMovieVector3 } from "@automovie/interface";

/** One half-open support phase. */
export interface ISelectAutoMoviePlacedChecksSupportPhase {
  /** First owned film second. */
  readonly from: number;
  /** First film second after the phase. */
  readonly to: number;
  /** Displayed socket whose origin is the contacting point. */
  readonly socket: Object3D;
  /** Displayed support whose local positive Y points away from its surface. */
  readonly support: Object3D;
  /** Expected point in support-local metres. */
  readonly anchor: IAutoMovieVector3;
}
