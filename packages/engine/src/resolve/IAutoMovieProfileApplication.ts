import { IAutoMovieProfile, IAutoMovieProfileBinding } from "@automovie/interface";

/**
 * One application of a profile onto a concrete subtree: the reusable profile
 * data, the binding that maps its semantic keys onto real node ids, and the
 * optional placement prefix a bridged actor's nodes carry
 * (`sceneToNodes`/`motionToClip` naming: `"actor/"` turns `hips` into
 * `actor/hips`).
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Applies one reusable control profile to a concrete rig subtree.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Defines one concrete profile-application request.
 * @author Samchon
 */
export interface IAutoMovieProfileApplication {
  /**
   * The profile being applied.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Supplies the reusable control profile selected for this application.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Carries the unbound profile graph.
   */
  profile: IAutoMovieProfile;

  /**
   * Where it lives this time (`boneMap`: semantic key → concrete node id).
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Maps each semantic node reference onto the selected concrete rig.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Supplies the binding that turns profile graph edges into executable node references.
   */
  binding: IAutoMovieProfileBinding;

  /**
   * Placement prefix prepended to every mapped node id, matching the
   * `nodePrefix` the scene bridge lowered the subtree with. Defaults to `""`.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Keeps bound driver nodes in the placed subtree's concrete namespace.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Resolves semantic graph references against their scene-bridge node prefix.
   */
  nodePrefix?: string;
}
