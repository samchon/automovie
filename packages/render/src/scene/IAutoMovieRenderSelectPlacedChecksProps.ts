import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type { Object3D } from "three";
import type { IAutoMovieRenderSelectPlacedChecksSupport } from "./IAutoMovieRenderSelectPlacedChecksSupport";
import type { IAutoMovieRenderSelectPlacedChecksGrip } from "./IAutoMovieRenderSelectPlacedChecksGrip";
import type { IAutoMovieRenderSelectPlacedChecksCustody } from "./IAutoMovieRenderSelectPlacedChecksCustody";
import type { IAutoMovieRenderSelectPlacedChecksContinuity } from "./IAutoMovieRenderSelectPlacedChecksContinuity";

/** The sample and the production's declarations. */
export interface IAutoMovieRenderSelectPlacedChecksProps {
  /** The settled scene of the placed sample. Holders are found beneath it. */
  readonly scene: Object3D;
  /** Clock of the placed sample. */
  readonly time: IAutoMovieInspectionDiagnostics.ITime;
  /** Output frames per second; the previous output frame is one step earlier. */
  readonly fps: number;
  /** Declared supports, such as a planted foot on a floor or a moving deck. */
  readonly supports?: readonly IAutoMovieRenderSelectPlacedChecksSupport[];
  /** Declared grips of a held prop. */
  readonly grips?: readonly IAutoMovieRenderSelectPlacedChecksGrip[];
  /** Declared holder schedules of props that change hands. */
  readonly custody?: readonly IAutoMovieRenderSelectPlacedChecksCustody[];
  /** Declared continuous tracks evaluated through the film's cut. */
  readonly continuity?: IAutoMovieRenderSelectPlacedChecksContinuity;
}
