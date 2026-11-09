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
 * @evidence contracts/development/design.md#principled-representation Partitions the union of both build-ups' role names into those present on both sides and those present on one, using insertion-ordered maps keyed by exact name, so every role lands in exactly one list in first-appearance order with no sort.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two lists, one per outcome, so a caller checking thermal or moisture continuity reads `continuous` and a caller reporting stopped barriers reads `broken`, with no status field to filter a single list on.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No role is privileged or skipped; a role both sides declare stays in `continuous` even when its spans do not touch, leaving `aligned` to say so rather than moving the role to `broken`.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, that every role appears exactly once and in which list, and the order of each list, including that right-only breaks follow the left-only ones.
 */
export interface IAutoMovieAssemblyJunction {
  /** Roles both sides carry, in the left build-up's declaration order. */
  continuous: IAutoMovieAssemblyContinuity[];

  /** Roles only one side carries, left-hand ones first. */
  broken: IAutoMovieAssemblyBreak[];
}
