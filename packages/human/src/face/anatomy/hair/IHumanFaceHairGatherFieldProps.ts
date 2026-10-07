import type { IHumanFaceHairGatherAttachment } from "./IHumanFaceHairGatherAttachment";

/**
 * Current scalp geometry and one already resolved attachment compiled into the gathering direction field.
 * Arrays remain caller-owned and must retain their admitted resident correspondence for the compilation.
 *
 * @evidence contracts/common.md#principled-implementation Matched current incidence and a resolved attachment give the graph compiler one connected growth domain.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFaceHairGatherField receives the current source buffers, connected domain and attachment needed by its distance graph.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual source geometry and derived state without a subject-specific replacement.
 * @evidence contracts/common.md#meaningful-documentation States caller-owned source buffers, source triangle addressing and the current attachment consumed by the graph.
 * @evidence contracts/modeling.md#spatial-conventions Flat current positions use head-frame metres; source incidence and growth-domain triangle ordinals retain their admitted resident layout.
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
export interface IHumanFaceHairGatherFieldProps {
  /** Current head-frame positions in metres. */
  positions: readonly number[];

  /** Source triangle corner indices. */
  indices: readonly number[];

  /** Connected growth-domain triangle ordinals. */
  triangles: readonly number[];

  /** Attachment resolved from the same source and current geometry. */
  anchor: IHumanFaceHairGatherAttachment;
}
