import type { AutoMovieHumanActionUnit as AutoMovieHumanActionUnitContract } from "@automovie/interface";

/**
 * A facial action unit of the Facial Action Coding System (FACS; Ekman and Friesen 1978), named by its action.
 *
 * Each unit describes the visible effect of one muscle or muscle group. The FACS number follows each name. Units for gross behaviour (tongue show, jaw thrust, cheek puff and the like), head position and gaze are not facial deformation and are not listed. Head position belongs to pose, while gaze describes eye orientation. Blink (45) and wink (46) are timed or one-sided forms of eye closure, authored as `eyesClosed` with a side.
 */
export namespace AutoMovieHumanActionUnit {
  /** AU1, frontalis medial part: the inner brow rises. */
  export const InnerBrowRaiser: "innerBrowRaiser" = "innerBrowRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU2, frontalis lateral part: the outer brow rises. */
  export const OuterBrowRaiser: "outerBrowRaiser" = "outerBrowRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU4, corrugator, depressor supercilii and procerus: brows down and together. */
  export const BrowLowerer: "browLowerer" = "browLowerer" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU5, levator palpebrae superioris: the upper lid rises. */
  export const UpperLidRaiser: "upperLidRaiser" = "upperLidRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU6, orbicularis oculi orbital part: the cheek rises toward the eye. */
  export const CheekRaiser: "cheekRaiser" = "cheekRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU7, orbicularis oculi palpebral part: the lids tighten. */
  export const LidTightener: "lidTightener" = "lidTightener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU9, levator labii superioris alaeque nasi: the nose wrinkles. */
  export const NoseWrinkler: "noseWrinkler" = "noseWrinkler" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU10, levator labii superioris: the upper lip rises. */
  export const UpperLipRaiser: "upperLipRaiser" = "upperLipRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU11, zygomaticus minor: the nasolabial furrow deepens. */
  export const NasolabialDeepener: "nasolabialDeepener" = "nasolabialDeepener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU12, zygomaticus major: the mouth corner pulls up and back. */
  export const LipCornerPuller: "lipCornerPuller" = "lipCornerPuller" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU13, levator anguli oris: the mouth corner rises sharply. */
  export const SharpLipPuller: "sharpLipPuller" = "sharpLipPuller" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU14, buccinator: the mouth corner draws in, dimpling. */
  export const Dimpler: "dimpler" = "dimpler" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU15, depressor anguli oris: the mouth corner lowers. */
  export const LipCornerDepressor: "lipCornerDepressor" = "lipCornerDepressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU16, depressor labii inferioris: the lower lip lowers. */
  export const LowerLipDepressor: "lowerLipDepressor" = "lowerLipDepressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU17, mentalis: the chin skin and lower lip rise. */
  export const ChinRaiser: "chinRaiser" = "chinRaiser" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU18, incisivus labii: the lips push forward and gather. */
  export const LipPucker: "lipPucker" = "lipPucker" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU20, risorius with platysma: the mouth corner stretches sideways. */
  export const LipStretcher: "lipStretcher" = "lipStretcher" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU21, platysma: the neck tightens. */
  export const NeckTightener: "neckTightener" = "neckTightener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU22, orbicularis oris: the lips funnel outward. */
  export const LipFunneler: "lipFunneler" = "lipFunneler" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU23, orbicularis oris: the lips narrow and tighten. */
  export const LipTightener: "lipTightener" = "lipTightener" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU24, orbicularis oris: the lips press together. */
  export const LipPressor: "lipPressor" = "lipPressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU25: the lips part. */
  export const LipsPart: "lipsPart" = "lipsPart" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU26, masseter and temporalis relaxed: the jaw drops moderately. */
  export const JawDrop: "jawDrop" = "jawDrop" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU27, pterygoids and digastric: the mouth stretches wide open. */
  export const MouthStretch: "mouthStretch" = "mouthStretch" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU28, orbicularis oris: the lips are sucked in over the teeth. */
  export const LipSuck: "lipSuck" = "lipSuck" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU38, nasalis alar part: the nostrils flare. */
  export const NostrilDilator: "nostrilDilator" = "nostrilDilator" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU39, nasalis transverse part and depressor septi: the nostrils narrow. */
  export const NostrilCompressor: "nostrilCompressor" = "nostrilCompressor" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU41, levator relaxed: the upper lid droops. */
  export const LidDroop: "lidDroop" = "lidDroop" satisfies
    AutoMovieHumanActionUnitContract;
  /** AU43, levator relaxed: the eyes close. */
  export const EyesClosed: "eyesClosed" = "eyesClosed" satisfies
    AutoMovieHumanActionUnitContract;
}
