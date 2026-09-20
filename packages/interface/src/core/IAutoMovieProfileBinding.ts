/**
 * One application of a profile to a concrete scene/model subtree.
 *
 * The profile is reusable data; a binding says where that profile lives this
 * time. Multiple characters can share one humanoid profile while each binding
 * maps the profile controls/bones onto that character's own node ids.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-humanoid-mapping Exposes `IAutoMovieProfileBinding` as the semantic-profile-to-concrete-node mapping boundary.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping Types `IAutoMovieProfileBinding` as an authoritative semantic rig binding.
 * @author Samchon
 */
export interface IAutoMovieProfileBinding {
  /**
   * Id of the {@link IAutoMovieProfile} being applied.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-humanoid-mapping Exposes `profile` as the stable semantic profile identity selected by the binding.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping Types `profile` as the identity of an open semantic rig mapping.
   */
  profile: string;

  /**
   * Root node id of the subtree this profile controls.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-humanoid-mapping Exposes `root` as the concrete subtree receiving the semantic mapping.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping Types `root` as the concrete rig binding root.
   */
  root: string;

  /**
   * Optional instance name for multiple applications of the same profile on one
   * model, e.g. `"hero"` / `"villain"` or `"leftDoor"` / `"rightDoor"`.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-humanoid-mapping Exposes `instanceName` as the stable identity for one application of a semantic mapping.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping Types `instanceName` as a distinct semantic mapping instance.
   */
  instanceName: string | null;

  /**
   * Profile semantic key -> concrete node id. For a humanoid this is equivalent
   * to VRM/HumanIK characterization (`"hips" -> "mixamorig:Hips"`); for a prop
   * it can map controls such as `"hinge"` to a door pivot node.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-humanoid-mapping Exposes `boneMap` as the explicit semantic-role-to-model-node mapping.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-semantic-joint-mapping Types `boneMap` as authoritative mapping data rather than a name guess.
   */
  boneMap: Record<string, string>;
}
