import type * as THREE from "three";
import type { IAutoMovieRenderViewerSnapshot } from "./IAutoMovieRenderViewerSnapshot";
import type { IAutoMovieRenderViewerSnapshotOptions } from "./IAutoMovieRenderViewerSnapshotOptions";
import type { IAutoMovieRenderViewerSnapshotRenderer } from "./IAutoMovieRenderViewerSnapshotRenderer";
import type { IAutoMovieRenderUpdateComparisonCameraProps } from "./IAutoMovieRenderUpdateComparisonCameraProps";
import { captureViewerSnapshot as captureViewerSnapshotImplementation } from "./subjectViewpoint/internal/captureViewerSnapshot";
import { updateComparisonCamera as updateComparisonCameraImplementation } from "./subjectViewpoint/internal/updateComparisonCamera";
import { type IAutoMovieRenderViewerSubject } from "./IAutoMovieRenderViewerSubject";
import { viewerSubjectKey as viewerSubjectKeyImplementation } from "./subjectViewpoint/internal/viewerSubjectKey";
import { parseViewerSubjectKey as parseViewerSubjectKeyImplementation } from "./subjectViewpoint/internal/parseViewerSubjectKey";
import { type IAutoMovieRenderViewerViewpoint } from "./IAutoMovieRenderViewerViewpoint";
import { viewerNamedViewpoints as viewerNamedViewpointsImplementation } from "./subjectViewpoint/internal/viewerNamedViewpoints";
import { type IAutoMovieRenderViewerTurntableOptions } from "./IAutoMovieRenderViewerTurntableOptions";
import { viewerTurntableViewpoints as viewerTurntableViewpointsImplementation } from "./subjectViewpoint/internal/viewerTurntableViewpoints";
import { type IAutoMovieRenderViewerSubjectPose } from "./IAutoMovieRenderViewerSubjectPose";
import { type IAutoMovieRenderViewerSubjectBounds } from "./IAutoMovieRenderViewerSubjectBounds";
import { type IAutoMovieRenderViewerSubjectLens } from "./IAutoMovieRenderViewerSubjectLens";
import { frameViewerSubject as frameViewerSubjectImplementation } from "./subjectViewpoint/internal/frameViewerSubject";
import { applyViewerSubjectPose as applyViewerSubjectPoseImplementation } from "./subjectViewpoint/internal/applyViewerSubjectPose";
import { type IAutoMovieRenderViewerSubjectView } from "./IAutoMovieRenderViewerSubjectView";
import { type IAutoMovieRenderViewerSubjectViewRequest } from "./IAutoMovieRenderViewerSubjectViewRequest";
import { captureViewerSubjectView as captureViewerSubjectViewImplementation } from "./subjectViewpoint/internal/captureViewerSubjectView";
import { viewerPoseFromHeadingImplementation } from "./subjectViewpoint/internal/viewerPoseFromHeadingImplementation";

/** Public operations for Auto Movie Render Subject Viewpoint. */
export namespace AutoMovieRenderSubjectViewpoint {
  /** Render and encode one viewer snapshot through the borrowed renderer. */
  export function captureSnapshot(
    renderer: IAutoMovieRenderViewerSnapshotRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    options?: IAutoMovieRenderViewerSnapshotOptions,
  ): IAutoMovieRenderViewerSnapshot {
    return captureViewerSnapshotImplementation(renderer, scene, camera, options);
  }

  /** Update a matched parallel comparison from a standalone perspective view. */
  export function updateComparisonCamera(
    props: IAutoMovieRenderUpdateComparisonCameraProps,
  ): void {
    updateComparisonCameraImplementation(props);
  }

  /**
   * Format a caller-supplied subject as kind:id or kind:id@revision without
   * escaping. Round-trip requires a nonempty id, a nonempty revision without @
   * when present, and an id without @ when revision is null.
   */
  export function autoMovieViewerSubjectKey(subject: IAutoMovieRenderViewerSubject): string {
    return viewerSubjectKeyImplementation(subject);
  }

  /**
   * Parse the first colon as category boundary and last @ as revision boundary.
   * Unknown category, missing id and empty explicit revision refuse; this grammar
   * does not resolve source existence or unambiguously represent a revision
   * containing @.
   */
  export function parseAutoMovieViewerSubjectKey(key: string): IAutoMovieRenderViewerSubject {
    return parseViewerSubjectKeyImplementation(key);
  }

