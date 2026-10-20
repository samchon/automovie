

/**
 * Perspective camera the client starts from and returns to on reset.
 */
export interface IViewerSceneCamera {
  /** Eye position, meters. */
  position: [number, number, number];

  /** Point the camera looks at, meters. */
  target: [number, number, number];

  /** Vertical field of view in degrees. */
  fovDeg: number;

  /** Near clip plane distance, meters. */
  near: number;

  /** Far clip plane distance, meters. */
  far: number;

  /** Full vertical extent for the fixed orthographic review camera. */
  orthographicSpan?: number;
}
