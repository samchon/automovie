import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import type { IAutoMovieViewerSubjectPose } from "../subjectViewpoint/IAutoMovieViewerSubjectPose.js";
import type { IAutoMovieViewerViewpoint } from "../subjectViewpoint/IAutoMovieViewerViewpoint.js";
import { autoMovieViewerNamedViewpoints } from "../subjectViewpoint/autoMovieViewerNamedViewpoints.js";
import { frameAutoMovieViewerSubject } from "../subjectViewpoint/frameAutoMovieViewerSubject.js";
import type { IAutoMovieInspectionCamera } from "./IAutoMovieInspectionCamera.js";
import type { IAutoMovieInspectionView } from "./IAutoMovieInspectionView.js";

/** Smallest half extent a fitted view frames, metres, the framing owner's floor for a box without size. */
const FLOOR: number = 0.5;

/**
 * Turn an inspection view into the camera that draws it and the record that repeats it, for a picture of `width` by `height` pixels at film second `seconds`.
 *
 * | View | Camera |
 * | --- | --- |
 * | `film` | The subject's own `camera`, returned unchanged |
 * | Fixed | A perspective camera at the position looking at the target, with the subject camera's field of view and clips, rolled to the view's up when it states one |
 * | Fixed with a scale | An orthographic camera at the position looking at the target, the picture's height spanning the scale times its pixels, with clips at a quarter and three and a half times the eye's distance to the target |
 * | A name the subject's `views` holds | A perspective camera where that view places it at `seconds`, with the subject camera's field of view and clips |
 * | A named viewpoint | A perspective camera from the viewpoint's direction fitted to `bounds` by `frameAutoMovieViewerSubject`, with the subject camera's field of view |
 * | A named viewpoint with `orthographic` | An orthographic camera from the same direction whose frame holds every corner of `bounds`, by the same margin |
 *
 * `bounds` is what the view frames: the host measures it on what is drawn, or on the focus the view names through the inspection handle's `bounds`. A subject's view wins a name over a named viewpoint, because the subject knows its own staging. A vertical named view takes the up direction its viewpoint documents, `-Z` from the top and `+Z` from the bottom; every other view takes `+Y`. The record's `metresPerPixel` is the orthographic frame's height over `height`.
 *
 * `@follow` changes only which seconds a host measures `bounds` over, the drawn second alone, so it resolves as the fit it modifies. A fixed camera with a scale repeats a fitted orthographic view exactly, because that view stands twice its frame's radius from its target with clips at half and seven times the radius.
 *
 * It throws for a size that is not positive, an unknown name with the accepted names listed, a subject view asked to be orthographic, followed or focused, and a fitted view without bounds, which means nothing is drawn to frame.
 *
 * ```ts
 * const { camera, record } = resolveAutoMovieInspectionView({
 *   view: parseAutoMovieInspectionView("front@ortho"),
 *   text: "front@ortho",
 *   bounds: inspection.bounds(),
 *   camera: production.camera,
 *   views: production.views,
 *   seconds,
 *   width: 960,
 *   height: 540,
 * });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every view with the camera it gives, states where the bounds come from, the precedence of names, the up rule, the scale's derivation and every refusal, and shows the call.
 * @evidence contracts/development/implementation.md#principled-implementation A perspective fit is the framing owner's sphere fit, and an orthographic fit projects the eight corners of the box onto the camera's picture plane and takes the larger of the half height and the half width over the aspect, times the viewpoint's distance factor, so the box lies inside the frame by the same margin; parallel projection makes that frame's height over the pixel height the metres one pixel spans everywhere in the picture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per view form, each producing a camera and its record through one record helper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 0.5 m floor is the framing owner's documented convention, the margin is the viewpoint's own distance factor, and a switch a form cannot honour is refused instead of ignored.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: eight corners at most.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Directions are the named viewpoints' own records and the perspective fit is the framing owner's, so every host frames by one rule.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Creates one camera, which the caller owns, except for `film`, which returns the subject's camera; nothing is kept.
 */
