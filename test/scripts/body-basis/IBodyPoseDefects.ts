import type { IBodyPoseZoneDefects } from "./IBodyPoseZoneDefects";
import type { BodyPoseDefectZone } from "./bodyPoseDefectZone";

/**
 * One skin's pose-defect measurements against its own shaped rest.
 * measureBodyPoseDefects produces this record for the census and formatter.
 * Ratios are dimensionless numerical proxies, not tissue-mechanics claims.
 * Enclosed volume is signed with each open rim capped by a centroid fan;
 * self-intersecting skins need separate contact/orientation inspection.
 *
 * @author Samchon
 */
export interface IBodyPoseDefects {
  /** Diagnostics grouped by the source-vertex zone classification. */
  zones: Record<BodyPoseDefectZone, IBodyPoseZoneDefects>;

  /** Posed-over-rest area of the whole skin; requires nonzero rest area. */
  areaRatio: number;

  /** Posed-over-rest capped signed volume; requires nonzero capped rest volume. */
  volumeRatio: number;
}
