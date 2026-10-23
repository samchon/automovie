import type { ProductionStage } from "./ProductionStage";

/**
 * Pairs screenplay construction with its scripts approval selection.
 *
 * The first element is the stage. The boolean is useFinalScripts:
 * true requires scripts naturalness approval, false scripts construction.
 * A bare stage means true. Both read the current scripts body.
 *
 * @evidence contracts/common.md#principled-implementation The tuple keeps construction activation and the scripts approval source together; the boolean does not switch the current manuscript body being read.
 * @evidence contracts/common.md#clear-and-simple-design The tuple pairs activation with the single scripts-source choice instead of parallel config fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both choices read current scripts body; the flag only selects required upstream approval.
 * @evidence contracts/common.md#meaningful-documentation The prose defines tuple order, boolean semantics, bare-stage default and current-body behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Screenplay construction tuple is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Screenplay construction tuple declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Screenplay construction tuple acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export type ProductionConstructionStageMixin = [ProductionStage, boolean];
