import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceIncisalOffset } from "./readHumanFaceIncisalOffset";

/**
 * The dentition measurements of the face resolver, one per
 * `IAutoMovieHumanFaceDentalParameters` field of the permanent dentition the
 * basis models.
 *
 * Overjet and overbite are the clinical incisal relationships read on the
 * basis contact's registered midline incisor pair in the contact frame, on
 * the document's own pose, so a neutral document reads the identity values.
 * Arch widths, palatal vault and per-tooth crown dimensions follow their
 * cited cast protocols, which need cusp tips, grooves, facial-axis points,
 * the palate and ISO 3950 tooth identities on the dental surface (skin
 * regions named `tooth-<code>`); until those are registered, and while the
 * crown protocol axes have no rule, each reads as a named gap. Primary-dentition fields
 * have no measurement because the dentition stage refuses them.
 *
 * @author Samchon
 */
export const HUMAN_FACE_DENTAL_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "dental.overjet",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : -offset.forward;
    },
  },
  {
    id: "dental.overbite",
    unit: "millimetres",
    channels: [],
    read: (context) => {
      const offset = readHumanFaceIncisalOffset(context);
      return "reason" in offset ? offset : offset.up;
    },
  },
  {
    id: "dental.maxillary.intercanineCuspWidth",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: ISO 13 and 23 cusp tips on the dental surface" }),
  },
  {
    id: "dental.maxillary.firstMolarMesiobuccalCuspWidth",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: ISO 16 and 26 mesiobuccal cusp tips on the dental surface" }),
  },
  {
    id: "dental.maxillary.palatalVaultWidthAtFirstMolarCej",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: the hard palate at the first-molar cementoenamel junction" }),
  },
  {
    id: "dental.maxillary.palatalVaultDepthAtFirstMolarCej",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: the hard palate at the first-molar cementoenamel junction" }),
  },
  {
    id: "dental.mandibular.intercanineCuspWidth",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: ISO 33 and 43 cusp tips on the dental surface" }),
  },
  {
    id: "dental.mandibular.firstMolarBuccalGrooveWidth",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: ISO 36 and 46 buccal grooves on the dental surface" }),
  },
  {
    id: "dental.mandibular.firstMolarFacialAxisDepth",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing registration: the incisor and first-molar facial-axis points on the dental surface" }),
  },
  ...[1, 2, 3, 4].flatMap((quadrant) =>
    [1, 2, 3, 4, 5, 6, 7, 8].flatMap((position) =>
      (["mesiodistalCrownWidth", "buccolingualCrownWidth", "crownHeight"] as const).map(
        (dimension): IHumanFaceMeasurement => ({
          id: `dental.teeth.${quadrant}${position}.${dimension}`,
          unit: "millimetres",
          channels: [],
          read: (context) =>
            context.basis.skinRegions?.[`tooth-${quadrant}${position}`] === undefined
              ? { reason: `missing registration: tooth-${quadrant}${position}` }
              : { reason: `missing rule: the ${dimension} protocol axes of tooth ${quadrant}${position}` },
        }),
      ),
    ),
  ),
];
