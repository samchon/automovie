import { IAutoMovieProductionRepaintInput } from "./IAutoMovieProductionRepaintInput";
import { IAutoMovieRepaintRuntimeIdentity } from "./capture/IAutoMovieRepaintRuntimeIdentity";

/**
 * Host-owned optional repaint adapter returning fixed encoded video bytes. Provider execution remains outside deterministic compilation; adoption validates and identifies the returned MP4 before it can enter delivery.
 *
 * @evidence contracts/common.md#principled-implementation The asynchronous seam converts a prepared repaint request into immutable output bytes with provider-model provenance and optional measured cost; the production repaint service validates the returned media before constructing an adoption receipt.
 * @evidence contracts/common.md#clear-and-simple-design Host execution is one callback separate from request policy, attempt accounting and rendition selection, leaving provider-specific network execution outside the deterministic engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A sampled response is accepted only as fixed encoded bytes rather than a promise of reproducibility, and the declared video media type does not replace actual MP4 inspection.
 * @evidence contracts/common.md#meaningful-documentation Gives host execution ownership, fixed-video output, provider identity, the nonnegative policy-unit cost and the validation boundary before delivery adoption.
 * @author Samchon
 */
export type AutoMovieProductionShotRepaint = (
  input: IAutoMovieProductionRepaintInput,
) => Promise<{
  /** Actual encoded rendition bytes. */
  bytes: Uint8Array;

  /** Required video media type. */
  mediaType: "video/mp4";

  /** Structured provider/model identity. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;

  /** Non-negative metered cost in the unit declared by the execution policy. */
  costUnits?: number;
}>;
