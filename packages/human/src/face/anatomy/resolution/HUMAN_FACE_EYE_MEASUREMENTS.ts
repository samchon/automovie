import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceBrowAtVertical } from "./readHumanFaceBrowAtVertical";
import { readHumanFaceCanthus } from "./readHumanFaceCanthus";
import { readHumanFaceMarginAtVertical } from "./readHumanFaceMarginAtVertical";
import { readHumanFaceOpticalMetric } from "./readHumanFaceOpticalMetric";
import { readHumanFacePupilCentre } from "./readHumanFacePupilCentre";

/**
 * Eye and independent optical measurements on the final connected surface.
 * Brow-band and lash-shaft quantities retain their separate registries.
 *
 * Readers use the producer's periocular registration and optical support.
 * Canthi come from the registered definitions (`readHumanFaceCanthus`), the
 * pupil centre from the generated iris centroid, or on a build without
 * independent optics the source anterior chart approximation
 * (`readHumanFacePupilCentre`), palpebrale superius and inferius from the
 * margin rows on the pupil vertical (`readHumanFaceMarginAtVertical`), and the
 * brow borders from the brow card on a vertical (`readHumanFaceBrowAtVertical`).
 * Canthal, interpupillary and fissure lengths, the fissure height and the
 * central brow-to-lid distance are straight 3D distances (the brow-to-lid
 * distance is the linear distance from the inferior brow margin to palpebrale
 * superius on the pupil vertical, Gao et al. 2024, Quant Imaging Med Surg
 * 15(1):882-897); the lateral canthus rise, pupil-to-brow and central brow
 * breadth are head-frame vertical (+Y) differences on the pupil vertical;
 * brow length is the card's head-frame X extent. A basis without the registration reads every one as a registration
 * gap.
 *
 * Generated optical geometry is measured by readHumanFaceOpticalMetric;
 * a build without it retains the named assembly gap. Clinical pupil diameter
 * at 250 lux remains unavailable because authored aperture supplies no
 * physiological adaptation protocol. The upper crease remains unregistered.
 * Central corneal thickness reads in millimetres, against the observation's
 * micrometres. Channels name the existing identity axes a target may move;
 * independent optical output metrics are report-only.
 *
 * @author Samchon
 */
