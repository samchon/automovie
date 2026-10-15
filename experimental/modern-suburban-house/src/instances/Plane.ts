
/** Half-plane `x * px + y * py <= limit` in facade-local coordinates. */
export type Plane = {
  /** Normal's first component. */
  x: number;
  /** Normal's second component. */
  y: number;
  /** Offset bounding the half-plane. */
  limit: number;
};
