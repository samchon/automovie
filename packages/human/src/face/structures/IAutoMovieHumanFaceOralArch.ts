/**
 * Independent source-relative placement of one authored dental arch and its
 * gingival collar. Width and depth are whole-arch extents in millimetres,
 * separate from each crown's dimensions. They are not cusp-tip cast protocols.
 * The lower arch follows the same mandibular transform as its lining.
 *
 * @evidence contracts/common.md#principled-implementation Separates arch placement from crown sizing and carries gingival collar dimensions with the group that joins their cervical cycles.
 * @evidence contracts/common.md#clear-and-simple-design Transverse/posterior extent, anterior/superior placement and collar dimensions have separate members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source extents are not relabelled clinical cusp distances or population bounds.
 * @evidence contracts/common.md#meaningful-documentation States frame, omission and distinction from clinical cast protocols.
 * @evidence contracts/modeling.md#parameter-channels Extent changes crown-centre placement; individual crown dimensions remain independently authored.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the source-neutral head frame, +Y superior and +Z anterior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The arch producer owns the group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The arch producer owns its source-dependent mesh population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Gingiva and crowns consume the assembler's common cervical cycles.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembler observes the joined group.
 * @evidence contracts/anatomy.md#anatomical-source Source arch extents and authored collars are coarse geometry conventions without clinical tissue-thickness or vault calibration.
 * @evidenceExclude contracts/anatomy.md#permitted-range The assembler admits extents and geometric combinations.
 * @evidence contracts/anatomy.md#parametric-authority Only named arch and gingival dimensions enter.
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
