import type { Vector } from "./Vector";

/**
 * Temple camera and observation fields consumed by the tour exporter; null poses and specialized views remain in the native inspector.
 *
 * @evidence contracts/common.md#principled-implementation This structural projection matches createViewerPayload's lens and observation fields; exportTourData admits only observations with both world endpoints and no specialized view.
 * @evidence contracts/common.md#clear-and-simple-design Only fields read by the camera exporter are described; the native object may retain additional geometry fields untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source camera values remain authored rather than being inferred from geometry or fixture identities.
 * @evidence contracts/common.md#meaningful-documentation Members state world units, lens units, optional space grouping and why null or specialized observations are omitted.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased projection selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record coordinates no completed work or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record acquires no source payload or GPU resources.
 *
 * @author Samchon
 */
export interface AncientSource {
  /** Authored vertical lens degrees and clip distances in meters. */
  lens: {
    /** Vertical perspective field of view in degrees. */
    verticalDegrees: number;

    /** Near clipping distance in meters. */
    near: number;

    /** Far clipping distance in meters. */
    far: number;
  };

  /** Source observation identities and world poses; null poses or specialized view records are excluded from the public perspective navigator. */
  observations: {
    /** Stable authored observation identity. */
    id: string;

    /** Source observation category used when space is absent. */
    group: string;

    /** Optional room identity used for navigation grouping. */
    space?: string;

    /** World eye, or null when this observation has no perspective pose. */
    position: Vector | null;

    /** World aim point, or null when this observation has no perspective pose. */
    target: Vector | null;

    /** Specialized diagnostic camera descriptor; a truthy value excludes the public pose. */
    view?: unknown;
  }[];
}
