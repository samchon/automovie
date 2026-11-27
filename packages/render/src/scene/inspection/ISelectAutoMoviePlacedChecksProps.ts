import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type { Object3D } from "three";
import type { ISelectAutoMoviePlacedChecksSupport } from "./ISelectAutoMoviePlacedChecksSupport.js";
import type { ISelectAutoMoviePlacedChecksGrip } from "./ISelectAutoMoviePlacedChecksGrip.js";
import type { ISelectAutoMoviePlacedChecksCustody } from "./ISelectAutoMoviePlacedChecksCustody.js";
import type { ISelectAutoMoviePlacedChecksContinuity } from "./ISelectAutoMoviePlacedChecksContinuity.js";

/** The sample and the production's declarations. */
export interface ISelectAutoMoviePlacedChecksProps {
  /** The settled scene of the placed sample. Holders are found beneath it. */
  readonly scene: Object3D;
  /** Clock of the placed sample. */
  readonly time: IAutoMovieInspectionDiagnostics.ITime;
  /** Output frames per second; the previous output frame is one step earlier. */
  readonly fps: number;
  /** Declared supports, such as a planted foot on a floor or a moving deck. */
  readonly supports?: readonly ISelectAutoMoviePlacedChecksSupport[];
  /** Declared grips of a held prop. */
  readonly grips?: readonly ISelectAutoMoviePlacedChecksGrip[];
  /** Declared holder schedules of props that change hands. */
  readonly custody?: readonly ISelectAutoMoviePlacedChecksCustody[];
  /** Declared continuous tracks evaluated through the film's cut. */
  readonly continuity?: ISelectAutoMoviePlacedChecksContinuity;
}