export function resolveAutoMovieInspectionView(props: {
  /** The view, as `parseAutoMovieInspectionView` read it. */
  view: IAutoMovieInspectionView;

  /** The view's text, kept in the record. */
  text: string;

  /** World box a fitted view frames, or null when nothing is drawn. */
  bounds: IAutoMovieViewerSubjectBounds | null;

  /** The subject's delivery camera: the film view itself, and the field of view and clips the other views take. */
  camera: THREE.PerspectiveCamera;

  /** The subject's own views by name, each placing a camera at a second. */
  views?: Readonly<
    Record<
      string,
      (seconds: number) => {
        position: readonly [number, number, number];
        target: readonly [number, number, number];
      }
    >
  >;

  /** The film second drawn. */
  seconds: number;

  /** Picture width, pixels. */
  width: number;

  /** Picture height, pixels. */
  height: number;
}): {
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  record: IAutoMovieInspectionCamera;
} {
  if (
    !(props.width > 0 && Number.isFinite(props.width)) ||
    !(props.height > 0 && Number.isFinite(props.height))
  )
    throw new Error(
      `Inspection picture ${props.width} x ${props.height} is not a positive size`,
    );
  const aspect: number = props.width / props.height;
  const view: IAutoMovieInspectionView = props.view;

  // The film camera is drawn as it is.
  if (view.type === "film")
    return {
      camera: props.camera,
      record: record(props.text, props.camera, props.height),
    };

  // A fixed camera and a subject's view are a position and a target.
  const own:
    | ((seconds: number) => {
        position: readonly [number, number, number];
        target: readonly [number, number, number];
      })
    | undefined =
    view.type === "named" &&
    props.views !== undefined &&
    Object.hasOwn(props.views, view.name)
      ? props.views[view.name]
      : undefined;
  if (view.type === "fixed" || own !== undefined) {
    if (
      view.type === "named" &&
      (view.orthographic || view.follow || view.focus !== null)
    )
      throw new Error(
        `Inspection view "${props.text}" is the subject's own view, which takes no switch`,
      );
    const placed: { position: IAutoMovieVector3; target: IAutoMovieVector3 } =
      view.type === "fixed"
        ? view
        : ((pose: {
            position: readonly [number, number, number];
            target: readonly [number, number, number];
          }): { position: IAutoMovieVector3; target: IAutoMovieVector3 } => ({
            position: vector(pose.position),
            target: vector(pose.target),
          }))(own!(props.seconds));
    const up: IAutoMovieVector3 =
      view.type === "fixed" && view.up !== null
        ? view.up
        : { x: 0, y: 1, z: 0 };

    // A fixed orthographic camera: its scale as written, its clips a quarter and three and a half times the eye's distance, a fitted orthographic view's own clips.
    if (view.type === "fixed" && view.metresPerPixel !== null) {
      const distance: number = Math.hypot(
        placed.target.x - placed.position.x,
        placed.target.y - placed.position.y,
        placed.target.z - placed.position.z,
      );
      const half: number = (view.metresPerPixel * props.height) / 2;
      const camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
        -half * aspect,
        half * aspect,
        half,
        -half,
        distance / 4,
        distance * 3.5,
      );
      aim(camera, placed.position, placed.target, up);
      return {
        camera,
        record: record(props.text, camera, props.height, placed.target),
      };
    }
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      props.camera.fov,
      aspect,
      props.camera.near,
      props.camera.far,
    );
    aim(camera, placed.position, placed.target, up);
    return {
      camera,
      record: record(props.text, camera, props.height, placed.target),
    };
  }

  // A named viewpoint is fitted to the bounds.
  const viewpoints: IAutoMovieViewerViewpoint[] =
    autoMovieViewerNamedViewpoints();
  const viewpoint: IAutoMovieViewerViewpoint | undefined = viewpoints.find(
    (candidate: IAutoMovieViewerViewpoint): boolean =>
      candidate.id === view.name,
  );
  if (viewpoint === undefined)
    throw new Error(
      `Inspection view "${props.text}" names no view; the names are ${[
        ...Object.keys(props.views ?? {}),
        ...viewpoints.map(
          (candidate: IAutoMovieViewerViewpoint): string => candidate.id,
        ),
      ].join(", ")}, besides film and x,y,z:tx,ty,tz`,
    );
  if (props.bounds === null)
    throw new Error(
      `Inspection view "${props.text}" has nothing to frame: nothing is drawn`,
    );
  const up: IAutoMovieVector3 = upOf(viewpoint);
  if (!view.orthographic) {
    const pose: IAutoMovieViewerSubjectPose = frameAutoMovieViewerSubject(
      props.bounds,
      viewpoint,
      { fovDeg: props.camera.fov, aspect },
    );
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      props.camera.fov,
      aspect,
      pose.near,
      pose.far,
    );
    aim(camera, pose.position, pose.target, up);
    return {
      camera,
      record: record(props.text, camera, props.height, pose.target),
    };
  }

  // Orthographic: stand back along the direction, then fit the frame to the box's corners on the picture plane.
  const min: IAutoMovieVector3 = props.bounds.min;
  const max: IAutoMovieVector3 = props.bounds.max;
  const centre: THREE.Vector3 = new THREE.Vector3(
    (min.x + max.x) / 2,
    (min.y + max.y) / 2,
    (min.z + max.z) / 2,
  );
  const radius: number = Math.max(
    Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z) / 2,
    FLOOR,
  );
  const azimuth: number = THREE.MathUtils.degToRad(viewpoint.azimuthDeg);
  const elevation: number = THREE.MathUtils.degToRad(viewpoint.elevationDeg);
  const direction: THREE.Vector3 = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  const camera: THREE.OrthographicCamera = new THREE.OrthographicCamera();
  camera.near = radius / 2;
  camera.far = radius * 7;
  aim(
    camera,
    {
      x: centre.x + direction.x * radius * 2,
      y: centre.y + direction.y * radius * 2,
      z: centre.z + direction.z * radius * 2,
    },
    { x: centre.x, y: centre.y, z: centre.z },
    up,
  );
  let half: number = FLOOR;
  const corner: THREE.Vector3 = new THREE.Vector3();
  for (let k: number = 0; k < 8; k++) {
    corner
      .set(
        (k & 1) === 0 ? min.x : max.x,
        (k & 2) === 0 ? min.y : max.y,
        (k & 4) === 0 ? min.z : max.z,
      )
      .applyMatrix4(camera.matrixWorldInverse);
    half = Math.max(half, Math.abs(corner.y), Math.abs(corner.x) / aspect);
  }
  half *= viewpoint.distanceFactor;
  camera.top = half;
  camera.bottom = -half;
  camera.right = half * aspect;
  camera.left = -half * aspect;
  camera.updateProjectionMatrix();
  return {
    camera,
    record: record(props.text, camera, props.height, {
      x: centre.x,
      y: centre.y,
      z: centre.z,
    }),
  };
}

