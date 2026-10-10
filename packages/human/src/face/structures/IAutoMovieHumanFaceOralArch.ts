/**
 * Independent source-relative placement of one authored dental arch and its
 * gingival collar. Width and depth are whole-arch extents in millimetres,
 * separate from each crown's dimensions. They are not cusp-tip cast protocols.
 * The lower arch follows the same mandibular transform as its lining.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralArch {
  /** Whole source crown-centre transverse span, positive finite mm. */
  widthMm?: number;

  /** Whole source crown-centre anterior-posterior span, positive finite mm. */
  depthMm?: number;

  /** Superior whole-arch offset from its source placement, finite mm. */
  elevationMm?: number;

  /** Anterior whole-arch offset from its source placement, finite mm. */
  projectionMm?: number;

  /** Cervical-to-gingival collar reach, positive finite authored mm. */
  gingivalHeightMm?: number;

  /** Gingival collar transverse reach, positive finite authored mm. */
  gingivalThicknessMm?: number;
}
