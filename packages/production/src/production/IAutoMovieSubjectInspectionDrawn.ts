import { IAutoMovieCaptureRuntimeIdentity } from "@automovie/interface";

/**
 * Carry an opaque host's PNG bytes, actual raster size and optional current-runtime observation.
 *
 * @evidence contracts/common.md#principled-implementation The sweep decodes bytes and checks reported/decoded/requested sizes before accepting the per-view result.
 * @evidence contracts/common.md#clear-and-simple-design PNG acquisition and runtime assertion are separate from later receipt/journal publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent runtime fields refuse; decoded variance is not subject visibility, and core has no current product producer of this record.
 * @evidence contracts/common.md#meaningful-documentation runtimeIdentity is host metadata and assertRuntimeCurrent must remain callable unbound at final sweep completion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Host capture, PNG decode and variance scanning execute at adapter/sweep owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same drawn bytes are hashed/published after decode rather than another host draw for the receipt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller/sweep owns provided buffers while optional callback closure and host resources retain their own lifetimes.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionDrawn {
  /** Raw PNG bytes. */
  bytes: Uint8Array;

  /** Pixel width the instrument actually drew. */
  width: number;

  /** Pixel height the instrument actually drew. */
  height: number;

  /** Complete launch closure combined with the actual page graphics identity. */
  runtimeIdentity?: IAutoMovieCaptureRuntimeIdentity;

  /**
   * Ask the opaque host whether its reported runtime is still current.
   *
   * @evidence contracts/common.md#principled-implementation The sweep invokes this supplied assertion around publication and again before whole completion.
   * @evidence contracts/common.md#clear-and-simple-design Host-runtime observation stays separate from structural canonical identity comparison.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No current product producer supplies this callback; a successful return is the host's assertion and does not independently inspect graphics here.
   * @evidence contracts/common.md#meaningful-documentation The final invocation is unbound, so callback closure state must suffice; thrown failures become terminal capture diagnostics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Runtime closure observation executes in the supplied host callback, not this erased signature.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same assertion is retained for finalization after per-view checks without caching a previous successful verdict.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its closure lives with drawn/sweep state and host handles remain host-owned, with no disposal supplied by this field.
   */
  assertRuntimeCurrent?: () => void;
}
