import { IAutoMovieFilmEdit, IAutoMovieFilmTimeline } from "@automovie/interface";

/**
 * Borrowed authored edit and resolved timeline before the build owner seals builder metadata, compile identity, and source digest. Materialization consumes this draft only after assembly and asset-use admission.
 *
 * @evidence contracts/common.md#principled-implementation The timeline type omits exactly builder, inputFingerprint, and sourceDigest from the published timeline representation, expressing the assembly stage without claiming those identities have already been established.
 * @evidence contracts/common.md#clear-and-simple-design The two-field structural interface separates authored edit and resolved schedule from publication sealing; productionBuildArtifacts supplies the omitted identity fields later.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The omitted fields represent a real pre-sealing stage, not optional publication provenance or a way to bypass final identity checks. Runtime data remains mutable and is not deep-frozen by this type.
 * @evidence contracts/common.md#meaningful-documentation Members identify authored edit and frame-resolved schedule; the comment names missing build metadata, borrowed ownership, and the consuming materialization stage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface chooses no runtime traversal or allocation; assembleFilm and materializeFilmArtifacts own schedule construction and sealing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased draft shape performs no work sharing or invalidation; current build owners decide whether edit and timeline inputs are reusable.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no handles or state. Runtime edit references and timeline arrays belong to assembly and materialization callers, with no bound imposed by this structural type.
 *
 * @author Samchon
 */
export interface ICompiledFilmDraft {
  /** The source-selected sequence of video and timed tracks. */
  edit: IAutoMovieFilmEdit;

  /** Frame-resolved edit before build metadata is attached. */
  timeline: Omit<
    IAutoMovieFilmTimeline,
    "builder" | "inputFingerprint" | "sourceDigest"
  >;
}
