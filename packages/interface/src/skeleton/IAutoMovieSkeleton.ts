import type { IAutoMovieBone } from "./IAutoMovieBone";

/**
 * A normalized humanoid skeleton: the rig a pose or motion targets.
 *
 * Bone identities, parent hierarchy, rest transforms and declared ROM define
 * the target of pose and motion channels. The closed humanoid names support
 * shared addressing, but retargeting additionally needs an admitted mapping,
 * compatible rest basis and target constraints; this record does not guarantee
 * arbitrary-avatar portability.
 *
 * Generated rigs and admitted glTF, GLB or VRM imports use the same normalized
 * shape. The current ingest suffix gate admits those containers; it implements
 * no FBX path. Shared addressing still requires the rig membership, mapping and
 * rest-basis admission described above.
 */
export interface IAutoMovieSkeleton {
  /** Stable id so poses, motions, and scene nodes can cite this rig. */
  id: string;

  /**
   * Nonempty unique bone records with hierarchy, rest pose and ROM. Model
   * admission requires exactly one parent-null root and every bone reachable
   * from it; this generic graph gate does not require hips specifically.
   */
  bones: IAutoMovieBone[];
}