/** The picture-up a viewpoint documents: `-Z` from the top, `+Z` from the bottom, `+Y` otherwise. */
function upOf(viewpoint: IAutoMovieViewerViewpoint): IAutoMovieVector3 {
  if (Math.abs(viewpoint.elevationDeg) !== 90) return { x: 0, y: 1, z: 0 };
  const sign: number = Math.sign(viewpoint.elevationDeg);
  const azimuth: number = THREE.MathUtils.degToRad(viewpoint.azimuthDeg);
  return { x: -sign * Math.sin(azimuth), y: 0, z: -sign * Math.cos(azimuth) };
}

/** Place an unparented camera and bring its matrices up to date. */
function aim(
  camera: THREE.Camera,
  position: IAutoMovieVector3,
  target: IAutoMovieVector3,
  up: IAutoMovieVector3,
): void {
  camera.position.set(position.x, position.y, position.z);
  camera.up.set(up.x, up.y, up.z);
  camera.lookAt(target.x, target.y, target.z);
  if (
    camera instanceof THREE.PerspectiveCamera ||
    camera instanceof THREE.OrthographicCamera
  )
    camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

/** The record of a placed camera, its target one metre ahead when the camera was not aimed here. */
function record(
  text: string,
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  height: number,
  target?: IAutoMovieVector3,
): IAutoMovieInspectionCamera {
  camera.updateMatrixWorld(true);
  const position: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
    camera.matrixWorld,
  );
  const forward: THREE.Vector3 = camera.getWorldDirection(new THREE.Vector3());
  const ahead: THREE.Vector3 = position.clone().add(forward);
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
    .transformDirection(camera.matrixWorld)
    .normalize();
  const orthographic: boolean = camera instanceof THREE.OrthographicCamera;
  return {
    view: text,
    projection: orthographic ? "orthographic" : "perspective",
    position: { x: position.x, y: position.y, z: position.z },
    target: target ?? { x: ahead.x, y: ahead.y, z: ahead.z },
    up: { x: up.x, y: up.y, z: up.z },
    fovDeg: orthographic ? null : (camera as THREE.PerspectiveCamera).fov,
    metresPerPixel: orthographic
      ? ((camera as THREE.OrthographicCamera).top -
          (camera as THREE.OrthographicCamera).bottom) /
        height
      : null,
    near: camera.near,
    far: camera.far,
  };
}

/** A vector from a triple. */
function vector(triple: readonly [number, number, number]): IAutoMovieVector3 {
  return { x: triple[0], y: triple[1], z: triple[2] };
}
