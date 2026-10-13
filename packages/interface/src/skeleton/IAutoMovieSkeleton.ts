import { IAutoMovieBone } from "./IAutoMovieBone";

/**
 * A normalized humanoid skeleton: the rig a pose or motion targets.
 *
 * The skeleton is the contract between _what exists_ (which bones, their hierarchy, their ROM) and _what an animation does_ (which bones it rotates). Because bones are keyed by the closed {@link AutoMovieHumanoidBone} enum, a motion authored against one skeleton retargets onto any other that shares the humanoid convention, the basis of automovie's "author once, play on any VRM" portability.
 *
 * Whether the skeleton was generated (geometry phase) or imported (ingest of a user's glTF/VRM/FBX), it arrives here in the same normalized shape, so the pose/motion/expression layers never need to know its origin.
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
