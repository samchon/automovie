import type { HumanObservationPass } from "../common/observation/HumanObservationPass.js";
import type { HumanObservationView } from "../common/observation/HumanObservationView.js";

/**
 * Selection shared by bookmarks and HTTP captures. `doc` selects a published
 * numerical document; operation and ao request numerical construction/baking,
 * while remaining fields choose its display. Consumers treat captured records
 * as immutable, although this interface does not enforce readonly fields.
 * Frame centres and radii use the displayed model's metres. Reference images
 * are optional local display resources and never enter model cache identities.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The record combines a published document selection, explicit numerical operation/AO requests and supported display framing/pass/visibility/reference controls. Parser and application admission own finite ranges and actual part/document resolution; typing alone does not validate URL input or photographic provenance.
 * @evidence contracts/common.md#clear-and-simple-design One address is shared by bookmark and capture consumers, with numerical selectors distinguished from display-only camera/light/reference settings. Numerical model cache identity excludes local reference presentation and display controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact part/document names and explicit camera data replace guessed selection or likeness registration. Existing optional calibration/reference displays remain instrumentation, not anatomical model input or evidence of measured tissue; partial/default camera settings do not establish matched image provenance.
 * @evidence contracts/common.md#meaningful-documentation Fields give metre/degree/pixel units, optional construction/default behavior, named versus explicit camera precedence, figure-light direction and reference modes. The comment distinguishes numerical AO/operation from other display fields and caller immutability obligation.
 * @evidence contracts/performance.md#efficient-algorithms Record size scales with part/hide names plus fixed framing/reference fields; actual capture raster, numerical baking and scene traversal costs belong to consumers. A requested square raster scales in pixels and is not constant-cost merely because size is one scalar.
 * @evidence contracts/performance.md#reuse-equivalent-work Numerical document/operation/AO and loaded source dependencies determine build reuse, while display-only changes reuse admitted model data. Equivalent address text alone does not certify equivalent native images without source, renderer and view provenance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record holds strings, arrays and scalar controls, no texture or viewport handle. Bookmark/capture owners retain their current addresses and actual reference/image resources; this type imposes no part-name population or raster-byte limit.
 */
export interface HumanViewerAddress {
  /** Published document identity, including the `body:` prefix for body states. */
  doc: string;

  /** Explicit product construction inspection; omission keeps admitted preview. */
  operation?: "preview" | "construct";

  /** Exact mesh names; empty means the assembled subject. */
  parts: string[];

  /** Exact mesh names hidden, the rest shown; combines with `parts` by hiding from the isolated set. */
  hide: string[];

  /** Anatomical viewing direction from the shared observation hook. */
  view: HumanObservationView;

  /**
   * Degrees added to the named view's elevation about the framed centre,
   * positive raising the camera. It reaches views from below or above at any
   * oblique azimuth, where the eight named directions cannot.
   */
  pitch: number;

  /** Display-only material pass. */
  pass: HumanObservationPass;

  /** Optional sphere centre and radius in metres. */
  frame: [number, number, number, number] | null;

  /**
   * Exact camera in the displayed model's metres: yaw and pitch in degrees,
   * the distance from the target, the target and the vertical field of view
   * in degrees, placed by the product's `humanCaptureCameraPosition`. It
   * overrides `view`, `pitch` and `frame`. It reproduces the supplied numerical
   * framing; matching a measured image still requires matching provenance.
   */
  look: [number, number, number, number, number, number, number] | null;

  /** Divisor of the framing sphere's radius before camera fitting; its centre stays fixed, and an explicit look overrides the resulting placement. This does not promise proportional projected size for every depth on a three-dimensional surface. */
  zoom: number;

  /** Bake numerical ambient occlusion when true. */
  ao: boolean;

  /** Cast display shadows through the viewport's lights; absent addresses default on. */
  shadows: boolean;

  /**
   * Body/Person inspection override for one studio light. The dimensionless
   * direction points from the world-origin target toward the light in Y-up
   * coordinates. Null restores the viewport's original studio directions.
   * It affects display only and never participates in numerical cache keys.
   */
  light: { name: string; direction: [number, number, number] } | null;

  /** Mark the photograph's observed landmarks over it, when a photograph is shown. */
  landmarks: boolean;

  /**
   * Add the hand-typed calibration spheres of `humanViewerCalibrationRig` beside
   * the subject, after framing, so a frame can be checked against independent
   * arithmetic. Off by default; it adds geometry to the picture only.
   */
  calibrate: boolean;

  /** Square render-cell side in pixels; reference or sheet composition can widen the final capture. */
  size: number;

  /** Requested local reference presentation, or null for none; the display owner separately checks photograph availability. */
  ref: "split" | "overlay" | "swipe" | null;

  /** Render contribution in overlay mode or horizontal divider fraction in swipe mode, between zero and one. */
  opacity: number;
}
