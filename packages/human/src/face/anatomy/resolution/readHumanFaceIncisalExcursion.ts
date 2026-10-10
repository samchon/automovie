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
