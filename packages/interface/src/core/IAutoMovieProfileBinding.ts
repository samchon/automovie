/**
 * One application of a profile to a concrete scene/model subtree.
 *
 * The profile is reusable data; a binding says where that profile lives this
 * time. Multiple characters can share one humanoid profile while each binding
 * maps the profile controls/bones onto that character's own node ids.
 *
 * `bindProfile` reads only `profile` and `boneMap`: `profile` must equal the
 * applied profile's id, every mapped id gets the application's placement
 * prefix, and a missing or blank mapping throws. `forgeProp` also checks that
 * each mapped id is a declared articulation node. No code reads `root` or
 * `instanceName`, and nothing checks that mapped nodes lie under `root`.
 *
 * @evidence contracts/common.md#principled-implementation A characterization map in the VRM and HumanIK sense: each semantic key resolves to one concrete node id, looked up per reference by `bindProfile` and `retargetHumanoidMotion`, so the profile itself never names scene nodes.
 * @evidence contracts/common.md#clear-and-simple-design Keeping the binding apart from the profile lets several subtrees share one profile; `root` and `instanceName` are declared but read by no engine or production code, unused fields this chapter flags.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `bindProfile` throws on a missing or blank key instead of falling back to the key itself; only `retargetHumanoidMotion` falls back to the slot name, for an absent binding or an unmapped slot outside its required bones.
 * @evidence contracts/common.md#meaningful-documentation States which fields each consumer reads, the profile-id match, the placement prefix, the failure on a missing or blank mapping, and that `root` and `instanceName` are unread.
 * @author Samchon
 */
export interface IAutoMovieProfileBinding {
  /** Id of the {@link IAutoMovieProfile} being applied. */
  profile: string;

  /** Root node id of the subtree this profile controls; currently unread. */
  root: string;

  /**
   * Optional instance name for multiple applications of the same profile on one
   * model, e.g. `"hero"` / `"villain"` or `"leftDoor"` / `"rightDoor"`;
   * currently unread.
   */
  instanceName: string | null;

  /**
   * Profile semantic key -> concrete node id. For a humanoid this is equivalent
   * to VRM/HumanIK characterization (`"hips" -> "mixamorig:Hips"`); for a prop
   * it can map controls such as `"hinge"` to a door pivot node.
   */
  boneMap: Record<string, string>;
}
