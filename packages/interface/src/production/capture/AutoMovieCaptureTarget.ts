import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * Current builder-registry shot frame or compiled asset turntable view accepted by the evidence capture tool.
 *
 * @evidence contracts/common.md#principled-implementation The target union provides exact production and registry identity plus shot-local time or model view parameters; capture resolves current registry membership and delegates actual verified PNG production to the oracle.
 * @evidence contracts/common.md#clear-and-simple-design Shot and asset arms carry only their own temporal or camera operands, with common optional render pass and explicit namespace rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown registry targets refuse and a part view is diagnostic only; caller-chosen convenient angles cannot discharge the server-required whole-model review population.
 * @evidence contracts/common.md#meaningful-documentation Defines current target identity, production default behavior, time and angle units, default elevation and pose and diagnostic part framing.
 * @author Samchon
 */
export type AutoMovieCaptureTarget =
  | {
      /** Current compiled shot frame. */
      kind: "shot";

      /** Exact production namespace owning the compiled shot. */
      productionId: string;

      /** Registry-owned shot id. */
      id: string;

      /** Finite non-negative shot-local time in seconds. */
      time: number;

      /** Requested beauty or structural render pass. */
      pass?: AutoMovieGuidePass;
    }
  | {
      /** Current compiled asset turntable frame. */
      kind: "asset";

      /** Optional production namespace; required when the host has no default. */
      productionId?: string;

      /** Registry-owned asset id. */
      id: string;

      /** Finite turntable azimuth in degrees. */
      angleDeg: number;

      /** Finite camera elevation in degrees, zero by default. */
      elevationDeg?: number;

      /** Rest or extreme-range rig pose, rest by default. */
      pose?: "rest" | "rom-extremes";

      /**
       * Compiled part id to frame instead of the whole model.
       *
       * The turntable fits that one part, which is how a mullion, a hinge, or a hand is inspected without exporting a model for it. A part view is a diagnostic look and never discharges a required asset review view, because what that review judges is the whole silhouette.
       */
      part?: string;

      /** Requested beauty or structural render pass. */
      pass?: AutoMovieGuidePass;
    };
