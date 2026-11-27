import type { IAutoMovieMark } from "@automovie/interface";

import type { IApplyAutoMovieInspectionProps } from "../scene/IApplyAutoMovieInspectionProps.js";
import type { IAutoMovieInspectionHandle } from "../scene/IAutoMovieInspectionHandle.js";

/** Inputs for replacing a draw inspection after placement. */
export interface IAutoMovieReplaceDrawInspectionProps {
  /** The inspection to restore before placement, or null. */
  previous: IAutoMovieInspectionHandle | null;
  /** The actual scene graph after placement. */
  scene: IApplyAutoMovieInspectionProps["scene"];
  /** The request applied to the placed graph. */
  request: IApplyAutoMovieInspectionProps["request"];
  /** Renderer used to measure the placed graph, when required. */
  renderer?: IApplyAutoMovieInspectionProps["renderer"];
  /** Declared kinds accepted for marks. */
  markKinds?: IApplyAutoMovieInspectionProps["markKinds"];
  /** Place the subject and return its current marks. */
  place: () => Promise<readonly IAutoMovieMark[]>;
}
