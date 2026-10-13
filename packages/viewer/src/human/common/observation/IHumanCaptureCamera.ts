/**
 * A recorded perspective camera in the displayed metre-scale, Y-up frame.
 * Yaw and pitch locate its eye around the target without changing a model.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Carries a display-only recorded camera for anatomical view comparison.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps recorded camera placement independent of the numerical document.
 * @author Samchon
 */
export interface IHumanCaptureCamera {
  /** Azimuth in degrees; zero faces the target from positive Z. */
  yaw: number;

  /** Elevation in degrees; positive places the eye above the target. */
  pitch: number;

  /** Positive eye-to-target distance in metres. */
  distance: number;

  /** Target position in displayed-world metres. */
  target: [number, number, number];

  /** Vertical field in degrees; the historical capture uses 28 when absent. */
  fov?: number;
}
