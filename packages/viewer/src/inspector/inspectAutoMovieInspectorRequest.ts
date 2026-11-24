import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import {
  type IApplyAutoMovieInspectionProps,
  type IAutoMovieDrawScene,
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";

import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";

/**
 * Apply a request's inspection to the subject's scene with the marks of the
 * placed second and the kinds the subject declares, as the draw page applies
 * it. It throws what `applyAutoMovieInspection` refuses, leaving the scene as
 * it was, so the mount can keep or fall back to another request.
 */
export function inspectAutoMovieInspectorRequest(props: {
  /** The created subject. */
  instance: IAutoMovieDrawScene;

  /** The inspector's renderer. */
  renderer: IAutoMovieInspectorSceneHost.IRenderer;

  /** The request whose inspection is applied. */
  request: IAutoMovieCapturePlanRequest;

  /** The marks of the placed second; absent applies none. */
  marks: IApplyAutoMovieInspectionProps["marks"] | undefined;
}): IAutoMovieInspectionHandle {
  return applyAutoMovieInspection({
    scene: props.instance.scene,
    request: props.request.inspection,
    renderer: props.renderer,
    ...(props.marks === undefined ? {} : { marks: props.marks }),
    markKinds: props.instance.markKinds ?? [],
  });
}
