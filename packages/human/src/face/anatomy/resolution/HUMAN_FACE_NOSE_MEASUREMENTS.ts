import { findHumanPronasale } from "../../../common/measure/findHumanPronasale";
import { humanHeadDistance } from "../../../common/measure/humanHeadDistance";
import { humanHeadPoint } from "../../../common/measure/humanHeadPoint";
import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceHeadRule } from "./readHumanFaceHeadRule";
import { readHumanFaceLandmarkDistance } from "./readHumanFaceLandmarkDistance";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * The nasal measurements of the face resolver, one per field of
 * `IAutoMovieHumanFaceNoseParameters`, keyed `nose.<field>` without its unit
 * suffix (paired fields add `.left` / `.right`).
 *
 * Fixed-point distances and angles follow the protocols the parameter type
 * cites (3D Facial Norms distances; the glabella–nasion–pronasale and
 * columellar–labial angles), read between named skin landmarks the basis
 * registers. A fixed landmark the basis does not declare reads as "missing
 * landmark: <name>" until source registers it (`subnasale`, `subalare`,
 * `alar-curvature`, `labiale-superius` are requested). An extreme or
 * construction (`nasion` by Katina 2016's curve definition, `alare`, the
 * columellar high point; `pronasale` is found by `findHumanPronasale`) and the basal nostril and columella
 * sections are found per shape by rules; until a rule exists the
 * measurement reads as "missing rule: <name>". Every measurement is
 * report-only.
 *
 * @author Samchon
 */
export const HUMAN_FACE_NOSE_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "nose.height",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "subnasale");
      if ("reason" in a) return a;
      return { reason: "missing rule: nasion (the meeting of the brow ridge curves with the superior extension of the midline nasal profile, Katina 2016, found per shape)" };
    },
  },
  {
    id: "nose.bridgeLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: nasion and pronasale, both found per shape" };
    },
  },
  {
    id: "nose.protrusion",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["subnasale", "sellion", "menton"], [], (head) =>
        humanHeadDistance(humanHeadPoint(head, "subnasale"), findHumanPronasale(head, humanHeadPoint(head, "sellion"), humanHeadPoint(head, "menton"))),
      ),
  },
  {
    id: "nose.alarWidth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: alare (the most lateral point of each ala, found per shape)" };
    },
  },
  {
    id: "nose.subalarWidth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "subalare-right", "subalare-left"),
  },
  {
    id: "nose.columellaWidth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the basal columella section" };
    },
  },
  {
    id: "nose.alaLength.left",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["alar-curvature-left", "sellion", "menton"], [], (head) =>
        humanHeadDistance(humanHeadPoint(head, "alar-curvature-left"), findHumanPronasale(head, humanHeadPoint(head, "sellion"), humanHeadPoint(head, "menton"))),
      ),
  },
  {
    id: "nose.alaLength.right",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["alar-curvature-right", "sellion", "menton"], [], (head) =>
        humanHeadDistance(humanHeadPoint(head, "alar-curvature-right"), findHumanPronasale(head, humanHeadPoint(head, "sellion"), humanHeadPoint(head, "menton"))),
      ),
  },
  {
    id: "nose.nasofrontalAngle",
    unit: "degrees",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "glabella");
      if ("reason" in a) return a;
      return { reason: "missing rule: nasion and pronasale, both found per shape" };
    },
  },
  {
    id: "nose.columellarLabialAngle",
    unit: "degrees",
    channels: [],
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "subnasale");
      if ("reason" in a) return a;
      const b = readHumanFaceMeasurementLandmark(context, "labiale-superius");
      if ("reason" in b) return b;
      return { reason: "missing rule: the columellar high point" };
    },
  },
  {
    id: "nose.nostrilArea.left",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left nostril aperture in a basal view" };
    },
  },
  {
    id: "nose.nostrilArea.right",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right nostril aperture in a basal view" };
    },
  },
  {
    id: "nose.nostrilLongAxis.left",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left nostril aperture in a basal view" };
    },
  },
  {
    id: "nose.nostrilShortAxis.left",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left nostril aperture in a basal view" };
    },
  },
  {
    id: "nose.nostrilLongAxis.right",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right nostril aperture in a basal view" };
    },
  },
  {
    id: "nose.nostrilShortAxis.right",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right nostril aperture in a basal view" };
    },
  },
  {
    id: "nose.nostrilLongAxesAngle",
    unit: "degrees",
    channels: [],
    read: () => {
      return { reason: "missing rule: both nostril apertures in a basal view" };
    },
  },
];