export const HUMAN_FACE_EYE_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "eye.innerCanthalDistance",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceCanthus(context, "left", "medial");
      if ("reason" in a) return a;
      const b = readHumanFaceCanthus(context, "right", "medial");
      if ("reason" in b) return b;
      return Vector3.length(Vector3.subtract(a, b)) * 1000;
    },
  },
  {
    id: "eye.outerCanthalDistance",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceCanthus(context, "left", "lateral");
      if ("reason" in a) return a;
      const b = readHumanFaceCanthus(context, "right", "lateral");
      if ("reason" in b) return b;
      return Vector3.length(Vector3.subtract(a, b)) * 1000;
    },
  },
  {
    id: "eye.interpupillaryDistance",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFacePupilCentre(context, "left");
      if ("reason" in a) return a;
      const b = readHumanFacePupilCentre(context, "right");
      if ("reason" in b) return b;
      return Vector3.length(Vector3.subtract(a, b)) * 1000;
    },
  },
  {
    id: "eye.left.fissureLength",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceCanthus(context, "left", "medial");
      if ("reason" in a) return a;
      const b = readHumanFaceCanthus(context, "left", "lateral");
      if ("reason" in b) return b;
      return Vector3.length(Vector3.subtract(a, b)) * 1000;
    },
  },
  {
    id: "eye.left.fissureHeight",
    unit: "millimetres",
    channels: ["leftEyeHeight"],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "left");
      if ("reason" in pupil) return pupil;
      const upper = readHumanFaceMarginAtVertical(
        context,
        "left",
        "upper",
        pupil.x,
      );
      if ("reason" in upper) return upper;
      const lower = readHumanFaceMarginAtVertical(
        context,
        "left",
        "lower",
        pupil.x,
      );
      if ("reason" in lower) return lower;
      return Vector3.length(Vector3.subtract(upper, lower)) * 1000;
    },
  },
  {
    id: "eye.left.lateralCanthusRise",
    unit: "millimetres",
    channels: ["leftLateralCanthusElevation"],
    read: (context) => {
      const medial = readHumanFaceCanthus(context, "left", "medial");
      if ("reason" in medial) return medial;
      const lateral = readHumanFaceCanthus(context, "left", "lateral");
      if ("reason" in lateral) return lateral;
      return (lateral.y - medial.y) * 1000;
    },
  },
  {
    id: "eye.left.upperCreaseHeight",
    unit: "millimetres",
    channels: ["leftEyeFoldHeight"],
    read: () => {
      return { reason: "missing registration: the left upper-lid crease" };
    },
  },
  {
    id: "eye.left.pupilToBrow",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "left");
      if ("reason" in pupil) return pupil;
      const brow = readHumanFaceBrowAtVertical(context, "left", pupil.x);
      if ("reason" in brow) return brow;
      return (brow.inferior.y - pupil.y) * 1000;
    },
  },
  {
    id: "eye.left.horizontalLimbusDiameter",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "left", "horizontalLimbusDiameter"),
  },
  {
    id: "eye.left.pupilDiameterAt250Lux",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing physiological protocol: iris aperture is authored geometry, without a measured 250 lux adaptation response",
      };
    },
  },
  {
    id: "eye.left.globeAxialLength",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "left", "globeAxialLength"),
  },
  {
    id: "eye.left.anteriorCornealRadius",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "left", "anteriorCornealRadius"),
  },
  {
    id: "eye.left.centralCornealThickness",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "left", "centralCornealThickness"),
  },
  {
    id: "eye.right.fissureLength",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const a = readHumanFaceCanthus(context, "right", "medial");
      if ("reason" in a) return a;
      const b = readHumanFaceCanthus(context, "right", "lateral");
      if ("reason" in b) return b;
      return Vector3.length(Vector3.subtract(a, b)) * 1000;
    },
  },
  {
    id: "eye.right.fissureHeight",
    unit: "millimetres",
    channels: ["rightEyeHeight"],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "right");
      if ("reason" in pupil) return pupil;
      const upper = readHumanFaceMarginAtVertical(
        context,
        "right",
        "upper",
        pupil.x,
      );
      if ("reason" in upper) return upper;
      const lower = readHumanFaceMarginAtVertical(
        context,
        "right",
        "lower",
        pupil.x,
      );
      if ("reason" in lower) return lower;
      return Vector3.length(Vector3.subtract(upper, lower)) * 1000;
    },
  },
  {
    id: "eye.right.lateralCanthusRise",
    unit: "millimetres",
    channels: ["rightLateralCanthusElevation"],
    read: (context) => {
      const medial = readHumanFaceCanthus(context, "right", "medial");
      if ("reason" in medial) return medial;
      const lateral = readHumanFaceCanthus(context, "right", "lateral");
      if ("reason" in lateral) return lateral;
      return (lateral.y - medial.y) * 1000;
    },
  },
  {
    id: "eye.right.upperCreaseHeight",
    unit: "millimetres",
    channels: ["rightEyeFoldHeight"],
    read: () => {
      return { reason: "missing registration: the right upper-lid crease" };
    },
  },
  {
    id: "eye.right.pupilToBrow",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const pupil = readHumanFacePupilCentre(context, "right");
      if ("reason" in pupil) return pupil;
      const brow = readHumanFaceBrowAtVertical(context, "right", pupil.x);
      if ("reason" in brow) return brow;
      return (brow.inferior.y - pupil.y) * 1000;
    },
  },
  {
    id: "eye.right.horizontalLimbusDiameter",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "right", "horizontalLimbusDiameter"),
  },
  {
    id: "eye.right.pupilDiameterAt250Lux",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing physiological protocol: iris aperture is authored geometry, without a measured 250 lux adaptation response",
      };
    },
  },
  {
    id: "eye.right.globeAxialLength",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "right", "globeAxialLength"),
  },
  {
    id: "eye.right.anteriorCornealRadius",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "right", "anteriorCornealRadius"),
  },
  {
    id: "eye.right.centralCornealThickness",
    unit: "millimetres",
    channels: [],
    qualification:
      "Authored independent optical geometry at Float32 output precision; not a measured clinical cornea.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "right", "centralCornealThickness"),
  },
  {
    id: "eye.left.irisOuterDiameter",
    unit: "millimetres",
    channels: [],
    qualification:
      "Generated model-space optical geometry; pupil adaptation, refraction and personal clinical measurements are not modeled.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "left", "irisOuterDiameter"),
  },
  {
    id: "eye.left.irisApertureDiameter",
    unit: "millimetres",
    channels: [],
    qualification:
      "Generated model-space optical geometry; pupil adaptation, refraction and personal clinical measurements are not modeled.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "left", "irisApertureDiameter"),
  },
  {
    id: "eye.left.irisDepthFromAnteriorSupport",
    unit: "millimetres",
    channels: [],
    qualification:
      "Generated model-space optical geometry; pupil adaptation, refraction and personal clinical measurements are not modeled.",
    read: (context) =>
      readHumanFaceOpticalMetric(
        context,
        "left",
        "irisDepthFromAnteriorSupport",
      ),
  },
  {
    id: "eye.right.irisOuterDiameter",
    unit: "millimetres",
    channels: [],
    qualification:
      "Generated model-space optical geometry; pupil adaptation, refraction and personal clinical measurements are not modeled.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "right", "irisOuterDiameter"),
  },
  {
    id: "eye.right.irisApertureDiameter",
    unit: "millimetres",
    channels: [],
    qualification:
      "Generated model-space optical geometry; pupil adaptation, refraction and personal clinical measurements are not modeled.",
    read: (context) =>
      readHumanFaceOpticalMetric(context, "right", "irisApertureDiameter"),
  },
  {
    id: "eye.right.irisDepthFromAnteriorSupport",
    unit: "millimetres",
    channels: [],
    qualification:
      "Generated model-space optical geometry; pupil adaptation, refraction and personal clinical measurements are not modeled.",
    read: (context) =>
      readHumanFaceOpticalMetric(
        context,
        "right",
        "irisDepthFromAnteriorSupport",
      ),
  },
];
