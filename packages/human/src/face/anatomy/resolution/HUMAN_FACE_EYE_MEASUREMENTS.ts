import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceBrowAtVertical } from "./readHumanFaceBrowAtVertical";
import { readHumanFaceBrowLength } from "./readHumanFaceBrowLength";
import { readHumanFaceCanthus } from "./readHumanFaceCanthus";
import { readHumanFaceMarginAtVertical } from "./readHumanFaceMarginAtVertical";
import { readHumanFacePupilCentre } from "./readHumanFacePupilCentre";

/**
 * The eye-region measurements of the face resolver: one per numeric field of
 * `IAutoMovieHumanFaceEyeParameters` (`eye.<field>` and `eye.<side>.<field>`),
 * `IAutoMovieHumanFaceBrowParameters` (`brow.<side>.<field>`) and
 * `IAutoMovieHumanFaceEyelashParameters`
 * (`eyelash.<side>.<row>.<field>`), each without its unit suffix.
 *
 * Readers use the producer's periocular registration and optical support.
 * Canthi come from the registered definitions (`readHumanFaceCanthus`), the
 * pupil centre from each eye's anterior chart point (a named approximation,
 * `readHumanFacePupilCentre`), palpebrale superius and inferius from the
 * margin rows on the pupil vertical (`readHumanFaceMarginAtVertical`), and the
 * brow borders from the brow card on a vertical (`readHumanFaceBrowAtVertical`).
 * Canthal, interpupillary and fissure lengths and the fissure height are
 * straight 3D distances; the lateral canthus rise, pupil-to-brow, central
 * brow breadth and central brow-to-lid distances are head-frame vertical (+Y)
 * differences on the pupil vertical; brow length is the card's head-frame X
 * extent. A basis without the registration reads every one as a registration
 * gap.
 *
 * Still gaps: the upper-lid crease (no crease is registered); limbus, pupil
 * aperture, axial length and cornea (the CC0 eye proxy has no cornea, limbus,
 * aperture or posterior pole); the medial and lateral brow-to-lid verticals
 * (the study's vertical definitions are not yet read from its text); the brow
 * arch apex (it is referenced to the medial limbus); and the lash lengths (the
 * lashes are cards, not shafts). Central corneal thickness reads in
 * millimetres, the registry's unit, against the observation's micrometres. The
 * shaft count, brow hair coverage, lash form and lower-lid tissue grades have
 * no measurement. Channels name the identity channels a target may move.
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
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.left.pupilDiameterAt250Lux",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.left.globeAxialLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.left.anteriorCornealRadius",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.left.centralCornealThickness",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
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
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.right.pupilDiameterAt250Lux",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.right.globeAxialLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.right.anteriorCornealRadius",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
  {
    id: "eye.right.centralCornealThickness",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the CC0 eye proxy carries no cornea, limbus, pupil aperture or posterior pole",
      };
    },
  },
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
        reason: "missing rule: the medial vertical of the brow-to-lid study",
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
      return (brow.inferior.y - lid.y) * 1000;
    },
  },
  {
    id: "brow.left.lateralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: () => {
      return {
        reason: "missing rule: the lateral vertical of the brow-to-lid study",
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
        reason: "missing rule: the medial vertical of the brow-to-lid study",
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
      return (brow.inferior.y - lid.y) * 1000;
    },
  },
  {
    id: "brow.right.lateralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: () => {
      return {
        reason: "missing rule: the lateral vertical of the brow-to-lid study",
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
  {
    id: "eyelash.left.upper.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the left upper lashes are cards with no shaft population",
      };
    },
  },
  {
    id: "eyelash.left.lower.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the left lower lashes are cards with no shaft population",
      };
    },
  },
  {
    id: "eyelash.right.upper.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the right upper lashes are cards with no shaft population",
      };
    },
  },
  {
    id: "eyelash.right.lower.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing registration: the right lower lashes are cards with no shaft population",
      };
    },
  },
];
