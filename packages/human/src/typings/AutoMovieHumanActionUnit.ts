import type { AutoMovieHumanActionUnit as AutoMovieHumanActionUnitContract } from "@automovie/interface";

/**
 * Serialized names for facial action units.
 *
 * Set `unit` in an `IAutoMovieHumanActionUnitActivation`. Intensity and
 * anatomical side are separate fields. The FACS numbers identify visible
 * actions. The cartoon face draws its supported subset and reports other
 * nonzero requests.
 */
export namespace AutoMovieHumanActionUnit {
  /** AU1 lifts the medial brow. */
  export const InnerBrowRaiser: "innerBrowRaiser" = "innerBrowRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU2 lifts the lateral brow. */
  export const OuterBrowRaiser: "outerBrowRaiser" = "outerBrowRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU4 lowers the brows and draws them together. */
  export const BrowLowerer: "browLowerer" = "browLowerer" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU5 raises the upper eyelid. */
  export const UpperLidRaiser: "upperLidRaiser" = "upperLidRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU6 raises the cheek toward the eye. */
  export const CheekRaiser: "cheekRaiser" = "cheekRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU7 tightens the eyelids. */
  export const LidTightener: "lidTightener" = "lidTightener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU9 wrinkles the nose. */
  export const NoseWrinkler: "noseWrinkler" = "noseWrinkler" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU10 raises the upper lip. */
  export const UpperLipRaiser: "upperLipRaiser" = "upperLipRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU11 deepens the nasolabial furrow. */
  export const NasolabialDeepener: "nasolabialDeepener" = "nasolabialDeepener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU12 draws the mouth corner upward and back. */
  export const LipCornerPuller: "lipCornerPuller" = "lipCornerPuller" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU13 lifts the mouth corner sharply. */
  export const SharpLipPuller: "sharpLipPuller" = "sharpLipPuller" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU14 draws the mouth corner inward to form a dimple. */
  export const Dimpler: "dimpler" = "dimpler" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU15 lowers the mouth corner. */
  export const LipCornerDepressor: "lipCornerDepressor" = "lipCornerDepressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU16 lowers the lower lip. */
  export const LowerLipDepressor: "lowerLipDepressor" = "lowerLipDepressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU17 lifts the chin skin and lower lip. */
  export const ChinRaiser: "chinRaiser" = "chinRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU18 gathers the lips and pushes them forward. */
  export const LipPucker: "lipPucker" = "lipPucker" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU20 stretches the mouth corner sideways. */
  export const LipStretcher: "lipStretcher" = "lipStretcher" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU21 tightens the neck. */
  export const NeckTightener: "neckTightener" = "neckTightener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU22 forms an outward lip funnel. */
  export const LipFunneler: "lipFunneler" = "lipFunneler" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU23 narrows and tightens the lips. */
  export const LipTightener: "lipTightener" = "lipTightener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU24 presses the lips together. */
  export const LipPressor: "lipPressor" = "lipPressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU25 parts the lips. */
  export const LipsPart: "lipsPart" = "lipsPart" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU26 lowers the jaw to open the mouth. */
  export const JawDrop: "jawDrop" = "jawDrop" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU27 opens the mouth wide. */
  export const MouthStretch: "mouthStretch" = "mouthStretch" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU28 draws the lips inward over the teeth. */
  export const LipSuck: "lipSuck" = "lipSuck" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU38 flares the nostrils. */
  export const NostrilDilator: "nostrilDilator" = "nostrilDilator" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU39 narrows the nostrils. */
  export const NostrilCompressor: "nostrilCompressor" = "nostrilCompressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU41 lets the upper eyelid droop. */
  export const LidDroop: "lidDroop" = "lidDroop" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU43 closes the eye on the selected side. */
  export const EyesClosed: "eyesClosed" = "eyesClosed" satisfies
    AutoMovieHumanActionUnitContract;
}
