import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { type IAutoMovieRenderApplyInspectionProps, type IAutoMovieRenderDrawScene, type IAutoMovieRenderInspectionHandle, AutoMovieRenderInspection } from "@automovie/render";

import type { IAutoMovieViewerInspectorSceneHost } from "../IAutoMovieViewerInspectorSceneHost.js";

/*
 * Apply a request's inspection to the subject's scene with the marks of the
 * placed second and the kinds the subject declares, as the draw page applies
 * it. It throws what `applyAutoMovieInspection` refuses, leaving the scene as
 * it was, so the mount can keep or fall back to another request.
 */
export function inspectAutoMovieInspectorRequest(props: {
  /*
   * The created subject.
   */
  instance: IAutoMovieRenderDrawScene;

  /*
   * The inspector's renderer.
   */
  renderer: IAutoMovieViewerInspectorSceneHost.IRenderer;

  /*
   * The request whose inspection is applied.
   */
  request: IAutoMovieCapturePlanRequest;

  /*
   * The marks of the placed second; absent applies none.
   */
  marks: IAutoMovieRenderApplyInspectionProps["marks"] | undefined;
}): IAutoMovieRenderInspectionHandle {
  return AutoMovieRenderInspection.apply({
    scene: props.instance.scene,
    request: props.request.inspection,
    renderer: props.renderer,
    ...(props.marks === undefined ? {} : { marks: props.marks }),
    markKinds: props.instance.markKinds ?? [],
  });
}