  /**
   * The eight views an inspection asks for by name: the six along the world axes
   * and two three-quarter views.
   *
   * A view is named by where the camera stands, looking at the subject's centre.
   * For a subject built facing +Z these are its own front, back and sides.
   *
   * | Id                   | Camera                                         | Reads                            |
   * | -------------------- | ---------------------------------------------- | -------------------------------- |
   * | `front`              | On +Z                                          | The XY silhouette                |
   * | `back`               | On -Z                                          | The XY silhouette, mirrored      |
   * | `right`              | On +X                                          | The ZY profile                   |
   * | `left`               | On -X                                          | The ZY profile, mirrored         |
   * | `top`                | On +Y, looking down, with -Z up in the picture | The XZ plan                      |
   * | `bottom`             | On -Y, looking up, with +Z up in the picture   | The XZ plan, mirrored            |
   * | `three-quarter`      | Between +Z and +X, raised 20 degrees           | Front and side together          |
   * | `three-quarter-back` | Between -Z and -X, raised 20 degrees           | Back and the other side together |
   *
   * `distanceFactor` multiplies the distance at which the subject fills the
   * frame, 1.25 when omitted as in the turntable plan. It throws when the factor
   * is not positive and finite.
   */
  export function autoMovieViewerNamedViewpoints(distanceFactor?: number): IAutoMovieRenderViewerViewpoint[] {
    return viewerNamedViewpointsImplementation(distanceFactor);
  }

  /**
   * Generate fresh viewpoints in elevation-ring then azimuth order, with rounded
   * whole-degree ids. Positive integer count, a nonempty ring list, positive
   * multiplier and duplicate ids are checked; finite angles/multiplier and a
   * practical output bound remain caller premises.
   */
  export function autoMovieViewerTurntableViewpoints(options: IAutoMovieRenderViewerTurntableOptions): IAutoMovieRenderViewerViewpoint[] {
    return viewerTurntableViewpointsImplementation(options);
  }

  /**
   * Frame a finite ordered world-space box using its half-diagonal sphere,
   * floored at 0.5 metres, and the narrower perspective field. Factor at least
   * one is needed for the angular full-sphere fit; the near-clip floor can still
   * crop its near edge with very wide lenses. Valid finite angles/lens/bounds and
   * arithmetic range remain caller premises.
   */
  export function frameAutoMovieViewerSubject(bounds: IAutoMovieRenderViewerSubjectBounds, viewpoint: IAutoMovieRenderViewerViewpoint, lens: IAutoMovieRenderViewerSubjectLens): IAutoMovieRenderViewerSubjectPose {
    return frameViewerSubjectImplementation(bounds, viewpoint, lens);
  }

  /**
   * Apply an admitted inspection pose to a borrowed perspective camera and update
   * its projection and world matrix. World position is written as local position,
   * requiring an unparented camera or identity parent transform; failure does not
   * roll back earlier mutations.
   */
  export function applyAutoMovieViewerSubjectPose(camera: THREE.PerspectiveCamera, pose: IAutoMovieRenderViewerSubjectPose): void {
    applyViewerSubjectPoseImplementation(camera, pose);
  }

  /**
   * Apply pose, resolve populations, then synchronously draw/encode one
   * inspection image. Subject and pose are supplied labels and borrowed
   * references; equal labels do not guarantee equal scene pixels, source
   * freshness or actual hardware readiness.
   */
  export function captureAutoMovieViewerSubjectView(request: IAutoMovieRenderViewerSubjectViewRequest): IAutoMovieRenderViewerSubjectView {
    return captureViewerSubjectViewImplementation(request);
  }

  /**
   * Resolve an inspection heading into a target one metre ahead: yaw zero faces
   * -Z, positive yaw faces -X, and positive pitch points upward. The returned
   * pose borrows position and lens; clip range is checked only by ordered
   * comparisons.
   */
  export function poseFromHeading(
    position: { x: number; y: number; z: number },
    headingDeg: { yaw: number; pitch: number },
    lens: IAutoMovieRenderViewerSubjectLens,
    clip: { near: number; far: number },
  ): IAutoMovieRenderViewerSubjectPose {
    return viewerPoseFromHeadingImplementation(
      position,
      headingDeg,
      lens,
      clip,
    );
  }
}
