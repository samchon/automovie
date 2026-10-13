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
