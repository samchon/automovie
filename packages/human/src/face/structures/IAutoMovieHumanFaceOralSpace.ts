/**
 * Coarse authored palate, floor and vestibular-wall space. Millimetre offsets
 * shape the actual lining independently of crowns and tongue. They are not
 * the clinical CBCT residual volume, which needs its own tissue boundaries.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralSpace {
  /** Superior roof clearance above the maxillary cervical frame, positive finite mm. */
  palateHeightMm?: number;

  /** Inferior floor clearance below the mandibular cervical frame, positive finite mm. */
  floorDepthMm?: number;

  /** Lateral vestibular clearance beyond the dental arch, positive finite mm. */
  wallClearanceMm?: number;

  /** Posterior lining reach beyond the terminal source crowns, positive finite mm. */
  posteriorReachMm?: number;
}
