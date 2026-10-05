import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { humanHeadPoint } from "../../../common/measure/humanHeadPoint";
import { readHumanEarLength } from "../../../common/measure/readHumanEarLength";
import { readHumanEarProjection } from "../../../common/measure/readHumanEarProjection";
import { readHumanFaceHeadRule } from "./readHumanFaceHeadRule";
import { readHumanFaceLandmarkDistance } from "./readHumanFaceLandmarkDistance";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

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
 * length reads the otobasion landmarks once source registers them ("missing
 * landmark: <name>" until then). Breadth, inclination, concha,
 * tragus and lobule measurements need landmarks found per shape within the ear
 * area; until each rule exists the measurement reads as "missing rule:
 * <name>". The categorical observations (helix rim, lobule shape and
 * attachment) have no measurement. Every measurement is report-only.
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
    read: () => {
      return { reason: "missing rule: preaurale and postaurale of the left auricle" };
    },
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
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "otobasion-superius-left");
      if ("reason" in a) return a;
      return { reason: "missing rule: superaurale and subaurale as points of the left auricle" };
    },
  },
  {
    id: "ear.left.conchaLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left conchal bowl extremes" };
    },
  },
  {
    id: "ear.left.conchaBreadth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left conchal bowl extremes" };
    },
  },
  {
    id: "ear.left.conchaDepth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left conchal entrance plane and floor" };
    },
  },
  {
    id: "ear.left.tragusToAntihelix",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left tragus and antihelix points" };
    },
  },
  {
    id: "ear.left.tragusToHelix",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left tragus and helix points" };
    },
  },
  {
    id: "ear.left.lobuleLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left intertragic notch and lobule extent" };
    },
  },
  {
    id: "ear.left.lobuleBreadth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the left lobule extremes" };
    },
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
    read: () => {
      return { reason: "missing rule: preaurale and postaurale of the right auricle" };
    },
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
    read: (context) => {
      const a = readHumanFaceMeasurementLandmark(context, "otobasion-superius-right");
      if ("reason" in a) return a;
      return { reason: "missing rule: superaurale and subaurale as points of the right auricle" };
    },
  },
  {
    id: "ear.right.conchaLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right conchal bowl extremes" };
    },
  },
  {
    id: "ear.right.conchaBreadth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right conchal bowl extremes" };
    },
  },
  {
    id: "ear.right.conchaDepth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right conchal entrance plane and floor" };
    },
  },
  {
    id: "ear.right.tragusToAntihelix",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right tragus and antihelix points" };
    },
  },
  {
    id: "ear.right.tragusToHelix",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right tragus and helix points" };
    },
  },
  {
    id: "ear.right.lobuleLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right intertragic notch and lobule extent" };
    },
  },
  {
    id: "ear.right.lobuleBreadth",
    unit: "millimetres",
    channels: [],
    read: () => {
      return { reason: "missing rule: the right lobule extremes" };
    },
  },
];
