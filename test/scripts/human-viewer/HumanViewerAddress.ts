import type { HumanObservationPass } from "@automovie/playground/src/human/common/observation/HumanObservationPass";
import type { HumanObservationView } from "@automovie/playground/src/human/common/observation/HumanObservationView";

/**
 * Immutable display selection shared by bookmarks and HTTP captures. `doc`
 * selects a published numerical document; the other fields only affect display.
 * Frame centres and radii use the displayed model's metres. Reference images
 * are optional local display resources and never enter model cache identities.
 *
 * @evidence contracts/common.md#principled-implementation A finite display record keeps model selection distinct from camera and material selection.
 * @evidence contracts/common.md#clear-and-simple-design One address representation serves both browser navigation and capture requests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Document identities are data supplied by the catalogue, without subject-specific behavior.
 * @evidence contracts/common.md#meaningful-documentation Documents display ownership and metre-based framing independently of anatomical inputs.
 * @author Samchon
 */
export interface HumanViewerAddress {
  /** Published document identity, including the `body:` prefix for body states. */
  doc: string;

  /** Exact mesh names; empty means the assembled subject. */
  parts: string[];

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
   * in degrees, placed as `faceShapeFitView` places a portrait camera. It
   * overrides `view`, `pitch` and `frame`, so a measured pose renders exactly
   * where it was measured.
   */
  look: [number, number, number, number, number, number, number] | null;

  /** Bake numerical ambient occlusion when true. */
  ao: boolean;

  /** Square capture side in pixels. */
  size: number;

  /** Local reference presentation, absent when no local reference is configured. */
  ref: "split" | "overlay" | "swipe" | null;

  /** Render contribution in overlay mode, between zero and one. */
  opacity: number;
}
