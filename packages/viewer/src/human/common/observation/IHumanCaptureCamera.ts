/**
 * A recorded perspective camera in the displayed metre-scale, Y-up frame.
 * Yaw and pitch locate its eye around the target without changing a model.
 *
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
