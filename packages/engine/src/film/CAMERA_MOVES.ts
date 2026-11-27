import { IAutoMovieCameraAction } from "@automovie/interface";
import * as CameraMovesData from "./internal/CameraMovesData";

/**
 * Every member of the closed camera move union, for gating values that arrive
 * from authored JSON at runtime.
 *
 * Built from a record keyed by the union, so a move added to the interface
 * fails compilation here instead of being silently refused by every gate.
 */
export const CAMERA_MOVES: ReadonlySet<IAutoMovieCameraAction["move"]> =
  new Set(Object.keys(CameraMovesData.MOVES) as IAutoMovieCameraAction["move"][]);
