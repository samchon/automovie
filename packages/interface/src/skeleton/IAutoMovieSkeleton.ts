import { IAutoMovieBone } from "./IAutoMovieBone";

/**
 * A normalized humanoid skeleton: the rig a pose or motion targets.
 *
 * Bone identities, parent hierarchy, rest transforms and declared ROM define the target of pose and motion channels. The closed humanoid names support shared addressing, but retargeting additionally needs an admitted mapping, compatible rest basis and target constraints; this record does not guarantee arbitrary-avatar portability.
 *
 * Generated rigs and admitted glTF, GLB or VRM imports use the same normalized shape. The current ingest suffix gate admits those containers; it implements no FBX path. Shared addressing still requires the rig membership, mapping and rest-basis admission described above.
 *
 * @evidence contracts/common.md#principled-implementation A stable rig id and unique normalized bone records define one connected single-root parent graph for FK and ROM admission, shared by generated and explicitly mapped imported rigs.
 * @evidence contracts/common.md#clear-and-simple-design Rig existence and rest/constraint data are independent from pose and motion channels, allowing one normalized representation across acquisition paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generic model validation requires one connected root but does not require every VRM mandatory bone or guarantee arbitrary-avatar retargeting; mapping, rest basis and target ROM remain separately admitted.
 * @evidence contracts/common.md#meaningful-documentation Defines stable rig identity, unique bone population, connected single-root graph and the separation from stricter VRM import requirements.
 * @author Samchon
 */
export interface IAutoMovieSkeleton {
  /** Stable id so poses, motions, and scene nodes can cite this rig. */
  id: string;

  /**
   * Nonempty unique bone records with hierarchy, rest pose and ROM. Model admission requires exactly one parent-null root and every bone reachable from it; this generic graph gate does not require hips specifically.
   */
  bones: IAutoMovieBone[];
}
