import { IAutoMovieDeliveryCrop } from "../cinematics/IAutoMovieDeliveryCrop";
import { IAutoMovieRenderObservation } from "../render/IAutoMovieRenderObservation";
import { IAutoMovieSemanticMaskEvidence } from "../render/IAutoMovieSemanticMaskEvidence";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieCaptureObservation } from "./AutoMovieCaptureObservation";
import { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMoviePreviewFrameInput } from "./IAutoMoviePreviewFrameInput";

/**
 * Host-owned adapter that captures a current compiled production frame.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `AutoMovieProductionFrameCapture` as the portable data boundary for the agent host evidence requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `AutoMovieProductionFrameCapture` for the spec authoring host evidence output system contract.
 */
export type AutoMovieProductionFrameCapture = (
  input: IAutoMoviePreviewFrameInput & {
    /** Active project root. */
    projectRoot: string;

    /** Active production namespace inside the project. */
    productionId: string;

    /** Current compile fingerprint. */
    compileFingerprint: AutoMovieContentDigest;

    /** Delivery crop for a shot capture; absent for isolated asset captures. */
    crop?: IAutoMovieDeliveryCrop;
  },
) => Promise<{
  /** Raw PNG bytes. */
  bytes: Uint8Array;

  /** Final-byte dialogue state consumed by the drawn frame, or null. */
  dialogueRuntimeIdentity: AutoMovieContentDigest | null;

  /** Structured browser, executable, mode, platform, and graphics identity. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity;

  /** Pixel width. */
  width: number;

  /** Pixel height. */
  height: number;

  /**
   * Counts observed from the same drawn shot frame, or an explicit reason the
   * selected capture path could not obtain them.
   */
  observation: AutoMovieCaptureObservation<IAutoMovieRenderObservation>;

  /** Atomic same-shot palette and runtime coverage, or explicit absence. */
  semanticMask: AutoMovieCaptureObservation<IAutoMovieSemanticMaskEvidence>;
}>;
