import type * as THREE from "three";

/**
 * Detached native camera state admitted by createViewerCameraState.restore.
 * Vectors and lens values are local native camera data, not a world hierarchy.
 *
 * @evidence contracts/common.md#principled-implementation The record contains copied native lens, TRS, layers and projection state for detached auto-updating PerspectiveCamera or OrthographicCamera. Unknown restore input is checked against a native candidate; this interface itself performs no runtime admission.
 * @evidence contracts/common.md#clear-and-simple-design One named transfer record exposes the existing camera payload so another exported transfer can name its return type. It introduces no alternate camera solver or new fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lens discriminants retain the two supported native classes; projection arrays are not accepted as a shortcut around lens parity, and parent relationships are not guessed.
 * @evidence contracts/common.md#meaningful-documentation Fields state local vector and quaternion order, metre/millimetre/degree units, layer mask and view offset optionality. The comment identifies the runtime admission owner.
 * @evidence contracts/performance.md#efficient-algorithms This is a fixed-size scalar and tuple payload; capture and restore each handle constant-size state aside from native camera clone's possible child subtree.
 * @evidence contracts/performance.md#reuse-equivalent-work Each capture copies current mutable camera state. The type defines no state cache and restore cannot substitute a previous lens for a newly supplied payload.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The payload retains scalar values and copied arrays/view fields with no renderer, scene or native handle. Its lifetime transfers to the snapshot consumer and ends when its references become unreachable.
 *
 * @author Samchon
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
