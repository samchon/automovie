import { HUMAN_HEAD_MEASUREMENTS } from "../../../common/measure/HUMAN_HEAD_MEASUREMENTS";
import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { findHumanFrontotemporalia } from "../../../common/measure/findHumanFrontotemporalia";
import { findHumanZygia } from "../../../common/measure/findHumanZygia";
import { humanHeadEars } from "../../../common/measure/humanHeadEars";
import { humanHeadPoint } from "../../../common/measure/humanHeadPoint";
import { humanHeadTragia } from "../../../common/measure/humanHeadTragia";
import { readHumanFaceHeadMeasurement } from "./readHumanFaceHeadMeasurement";
import { readHumanFaceHeadRule } from "./readHumanFaceHeadRule";
import { readHumanFaceLandmarkDistance } from "./readHumanFaceLandmarkDistance";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";
import { readHumanFaceVertexToLandmark } from "./readHumanFaceVertexToLandmark";

/**
 * The craniofacial measurements of the face resolver, one per field of
 * `IAutoMovieHumanFaceCraniofacialParameters`, keyed `craniofacial.<field>`
 * without its unit suffix (depths add `.left` / `.right`).
 *
 * Fixed-point distances are the direct landmark distances of the 3D Facial
 * Norms protocol (Weinberg et al., 2016,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/), read between named skin
 * landmarks the basis registers. A fixed landmark the basis does not declare
 * reads as the gap "missing landmark: <name>" until source registers it
 * (`subnasale`, `stomion` and `gnathion` are requested; `gnathion` follows
 * Farkas, the lowest midline point of the lower border of the mandible, the
 * same skin point as ANSUR II's `menton`). A point whose definition is an
 * extreme or a construction that moves with the shape is found per shape by a
 * shared head instrument: `zygion` (`findHumanZygia`), `frontotemporale`
 * (`findHumanFrontotemporalia`, a skin approximation of the palpated crest);
 * each states its search conventions. `gonion` has no instrument: the jaw
 * attachment does not delimit the skin over the mandibular angle. `nasion` by Katina 2016's curve definition has no
 * instrument yet and reads as "missing rule: nasion"; the pogonion to
 * corneal-plane projection reads as an unread source.
 *
 * Maximum cranial width and length are the ANSUR II head breadth and head
 * length, read by the shared head instrument (`HUMAN_HEAD_MEASUREMENTS`,
 * `readHumanFaceHeadMeasurement`) on the build's final skin with the basis's
 * ear areas; a basis without them reads the named gap.
 *
 * Every measurement is report-only (no channel): a target for one is refused
 * by the editor's solver by name, and the person head solve owns the coupled
 * head measurements.
 *
 * @author Samchon
 */
export const HUMAN_FACE_CRANIOFACIAL_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "craniofacial.maximumCranialWidth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceHeadMeasurement(context, HUMAN_HEAD_MEASUREMENTS.headBreadth),
  },
  {
    id: "craniofacial.maximumCranialLength",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceHeadMeasurement(context, HUMAN_HEAD_MEASUREMENTS.headLength),
  },
  {
    id: "craniofacial.minimumFrontalWidth",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["glabella", "tragion-right", "tragion-left"], ["ear-right", "ear-left"], (head) => {
        const pair = findHumanFrontotemporalia(head, humanHeadPoint(head, "glabella"), humanHeadTragia(head), humanHeadEars(head));
        return pair.left.x - pair.right.x;
      }),
  },
  {
    id: "craniofacial.vertexToGnathion",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceVertexToLandmark(context, "gnathion"),
  },
  {
    id: "craniofacial.bizygomaticWidth",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["sellion", "tragion-right", "tragion-left"], ["ear-right", "ear-left"], (head) => {
        const pair = findHumanZygia(head, humanHeadTragia(head), humanHeadPoint(head, "sellion"), "ear-right", "ear-left");
        return pair.left.x - pair.right.x;
      }),
  },
  {
    id: "craniofacial.bigonialWidth",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "missing rule: gonion (the most lateral point of the posterior angle of the mandible, ANSUR II 5.2.16); the jaw attachment weights fade before the angle (at most 0.03 there) so they cannot delimit the skin over the mandible, and the skin has no registered mandibular border",
    }),
  },
  {
    id: "craniofacial.tragionWidth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "tragion-right", "tragion-left"),
  },
  {
    id: "craniofacial.faceHeight",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "gnathion");
      if ("reason" in a) return a;
      return { reason: "missing rule: nasion (the meeting of the brow ridge curves with the superior extension of the midline nasal profile, Katina 2016, found per shape)" };
    },
  },
  {
    id: "craniofacial.upperFaceHeight",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "stomion");
      if ("reason" in a) return a;
      return { reason: "missing rule: nasion (the meeting of the brow ridge curves with the superior extension of the midline nasal profile, Katina 2016, found per shape)" };
    },
  },
  {
    id: "craniofacial.lowerFaceHeight",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "subnasale", "gnathion"),
  },
  {
    id: "craniofacial.nasionSubnasalePogonionAngle",
    unit: "degrees",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "subnasale");
      if ("reason" in a) return a;
      return { reason: "missing rule: pogonion (the most anterior midline point of the chin, found per shape)" };
    },
  },
  {
    id: "craniofacial.pogonionFromCornealPlane",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: the cited protocol (PubMed 28339510, Eur J Orthod 2017, doi:10.1093/ejo/cjw055) is read only as its abstract, which measures pogonion against a coronal plane contacting the pupils in natural head orientation; the full method is not freely available",
    }),
  },
  {
    id: "craniofacial.upperFaceDepth.left",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "tragion-left");
      if ("reason" in a) return a;
      return { reason: "missing rule: nasion (the meeting of the brow ridge curves with the superior extension of the midline nasal profile, Katina 2016, found per shape)" };
    },
  },
  {
    id: "craniofacial.upperFaceDepth.right",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "tragion-right");
      if ("reason" in a) return a;
      return { reason: "missing rule: nasion (the meeting of the brow ridge curves with the superior extension of the midline nasal profile, Katina 2016, found per shape)" };
    },
  },
  {
    id: "craniofacial.middleFaceDepth.left",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "subnasale", "tragion-left"),
  },
  {
    id: "craniofacial.middleFaceDepth.right",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "subnasale", "tragion-right"),
  },
  {
    id: "craniofacial.lowerFaceDepth.left",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "gnathion", "tragion-left"),
  },
  {
    id: "craniofacial.lowerFaceDepth.right",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "gnathion", "tragion-right"),
  },
];
