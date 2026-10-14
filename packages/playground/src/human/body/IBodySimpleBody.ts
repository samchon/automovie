import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "@automovie/human";

/**
 * What the simple tier reads a body from: the document's authored channel weights, anatomical measurements and whole-person context identity.
 *
 * The builder solves the anatomy's bound targets into channel weights before shaping, so a projection read from the weights alone would describe a body the editor does not show; the pair is the projection's input and its invalidation key together with `contextKey`, which distinguishes head-dependent readings. Omit `anatomy` when no anatomical targets are authored and `contextKey` when the caller has no separate whole-person context.
 *
 * @evidence contracts/common.md#principled-implementation Projection identity includes authored weights, anatomical targets and caller-provided whole-person context because all three can affect the displayed readings; the simple controls compare these fields before reusing a result.
 * @evidence contracts/common.md#clear-and-simple-design The projection input keeps the document's shape and anatomy together with the external head-context key, without copying pose or camera state that does not change rest measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject identity or measured answer is embedded here; the optional context key records a caller dependency rather than choosing a special numerical path.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies anatomy's effect on shaping, the projection invalidation inputs and the meanings of omitted anatomy and whole-person context.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input record selects no projection algorithm; its shape map and anatomy are evaluated by the supplied numerical reader.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type declares the dependency key but retains no result; the simple-control refresh operation owns equality checks and projection reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record transfers references to authored inputs without acquiring a worker or handle; pending and accepted reading owners decide their lifetime.
 *
 * @author Samchon
 */
export interface IBodySimpleBody {
  /** Authored channel weights. */
  shape: Record<string, number>;

  /** Anatomical measurements the builder solves into channel weights, if any. */
  anatomy?: IAutoMovieHumanBodyAnatomicalMeasurements;

  /** Optional whole-person context identity; a changed head invalidates stature and volume readback. */
  contextKey?: string;
}
