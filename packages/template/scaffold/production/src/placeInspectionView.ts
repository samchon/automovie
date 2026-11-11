import {
  type IAutoMovieViewerSubjectBounds,
  type IAutoMovieViewerSubjectPose,
  applyAutoMovieViewerSubjectPose,
  frameAutoMovieViewerSubject,
} from "@automovie/viewer";
import type * as THREE from "three";

import type { IFilmProduction } from "./IFilmProduction";
import type { InspectionView } from "./InspectionView";

/**
 * Place an inspection camera for one view at one film second and return where it stands and what it looks at.
 *
 * The camera is a spare one, never the film camera, so the delivered framing is untouched. A production view is asked for its pose at `seconds`. A fixed view takes its two points. A named view is framed on `bounds` by the viewer's framing owner, keeping the camera's own field of view; it throws when `bounds` is null, which means nothing is drawn to frame. Every view takes `aspect`, the picture's width over its height.
 *
 * ```ts
 * const spare = production.camera.clone();
 * placeInspectionView({ camera: spare, view, production, seconds, aspect: 16 / 9, bounds: inspection.bounds() });
 * renderer.render(production.scene, spare);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which camera is moved and why, the rule of each view kind, the refusal and its meaning, the unit of `aspect`, and shows the clone, place and draw order.
 * @evidence contracts/development/implementation.md#principled-implementation One placement serves the page and the command, so a view shows the same picture in both; framing and pose application are the viewer's owners, called with the camera's own field of view so a named view keeps the film's lens.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two branches: the framed view, and the two views that are a position and a target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty picture and a view the production does not define throw instead of leaving the camera where it was.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller measures the bounds once and passes them to every named view it places.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Moves a borrowed camera and returns plain numbers.
 */
export function placeInspectionView(props: {
  /** Spare camera to move, unparented. */
  camera: THREE.PerspectiveCamera;

  /** The view to place; the film camera is not placed. */
  view: Exclude<InspectionView, { kind: "film" }>;

  /** The mounted film, read for its named views. */
  production: Pick<IFilmProduction, "views">;

  /** Film second being drawn. */
  seconds: number;

  /** Picture width over height. */
  aspect: number;

  /** World-space box a named view is framed on, or null when nothing is drawn. */
  bounds: IAutoMovieViewerSubjectBounds | null;
}): {
  /** Camera position in world metres. */
  position: readonly [number, number, number];

  /** Point the camera looks at, in world metres. */
  target: readonly [number, number, number];
} {
  const { camera, view } = props;

  // A named view is framed on what is drawn.
  if (view.kind === "named") {
    if (props.bounds === null)
      throw new Error(
        `View "${view.id}" has nothing to frame: no object is drawn`,
      );
    const pose: IAutoMovieViewerSubjectPose = frameAutoMovieViewerSubject(
      props.bounds,
      view.viewpoint,
      { fovDeg: camera.fov, aspect: props.aspect },
    );
    applyAutoMovieViewerSubjectPose(camera, pose);
    return {
      position: [pose.position.x, pose.position.y, pose.position.z],
      target: [pose.target.x, pose.target.y, pose.target.z],
    };
  }

  // A production view and a fixed view are a position and a target.
  const views: IFilmProduction["views"] = props.production.views;
  if (
    view.kind === "preset" &&
    (views === undefined || !Object.hasOwn(views, view.id))
  )
    throw new Error(`The film defines no view "${view.id}"`);
  const pose: {
    position: readonly [number, number, number];
    target: readonly [number, number, number];
  } = view.kind === "preset" ? views![view.id]!(props.seconds) : view;
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.aspect = props.aspect;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return { position: pose.position, target: pose.target };
}
