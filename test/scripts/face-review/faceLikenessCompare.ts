/**
 * One subject's photograph-to-render comparison, kept as separate signals.
 *
 * `measure-face-likeness.ts` calls `compareFaceLikeness` for each subject
 * whose photograph and renders were all detected, and
 * `summarizeFaceLikeness` over the population. Two captures of the same
 * published document at the same planned yaw take part:
 *
 * 1. the portrait capture at the default 0.62 m distance supplies landmark
 *    shape, eye aperture, mouth corner, detector blendshapes and colour,
 *    because the face is large there;
 * 2. the frame capture, whose distance and target come from
 *    `faceLikenessFraming.ts`, supplies the hair silhouette, because only it
 *    sees all of the photograph's hair.
 *
 * Each capture is aligned to the photograph by its own landmarks. The
 * signals are never combined into one score: 2D proportions, lid and lip
 * state, silhouette and appearance under different light answer different
 * questions, and none of them is an identity or likeness verdict. Inputs are
 * caller-owned and never mutated.
 */
import {
  type IFaceLikenessColour,
  type IFaceLikenessImage,
  faceLikenessCheekColour,
  faceLikenessHairColour,
  faceLikenessIrisColour,
  faceLikenessScleraColour,
} from "./faceLikenessColour";
import {
  type FaceLikenessPoint,
  faceLikenessEyeAperture,
  faceLikenessLandmarkResidual,
  faceLikenessMedian,
  faceLikenessMouthCornerLift,
  faceLikenessRelativeRotation,
  faceLikenessRotationVector,
  fitFaceLikenessSimilarity,
} from "./faceLikenessGeometry";
import {
  type IFaceLikenessMask,
  type IFaceLikenessOverlap,
  faceLikenessHeadRegion,
  faceLikenessMaskOverlap,
  faceLikenessUncoveredShare,
  warpFaceLikenessMask,
} from "./faceLikenessMasks";
import {
  faceLikenessTeethLengths,
  measureFaceLikenessTeeth,
} from "./faceLikenessTeeth";

/** Detector blendshapes compared between photograph and render. */
export const FACE_LIKENESS_BLENDSHAPES = [
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "cheekSquintLeft",
  "cheekSquintRight",
  "mouthSmileLeft",
  "mouthSmileRight",
  "jawOpen",
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
] as const;

/** One detected image: landmarks, detector transform and blendshapes. */
export interface IFaceLikenessObservation {
  landmarks: FaceLikenessPoint[];
  transform: number[][];
  blendshapes: Record<string, number>;
}

/** A reference and a render value of one scalar signal. */
export interface IFaceLikenessPair {
  reference: number;
  render: number;
}

/** A reference and a render colour sample; either may be missing. */
export interface IFaceLikenessColourPair {
  reference: IFaceLikenessColour | null;
  render: IFaceLikenessColour | null;
  deltaE76: number | null;
}

/** Every separate signal of one subject. */
export interface IFaceLikenessComparison {
  landmarkRmsInterocular: number;
  landmarkMedianInterocular: number;
  detectorPoseDifferenceDegrees: number;
  eyeAperture: { right: IFaceLikenessPair; left: IFaceLikenessPair };
  mouthCornerLift: IFaceLikenessPair;
  /** Visible incisors along the mouth midline (`faceLikenessTeethLengths`). */
  teeth: Record<
    "upperExposure" | "lowerExposure" | "gap",
    { reference: number | null; render: number | null }
  >;
  blendshapes: Record<string, IFaceLikenessPair>;
  hair: {
    head: IFaceLikenessOverlap;
    covered: IFaceLikenessOverlap;
    uncoveredReferenceShare: number | null;
  };
  colour: {
    cheekRight: IFaceLikenessColourPair;
    cheekLeft: IFaceLikenessColourPair;
    irisRight: IFaceLikenessColourPair;
    irisLeft: IFaceLikenessColourPair;
    scleraRight: IFaceLikenessColourPair;
    scleraLeft: IFaceLikenessColourPair;
    /**
     * Cheek over sclera luminance (CIE Y) within one image: exposure and a
     * grey illuminant cancel, so the two sides compare skin albedo.
     */
    skinOverScleraLuminance: {
      reference: number | null;
      render: number | null;
    };
    hair: IFaceLikenessColourPair;
    irisMinusSkinLightness: { reference: number | null; render: number | null };
    hairMinusSkinLightness: { reference: number | null; render: number | null };
  };
}

