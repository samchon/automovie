import {
  type IAutoMovieInspectionCamera,
  type IAutoMovieViewerSubjectBounds,
  resolveAutoMovieInspectionView,
} from "@automovie/render";
import type * as THREE from "three";

import type { IFilmProduction } from "./IFilmProduction";
import type { InspectionView } from "./InspectionView";

/**
 * Give the camera one view draws through at one film second, and the record of where it stands.
 *
 * The renderer's `resolveAutoMovieInspectionView` decides every camera: the film camera is returned as it is, so the delivered framing is untouched, a production view is asked for its pose at `seconds`, a fixed camera takes its two points, and a named viewpoint is fitted to `bounds`, in perspective with the film camera's field of view or orthographic when the view says so. `bounds` is what the view frames: everything drawn, or its focus. The film camera's aspect is matched to the picture, as the Viewer does for its canvas.
 *
 * ```ts
 * const { camera } = placeInspectionView({ view, production, seconds, width: 1280, height: 720, bounds: inspection.bounds(view.view.type === "named" ? view.view.focus : null) });
 * renderer.render(production.scene, camera);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who decides the camera, what each view gives, what the bounds are, the aspect rule, and shows the place and draw order.
 * @evidence contracts/development/implementation.md#principled-implementation Every camera comes from the renderer's one resolver, so the page and the command draw the same view through the same camera for the same bounds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Matches the film camera's aspect, then forwards to the resolver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Builds no camera by its own rule; the resolver's refusals reach the caller.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller measures the bounds once per view and passes them to every second it places.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the resolver's camera, which the caller owns, or the film's own camera.
 */
export function placeInspectionView(props: {
  /** The view to place. */
  view: InspectionView;

  /** The mounted film, read for its camera and its named views. */
  production: Pick<IFilmProduction, "camera" | "views">;

  /** Film second being drawn. */
  seconds: number;

  /** Picture width, pixels. */
  width: number;

  /** Picture height, pixels. */
  height: number;

  /** World-space box a named view frames, or null when nothing is drawn. */
  bounds: IAutoMovieViewerSubjectBounds | null;
}): {
  /** The camera to draw through. */
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

  /** Where it stands, as a record keeps it. */
  record: IAutoMovieInspectionCamera;
} {
  const film: THREE.PerspectiveCamera = props.production.camera;
  if (film.aspect !== props.width / props.height) {
    film.aspect = props.width / props.height;
    film.updateProjectionMatrix();
  }
  return resolveAutoMovieInspectionView({
    view: props.view.view,
    text: props.view.text,
    bounds: props.bounds,
    camera: film,
    ...(props.production.views === undefined
      ? {}
      : { views: props.production.views }),
    seconds: props.seconds,
    width: props.width,
    height: props.height,
  });
}
