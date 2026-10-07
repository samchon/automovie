import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { findHumanIntertragicNotch } from "../../../common/measure/findHumanIntertragicNotch";
import { humanHeadDistance } from "../../../common/measure/humanHeadDistance";
import { humanHeadPoint } from "../../../common/measure/humanHeadPoint";
import { readHumanConchaExtent } from "../../../common/measure/readHumanConchaExtent";
import { readHumanEarBreadth } from "../../../common/measure/readHumanEarBreadth";
import { readHumanEarInclination } from "../../../common/measure/readHumanEarInclination";
import { readHumanEarLength } from "../../../common/measure/readHumanEarLength";
import { readHumanEarProjection } from "../../../common/measure/readHumanEarProjection";
import { readHumanLobuleWidth } from "../../../common/measure/readHumanLobuleWidth";
import { readHumanFaceHeadRule } from "./readHumanFaceHeadRule";
import { readHumanFaceLandmarkDistance } from "./readHumanFaceLandmarkDistance";

const CONCHA_SAMPLE_QUALIFICATION =
  "Source convention: sampled region extent along the registered attachment frame; clinical conchal boundary and depth remain unregistered.";
const LOBULE_SAMPLE_QUALIFICATION =
  "Source convention: cavum inferior sample stands for the notch and the sampled lobule supplies the extent; clinical h-f/h-i landmarks remain unregistered.";

/**
 * The auricle measurements of the face resolver, one per numeric field of
 * `IAutoMovieHumanFaceEarParameters` on each side, keyed
 * `ear.<side>.<field>` without its unit suffix.
 *
 * Auricle length is ANSUR II 6.4.32's highest-to-lowest length, the straight
 * distance between superaurale and subaurale of the named ear area
 * (`readHumanEarLength`; the long axis taken through those points is a
 * convention). The superior and tragal projections are ANSUR II 6.4.33's ear
 * protrusion read at the superaurale and tragion heights
 * (`readHumanEarProjection`; the scalp behind the ear at that height stands in
 * for the mastoid surface, a convention). The attachment
 * length reads the registered otobasion landmarks. Breadth is Pa-Pra and
 * inclination the superaurale-subaurale-otobasion superius angle of the cited
 * 3D auricle study (`readHumanEarBreadth`, `readHumanEarInclination`); the
 * conchal length and breadth read the registered cymba and cavum conchae
 * against the attachment line (`readHumanConchaExtent`); lobular length and
 * width are the Korean CT study's h-f and h-i from the intertragic notch
 * (`findHumanIntertragicNotch`, `readHumanLobuleWidth`). Conchal depth and the
 * tragus distances follow sources not read, and read as unread sources. A
 * part the basis does not register reads as "missing region: <name>". The
 * categorical observations (helix rim, lobule shape and attachment) have no
 * measurement. Every measurement is report-only.
 *
 * @author Samchon
 */
