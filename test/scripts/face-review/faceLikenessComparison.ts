import type { IFaceLikenessColour } from "./faceLikenessColour";
import type { FaceLikenessPoint } from "./faceLikenessGeometry";
import type { IFaceLikenessOverlap } from "./faceLikenessMasks";

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
  /** Visible brow height over inter-ocular distance, null when unreadable. */
  browBand: Record<
    "right" | "left",
    { reference: number | null; render: number | null }
  >;
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
    /** The darkest tenth of each brow outline, hair excluded: the fibres. */
    browRight: IFaceLikenessColourPair;
    browLeft: IFaceLikenessColourPair;
    /** The median of each brow outline, hair excluded: the tone as seen. */
    browToneRight: IFaceLikenessColourPair;
    browToneLeft: IFaceLikenessColourPair;
    /**
     * Cheek over sclera luminance (CIE Y) within one image: exposure and a
     * grey illuminant cancel, so the two sides compare skin albedo.
     */
    skinOverScleraLuminance: {
      reference: number | null;
      render: number | null;
    };
    hair: IFaceLikenessColourPair;
    /** The median of each lip's vermilion. */
    lipUpper: IFaceLikenessColourPair;
    lipLower: IFaceLikenessColourPair;
    irisMinusSkinLightness: { reference: number | null; render: number | null };
    hairMinusSkinLightness: { reference: number | null; render: number | null };
  };
}
