import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceLandmarkAngle } from "./readHumanFaceLandmarkAngle";
import { readHumanFaceLandmarkDistance } from "./readHumanFaceLandmarkDistance";

/**
 * The closed-lip soft-tissue measurements of the face resolver, one per
 * `IAutoMovieHumanFaceMouthParameters` field.
 *
 * Landmark distances follow the 3D Facial Norms apposed-lip protocol
 * (Weinberg et al., 2016, https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/),
 * read between the named skin landmarks the basis registers; the Cupid's bow
 * angle is the 3D angle at labiale superius between the crista-philtri peaks.
 * A peak height needs the labial fissure line under its peak, and an
 * esthetic-line distance has no connected, qualified distance instrument even
 * though per-shape pronasale and pogonion readers exist. These unsupported
 * distances read as named gaps. The interlabial gap is the
 * performed central lip aperture of the contact's vermilion seam pair along
 * the contact frame's opening direction. A measurement lists a channel
 * only where one existing channel varies that distance; the rest are
 * report-only.
 *
 * @author Samchon
 */
export const HUMAN_FACE_MOUTH_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "mouth.fissureWidth",
    unit: "millimetres",
    channels: ["mouthWidth"],
    read: (context) => readHumanFaceLandmarkDistance(context, "cheilion-left", "cheilion-right"),
  },
  {
    id: "mouth.cristaPhiltriToCheilion.left",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "crista-philtri-left", "cheilion-left"),
  },
  {
    id: "mouth.cristaPhiltriToCheilion.right",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "crista-philtri-right", "cheilion-right"),
  },
  {
    id: "mouth.philtrumWidth",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "crista-philtri-left", "crista-philtri-right"),
  },
  {
    id: "mouth.philtrumLength",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "subnasale", "labiale-superius"),
  },
  {
    id: "mouth.upperLipHeight",
    unit: "millimetres",
    channels: ["upperLipHeight"],
    read: (context) => readHumanFaceLandmarkDistance(context, "subnasale", "stomion"),
  },
  {
    id: "mouth.lowerLipHeight",
    unit: "millimetres",
    channels: ["lowerLipHeight"],
    read: (context) => readHumanFaceLandmarkDistance(context, "stomion", "sublabiale"),
  },
  {
    id: "mouth.upperVermilionHeight",
    unit: "millimetres",
    channels: ["upperVermilionHeight"],
    read: (context) => readHumanFaceLandmarkDistance(context, "labiale-superius", "stomion"),
  },
  {
    id: "mouth.lowerVermilionHeight",
    unit: "millimetres",
    channels: ["lowerVermilionHeight"],
    read: (context) => readHumanFaceLandmarkDistance(context, "stomion", "labiale-inferius"),
  },
  {
    id: "mouth.lowerCutaneousLipHeight",
    unit: "millimetres",
    channels: [],
    read: (context) => readHumanFaceLandmarkDistance(context, "labiale-inferius", "sublabiale"),
  },
  {
    id: "mouth.cupidBowCentralAngle",
    unit: "degrees",
    channels: [],
    read: (context) =>
      readHumanFaceLandmarkAngle(
        context,
        "crista-philtri-right",
        "labiale-superius",
        "crista-philtri-left",
      ),
  },
  {
    id: "mouth.cupidBowPeakHeight.left",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: the labial fissure line under the left crista philtri" }),
  },
  {
    id: "mouth.cupidBowPeakHeight.right",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: the labial fissure line under the right crista philtri" }),
  },
  {
    id: "mouth.upperLipToEstheticLine",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "unavailable instrument: connected esthetic-line distance between per-shape pronasale and pogonion" }),
  },
  {
    id: "mouth.lowerLipToEstheticLine",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "unavailable instrument: connected esthetic-line distance between per-shape pronasale and pogonion" }),
  },
  {
    id: "mouth.interlabialGap",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const contact = context.basis.contact;
      if (contact === undefined || context.apertureUp === null)
        return { reason: "missing registration: the vermilion seam pair and jaw articulation" };
      return (
        Vector3.dot(
          Vector3.subtract(
            context.point(contact.lips.surface, contact.lips.upper),
            context.point(contact.lips.surface, contact.lips.lower),
          ),
          context.apertureUp,
        ) * 1000
      );
    },
  },
];
