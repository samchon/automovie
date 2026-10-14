import { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame";
import { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan";





/**
 * Host I/O for sequence rendering. The capture adapter receives the resolved sequence frame sample, including the live shot local time and optional outgoing blend tail; drawing pixels remains the host's job.
 *
 * @evidence contracts/common.md#principled-implementation Sequence capture receives the fully resolved frame and the same manifest used for encoding, including outgoing blend tails.
 * @evidence contracts/common.md#clear-and-simple-design These callbacks separate host drawing and encoder effects from deterministic sequence playback resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared callbacks are public host seams and do not replace renderer globals or hidden engine state.
 * @evidence contracts/common.md#meaningful-documentation Capture returns the actual written frame path and encode returns the actual video path, with all frame timing supplied by the plan.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sequence host callback schema declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased port shares no in-flight capture or encode; renderSequenceVideo supplies one common manifest and waits for distinct host effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased sequence callback port acquires nothing; host implementations own capture and encoding sessions and must release them on completion or rejection, independently of this signature.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderAdapters {
  /**
   * Capture one resolved sequence frame and return the written frame path.
   *
   * @evidence contracts/common.md#principled-implementation renderSequenceVideo passes each prepared frame and the same sequence manifest, awaiting capture in plan order. The frame includes shot-local timing and any outgoing blend tail; the host draws those inputs and returns its reported written path without an independent pixel or filesystem check here.
   * @evidence contracts/common.md#clear-and-simple-design One resolved frame plus its shared manifest exposes sequence semantics without moving cut resolution or playback arithmetic into this callback declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied capture operation is the declared host seam; rejection stops execution before encoding, with no missing-shot fallback or fabricated successful frame.
   * @evidence contracts/common.md#meaningful-documentation The member identifies a resolved frame, shared manifest and reported destination. Implementations must keep these shared plan inputs stable during rendering and honor the frame's shot and blend semantics; the returned path alone does not prove capture.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased signature selects no scene or blend rendering algorithm. renderSequenceVideo owns O(F) scheduling and shallow metadata copies; the host owns actual per-frame drawing and writing cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration coordinates no capture cache. The orchestration shares one unchanged manifest across calls, while each scheduled capture remains a distinct host effect whose reuse needs host-specific equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased member acquires no drawing session or file. The concrete host owns capture resources and failure cleanup; renderSequenceVideo preserves supplied sample fields with the reported path in its caller-owned result records.
   *
   * @author Samchon
   */
  captureFrame: (
    frame: IAutoMovieSequenceRenderFrame,
    plan: IAutoMovieSequenceRenderPlan,
  ) => Promise<string>;

  /**
   * Encode the captured frame sequence and return the encoded output path.
   *
   * @evidence contracts/common.md#principled-implementation renderSequenceVideo invokes this capability once after all prepared frames capture successfully, passing the manifest's exact ffmpegArgs and outputPath. The host performs encoding and returns its reported output, whose container and pixels are not independently validated by this orchestration.
   * @evidence contracts/common.md#clear-and-simple-design One encoder promise consumes planned sequence arguments, leaving manifest construction with planSequenceRender and actual codec execution with the host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This public effect seam does not replace a global encoder. Its rejection propagates, and sequence identity or output naming cannot turn an unencoded result into successful orchestration metadata.
   * @evidence contracts/common.md#meaningful-documentation The member states captured-sequence encoding and returned destination; the host must keep shared manifest arguments stable and complete encoding before resolving, while this signature cannot prove actual output bytes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased member chooses no encoder algorithm. Input frame reads, compression and output writes belong to the concrete host; renderSequenceVideo only schedules and awaits one encode call.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared encoding work; the host needs complete input and encoding equivalence before reuse, and the sequence orchestrator performs one encode per attempt.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased member opens no process or stream. The host owns encoder lifetime and cleanup on completion or rejection; the orchestrator returns the reported path alongside the shared manifest and caller-owned frame metadata.
   *
   * @author Samchon
   */
  encode: (args: string[], outputPath: string) => Promise<string>;
}
