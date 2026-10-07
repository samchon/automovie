/**
 * Lower minus upper midline incisal point in the contact frame, millimetres.
 *
 * @evidence contracts/common.md#principled-implementation The three components of one absolute offset carry overbite or opening, overjet or position past the upper incisor, and dental-midline offset; excursion subtracts the corresponding closed-reference offset separately.
 * @evidence contracts/common.md#clear-and-simple-design One record per incisal offset reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Components are projections of the measured offset, never stored constants.
 * @evidence contracts/common.md#meaningful-documentation States each axis and its sign.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres along the contact frame's up, forward and mandibular-axis directions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Measurements state their protocols.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is not an input.
 * @author Samchon
 */
export interface IHumanFaceIncisalOffset {
  /** Along the opening direction; positive is vertical overlap (overbite), negative is opening. */
  up: number;

  /** Anterior; negative is the upper incisor ahead (overjet), positive is protrusion past it. */
  forward: number;

  /** Toward the face's left along the mandibular axis. */
  left: number;
}
