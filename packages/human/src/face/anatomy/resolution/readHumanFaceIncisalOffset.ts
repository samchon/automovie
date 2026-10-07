import { Vector3 } from "@automovie/engine";

import { resolveHumanFaceApertureDirections } from "../../basis/resolveHumanFaceApertureDirections";
import type { IHumanFaceIncisalOffset } from "./IHumanFaceIncisalOffset";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Lower minus upper midline incisal point on the build's final surface,
 * resolved into the contact frame, in millimetres.
 *
 * The points are the basis contact's registered incisor pair. `up` is the
 * contact frame's opening direction, `forward` is its canonical unit mandibular
 * direction cross `up` (anterior), and `left` is that unit direction (+X in
 * the source's conventional frame). All three read the shared canonical owner,
 * so the source admission's unit-norm tolerance does not scale a measurement.
 * So `up` is the vertical incisal overlap (overbite) and `-up` the
 * interincisal opening; `-forward` is the overjet and `forward` the protrusion
 * past the upper incisor; `left` is the lower midline's absolute offset from
 * the upper midline. Those two absolute positions are not excursions from a
 * closed reference. With `reference`, the same pair is read on the current
 * identity's separately evaluated neutral. An absent reference returns a
 * named gap rather than substituting the unshaped basis. A basis without
 * contact or articulation returns a gap.
 *
 * @evidence contracts/common.md#principled-implementation Overjet, overbite, opening and absolute midline offset are components of one incisal offset in the contact frame; reference reads use the same pair, precision and axes on the same identity's separately evaluated neutral.
 * @evidence contracts/common.md#clear-and-simple-design One reader supplies every incisal measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the registered pair is read; no tooth is located by coordinates.
 * @evidence contracts/common.md#meaningful-documentation States the pair, the frame axes, each component's clinical meaning and the gap.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres along the contact frame derived from the mandibular axis in the basis head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The registered pair's producer owns its anatomy; measurements state their protocols.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 * @author Samchon
 */
export function readHumanFaceIncisalOffset(
  context: IHumanFaceMeasurementContext,
  reference: boolean = false,
): IHumanFaceIncisalOffset | IHumanFaceMeasurementGap {
  const contact = context.basis.contact;
  const articulation = context.basis.articulation;
  if (
    contact === undefined ||
    articulation === undefined ||
    context.apertureUp === null
  )
    return {
      reason: "the basis declares no incisor contact pair and jaw articulation",
    };
  const point = reference ? context.referencePoint : context.point;
  if (point === undefined || point === null)
    return {
      reason: "the current identity has no evaluated closed incisal reference",
    };
  const { axis, up, forward } = resolveHumanFaceApertureDirections(
    articulation.jaw.axis,
  );
  const offset = Vector3.subtract(
    point(contact.incisors.surface, contact.incisors.lower),
    point(contact.incisors.surface, contact.incisors.upper),
  );
  return {
    up: Vector3.dot(offset, up) * 1000,
    forward: Vector3.dot(offset, forward) * 1000,
    left: Vector3.dot(offset, axis) * 1000,
  };
}
