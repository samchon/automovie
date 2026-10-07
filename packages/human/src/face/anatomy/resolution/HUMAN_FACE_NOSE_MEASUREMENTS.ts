import { findHumanAlaria } from "../../../common/measure/findHumanAlaria";
import { findHumanPronasale } from "../../../common/measure/findHumanPronasale";
import { humanHeadDistance } from "../../../common/measure/humanHeadDistance";
import { humanHeadPoint } from "../../../common/measure/humanHeadPoint";
import { readHumanColumellaWidth } from "../../../common/measure/readHumanColumellaWidth";
import { readHumanNostrilBasal } from "../../../common/measure/readHumanNostrilBasal";
import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceHeadRule } from "./readHumanFaceHeadRule";
import { readHumanFaceLandmarkDistance } from "./readHumanFaceLandmarkDistance";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";
import { readHumanFaceNasalContour } from "./readHumanFaceNasalContour";

const BASAL_SAMPLE_QUALIFICATION =
  "Source convention: angularly ordered XZ sample polygon; missing boundary sectors are interpolated. Clinical aperture area and axes remain unregistered.";
const AUTHORED_CONTOUR_QUALIFICATION =
  "Source-authored ordered contour projected on its registered source normal; not a clinical aperture or calibrated basal-view measurement.";

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
 * construction is found per shape by a rule: `pronasale` by
 * `findHumanPronasale`, `alare` by `findHumanAlaria`, and the basal nostril
 * openings and columella breadth from the registered nostril margins
 * (`readHumanNostrilBasal`, `readHumanColumellaWidth`). `nasion` (Katina
 * 2016's curve definition) and the columellar high point have no rule yet and
 * read as "missing rule: <name>"; the long-axes angle reads as an unread
 * source. Every measurement is report-only.
 *
 * @author Samchon
 */
export const HUMAN_FACE_NOSE_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  ...(["left", "right"] as const).flatMap((side): IHumanFaceMeasurement[] => [
    { id: `nose.authoredOpeningProjectedArea.${side}`, unit: "square-millimetres", channels: [],
      qualification: AUTHORED_CONTOUR_QUALIFICATION,
      read: (context) => readHumanFaceNasalContour(context, side).area * 1e6 },
    { id: `nose.authoredOpeningProjectedLongAxis.${side}`, unit: "millimetres", channels: [],
      qualification: AUTHORED_CONTOUR_QUALIFICATION,
      read: (context) => readHumanFaceNasalContour(context, side).longAxis * 1000 },
    { id: `nose.authoredOpeningProjectedShortAxis.${side}`, unit: "millimetres", channels: [],
      qualification: AUTHORED_CONTOUR_QUALIFICATION,
      read: (context) => readHumanFaceNasalContour(context, side).shortAxis * 1000 },
  ]),
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
      return { reason: "unavailable instrument: registered nasion and connected nasal bridge length; pronasale has a per-shape reader" };
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
    read: (context) =>
      readHumanFaceHeadRule(
        context,
        ["subalare-right", "subalare-left", "alar-curvature-right", "alar-curvature-left", "sellion", "menton"],
        [],
        (head) => {
          const pair = findHumanAlaria(
            head,
            { right: humanHeadPoint(head, "subalare-right"), left: humanHeadPoint(head, "subalare-left") },
            { right: humanHeadPoint(head, "alar-curvature-right"), left: humanHeadPoint(head, "alar-curvature-left") },
            findHumanPronasale(head, humanHeadPoint(head, "sellion"), humanHeadPoint(head, "menton")),
          );
          return humanHeadDistance(pair.right, pair.left);
        },
      ),
  },
  {
    id: "nose.subalarWidth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "subalare-right", "subalare-left"),
  },
  {
    id: "nose.columellaWidth",
    qualification: "Source convention: minimum medial sample gap in 1 mm Z bands, not a registered clinical columella section.",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-right", "naris-margin-left"], (head) =>
        readHumanColumellaWidth(head, "naris-margin-right", "naris-margin-left"),
      ),
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
      return { reason: "unavailable instrument: registered nasion and connected nasofrontal angle; pronasale has a per-shape reader" };
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
    qualification: BASAL_SAMPLE_QUALIFICATION,
    unit: "square-millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-left"], (head) => readHumanNostrilBasal(head, "naris-margin-left").area, 1e6),
  },
  {
    id: "nose.nostrilArea.right",
    qualification: BASAL_SAMPLE_QUALIFICATION,
    unit: "square-millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-right"], (head) => readHumanNostrilBasal(head, "naris-margin-right").area, 1e6),
  },
  {
    id: "nose.nostrilLongAxis.left",
    qualification: BASAL_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-left"], (head) => readHumanNostrilBasal(head, "naris-margin-left").longAxis),
  },
  {
    id: "nose.nostrilShortAxis.left",
    qualification: BASAL_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-left"], (head) => readHumanNostrilBasal(head, "naris-margin-left").shortAxis),
  },
  {
    id: "nose.nostrilLongAxis.right",
    qualification: BASAL_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-right"], (head) => readHumanNostrilBasal(head, "naris-margin-right").longAxis),
  },
  {
    id: "nose.nostrilShortAxis.right",
    qualification: BASAL_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["naris-margin-right"], (head) => readHumanNostrilBasal(head, "naris-margin-right").shortAxis),
  },
  {
    id: "nose.nostrilLongAxesAngle",
    unit: "degrees",
    channels: [],
    read: () => ({
      reason:
        "unread source: the angle between the oriented long axes follows Hwang and Kang 2003 (PubMed 12725444), read only as its abstract, which classifies nostrils by that angle without stating how each axis is oriented",
    }),
  },
];
