import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * One builder-registry target accepted by the evidence capture tool.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `AutoMovieCaptureTarget` as the portable data boundary for the agent host evidence requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `AutoMovieCaptureTarget` for the spec authoring host evidence output system contract.
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
       * The turntable fits that one part, which is how a mullion, a hinge, or a
       * hand is inspected without exporting a model for it. A part view is a
       * diagnostic look and never discharges a required asset review view,
       * because what that review judges is the whole silhouette.
       */
      part?: string;
      /** Requested beauty or structural render pass. */
      pass?: AutoMovieGuidePass;
    };
