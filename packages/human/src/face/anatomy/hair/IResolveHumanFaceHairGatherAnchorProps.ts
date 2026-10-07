import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Neutral angular ray and matched current scalp geometry used to resolve one gathering attachment.
 * The origin is neutral head-frame metres, angles are radians, and resident indices share the admitted source correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Neutral and current positions share indices, so the neutral ray hit transfers by its own barycentric weights.
 * @evidence contracts/common.md#clear-and-simple-design resolveHumanFaceHairGatherAnchor uses the neutral ray and matched current geometry to transfer one source hit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual source geometry and derived state without a subject-specific replacement.
 * @evidence contracts/common.md#meaningful-documentation States the neutral/current correspondence and both angular conventions before barycentric attachment transfer.
 * @evidence contracts/modeling.md#spatial-conventions Origin, neutral positions and matched current positions use head-frame metres; polar is from +Y and azimuth from +Z toward +X in radians.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry for an existing scalp and hair population without assigning a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Internal compiler state preserves the hairstyle document's controls and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The resolver, graph or closure producer owns derived geometry; this record carries its inputs or result.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source admission and hair-contact construction own topology; this record changes neither.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns the displayed assembly; this numerical carrier supplies no observed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns source qualification; this carrier introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Hairstyle admission retains numerical controls and bounds; this record adds no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source and derived geometry are not personal authoring fields.
 * @author Samchon
 */
export interface IResolveHumanFaceHairGatherAnchorProps {
  /** Neutral growth-chart origin in metres. */
  origin: IAutoMovieVector3;

  /** Neutral source positions in metres. */
  positions: readonly number[];

  /** Matched current source positions in metres. */
  current: readonly number[];

  /** Source triangle corner indices. */
  indices: readonly number[];

  /** Growth-domain triangle ordinals. */
  triangles: readonly number[];

  /** Polar angle from +Y in radians. */
  polar: number;

  /** Azimuth from +Z toward +X in radians. */
  azimuth: number;
}
