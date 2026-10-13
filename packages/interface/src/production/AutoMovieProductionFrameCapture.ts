import { IAutoMovieDeliveryCrop } from "../cinematics/IAutoMovieDeliveryCrop";
import { IAutoMovieRenderObservation } from "../render/IAutoMovieRenderObservation";
import { IAutoMovieSemanticMaskEvidence } from "../render/IAutoMovieSemanticMaskEvidence";
import { AutoMovieCaptureObservation } from "./AutoMovieCaptureObservation";
import { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMoviePreviewFrameInput } from "./IAutoMoviePreviewFrameInput";

/**
 * Host-owned adapter that captures a current compiled production frame. The returned observations must describe the same drawn frame as the PNG; production verifies image bytes and runtime identity before publication.
 *
 * @evidence contracts/common.md#principled-implementation The asynchronous host seam returns actual PNG bytes with dimensions, runtime identity and same-frame observations, bound to the input compile fingerprint and optional shot crop; the oracle decodes and validates those facts before publishing a receipt.
 * @evidence contracts/common.md#clear-and-simple-design The callback isolates browser or GPU capture from production orchestration, while discriminated observations preserve explicit absence without coupling the render and semantic-mask schemas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A host supplies actual encoded bytes and observed runtime facts rather than an assumed screenshot identity; unavailable measurements carry not-run reasons and cannot masquerade as measured zero counts.
 * @evidence contracts/common.md#meaningful-documentation Defines host ownership, current production and compile inputs, optional crop, PNG output, drawn-frame consistency, dialogue identity and explicit observation availability.
 * @author Samchon
 */
export type AutoMovieProductionFrameCapture = (
  input: IAutoMoviePreviewFrameInput & {
    /** Active project root. */
    projectRoot: string;

    /** Active production namespace inside the project. */
    productionId: string;

    /** Current compile fingerprint. */
    compileFingerprint: string;

    /** Delivery crop for a shot capture; absent for isolated asset captures. */
    crop?: IAutoMovieDeliveryCrop;
  },
) => Promise<{
  /** Raw PNG bytes. */
  bytes: Uint8Array;

  /** Final-byte dialogue state consumed by the drawn frame, or null. */
  dialogueRuntimeIdentity: string | null;

  /** Structured browser, executable, mode, platform, and graphics identity. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity;

  /** Pixel width. */
  width: number;

  /** Pixel height. */
  height: number;

  /**
   * Counts observed from the same drawn shot frame, or an explicit reason the selected capture path could not obtain them.
   */
  observation: AutoMovieCaptureObservation<IAutoMovieRenderObservation>;

  /** Atomic same-shot palette and runtime coverage, or explicit absence. */
  semanticMask: AutoMovieCaptureObservation<IAutoMovieSemanticMaskEvidence>;
}>;