export const HUMAN_FACE_EAR_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "ear.left.length",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceHeadRule(context, [], ["ear-left"], (head) => readHumanEarLength(head, "ear-left").metres),
  },
  {
    id: "ear.left.breadth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceHeadRule(context, [], ["ear-left"], (head) => readHumanEarBreadth(head, "ear-left").metres),
  },
  {
    id: "ear.left.attachmentLength",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "otobasion-superius-left", "otobasion-inferius-left"),
  },
  {
    id: "ear.left.superiorProjection",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["ear-left"], (head) =>
        // 0.1 mm under superaurale, so the plane cuts the helix just below its apex
        readHumanEarProjection(head, "ear-left", readHumanEarLength(head, "ear-left").points.superaurale.y - 0.0001).metres,
      ),
  },
  {
    id: "ear.left.tragalProjection",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["tragion-left"], ["ear-left"], (head) =>
        readHumanEarProjection(head, "ear-left", humanHeadPoint(head, "tragion-left").y).metres,
      ),
  },
  {
    id: "ear.left.inclination",
    unit: "degrees",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(
        context,
        ["otobasion-superius-left"],
        ["ear-left"],
        (head) => readHumanEarInclination(head, "ear-left", humanHeadPoint(head, "otobasion-superius-left")),
        1,
      ),
  },
  {
    id: "ear.left.conchaLength",
    qualification: CONCHA_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["otobasion-superius-left", "otobasion-inferius-left"], ["cymba-conchae-left", "cavum-conchae-left"], (head) =>
        readHumanConchaExtent(head, ["cymba-conchae-left", "cavum-conchae-left"], humanHeadPoint(head, "otobasion-superius-left"), humanHeadPoint(head, "otobasion-inferius-left")).length,
      ),
  },
  {
    id: "ear.left.conchaBreadth",
    qualification: CONCHA_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["otobasion-superius-left", "otobasion-inferius-left"], ["cymba-conchae-left", "cavum-conchae-left"], (head) =>
        readHumanConchaExtent(head, ["cymba-conchae-left", "cavum-conchae-left"], humanHeadPoint(head, "otobasion-superius-left"), humanHeadPoint(head, "otobasion-inferius-left")).breadth,
      ),
  },
  {
    id: "ear.left.conchaDepth",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: conchal depth from the entrance plane to the floor follows the external-ear protocol the parameter cites (Int J Pediatr Otorhinolaryngol 2003, S0165587603002210), not read",
    }),
  },
  {
    id: "ear.left.tragusToAntihelix",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: the tragus-to-antihelix points follow Rani et al. 2021 (Clin Ter, PubMed 34821348), read only as its abstract, which names the distance without its landmarks",
    }),
  },
  {
    id: "ear.left.tragusToHelix",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: the tragus-to-helix points follow Rani et al. 2021 (Clin Ter, PubMed 34821348), read only as its abstract, which names the distance without its landmarks",
    }),
  },
  {
    id: "ear.left.lobuleLength",
    qualification: LOBULE_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["ear-left", "cavum-conchae-left"], (head) =>
        humanHeadDistance(findHumanIntertragicNotch(head, "cavum-conchae-left"), readHumanEarLength(head, "ear-left").points.subaurale),
      ),
  },
  {
    id: "ear.left.lobuleBreadth",
    qualification: LOBULE_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["ear-left", "cavum-conchae-left", "lobule-left"], (head) => {
        const { superaurale, subaurale } = readHumanEarLength(head, "ear-left").points;
        return readHumanLobuleWidth(head, "lobule-left", findHumanIntertragicNotch(head, "cavum-conchae-left"), superaurale, subaurale);
      }),
  },
  {
    id: "ear.right.length",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceHeadRule(context, [], ["ear-right"], (head) => readHumanEarLength(head, "ear-right").metres),
  },
  {
    id: "ear.right.breadth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceHeadRule(context, [], ["ear-right"], (head) => readHumanEarBreadth(head, "ear-right").metres),
  },
  {
    id: "ear.right.attachmentLength",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "otobasion-superius-right", "otobasion-inferius-right"),
  },
  {
    id: "ear.right.superiorProjection",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["ear-right"], (head) =>
        // 0.1 mm under superaurale, so the plane cuts the helix just below its apex
        readHumanEarProjection(head, "ear-right", readHumanEarLength(head, "ear-right").points.superaurale.y - 0.0001).metres,
      ),
  },
  {
    id: "ear.right.tragalProjection",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["tragion-right"], ["ear-right"], (head) =>
        readHumanEarProjection(head, "ear-right", humanHeadPoint(head, "tragion-right").y).metres,
      ),
  },
  {
    id: "ear.right.inclination",
    unit: "degrees",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(
        context,
        ["otobasion-superius-right"],
        ["ear-right"],
        (head) => readHumanEarInclination(head, "ear-right", humanHeadPoint(head, "otobasion-superius-right")),
        1,
      ),
  },
  {
    id: "ear.right.conchaLength",
    qualification: CONCHA_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["otobasion-superius-right", "otobasion-inferius-right"], ["cymba-conchae-right", "cavum-conchae-right"], (head) =>
        readHumanConchaExtent(head, ["cymba-conchae-right", "cavum-conchae-right"], humanHeadPoint(head, "otobasion-superius-right"), humanHeadPoint(head, "otobasion-inferius-right")).length,
      ),
  },
  {
    id: "ear.right.conchaBreadth",
    qualification: CONCHA_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, ["otobasion-superius-right", "otobasion-inferius-right"], ["cymba-conchae-right", "cavum-conchae-right"], (head) =>
        readHumanConchaExtent(head, ["cymba-conchae-right", "cavum-conchae-right"], humanHeadPoint(head, "otobasion-superius-right"), humanHeadPoint(head, "otobasion-inferius-right")).breadth,
      ),
  },
  {
    id: "ear.right.conchaDepth",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: conchal depth from the entrance plane to the floor follows the external-ear protocol the parameter cites (Int J Pediatr Otorhinolaryngol 2003, S0165587603002210), not read",
    }),
  },
  {
    id: "ear.right.tragusToAntihelix",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: the tragus-to-antihelix points follow Rani et al. 2021 (Clin Ter, PubMed 34821348), read only as its abstract, which names the distance without its landmarks",
    }),
  },
  {
    id: "ear.right.tragusToHelix",
    unit: "millimetres",
    channels: [],
    read: () => ({
      reason:
        "unread source: the tragus-to-helix points follow Rani et al. 2021 (Clin Ter, PubMed 34821348), read only as its abstract, which names the distance without its landmarks",
    }),
  },
  {
    id: "ear.right.lobuleLength",
    qualification: LOBULE_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["ear-right", "cavum-conchae-right"], (head) =>
        humanHeadDistance(findHumanIntertragicNotch(head, "cavum-conchae-right"), readHumanEarLength(head, "ear-right").points.subaurale),
      ),
  },
  {
    id: "ear.right.lobuleBreadth",
    qualification: LOBULE_SAMPLE_QUALIFICATION,
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceHeadRule(context, [], ["ear-right", "cavum-conchae-right", "lobule-right"], (head) => {
        const { superaurale, subaurale } = readHumanEarLength(head, "ear-right").points;
        return readHumanLobuleWidth(head, "lobule-right", findHumanIntertragicNotch(head, "cavum-conchae-right"), superaurale, subaurale);
      }),
  },
];
