import type { IHumanViewerRenderFailure } from "./IHumanViewerRenderFailure";
import type { IHumanViewerRenderSuccess } from "./IHumanViewerRenderSuccess";

/** A rendered frame, or the reason the viewer refused it. */
export type HumanViewerRender =
  | IHumanViewerRenderSuccess
  | IHumanViewerRenderFailure;
