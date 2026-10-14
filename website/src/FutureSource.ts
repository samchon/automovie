import type { Vector } from "./Vector";

/**
 * Citizen-house observation stations consumed by the exporter; a missing pose or section view is left to the native inspector.
 *
 * @evidence contracts/common.md#principled-implementation This projection describes the stations emitted by createViewerPayload; the exporter namespaces ids by space and admits only non-null poses without a truthy section descriptor.
 * @evidence contracts/common.md#clear-and-simple-design The website reads camera station facts while keeping the remaining native scene payload opaque.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing poses stay missing rather than being replaced with a website-generated camera.
 * @evidence contracts/common.md#meaningful-documentation Members describe namespace identity, world pose, lens degrees and section exclusion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased source projection executes no station traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no station or scene resources.
 *
 * @author Samchon
 */
export interface FutureSource {
  /** Source station ids and spaces with optional world poses; section observations remain in the native inspector. */
  stations: {
    /** Authored station identity, unique within its source space. */
    id: string;

    /** Source space identity used as the public id namespace and group. */
    space: string;

    /** World perspective pose, or null when no such pose is authored. */
    pose: {
      /** Eye position in world meters. */
      position: Vector;

      /** Aim point in world meters. */
      target: Vector;
    } | null;

    /** Vertical perspective field of view in degrees. */
    fov: number;

    /** Specialized section descriptor; a truthy value keeps the view in its native inspector. */
    section?: unknown;
  }[];
}
