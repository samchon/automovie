import type * as THREE from "three";

/**
 * Detached native camera state admitted by AutoMovieViewerDisplay.createCameraState.restore.
 * Vectors and lens values are local native camera data, not a world hierarchy.
 */
export interface IViewerCameraStateSnapshot {
  /** Native camera class identity; restore requires the same current class. */
  type: string;

  /** Local metre translation, x/y/z. */
  position: THREE.Vector3Tuple;

  /** Local x/y/z/w orientation copied without implicit normalization. */
  quaternion: THREE.QuaternionTuple;

  /** Nonzero dimensionless local axis scales. */
  scale: THREE.Vector3Tuple;

  /** Nonzero camera-up vector used by controls. */
  up: THREE.Vector3Tuple;

  /** Native 32-bit layer bitmask. */
  layers: number;

  /** Native column-major projection values, checked against restored lens state. */
  projection: THREE.Matrix4Tuple;

  /** Full-raster view offset, including its enabled flag, or omission by null. */
  view: THREE.PerspectiveCamera["view"];

  /** Native lens scalars: degree fov, metre clip/focus, millimetre film fields. */
  lens:
    | {
        kind: "perspective";
        fov: number;
        aspect: number;
        near: number;
        far: number;
        zoom: number;
        filmGauge: number;
        filmOffset: number;
        focus: number;
      }
    | {
        kind: "orthographic";
        left: number;
        right: number;
        top: number;
        bottom: number;
        near: number;
        far: number;
        zoom: number;
      };
}
