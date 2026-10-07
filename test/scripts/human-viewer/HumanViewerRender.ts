import type { IHumanViewerRenderSuccess } from "./IHumanViewerRenderSuccess";
import type { IHumanViewerRenderFailure } from "./IHumanViewerRenderFailure";

/** A rendered frame, or the reason the viewer refused it. */
export type HumanViewerRender =
  | IHumanViewerRenderSuccess
  | IHumanViewerRenderFailure;
