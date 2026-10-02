import type { IFaceAnthropometryIndex } from "./IFaceAnthropometryIndex";

/**
 * The unseen form's norms: E-line distances in metres, angles in degrees,
 * the cephalic index and the ear's length over the face's height as ratios.
 */
export interface IFaceUnseenNorm {
  eLineUpper: number;
  eLineLower: number;
  facialConvexity: number;
  nasofrontal: number;
  nasolabial: number;
  nasalProtrusion: number;
  cephalicIndex: number;
  earLength: number;
  earProtrusion: number;
  lowerVermilion: number;
}

/** One reading of the unseen form on the model. */
export type FaceUnseenReading =
  | Exclude<keyof IFaceUnseenNorm, "earLength" | "earProtrusion">
  | "earLengthLeft"
  | "earLengthRight"
  | "earProtrusionLeft"
  | "earProtrusionRight";

/** One unseen reading, the norm it is held to and the control that means it. */
export interface IFaceUnseenIndex extends IFaceAnthropometryIndex {
  id: FaceUnseenReading;
  norm: keyof IFaceUnseenNorm;
  /** The least difference the reading resolves (metres, degrees, ratio). */
  resolution: number;
  /** The population's standard deviation of the reading, same units. */
  spread: number;
  /**
   * The photograph's index this reading stands in for: it holds only where
   * the photograph does not measure that index.
   */
  photographed?: string;
}

/**
 * Each unseen reading's control. Lip protrusion is the dentoalveolar
 * position the whole mouth moves with, and the lower lip's own fullness sets
 * it apart from the upper; the chin's projection closes the facial
 * convexity, the nasal root's depth the nasofrontal angle, the columella's
 * inclination the nasolabial angle, the nose's depth its tip's
 * protrusion, the occiput's depth the head's length, and each ear's scale
 * its length and its flap its protrusion. Distances resolve to 0.01 mm, angles to 0.01 degree, a
 * tenth of the profile's sampling, and ratios to 0.0001. Each spread is
 * the reading's standard deviation among adults: 2 mm to the E-line
 * (Ricketts 1968), 4 degrees of convexity and 8 of the nasolabial angle
 * (Legan and Burstone 1980), 7 of the nasofrontal angle (Farkas 1994,
 * North American White), 0.02 of the nasal tip protrusion index (Zaidi
 * 2017, individual data), 0.03 of the cephalic index and 0.04 of the ear's
 * ratio, and 0.045 of the ear's protrusion over its length (ANSUR II),
 * and 0.036 of the lower vermilion over the mouth's width (the root mean
 * square of the samples' ratio deviations below, by the delta method).
 */
export const FACE_UNSEEN_INDICES: readonly IFaceUnseenIndex[] = [
  {
    id: "eLineUpper",
    norm: "eLineUpper",
    definition: "ls' to the E-line (prn-pog'), positive in front",
    channels: ["mouthForwardPosition"],
    resolution: 1e-5,
    spread: 0.002,
  },
  {
    id: "eLineLower",
    norm: "eLineLower",
    definition: "li' to the E-line (prn-pog'), positive in front",
    channels: ["lowerLipVolume"],
    resolution: 1e-5,
    spread: 0.002,
  },
  {
    id: "facialConvexity",
    norm: "facialConvexity",
    definition: "angle g-sn-pog'",
    channels: ["chinProjection"],
    resolution: 0.01,
    spread: 4,
  },
  {
    id: "nasofrontal",
    norm: "nasofrontal",
    definition: "angle between the forehead tangent and n-prn at n",
    channels: ["nasalRootProjection"],
    resolution: 0.01,
    spread: 7,
  },
  {
    id: "nasolabial",
    norm: "nasolabial",
    definition: "angle between the columella tangent and sn-ls at sn",
    channels: ["noseSeptumAngle"],
    resolution: 0.01,
    spread: 8,
  },
  {
    id: "nasalProtrusion",
    norm: "nasalProtrusion",
    definition: "sn-prn over n-sn",
    channels: ["noseDepth"],
    resolution: 1e-4,
    spread: 0.02,
  },
  {
    id: "cephalicIndex",
    norm: "cephalicIndex",
    definition: "eu-eu over g-op",
    channels: ["posteriorHeadDepth"],
    resolution: 1e-4,
    spread: 0.03,
  },
  {
    id: "earLengthLeft",
    norm: "earLength",
    definition: "left sa-sba over n-me",
    channels: ["leftEarScale"],
    resolution: 1e-4,
    spread: 0.04,
  },
  {
    id: "earLengthRight",
    norm: "earLength",
    definition: "right sa-sba over n-me",
    channels: ["rightEarScale"],
    resolution: 1e-4,
    spread: 0.04,
  },
  {
    id: "earProtrusionLeft",
    norm: "earProtrusion",
    definition: "left ear's lateral point to the head behind it, over sa-sba",
    channels: ["leftEarFlap"],
    resolution: 1e-4,
    spread: 0.045,
  },
  {
    id: "earProtrusionRight",
    norm: "earProtrusion",
    definition: "right ear's lateral point to the head behind it, over sa-sba",
    channels: ["rightEarFlap"],
    resolution: 1e-4,
    spread: 0.045,
  },
  {
    id: "lowerVermilion",
    norm: "lowerVermilion",
    definition: "sto-li over ch-ch at rest",
    channels: ["lowerVermilionHeight"],
    resolution: 1e-4,
    spread: 0.036,
    photographed: "lowerVermilion",
  },
];
