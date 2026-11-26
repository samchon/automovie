import type * as THREE from "three";
import { type IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";
import { autoMovieViewerSubjectKey as autoMovieViewerSubjectKeyImplementation } from "./internal/autoMovieViewerSubjectKey.js";
import { parseAutoMovieViewerSubjectKey as parseAutoMovieViewerSubjectKeyImplementation } from "./internal/parseAutoMovieViewerSubjectKey.js";
import { type IAutoMovieViewerViewpoint } from "./IAutoMovieViewerViewpoint.js";
import { autoMovieViewerNamedViewpoints as autoMovieViewerNamedViewpointsImplementation } from "./internal/autoMovieViewerNamedViewpoints.js";
import { type IAutoMovieViewerTurntableOptions } from "./IAutoMovieViewerTurntableOptions.js";
import { autoMovieViewerTurntableViewpoints as autoMovieViewerTurntableViewpointsImplementation } from "./internal/autoMovieViewerTurntableViewpoints.js";
import { type IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";
import { type IAutoMovieViewerSubjectBounds } from "./IAutoMovieViewerSubjectBounds.js";
import { type IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";
import { frameAutoMovieViewerSubject as frameAutoMovieViewerSubjectImplementation } from "./internal/frameAutoMovieViewerSubject.js";
import { applyAutoMovieViewerSubjectPose as applyAutoMovieViewerSubjectPoseImplementation } from "./internal/applyAutoMovieViewerSubjectPose.js";
import { type IAutoMovieViewerSubjectView } from "./IAutoMovieViewerSubjectView.js";
import { type IAutoMovieViewerSubjectViewRequest } from "./IAutoMovieViewerSubjectViewRequest.js";
import { captureAutoMovieViewerSubjectView as captureAutoMovieViewerSubjectViewImplementation } from "./internal/captureAutoMovieViewerSubjectView.js";

/** Public operations for Auto Movie Render Subject Viewpoint. */
export namespace AutoMovieRenderSubjectViewpoint {
  /**
   * Format a caller-supplied subject as kind:id or kind:id@revision without
   * escaping. Round-trip requires a nonempty id, a nonempty revision without @
   * when present, and an id without @ when revision is null.
   */
  export function autoMovieViewerSubjectKey(subject: IAutoMovieViewerSubject): string {
    return autoMovieViewerSubjectKeyImplementation(subject);
  }

  /**
   * Parse the first colon as category boundary and last @ as revision boundary.
   * Unknown category, missing id and empty explicit revision refuse; this grammar
   * does not resolve source existence or unambiguously represent a revision
   * containing @.
   */
  export function parseAutoMovieViewerSubjectKey(key: string): IAutoMovieViewerSubject {
    return parseAutoMovieViewerSubjectKeyImplementation(key);
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
  export function autoMovieViewerNamedViewpoints(distanceFactor?: number): IAutoMovieViewerViewpoint[] {
    return autoMovieViewerNamedViewpointsImplementation(distanceFactor);
  }

  /**
   * Generate fresh viewpoints in elevation-ring then azimuth order, with rounded
   * whole-degree ids. Positive integer count, a nonempty ring list, positive
   * multiplier and duplicate ids are checked; finite angles/multiplier and a
   * practical output bound remain caller premises.
   */
  export function autoMovieViewerTurntableViewpoints(options: IAutoMovieViewerTurntableOptions): IAutoMovieViewerViewpoint[] {
    return autoMovieViewerTurntableViewpointsImplementation(options);
  }

  /**
   * Frame a finite ordered world-space box using its half-diagonal sphere,
   * floored at 0.5 metres, and the narrower perspective field. Factor at least
   * one is needed for the angular full-sphere fit; the near-clip floor can still
   * crop its near edge with very wide lenses. Valid finite angles/lens/bounds and
   * arithmetic range remain caller premises.
   */
  export function frameAutoMovieViewerSubject(bounds: IAutoMovieViewerSubjectBounds, viewpoint: IAutoMovieViewerViewpoint, lens: IAutoMovieViewerSubjectLens): IAutoMovieViewerSubjectPose {
    return frameAutoMovieViewerSubjectImplementation(bounds, viewpoint, lens);
  }

  /**
   * Apply an admitted inspection pose to a borrowed perspective camera and update
   * its projection and world matrix. World position is written as local position,
   * requiring an unparented camera or identity parent transform; failure does not
   * roll back earlier mutations.
   */
  export function applyAutoMovieViewerSubjectPose(camera: THREE.PerspectiveCamera, pose: IAutoMovieViewerSubjectPose): void {
    applyAutoMovieViewerSubjectPoseImplementation(camera, pose);
  }

  /**
   * Apply pose, resolve populations, then synchronously draw/encode one
   * inspection image. Subject and pose are supplied labels and borrowed
   * references; equal labels do not guarantee equal scene pixels, source
   * freshness or actual hardware readiness.
   */
  export function captureAutoMovieViewerSubjectView(request: IAutoMovieViewerSubjectViewRequest): IAutoMovieViewerSubjectView {
    return captureAutoMovieViewerSubjectViewImplementation(request);
  }
}
