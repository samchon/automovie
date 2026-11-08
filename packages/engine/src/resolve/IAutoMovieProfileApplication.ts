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
 * @evidence contracts/development/design.md#principled-representation Join an authored profile, its semantic-to-concrete bone map and an optional placement prefix; bindProfile checks profile identity and every referenced own mapping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The application keeps reusable rig policy separate from each concrete placement without another runtime profile registry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted prefix means the empty string; pointer channels remain global and missing/blank semantic mappings are errors rather than dropped constraints.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify borrowed profile/binding records and literal prefix concatenation matching scene lowering and motion clips.
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
