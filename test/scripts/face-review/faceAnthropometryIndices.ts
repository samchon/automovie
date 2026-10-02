import type { IFaceAnthropometryIndex } from "./IFaceAnthropometryIndex";

/** The indices, in solve order, with their paired controls. */
export const FACE_ANTHROPOMETRY_INDICES: readonly IFaceAnthropometryIndex[] = [
  {
    id: "intercanthal",
    definition: "en-en width (133, 362) over face width",
    channels: ["leftEyeLateralPosition", "rightEyeLateralPosition"],
  },
  {
    id: "fissureLength",
    definition: "mean en-ex length (133-33, 362-263) over face width",
    channels: ["leftEyeScale", "rightEyeScale"],
  },
  {
    id: "fissureHeight",
    definition: "mean ps-pi height (159-145, 386-374) over fissure length",
    channels: ["leftEyeHeight", "rightEyeHeight"],
  },
  {
    id: "canthalTilt",
    definition:
      "mean exocanthion rise above endocanthion (33 over 133, 263 over 362) over each fissure's length, signed, positive when the outer corner is higher",
    channels: ["leftLateralCanthusElevation", "rightLateralCanthusElevation"],
  },
  {
    id: "noseWidth",
    definition: "al-al width (129, 358) over face width",
    channels: ["noseWidth"],
  },
  {
    id: "noseHeight",
    definition: "n-sn height (168, 2) over face width at zygion (234, 454)",
    channels: ["noseHeight"],
  },
  {
    id: "mouthWidth",
    definition: "ch-ch width (61, 291) over face width",
    channels: ["mouthWidth"],
  },
  {
    id: "upperVermilion",
    definition:
      "ls-stoms height (labrale superius from the midline's colour, 475, to 13) over mouth width",
    channels: ["upperVermilionHeight"],
  },
  {
    id: "lowerVermilion",
    definition:
      "stomi-li height (14 to labrale inferius from the midline's colour, 476) over mouth width",
    channels: ["lowerVermilionHeight"],
  },
  {
    id: "upperLip",
    definition: "sn-stoms height (2, 13) over face width",
    channels: ["mouthElevation"],
  },
  {
    id: "chinHeight",
    definition:
      "stomi-me' height (14 to the jaw outline's menton, 470) over face width",
    channels: ["mentalHeight"],
  },
  {
    id: "cornerLift",
    definition:
      "lip centre (midpoint of 13 and 14) minus mouth corners (61, 291) height over mouth width, positive when the corners rise",
    channels: ["mouthSmileLeft", "mouthSmileRight"],
    expression: true,
  },
  {
    id: "lipParting",
    definition: "stoms-stomi height (13, 14) over mouth width",
    channels: ["mouthLowerDownLeft", "mouthLowerDownRight"],
    expression: true,
  },
  {
    id: "upperDisplay",
    definition:
      "upper incisal edge (FACE_ANTHROPOMETRY_UPPER_EDGE) below stomion superius (13) over mouth width, signed",
    channels: ["mouthUpperUpLeft", "mouthUpperUpRight"],
    expression: true,
    uncoveredBy: "incisalGap",
  },
  {
    id: "incisalGap",
    definition:
      "lower incisal edge (FACE_ANTHROPOMETRY_LOWER_EDGE) below the upper (FACE_ANTHROPOMETRY_UPPER_EDGE) over mouth width, signed",
    channels: ["jawOpen"],
    expression: true,
  },
  {
    id: "mouthShift",
    definition:
      "lip centre (midpoint of 13 and 14) across from subnasale (2) over mouth width, signed",
    channels: ["mouthLeft"],
    negative: ["mouthRight"],
    expression: true,
  },
  {
    id: "lowerFaceWidth",
    definition:
      "the jaw outline's width at the mouth line (471, 472) over face width",
    channels: ["cheekFullness"],
  },
  {
    id: "chinWidth",
    definition:
      "the jaw outline's width half the eyes' height below stomion (473, 474) over face width",
    channels: ["jawTaper"],
  },
  {
    id: "browHeight",
    definition:
      "mean brow apex to upper lid height (105-159, 334-386) over fissure length",
    channels: ["browElevation"],
  },
  {
    id: "eyeLevel",
    definition:
      "the canthi's mean height (33, 133, 263, 362) above subnasale (2) over face width",
    channels: ["leftEyeElevation", "rightEyeElevation"],
  },
  {
    id: "medialAperture",
    definition:
      "mean lid-to-lid height at the fissure's medial third (157-154, 384-381) over fissure length",
    channels: ["leftMedialEyeApertureHeight", "rightMedialEyeApertureHeight"],
  },
  {
    id: "lateralAperture",
    definition:
      "mean lid-to-lid height at the fissure's lateral third (161-163, 388-390) over fissure length",
    channels: ["leftLateralEyeApertureHeight", "rightLateralEyeApertureHeight"],
  },
  {
    id: "browSlope",
    definition:
      "mean brow head above brow tail (107 over 70, 336 over 300) over fissure length, signed",
    channels: ["browAngle"],
  },
  {
    id: "cupidsBowWidth",
    definition: "Cupid's bow peaks' width (37, 267) over mouth width",
    channels: ["cupidsBowWidth"],
  },
  {
    id: "cupidsBowDepth",
    definition:
      "Cupid's bow peaks (37, 267) above labrale superius (0) over mouth width, signed",
    channels: ["cupidsBowDefinition"],
  },
  {
    id: "upperLateralVermilion",
    definition:
      "mean upper vermilion height at its lateral third (39-81, 269-311) over mouth width",
    channels: ["upperLipLateralElevation"],
  },
  {
    id: "lowerLateralVermilion",
    definition:
      "mean lower vermilion height at its lateral third (178-181, 402-405) over mouth width",
    channels: ["lowerLipLateralElevation"],
  },
  {
    id: "cheekProminence",
    definition:
      "cheek contour width below the zygoma (123, 352) over face width",
    channels: ["leftCheekBone", "rightCheekBone"],
  },
  {
    id: "noseUpperWidth",
    definition:
      "nasal sidewall width at the upper dorsum (193, 417) over face width",
    channels: ["noseUpperWidth"],
  },
  {
    id: "noseMiddleWidth",
    definition:
      "nasal sidewall width at the middle dorsum (196, 419) over face width",
    channels: ["noseMiddleWidth"],
  },
  {
    id: "templeWidth",
    definition: "temple contour width (21, 251) over face width",
    channels: ["templeWidth"],
  },
  {
    id: "medialLowerLidSlope",
    definition:
      "mean slope of the lower lid from endocanthion to its medial third (133-155, 362-382), rise over run",
    channels: ["leftEpicanthalFold", "rightEpicanthalFold"],
  },
  {
    id: "upperLidHeight",
    definition:
      "mean upper lid margin to the lid's upper landmark (159-27, 386-257) over fissure length",
    channels: ["leftEyeFoldHeight", "rightEyeFoldHeight"],
  },
  {
    id: "infraorbitalHeight",
    definition:
      "mean lower lid margin to the infraorbital landmark (145-230, 374-450) over fissure length",
    channels: ["leftEyeBagHeight", "rightEyeBagHeight"],
  },
  {
    id: "noseTipHeight",
    definition: "nasal tip (1) above subnasale (2) over n-sn height",
    channels: ["noseTipElevation"],
  },
  {
    id: "nostrilHeight",
    definition:
      "mean nostril landmark (49, 279) above subnasale (2) over n-sn height",
    channels: ["noseBaseElevation"],
  },
];
