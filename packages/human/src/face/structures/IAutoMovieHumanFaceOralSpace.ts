/**
 * Coarse authored palate, floor and vestibular-wall space. Millimetre offsets
 * shape the actual lining independently of crowns and tongue. They are not
 * the clinical CBCT residual volume, which needs its own tissue boundaries.
 *
 * @evidence contracts/common.md#principled-implementation Separate named enclosure extents express space without pretending one volume scalar determines hidden tissue.
 * @evidence contracts/common.md#clear-and-simple-design Roof, floor, lateral and posterior clearance each have one owner member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored enclosure geometry is not relabelled clinical palate or floor acquisition.
 * @evidence contracts/common.md#meaningful-documentation States units, independence and clinical volume limits.
 * @evidence contracts/modeling.md#parameter-channels Roof and floor vary opposite vertical clearances; wall and posterior reach vary different extents.
 * @evidence contracts/modeling.md#spatial-conventions Positive clearances are millimetres in the neutral oral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The lining producer owns its component grouping.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The lining producer owns its mesh population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The lining consumes the assembler's common vestibular and dental boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes the enclosure and tongue space.
 * @evidence contracts/anatomy.md#anatomical-source These are coarse authored clearances; palate/floor tissue and CBCT clinical boundaries remain uncalibrated.
 * @evidenceExclude contracts/anatomy.md#permitted-range The assembly admits clearances and contacts together.
 * @evidence contracts/anatomy.md#parametric-authority Only named clearances enter, never personal wall vertices or sections.
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
