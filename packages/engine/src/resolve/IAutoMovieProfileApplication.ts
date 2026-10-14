import {
  IAutoMovieProfile,
  IAutoMovieProfileBinding,
} from "@automovie/interface";

/**
 * One application of a profile onto a concrete subtree: the reusable profile
 * data, the binding that maps its semantic keys onto real node ids, and the
 * optional placement prefix a bridged actor's nodes carry
 * (`sceneToNodes`/`motionToClip` naming: `"actor/"` turns `hips` into
 * `actor/hips`).
 *
 *
 * @evidence contracts/common.md#principled-implementation Join an authored profile, its semantic-to-concrete bone map and an optional placement prefix; bindProfile checks profile identity and every referenced own mapping.
 * @evidence contracts/common.md#clear-and-simple-design The application keeps reusable rig policy separate from each concrete placement without another runtime profile registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted prefix means the empty string; pointer channels remain global and missing/blank semantic mappings are errors rather than dropped constraints.
 * @evidence contracts/common.md#meaningful-documentation Members identify borrowed profile/binding records and literal prefix concatenation matching scene lowering and motion clips.
 * @evidence contracts/performance.md#efficient-algorithms This wrapper adds constant references plus prefix text; binding allocates records proportional to profile limits/drivers and their node references.
 * @evidence contracts/performance.md#reuse-equivalent-work Authored profile data can serve multiple bindings; cached concrete results are valid only while policy, mapping and prefix remain unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The resolve input borrows application records for the frame/shot; the type owns no graph, bound-result cache, host handle or task.
 * @author Samchon
 */
export interface IAutoMovieProfileApplication {
  /** The profile being applied. */
  profile: IAutoMovieProfile;

  /** Where it lives this time (`boneMap`: semantic key → concrete node id). */
  binding: IAutoMovieProfileBinding;

  /**
   * Placement prefix prepended to every mapped node id, matching the
   * `nodePrefix` the scene bridge lowered the subtree with. Defaults to `""`.
   */
  nodePrefix?: string;
}
