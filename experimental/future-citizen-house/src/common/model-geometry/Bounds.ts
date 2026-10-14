/**
 * Mutable local Cartesian intervals in metres used by draft mesh recipes. Callers supply finite ordered endpoints; this erased record performs no checks or copying.
 *
 * @author Samchon
 */
export interface Bounds {
  /** Local X minimum and maximum in metres. */
  x: [number, number];

  /** Local Y minimum and maximum in metres. */
  y: [number, number];

  /** Local Z minimum and maximum in metres. */
  z: [number, number];
}
