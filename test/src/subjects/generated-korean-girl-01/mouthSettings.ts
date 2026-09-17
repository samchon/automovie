/**
 * Frozen oral dimensions, enamel and attachments for the retained reference study.
 * configuration.ts assembles these values; unit document fixtures own separate
 * immutable input data. Lengths use head millimetres and socket IDs refer to
 * controlNet. These are the unchanged historical inputs, not a new fitting pass.
 * Callers clone a profile before editing it; shared configuration stays fixed.
 */
import type { IPortraitDentalRow } from "@automovie/human/components/dentalRow";
import {
  type IPortraitMouthShape,
  type IPortraitMouthSocket,
} from "@automovie/human/components/mouth";

/** Measured vermilion and inner oral boundaries owned by this subject. */
export const portraitMouthSocket: IPortraitMouthSocket = {
  outer: [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0,
    37, 39, 40, 185,
  ],
  upper: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  lower: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
  lipSeed: 11,
};

/** Subject-owned smile fit. Crown dimensions remain authored estimates, not a scan. */
export const portraitMouthShape: IPortraitMouthShape = {
  // The outer vermilion is an anatomical curve shared with neighbouring skin.
  // Its refinement should not inherit zigzags from opposite triangle vertices.
  borderRefinement: "curve",
  // The former 0.86 width reduced a 133 px measured corner span to 110 px.
  // Compensate that shrinkage while retaining the same oral attachments.
  widthScale: 1.03,
  openingScale: 0.9,
  cornerLift: 1,
  upperLipProjection: 0,
  lowerLipProjection: 0,
  // Thickness varies along the curved lower band independently of the smile's
  // inner aperture. The central pad remains broad; the lateral vermilion tapers
  // toward shared corners. These are provisional fit ratios, not measurements.
  band: {
    upper: 1.1,
    lower: 1.08,
  },
  // Add cross-sectional body between the existing cutaneous and oral borders.
  // The central upper tubercle and lower paired pads are independent from the
  // broad body. Projections use mm; widths/offsets use oral half-width fractions.
  // This provisional shape retains the photographed aperture and dental frame.
  section: {
    upperBody: 0.6,
    upperTubercle: 0.2,
    upperTubercleWidth: 0.33,
    lowerBody: 0.6,
    lowerPads: 0.12,
    lowerPadOffset: 0.28,
    lowerPadWidth: 0.26,
  },
  blendReach: 14,
  cavityDepth: 5,
  dentalOffset: -1.15,
  dentalRecess: 3.4,
  // Crown centres sit below the refined upper-lip guide. Review dentalDrop
  // together with crown height: their upper edges must remain behind the lip.
  dentalDrop: 5.2,
  dentalDepth: 1.5,
  toothGap: 0.08,
  crowns: [
    { width: 4.4, height: 8.0 },
    { width: 5.1, height: 8.3 },
    { width: 6, height: 8.8, cervicalWidth: 0.72, edgeRise: 1.05 },
    {
      width: 6.8,
      height: 9.2,
      cervicalWidth: 0.76,
      edgeRise: 0.65,
      contour: {
        mesial: { contactHeight: 0.29, incisalRise: 0.35, cervicalWidth: 0.81 },
        distal: { contactHeight: 0.43, incisalRise: 0.82, cervicalWidth: 0.74 },
      },
    },
    // The central incisors have a sharper mesial and rounder distal corner.
    // These optional fractions/mm are authored form fits. The arch supplies
    // mesial orientation, so neither crown owns an independent world placement.
    {
      width: 8.1,
      height: 9.7,
      cervicalWidth: 0.82,
      // The central incisor cutting edge is a shallow curved arc in the
      // reference smile. Keep crown height and the shared arch unchanged;
      // increase only the mesial/distal corner lift so the enamel reads as a
      // rounded incisal edge instead of a rectangular block.
      edgeRise: 0.9,
      contour: {
        mesial: { contactHeight: 0.22, incisalRise: 0.32, cervicalWidth: 0.85 },
        distal: { contactHeight: 0.35, incisalRise: 0.8, cervicalWidth: 0.78 },
      },
    },
    {
      width: 8.1,
      height: 9.8,
      cervicalWidth: 0.82,
      edgeRise: 0.95,
      contour: {
        mesial: { contactHeight: 0.2, incisalRise: 0.34, cervicalWidth: 0.84 },
        distal: { contactHeight: 0.36, incisalRise: 0.83, cervicalWidth: 0.77 },
      },
    },
    {
      width: 6.8,
      height: 9.2,
      cervicalWidth: 0.76,
      edgeRise: 0.65,
      contour: {
        mesial: { contactHeight: 0.29, incisalRise: 0.35, cervicalWidth: 0.81 },
        distal: { contactHeight: 0.43, incisalRise: 0.82, cervicalWidth: 0.74 },
      },
    },
    { width: 6, height: 8.8, cervicalWidth: 0.72, edgeRise: 1.05 },
    { width: 5.1, height: 8.3 },
    { width: 4.4, height: 8.0 },
  ],
};

/**
 * The upper row is one group: local arch dimensions own every tooth placement.
 * The authored enamel profiles are shared with the procedural study; the active
 * row has its own arch and attachment controls. Changing a crown recomputes
 * arc-distance centres for the complete group without sampling the lip shape.
 */
export const portraitDentalRow: IPortraitDentalRow = {
  halfWidth: 23,
  depth: 16,
  gap: 0.08,
  // Nominal arc gaps do not measure the rotating proximal surfaces. Fit those
  // resident crown meshes with a separate, small physical separation constraint.
  contactGap: 0.02,
  crowns: portraitMouthShape.crowns.map((crown) => ({
    ...crown,
    // Width fitting is independent of the crown's full anatomical height.
    width: crown.width * 0.94,
    depth: 1.5,
    cervicalWidth: crown.cervicalWidth ?? 0.78,
    edgeRise: crown.edgeRise ?? 0.035 * crown.height,
  })),
};

/** Central upper lip and corner identities establish one oral frame. */
export const portraitDentalSocket = {
  rightCorner: 78,
  leftCorner: 308,
  upperLipMiddle: 13,
};

/**
 * One group placement in mm: positive lift hides gingival ends behind the upper
 * lip; positive recess moves the entire arch posteriorly. These are authored
 * estimates and require both profile views after every placement change.
 */
export const portraitDentalPlacement = { lift: 1.7, recess: 6 };
