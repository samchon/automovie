import type { RegionFile } from "../schema/RegionFile.ts";

/**
 * Carries hand observations and the identity of the limb owner's shared wrist.
 * A revision is private calibration evidence, not a generated product surface.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Declares the exact saved boundary and input byte identity rather than independently recreating a wrist.
 * @evidence contracts/common.md#clear-and-simple-design Adds boundary provenance to the common region record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not hide unsupported geometry behind successful extraction counts.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes observations, source boundaries and current qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data interface coordinates no requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data interface acquires no resources.
 */
export interface HandRegion extends RegionFile {
  /** Both regions consume the same saved physical contour and plane. */
  boundaries?: {
    sourceInput: string;
    sourceSection: string;
    sourceSha256: string;
    sectionId: string;
  }[];

  /** Input and producer identity for this observation revision. */
  observationRevision?: {
    baseSha256: string;
    inheritedSections: number;
    addedSections: number;
    stationSpacingMm: number;
    sourceBodySha256: string;
    producerSha256: string;
  };

  /** Unsupported inherited records remain explicitly listed after numeric admission. */
  rejectedInheritedObservations?: {
    kind: string;
    id: string;
    reason: string;
  }[];
}
