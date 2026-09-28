/**
 * Common visible exterior finish boundary for the four elevation owners.
 * World Y-up metres: Y = 0.60 places the brick top 0.10 m below the lowest
 * front window sill. Each elevation cuts its existing wall body at this datum
 * and preserves its own corners, holes and roof contacts. This is no footing
 * or ground datum; structural support still awaits the map-ground handoff.
 */

/** Shared top of exposed brick plinth faces, in world metres. */
/**
 * @evidence spaces/envelope/front.md The front elevation fixes the common visible Y = 0.60 m finish boundary, adopted by the other elevation owners.
 * @evidence principles/core/source-units.md#source-scope-preservation This value bounds exposed finish only; wall bottoms and structural foundations retain their separate owners.
 * @evidence principles/core/source-units.md#source-substantive-completion Every elevation consumes one datum so the brick and siding seam meets at corners.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The Y = 0.60 m finish boundary is declared by the front elevation and mirrored by the other three elevation design owners; the source adds no new parent decision.
 */
export const EXTERIOR_PLINTH_TOP = 0.6;
