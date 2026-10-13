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
