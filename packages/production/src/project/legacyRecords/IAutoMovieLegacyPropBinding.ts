import type { IAutoMovieProfileBinding } from "@automovie/interface";

/**
 * A v1 prop binding with historical placement labels preserved for admission.
 *
 * Only profile and boneMap affect binding. Conversion omits root and instanceName because the runtime never used either to select scene nodes.
 *
 * @evidence contracts/common.md#principled-implementation Active profile and boneMap semantics reuse the current binding type; historical root and instanceName remain explicit v1 persisted fields.
 * @evidence contracts/common.md#clear-and-simple-design The legacy boundary holds unread historical labels while the engine receives only its active mapping contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subtree or instance semantics are invented for labels that never influenced binding.
 * @evidence contracts/common.md#meaningful-documentation Identifies which fields affect runtime and why historical labels are omitted on conversion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This stored-data type executes no mapping algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration shares active field types and coordinates no repeated computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its enclosing legacy prop owns these scalar labels and map; no resource is acquired here.
 * @author Samchon
 */
export interface IAutoMovieLegacyPropBinding extends IAutoMovieProfileBinding {
  /** Historical subtree label; binding never constrained mappings to it. */
  root: string;

  /** Historical instance label, or null; binding never read it. */
  instanceName: string | null;
}
