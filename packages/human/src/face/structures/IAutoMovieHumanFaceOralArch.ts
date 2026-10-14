/**
 * Independent source-relative placement of one authored dental arch and its
 * gingival collar. Width and depth are whole-arch extents in millimetres,
 * separate from each crown's dimensions. They are not cusp-tip cast protocols.
 * The lower arch follows the same mandibular transform as its lining.
 * Omitted width/depth retain the source cervical-centre spans and omitted
 * offsets add zero. Generated lining instead uses the dimension owner's
 * authored defaults: collar reach 4.25 mm and thickness 1.5 mm. These are not
 * this person's observed gingival measurements or universal clinical norms.
 *
 * @evidence contracts/common.md#principled-implementation applyHumanFaceOralIdentity places source cervical centres using whole-arch transverse/anterior spans, with independent elevation/projection; lining dimensions separately own cervical collar reach.
 * @evidence contracts/common.md#clear-and-simple-design Whole-arch placement and gingival collar dimensions are separate from individual source crown scaling and upper/lower ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied spans/reaches require positive finite representable millimetres and offsets finite values; source axes/ports are not cusp-tip cast protocols, clinical gingiva or a second jaw law.
 * @evidence contracts/common.md#meaningful-documentation Centre spans versus crown extents, signed offsets and explicit source-retaining versus authored-default omissions preserve each geometric quantity's meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record computes no cervical centres or lining field.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared crown/lining placement is consumer-owned, not memoization in these scalars.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No transformed dental arrays or generated gingiva are retained here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralArch {
  /** Whole source cervical-centre transverse span, positive finite mm. */
  widthMm?: number;

  /** Whole source cervical-centre anterior-posterior span, positive finite mm. */
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
