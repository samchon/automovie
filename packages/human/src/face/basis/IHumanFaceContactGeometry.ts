import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IHumanFaceContactBounds } from "./IHumanFaceContactBounds";

/**
 * One compiled rest or performed contact sheet and its pruning bounds.
 * The engine query owns nearest features, signed distance and open-sheet rims.
 *
 * @evidence contracts/common.md#principled-implementation A native open-sheet signed query snapshots the actual rest or performed collider coordinates, while low/high extrema provide separate reach pruning.
 * @evidence contracts/common.md#clear-and-simple-design Query and inherited bounds share one state owner so pruning and native nearest-feature readings cannot accidentally refer to different poses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open-sheet rims/readable reach retain the engine's side limitations; box inclusion never substitutes for signed geometry or anatomical acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies state-specific sheet ownership and the engine's nearest-feature/rim responsibilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record compiles no hierarchy; engine query construction and contact scans own their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no work; the contact invocation reuses each immutable compiled state across vertices.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; query-captured mesh/hierarchy remains with its invocation-owned collider.
 *
 * @author Samchon
 */
export interface IHumanFaceContactGeometry extends IHumanFaceContactBounds {
  /** Signed query compiled from this state's actual collider coordinates. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}
