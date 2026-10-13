import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * Request one actual frame from the current compiled shot or model turntable.
 *
 * @evidence contracts/common.md#principled-implementation The oracle admits current generated identity and target existence, normalizes shot time to the production frame grid or derives canonical turntable time from the asset view, then requests bounded raster dimensions from the capture adapter.
 * @evidence contracts/common.md#clear-and-simple-design A target union separates shot identity from asset camera and pose parameters; common pass and raster fields configure the same verified PNG capture path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Captures use current compiled bytes, and part views are diagnostic only and cannot satisfy whole-model review; invalid dimensions and non-finite or negative input time refuse even for asset targets.
 * @evidence contracts/common.md#meaningful-documentation Defines target ownership, view parameters, shot-local seconds, frame snapping, default beauty pass, raster limits and the diagnostic-only part view.
 * @author Samchon
 */
export interface IAutoMoviePreviewFrameInput {
  /**
   * Exact shot or isolated compiled-model target.
   *
   * Whole-film and sequence review compose current shot frames. Asset review supplies the server-required turntable view so the capture receipt proves which angle and pose was inspected.
   */
  target:
    | {
        /** Shot target. */
        kind: "shot";

        /** Shot id. */
        id: string;
      }
    | {
        /** Isolated compiled model turntable target. */
        kind: "asset";

        /** Model-recipe id. */
        id: string;

        /** Finite turntable azimuth in degrees. */
        angleDeg: number;

        /** Finite camera elevation in degrees. */
        elevationDeg: number;

        /** Rest or required extreme-range rig pose. */
        pose: "rest" | "rom-extremes";

        /**
         * Compiled part id to frame instead of the whole model, when given.
         *
         * The turntable then fits that one part, which is how a mullion, a hinge, or a hand is looked at without exporting a separate model for it. A framed part is a diagnostic view: the asset review's required turntable is of the whole model and no part view discharges it.
         */
        part?: string;
      };

  /**
   * Finite non-negative shot-local seconds no later than shot duration, snapped to the nearest production frame. Asset targets still require a finite non-negative value but derive their sampled time from angleDeg.
   */
  time: number;

  /** Requested render pass, beauty by default. */
  pass?: AutoMovieGuidePass;

  /**
   * Optional positive integer width, no larger than production width. Width times height may not exceed 16,777,216 pixels.
   */
  width?: number;

  /**
   * Optional positive integer height, no larger than production height. Width times height may not exceed 16,777,216 pixels.
   */
  height?: number;
}
