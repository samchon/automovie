import type { IHumanFaceIncisalExcursion } from "./IHumanFaceIncisalExcursion";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceIncisalOffset } from "./readHumanFaceIncisalOffset";

/**
 * Incisal motion from the same identity's closed reference, in millimetres.
 * Subtract reference from performed lower-minus-upper offsets in their common
 * contact frame. This accounts for initial overjet in protrusion and initial
 * dental-midline deviation in lateral motion, which an absolute final offset
 * cannot do. It also isolates motion from a change of shaped dental identity.
 *
 * Park et al. (2021, Children, https://pmc.ncbi.nlm.nih.gov/articles/PMC8235157/)
 * include horizontal overlap in protrusion and correct initial midline
 * deviation for laterotrusion in 438 Korean children aged 3–15 with erupted
 * incisors. Beltran-Alacreu et al. (2014, Journal of Physical Therapy Science,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4085221/) measure protrusion by
 * combining initial and final incisal positions in 50 asymptomatic adults
 * aged 18–65 in a controlled neutral craniocervical posture. These sources
 * define quantities, not universal motion bounds or a clinical trajectory for
 * the source rig. Missing reference or incisor registration remains a gap.
 * Raw interincisal opening is a separate distance, not this vertical excursion.
 *
 * @evidence contracts/common.md#principled-implementation Subtracts offsets of one homologous pair at two states in the same frame, yielding reference-relative movement rather than final dental position.
 * @evidence contracts/common.md#clear-and-simple-design One adapter over the shared incisal offset reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No zero reference or unshaped basis substitutes for a missing evaluated reference.
 * @evidence contracts/common.md#meaningful-documentation States reference ownership, signs, units, source protocols and distinction from raw opening.
 * @evidence contracts/modeling.md#spatial-conventions Signed millimetres in one contact frame; positive forward is anterior and positive left is anatomical left.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader creates no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The context owns the emitted positions and the editor shows the reading.
 * @evidence contracts/anatomy.md#anatomical-source The cited 2021 and 2014 primary protocols account for initial incisal relationship when measuring excursion; their cohorts supply no universal range here.
 * @evidenceExclude contracts/anatomy.md#permitted-range The capacity owner compares this quantity with the document's own observed maximum.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is a readout, not a shaping input.
 * @author Samchon
 */
export function readHumanFaceIncisalExcursion(
  context: IHumanFaceMeasurementContext,
): IHumanFaceIncisalExcursion | IHumanFaceMeasurementGap {
  const performed = readHumanFaceIncisalOffset(context);
  if ("reason" in performed) return performed;
  const reference = readHumanFaceIncisalOffset(context, true);
  if ("reason" in reference) return reference;
  return {
    forward: performed.forward - reference.forward,
    left: performed.left - reference.left,
  };
}
