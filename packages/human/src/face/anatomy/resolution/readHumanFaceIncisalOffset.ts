import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanFaceBasisArticulation as ImportedIAutoMovieHumanFaceBasisArticulation,
  IAutoMovieHumanFaceBasisContact as ImportedIAutoMovieHumanFaceBasisContact,
} from "@automovie/human";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceApertureDirections as ImportedIHumanFaceApertureDirections } from "../../basis/IHumanFaceApertureDirections";
import { resolveHumanFaceApertureDirections } from "../../basis/resolveHumanFaceApertureDirections";
import type { IHumanFaceIncisalOffset } from "./IHumanFaceIncisalOffset";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Lower minus upper midline incisal point on the build's final surface, resolved into the contact frame, in millimetres.
 *
 * The points are the basis contact's registered incisor pair. `up` is the contact frame's opening direction, `forward` is its canonical unit mandibular direction cross `up` (anterior), and `left` is that unit direction (+X in the source's conventional frame). All three read the shared canonical owner, so the source admission's unit-norm tolerance does not scale a measurement. So `up` is the vertical incisal overlap (overbite) and `-up` the interincisal opening; `-forward` is the overjet and `forward` the protrusion past the upper incisor; `left` is the lower midline's absolute offset from the upper midline. Those two absolute positions are not excursions from a closed reference. With `reference`, the same pair is read on the current identity's separately evaluated neutral. An absent reference returns a named gap rather than substituting the unshaped basis. A basis without contact or articulation returns a gap.
 *
 * @evidence contracts/common.md#principled-implementation Registered lower-minus-upper incisal points project onto the shared jaw contact axes.
 * @evidence contracts/common.md#clear-and-simple-design Absolute overlap, forward relation and signed left offset stay separate from reference-relative motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing contact registration or articulation returns a gap; coarse source points are not clinically acquired dental trajectories.
 * @evidence contracts/common.md#meaningful-documentation Head metres convert to millimetres; positive up is overlap and negative forward is upper-ahead overjet.
 * @evidence contracts/performance.md#efficient-algorithms Fixed point/frame reads and three vector projections determine work.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical aperture-direction owner prevents source axis length from rescaling readings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only derived scalar fields escape and no source geometry or contact cache is retained.
 *
 * @author Samchon
 */
export function readHumanFaceIncisalOffset(
  context: IHumanFaceMeasurementContext,
  reference: boolean = false,
): IHumanFaceIncisalOffset | IHumanFaceMeasurementGap {
  const contact: ImportedIAutoMovieHumanFaceBasisContact | undefined =
    context.basis.contact;
  const articulation: ImportedIAutoMovieHumanFaceBasisArticulation | undefined =
    context.basis.articulation;
  if (
    contact === undefined ||
    articulation === undefined ||
    context.apertureUp === null
  )
    return {
      reason: "the basis declares no incisor contact pair and jaw articulation",
    };
  const point:
    | ((surface: string, vertex: number) => ImportedIAutoMovieVector3)
    | null
    | undefined = reference ? context.referencePoint : context.point;
  if (point === undefined || point === null)
    return {
      reason: "the current identity has no evaluated closed incisal reference",
    };
  const { axis, up, forward }: ImportedIHumanFaceApertureDirections =
    resolveHumanFaceApertureDirections(articulation.jaw.axis);
  const offset: ImportedIAutoMovieVector3 = Vector3.subtract(
    point(contact.incisors.surface, contact.incisors.lower),
    point(contact.incisors.surface, contact.incisors.upper),
  );
  return {
    up: Vector3.dot(offset, up) * 1000,
    forward: Vector3.dot(offset, forward) * 1000,
    left: Vector3.dot(offset, axis) * 1000,
  };
}
