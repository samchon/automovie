import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceBrowAtVertical } from "./readHumanFaceBrowAtVertical";
import { readHumanFaceBrowLength } from "./readHumanFaceBrowLength";
import { readHumanFaceMarginAtVertical } from "./readHumanFaceMarginAtVertical";
import { readHumanFacePupilCentre } from "./readHumanFacePupilCentre";

/**
 * Brow band measurements on the final connected source surface.
 * The existing source-card boundary and pupil vertical retain their meaning;
 * unregistered limbal verticals remain named gaps rather than guessed values.
 *
 * @author Samchon
 */
export const HUMAN_FACE_BROW_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "brow.left.length",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceBrowLength(context, "left"),
  },
  {
    id: "brow.left.centralBreadth",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "left");
      if ("reason" in pupil) return pupil;
      const brow = readHumanFaceBrowAtVertical(context, "left", pupil.x);
      if ("reason" in brow) return brow;
      return (brow.superior.y - brow.inferior.y) * 1000;
    },
  },
  {
    id: "brow.left.medialBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: () => {
      return {
        reason:
          "missing registration: the medial limbus that fixes this vertical; the CC0 eye proxy carries no limbus",
      };
    },
  },
  {
    id: "brow.left.centralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "left");
      if ("reason" in pupil) return pupil;
      const brow = readHumanFaceBrowAtVertical(context, "left", pupil.x);
      if ("reason" in brow) return brow;
      const lid = readHumanFaceMarginAtVertical(
        context,
        "left",
        "upper",
        pupil.x,
      );
      if ("reason" in lid) return lid;
      return Vector3.length(Vector3.subtract(brow.inferior, lid)) * 1000;
    },
  },
  {
    id: "brow.left.lateralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: () => {
      return {
        reason:
          "missing registration: the lateral limbus that fixes this vertical; the CC0 eye proxy carries no limbus",
      };
    },
  },
  {
    id: "brow.left.upperArchApexRise",
    unit: "millimetres",
    channels: ["browAngle"],
    read: () => {
      return {
        reason:
          "missing registration: the left medial limbus; the CC0 eye proxy carries no limbus",
      };
    },
  },
  {
    id: "brow.right.length",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceBrowLength(context, "right"),
  },
  {
    id: "brow.right.centralBreadth",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "right");
      if ("reason" in pupil) return pupil;
      const brow = readHumanFaceBrowAtVertical(context, "right", pupil.x);
      if ("reason" in brow) return brow;
      return (brow.superior.y - brow.inferior.y) * 1000;
    },
  },
  {
    id: "brow.right.medialBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: () => {
      return {
        reason:
          "missing registration: the medial limbus that fixes this vertical; the CC0 eye proxy carries no limbus",
      };
    },
  },
  {
    id: "brow.right.centralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "right");
      if ("reason" in pupil) return pupil;
      const brow = readHumanFaceBrowAtVertical(context, "right", pupil.x);
      if ("reason" in brow) return brow;
      const lid = readHumanFaceMarginAtVertical(
        context,
        "right",
        "upper",
        pupil.x,
      );
      if ("reason" in lid) return lid;
      return Vector3.length(Vector3.subtract(brow.inferior, lid)) * 1000;
    },
  },
  {
    id: "brow.right.lateralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: () => {
      return {
        reason:
          "missing registration: the lateral limbus that fixes this vertical; the CC0 eye proxy carries no limbus",
      };
    },
  },
  {
    id: "brow.right.upperArchApexRise",
    unit: "millimetres",
    channels: ["browAngle"],
    read: () => {
      return {
        reason:
          "missing registration: the right medial limbus; the CC0 eye proxy carries no limbus",
      };
    },
  },
];
