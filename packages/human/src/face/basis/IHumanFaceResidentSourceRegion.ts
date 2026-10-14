/**
 * Exact source correspondence of one retained native face region.
 * The region gatherer owns render numbering, including UV splits and removed
 * source components. Coordinates never establish this correspondence.
 *
 * @evidence contracts/common.md#principled-implementation The canonical gather's actual corner/source table identifies each emitted render vertex after retained incidence and UV splitting.
 * @evidence contracts/common.md#clear-and-simple-design Source surface id, pre-Person part id and ordered sources provide one explicit downstream attachment correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Render/source identity is producer-owned; equal coordinates or the original region's outdated numbering never reconstruct a compact gather's correspondence.
 * @evidence contracts/common.md#meaningful-documentation Members state source domain, face-prefix boundary and emitted render order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This table performs no gather; region/corner producers own its construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; physical attachment consumers reuse the exact emitted table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; source-id arrays live with the retained native construction.
 *
 * @author Samchon
 */
export interface IHumanFaceResidentSourceRegion {
  /** Native basis surface whose vertex population the source table addresses. */
  surface: string;

  /** Actual retained face part identity, before the person's face prefix. */
  part: string;

  /** Source vertex for each emitted render vertex, in its actual gather order. */
  sources: readonly number[];
}
