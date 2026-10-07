import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceIncisalOffset } from "./readHumanFaceIncisalOffset";
import { readHumanFaceIncisalExcursion } from "./readHumanFaceIncisalExcursion";

/**
 * The performed jaw measurements of the face resolver: the midline incisal
 * opening, the lower incisor's protrusion past the upper and its lateral
 * excursion toward the face's left, read on the document's own pose in the
 * contact frame.
 *
 * Raw opening follows the uncorrected interincisal gap definition. The legacy
 * final protrusion and midline offset readings remain absolute positions;
 * reference-relative readings separately subtract the same shaped identity's
 * closed incisal offset for comparison with observed motion capacity. A
 * missing reference remains unavailable, never an assumed zero.
 *
 * @author Samchon
 */
export const HUMAN_FACE_JAW_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "jaw.interincisalOpening",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : -offset.up;
    },
  },
  {
    id: "jaw.protrusionBeyondOverjet",
    unit: "millimetres",
    channels: [],
    qualification: "absolute final incisal position past the upper edge, not protrusive excursion from the closed reference",
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : offset.forward;
    },
  },
  {
    id: "jaw.lateralExcursion",
    unit: "millimetres",
    channels: [],
    qualification: "legacy absolute lower-to-upper midline offset, not excursion corrected for initial midline deviation",
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : offset.left;
    },
  },
  {
    id: "jaw.protrusionFromReference",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const excursion = readHumanFaceIncisalExcursion(context);
      return "reason" in excursion ? excursion : excursion.forward;
    },
  },
  {
    id: "jaw.lateralExcursionFromReference",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const excursion = readHumanFaceIncisalExcursion(context);
      return "reason" in excursion ? excursion : excursion.left;
    },
  },
];