/** Compare one subject's photograph with its portrait and frame captures. */
export function compareFaceLikeness(props: {
  reference: {
    face: IFaceLikenessObservation;
    image: IFaceLikenessImage;
    hair: IFaceLikenessMask;
  };
  portrait: {
    face: IFaceLikenessObservation;
    image: IFaceLikenessImage;
    hair: IFaceLikenessMask;
  };
  frame: { face: IFaceLikenessObservation; hair: IFaceLikenessMask };
}): IFaceLikenessComparison {
  const { reference, portrait, frame } = props;
  const fixed = reference.face.landmarks;
  const moving = portrait.face.landmarks;
  const residual = faceLikenessLandmarkResidual(
    moving,
    fixed,
    fitFaceLikenessSimilarity(moving, fixed),
  );
  const pose = faceLikenessRotationVector(
    faceLikenessRelativeRotation(
      portrait.face.transform,
      reference.face.transform,
    ),
  );
  const warped = warpFaceLikenessMask(
    frame.hair,
    fitFaceLikenessSimilarity(frame.face.landmarks, fixed),
    reference.hair.width,
    reference.hair.height,
  );
  const blendshapes: Record<string, IFaceLikenessPair> = {};
  for (const name of FACE_LIKENESS_BLENDSHAPES)
    blendshapes[name] = {
      reference: reference.face.blendshapes[name] ?? 0,
      render: portrait.face.blendshapes[name] ?? 0,
    };
  const region = (
    points: readonly FaceLikenessPoint[],
    image: IFaceLikenessImage,
  ) => faceLikenessHeadRegion(points, image.width, image.height);
  const colours = {
    cheekRight: pair(
      faceLikenessCheekColour(reference.image, fixed, "right", reference.hair),
      faceLikenessCheekColour(portrait.image, moving, "right", portrait.hair),
    ),
    cheekLeft: pair(
      faceLikenessCheekColour(reference.image, fixed, "left", reference.hair),
      faceLikenessCheekColour(portrait.image, moving, "left", portrait.hair),
    ),
    irisRight: pair(
      eye(faceLikenessIrisColour, reference.image, fixed, "right"),
      eye(faceLikenessIrisColour, portrait.image, moving, "right"),
    ),
    irisLeft: pair(
      eye(faceLikenessIrisColour, reference.image, fixed, "left"),
      eye(faceLikenessIrisColour, portrait.image, moving, "left"),
    ),
    scleraRight: pair(
      eye(faceLikenessScleraColour, reference.image, fixed, "right"),
      eye(faceLikenessScleraColour, portrait.image, moving, "right"),
    ),
    scleraLeft: pair(
      eye(faceLikenessScleraColour, reference.image, fixed, "left"),
      eye(faceLikenessScleraColour, portrait.image, moving, "left"),
    ),
    hair: pair(
      faceLikenessHairColour(
        reference.image,
        reference.hair,
        region(fixed, reference.image),
      ),
      faceLikenessHairColour(
        portrait.image,
        portrait.hair,
        region(moving, portrait.image),
      ),
    ),
  };
  const skin = (side: "reference" | "render") =>
    meanLightness([colours.cheekRight[side], colours.cheekLeft[side]]);
  const relative = (
    samples: (IFaceLikenessColour | null)[],
    side: "reference" | "render",
  ): number | null => {
    const value = meanLightness(samples);
    const base = skin(side);
    return value === null || base === null ? null : value - base;
  };
  return {
    landmarkRmsInterocular: residual.rms,
    landmarkMedianInterocular: residual.median,
    detectorPoseDifferenceDegrees: (Math.hypot(...pose) * 180) / Math.PI,
    eyeAperture: {
      right: {
        reference: faceLikenessEyeAperture(fixed, "right"),
        render: faceLikenessEyeAperture(moving, "right"),
      },
      left: {
        reference: faceLikenessEyeAperture(fixed, "left"),
        render: faceLikenessEyeAperture(moving, "left"),
      },
    },
    mouthCornerLift: {
      reference: faceLikenessMouthCornerLift(fixed),
      render: faceLikenessMouthCornerLift(moving),
    },
    teeth: teethPairs(
      faceLikenessTeethLengths(
        measureFaceLikenessTeeth(reference.image, fixed),
      ),
      faceLikenessTeethLengths(
        measureFaceLikenessTeeth(portrait.image, moving),
      ),
    ),
    blendshapes,
    hair: {
      head: faceLikenessMaskOverlap(
        reference.hair,
        warped.mask,
        warped.covered,
        region(fixed, reference.image),
      ),
      covered: faceLikenessMaskOverlap(
        reference.hair,
        warped.mask,
        warped.covered,
      ),
      uncoveredReferenceShare: faceLikenessUncoveredShare(
        reference.hair,
        warped.covered,
      ),
    },
    colour: {
      ...colours,
      irisMinusSkinLightness: {
        reference: relative(
          [colours.irisRight.reference, colours.irisLeft.reference],
          "reference",
        ),
        render: relative(
          [colours.irisRight.render, colours.irisLeft.render],
          "render",
        ),
      },
      hairMinusSkinLightness: {
        reference: relative([colours.hair.reference], "reference"),
        render: relative([colours.hair.render], "render"),
      },
      skinOverScleraLuminance: {
        reference: luminanceRatio(
          skin("reference"),
          meanLightness([
            colours.scleraRight.reference,
            colours.scleraLeft.reference,
          ]),
        ),
        render: luminanceRatio(
          skin("render"),
          meanLightness([
            colours.scleraRight.render,
            colours.scleraLeft.render,
          ]),
        ),
      },
    },
  };
}

