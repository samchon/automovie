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
 * and that every key the profile references is mapped. No code reads `root` or
 * `instanceName`, and nothing checks that mapped nodes lie under `root`.
 *
 * @evidence contracts/common.md#principled-implementation Binding is a total lookup: each semantic key the profile's limits and drivers cite is replaced by `prefix + boneMap[key]`, and a key with no entry or a blank entry throws, so a bound profile never silently loses a constraint.
 * @evidence contracts/common.md#clear-and-simple-design The binding is separate from the profile so one profile serves many bodies, and the mapping is a plain record because lookup by key is its only operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No key is guessed from a node name or a naming convention; `root` and `instanceName` are unread fields of this core type, a gap stated here and on each field rather than filled with an unchecked meaning.
 * @evidence contracts/common.md#meaningful-documentation States which fields each consumer reads, the prefix rule, every refusal of `bindProfile` and `forgeProp`, and which fields nothing reads or checks.
 * @author Samchon
 */
export interface IAutoMovieProfileBinding {
  /** Id of the {@link IAutoMovieProfile} being applied. */
  profile: string;

  /** Root node id of the subtree this profile controls; currently unread. */
  root: string;

  /**
   * Optional instance name for several applications of the same profile on one
   * model, such as `"leftDoor"` and `"rightDoor"`; currently unread.
   */
  instanceName: string | null;

  /**
   * Profile semantic key to concrete node id, before the placement prefix. For
   * a humanoid it plays the role of VRM or HumanIK characterization (`"hips"`
   * to `"mixamorig:Hips"`); for a prop it maps a key such as `"hinge"` to a
   * door pivot node. Entries for keys the profile never cites are ignored by
   * `bindProfile`.
   */
  boneMap: Record<string, string>;
}
