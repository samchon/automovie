import type { IAutoMovieInspectionView } from "@automovie/interface";
import { type IAutoMovieRenderDrawScene, type IAutoMovieRenderInspectionHandle, AutoMovieRenderInspectionCamera, AutoMovieRenderInspectionRequest } from "@automovie/render";
import type * as THREE from "three";

/*
 * The camera the inspector draws a placed second through: the request's view,
 * written as `text`, resolved against the subject's delivery camera and named
 * views at `seconds`, a named view with a focus framed on what the inspection
 * selects.
 *
 * The delivery camera first takes the subject raster's aspect, as a capture of
 * the subject sets it, so a view frames what a capture of the same view frames
 * whatever the canvas's shape.
 */
export function resolveInspectorCamera(props: {
  /*
   * The created subject, placed at `seconds`.
   */
  instance: IAutoMovieRenderDrawScene;

  /*
   * The view's text, the request's first view.
   */
  text: string;

  /*
   * The applied inspection, whose bounds frame a focused named view.
   */
  inspection: IAutoMovieRenderInspectionHandle;

  /*
   * The placed second.
   */
  seconds: number;
}): THREE.Camera {
  const { instance, text }: typeof props = props;
  const aspect: number = instance.width / instance.height;
  if (instance.camera.aspect !== aspect) {
    instance.camera.aspect = aspect;
    instance.camera.updateProjectionMatrix();
  }
  const view: IAutoMovieInspectionView = AutoMovieRenderInspectionRequest.parseView(text);
  return AutoMovieRenderInspectionCamera.resolveView({
    view,
    text,
    bounds: view.type === "named" ? props.inspection.bounds(view.focus) : null,
    camera: instance.camera,
    ...(instance.views === undefined ? {} : { views: instance.views }),
    seconds: props.seconds,
    width: instance.width,
    height: instance.height,
  }).camera;
}