/**
 * Population medians of the scalar signals over compared subjects, each with
 * the number of subjects that contributed. A missing value is skipped, never
 * counted as zero.
 */
export function summarizeFaceLikeness(
  rows: readonly IFaceLikenessComparison[],
): Record<string, { median: number | null; count: number }> {
  const signals: Record<
    string,
    (row: IFaceLikenessComparison) => number | null
  > = {
    landmarkRmsInterocular: (row) => row.landmarkRmsInterocular,
    detectorPoseDifferenceDegrees: (row) => row.detectorPoseDifferenceDegrees,
    hairIouHead: (row) => row.hair.head.iou,
    hairIouCovered: (row) => row.hair.covered.iou,
    uncoveredReferenceHairShare: (row) => row.hair.uncoveredReferenceShare,
    eyeApertureAbsoluteError: (row) =>
      (Math.abs(
        row.eyeAperture.right.render - row.eyeAperture.right.reference,
      ) +
        Math.abs(
          row.eyeAperture.left.render - row.eyeAperture.left.reference,
        )) /
      2,
    eyeApertureSignedError: (row) =>
      (row.eyeAperture.right.render -
        row.eyeAperture.right.reference +
        row.eyeAperture.left.render -
        row.eyeAperture.left.reference) /
      2,
    mouthCornerLiftSignedError: (row) =>
      row.mouthCornerLift.render - row.mouthCornerLift.reference,
    upperIncisorExposureSignedError: (row) =>
      difference(row.teeth.upperExposure),
    lowerIncisorExposureSignedError: (row) =>
      difference(row.teeth.lowerExposure),
    incisalGapSignedError: (row) => difference(row.teeth.gap),
    cheekDeltaE76: (row) =>
      mean([row.colour.cheekRight.deltaE76, row.colour.cheekLeft.deltaE76]),
    irisDeltaE76: (row) =>
      mean([row.colour.irisRight.deltaE76, row.colour.irisLeft.deltaE76]),
    hairDeltaE76: (row) => row.colour.hair.deltaE76,
    irisMinusSkinLightnessError: (row) =>
      difference(row.colour.irisMinusSkinLightness),
    hairMinusSkinLightnessError: (row) =>
      difference(row.colour.hairMinusSkinLightness),
    skinOverScleraLuminanceError: (row) =>
      difference(row.colour.skinOverScleraLuminance),
  };
  const summary: Record<string, { median: number | null; count: number }> = {};
  for (const [name, read] of Object.entries(signals)) {
    const values = rows
      .map(read)
      .filter((value): value is number => value !== null);
    summary[name] = {
      median: faceLikenessMedian(values),
      count: values.length,
    };
  }
  return summary;
}

function eye(
  sampler: typeof faceLikenessIrisColour,
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  side: "left" | "right",
): IFaceLikenessColour | null {
  // The refined-iris groups are assigned to an eye by containment, so a
  // detector that orders them differently cannot swap left and right.
  for (const group of [0, 1] as const) {
    const sample = sampler(image, points, group);
    if (sample?.side === side) return sample.colour;
  }
  return null;
}

/** CIE Y of skin over sclera from their CIELAB lightness, or null. */
function luminanceRatio(
  skin: number | null,
  sclera: number | null,
): number | null {
  if (skin === null || sclera === null) return null;
  const y = (lightness: number) =>
    lightness > 8 ? ((lightness + 16) / 116) ** 3 : lightness / (24389 / 27);
  return y(sclera) === 0 ? null : y(skin) / y(sclera);
}

function pair(
  reference: IFaceLikenessColour | null,
  render: IFaceLikenessColour | null,
): IFaceLikenessColourPair {
  return {
    reference,
    render,
    deltaE76:
      reference === null || render === null
        ? null
        : Math.hypot(
            reference.lab[0] - render.lab[0],
            reference.lab[1] - render.lab[1],
            reference.lab[2] - render.lab[2],
          ),
  };
}

function meanLightness(
  samples: readonly (IFaceLikenessColour | null)[],
): number | null {
  return mean(
    samples.map((sample) => (sample === null ? null : sample.lab[0])),
  );
}

function mean(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0
    ? null
    : present.reduce((sum, value) => sum + value, 0) / present.length;
}

function difference(value: {
  reference: number | null;
  render: number | null;
}): number | null {
  return value.reference === null || value.render === null
    ? null
    : value.render - value.reference;
}

function teethPairs(
  reference: ReturnType<typeof faceLikenessTeethLengths>,
  render: ReturnType<typeof faceLikenessTeethLengths>,
): IFaceLikenessComparison["teeth"] {
  return {
    upperExposure: {
      reference: reference.upperExposure,
      render: render.upperExposure,
    },
    lowerExposure: {
      reference: reference.lowerExposure,
      render: render.lowerExposure,
    },
    gap: { reference: reference.gap, render: render.gap },
  };
}
