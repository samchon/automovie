import type { Plane } from "../geometry/Plane.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * Stores physical section observations without source topology addresses.
 * Open pieces remain open; their endpoints may lie inside source triangles.
 *
 * @evidence contracts/common.md#principled-implementation Separates an exact cutting frame and station from ordered source-surface pieces; closure is an observed property rather than a reconstruction command.
 * @evidence contracts/common.md#clear-and-simple-design The same record represents ordinary stations and critical-event brackets without fabricating source-edge identifiers for cropped points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains neither reference triangle indices nor inferred caps or anatomical assignments.
 * @evidence contracts/common.md#meaningful-documentation States frame units, source-face segment containment and the distinction between full incident contours and spatially cropped observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data declaration selects no processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data declaration owns no computation or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data declaration owns no acquired resource.
 * @author Samchon
 */
export interface BranchSection {
  /** Producer-local stable name referenced by critical-event metadata. */
  id: string;

  /** Signed distance along the branch normal from its origin, in millimetres. */
  stationMm: number;

  /** Actual physical source cutting plane. */
  frame: Plane;

  /** Whether the region window removed parts of source contours. */
  scope: "cropped-region" | "full-incident-contour";

  /**
   * Consecutive points lie on one original source-plane segment.
   * sourceClosed describes the complete contour before cropping; winding is its
   * supporting-face outer/cavity sign, or null when that source contour is open.
   */
  pieces: {
    closed: boolean;
    points: V3[];
    sourceClosed: boolean;
    winding: number | null;
  }[];
}
