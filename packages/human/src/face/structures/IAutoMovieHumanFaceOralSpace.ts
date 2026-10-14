/**
 * Coarse authored palate, floor and vestibular-wall space. Millimetre offsets
 * shape the actual lining independently of crowns and tongue. They are not
 * the clinical CBCT residual volume, which needs its own tissue boundaries.
 * In a generated oral assembly, omission takes the dimension owner's authored
 * defaults: roof 15 mm, floor 8 mm, wall clearance equal to collar thickness,
 * and posterior reach equal to wall clearance. These defaults are geometric
 * conventions with the resolver's stated source/protocol limitations, not
 * observed personal anatomy. Omitting the entire oral record retains source replay.
 *
 * @evidence contracts/common.md#principled-implementation The lining-dimension owner converts explicit roof/floor/wall/posterior mm reaches into the common cervical-port height field and vestibular outline, with upper/head and lower/jaw owners separate.
 * @evidence contracts/common.md#clear-and-simple-design Four named enclosure reaches remain independent from crown dimensions, tongue identity and the resident lip contact boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive finite supported dimensions do not reconstruct pharynx, clinical mucogingival boundaries or CBCT residual volume; exact cervical holes and ordinary emitted/contact admission still judge the actual lining.
 * @evidence contracts/common.md#meaningful-documentation Each metric direction is tied to its cervical/arch frame, and generated default dimensions are distinguished from whole-oral source-replay omission and observed anatomy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no height field or constrained triangulation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Common lining ownership does not implement cached enclosure geometry here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar reaches create no roof/floor/wall meshes or query state.
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
