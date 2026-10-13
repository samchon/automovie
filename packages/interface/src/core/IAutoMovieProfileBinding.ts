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
 *
 * @evidence contracts/common.md#principled-implementation Binding is a total lookup: each semantic key the profile's limits and drivers cite is replaced by `prefix + boneMap[key]`, and a key with no entry or a blank entry throws, so a bound profile never silently loses a constraint.
 * @evidence contracts/common.md#clear-and-simple-design The binding is separate from the profile so one profile serves many bodies, and the mapping is a plain record because lookup by key is its only operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No key is guessed from node names, and no unread root or instance label claims a hierarchy constraint the binder does not enforce; only the profile identity and explicit semantic mapping drive binding.
 * @evidence contracts/common.md#meaningful-documentation States profile-id matching, semantic key mapping before the placement prefix, missing and blank mapping failures, articulation-node membership and the absence of a separate subtree-root assertion.
 * @author Samchon
 */
export interface IAutoMovieProfileBinding {
  /** Id of the {@link IAutoMovieProfile} being applied. */
  profile: string;

  /**
   * Profile semantic key to concrete node id, before the placement prefix. For
   * a humanoid it plays the role of VRM or HumanIK characterization (`"hips"`
   * to `"mixamorig:Hips"`); for a prop it maps a key such as `"hinge"` to a
   * door pivot node. Entries for keys the profile never cites are ignored by
   * `bindProfile`.
   */
  boneMap: Record<string, string>;
}
