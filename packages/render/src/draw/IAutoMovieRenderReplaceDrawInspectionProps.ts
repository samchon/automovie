import type { IAutoMovieMark } from "@automovie/interface";

import type { IAutoMovieRenderApplyInspectionProps } from "../scene/IAutoMovieRenderApplyInspectionProps.js";
import type { IAutoMovieRenderInspectionHandle } from "../scene/IAutoMovieRenderInspectionHandle.js";

/** Inputs for replacing a draw inspection after placement. */
export interface IAutoMovieRenderReplaceDrawInspectionProps {
  /** The inspection to restore before placement, or null. */
  previous: IAutoMovieRenderInspectionHandle | null;
  /** The actual scene graph after placement. */
  scene: IAutoMovieRenderApplyInspectionProps["scene"];
  /** The request applied to the placed graph. */
  request: IAutoMovieRenderApplyInspectionProps["request"];
  /** Renderer used to measure the placed graph, when required. */
  renderer?: IAutoMovieRenderApplyInspectionProps["renderer"];
  /** Declared kinds accepted for marks. */
  markKinds?: IAutoMovieRenderApplyInspectionProps["markKinds"];
  /** Place the subject and return its current marks. */
  place: () => Promise<readonly IAutoMovieMark[]>;
}
