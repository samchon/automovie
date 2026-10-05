import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceIncisalOffset } from "./readHumanFaceIncisalOffset";

/**
 * The performed jaw measurements of the face resolver: the midline incisal
 * opening, the lower incisor's protrusion past the upper and its lateral
 * excursion toward the face's left, read on the document's own pose in the
 * contact frame.
 *
 * They follow the clinical incisal definitions the motion capacity and
 * performance vocabularies use, and the jaw capacity check compares them
 * with the document's observed maxima.
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
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : offset.forward;
    },
  },
  {
    id: "jaw.lateralExcursion",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : offset.left;
    },
  },
];
