import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourcePelvicRhythm } from "./IAutoMovieHumanBodySourcePelvicRhythm";
import type { IAutoMovieHumanBodySourceToeBase } from "./IAutoMovieHumanBodySourceToeBase";

/**
 * One shared source generation's complete parent-before-child anatomical graph.
 *
 * @evidence contracts/common.md#principled-implementation A generation identifies one parent-before-child anatomical graph whose optional pelvic and aggregate toe registrations share the same node frames.
 * @evidence contracts/common.md#clear-and-simple-design The graph owns nodes and registration metadata together so public projections and tissue consumers cannot select unrelated rest sources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named anatomical nodes and generation provenance avoid substituting a separately solved public skin skeleton.
 * @evidence contracts/common.md#meaningful-documentation Comments specify node uniqueness/order, derivative generation identity, optional pelvic registration and aggregate toe-frame meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The rig interface describes graph topology while admission and resolution own traversal algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A generation identifier records dependency provenance but does not itself establish cached evaluation equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Graph arrays are source-owned input references; this declaration allocates no resident mesh or running evaluator.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceRig {
  /** Optional source registration for the existing final hips-only rhythm transition. */
  pelvicRhythm?: IAutoMovieHumanBodySourcePelvicRhythm;

  /** One aggregate MTP goal frame per foot, shared by its proximal phalanges and public toes projection. */
  toeBases?: readonly IAutoMovieHumanBodySourceToeBase[];

  /** Independent source graph revision, carried with registered meshes and every derivative. */
  generation: string;

  /** Every bone is named once; parents and thorax references precede their consumers. */
  nodes: readonly IAutoMovieHumanBodySourceBoneNode[];
}
