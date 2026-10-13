import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One numbered bony rib distinct from its costal cartilage and neighbour.
 *
 * Its required volume is an imaging/target constraint, not a curved rib path, anterior junction, respiratory motion or user-authored 3D control spline.
 *
 * @evidence contracts/common.md#principled-implementation One required bone-volume carrier preserves a numbered rib's target or segmentation provenance separately from cartilage and neighboring ribs.
 * @evidence contracts/common.md#clear-and-simple-design Numbering remains with the rib collection and shared anatomical volume owns units/acquisition details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A volume cannot supply curved rib paths, cartilage junctions, respiratory motion or user-authored splines.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies required osseous volume and excludes cartilage/intercostal tissue and unresolved path/motion information.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rib volume typing performs no curved-path reconstruction or respiratory deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One rib input holds no completed path fit or costal articulation result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Rib metadata retains no osseous surface, spline buffer or breathing simulation.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyRibMeasurements {
  /** Osseous rib volume alone, excluding cartilage and intercostal muscle. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
