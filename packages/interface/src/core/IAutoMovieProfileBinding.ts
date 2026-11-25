/**
 * One application of a profile to a concrete scene or model subtree.
 *
 * The profile is reusable data; a binding says where that profile lives this
 * time. Several characters can share one humanoid profile while each binding
 * maps the profile's semantic keys onto that character's own node ids.
 *
 * `bindProfile` reads only `profile` and `boneMap`: `profile` must equal the
 * applied profile's id, every mapped id gets the application's placement
 * prefix, and a missing or blank mapping for a key the profile uses throws.
 * `forgeProp` also checks that each mapped id is a declared articulation node
 * and that every key the profile references is mapped. This mapping asserts
 * concrete node identity, without claiming a separate subtree-root constraint.
 */
export interface IAutoMovieProfileBinding {
  /** Id of the {@link IAutoMovieProfile} being applied. */
  profile: string;

  /**
   * Profile semantic key to concrete node id, before the placement prefix. For
   * a humanoid it plays the role of a VRM humanoid bone map (`"hips"` to a
   * rig's own hip node); for a prop it maps a key such as `"hinge"` to a
   * door pivot node. Entries for keys the profile never cites are ignored by
   * `bindProfile`.
   */
  boneMap: Record<string, string>;
}
