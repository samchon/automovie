/**
 * A light property a shot's `lightMotions` may animate.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Defines the explicit light values an authored shot may vary over time.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Bounds animation to properties owned by the staged authored light branch.
 */
export type AutoMovieLightProperty =
  | "intensity"
  | "color"
  | "range"
  | "coneAngle"
  | "position"
  | "rotation";
