import { IAutoMovieAssemblyBreak } from "./IAutoMovieAssemblyBreak";
import { IAutoMovieAssemblyContinuity } from "./IAutoMovieAssemblyContinuity";

/**
 * What survives a junction between two build-ups and what stops there.
 *
 * Produced by `matchAutoMovieAssemblyJunction`. Every role either build-up
 * declares appears exactly once: in `continuous` when both declare it, in
 * `broken` when only one does. Order follows each role's first layer in its
 * build-up; nothing is sorted by name.
 *
 * @evidence contracts/common.md#principled-implementation Partitions the union of both build-ups' role names into those present on both sides and those present on one, using insertion-ordered maps keyed by exact name, so every role lands in exactly one list in first-appearance order with no sort.
 * @evidence contracts/common.md#clear-and-simple-design Two lists, one per outcome, so a caller checking thermal or moisture continuity reads `continuous` and a caller reporting stopped barriers reads `broken`, with no status field to filter a single list on.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No role is privileged or skipped; a role both sides declare stays in `continuous` even when its spans do not touch, leaving `aligned` to say so rather than moving the role to `broken`.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that every role appears exactly once and in which list, and the order of each list, including that right-only breaks follow the left-only ones.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result shape only; building it is linear in both build-ups' layer counts with map lookups by role, answered on `matchAutoMovieAssemblyJunction`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call returns new lists, and the engine memoizes no junction for a pair of assemblies because the caller's tolerance is an input to every `aligned` flag.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns its two arrays and their element records; the caller keeps them as long as it needs the answer and nothing else in the engine refers to them.
 */
export interface IAutoMovieAssemblyJunction {
  /** Roles both sides carry, in the left build-up's declaration order. */
  continuous: IAutoMovieAssemblyContinuity[];

  /** Roles only one side carries, left-hand ones first. */
  broken: IAutoMovieAssemblyBreak[];
}
