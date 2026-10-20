/**
 * A facial action unit of the Facial Action Coding System (FACS; Ekman and Friesen 1978), named by its action.
 *
 * Each unit is the visible effect of one muscle or muscle group, so an expression authored as action units states which muscles act, and the face generator pulls the surface along each muscle's anatomy. The FACS number follows each name. Units for gross behaviour (tongue show, jaw thrust, cheek puff and the like), head position and gaze are not facial deformation and are not listed: head position is a pose and gaze rotates the eye bones. Blink (45) and wink (46) are timed or one-sided forms of eye closure, authored as `eyesClosed` with a side.
 */
export const enum AutoMovieHumanActionUnit {
  /** AU1, frontalis medial part: the inner brow rises. */
  InnerBrowRaiser = "innerBrowRaiser",

  /** AU2, frontalis lateral part: the outer brow rises. */
  OuterBrowRaiser = "outerBrowRaiser",

  /** AU4, corrugator, depressor supercilii and procerus: brows down and together. */
  BrowLowerer = "browLowerer",

  /** AU5, levator palpebrae superioris: the upper lid rises. */
  UpperLidRaiser = "upperLidRaiser",

  /** AU6, orbicularis oculi orbital part: the cheek rises toward the eye. */
  CheekRaiser = "cheekRaiser",

  /** AU7, orbicularis oculi palpebral part: the lids tighten. */
  LidTightener = "lidTightener",

  /** AU9, levator labii superioris alaeque nasi: the nose wrinkles. */
  NoseWrinkler = "noseWrinkler",

  /** AU10, levator labii superioris: the upper lip rises. */
  UpperLipRaiser = "upperLipRaiser",

  /** AU11, zygomaticus minor: the nasolabial furrow deepens. */
  NasolabialDeepener = "nasolabialDeepener",

  /** AU12, zygomaticus major: the mouth corner pulls up and back. */
  LipCornerPuller = "lipCornerPuller",

  /** AU13, levator anguli oris: the mouth corner rises sharply. */
  SharpLipPuller = "sharpLipPuller",

  /** AU14, buccinator: the mouth corner draws in, dimpling. */
  Dimpler = "dimpler",

  /** AU15, depressor anguli oris: the mouth corner lowers. */
  LipCornerDepressor = "lipCornerDepressor",

  /** AU16, depressor labii inferioris: the lower lip lowers. */
  LowerLipDepressor = "lowerLipDepressor",

  /** AU17, mentalis: the chin skin and lower lip rise. */
  ChinRaiser = "chinRaiser",

  /** AU18, incisivus labii: the lips push forward and gather. */
  LipPucker = "lipPucker",

  /** AU20, risorius with platysma: the mouth corner stretches sideways. */
  LipStretcher = "lipStretcher",

  /** AU21, platysma: the neck tightens. */
  NeckTightener = "neckTightener",

  /** AU22, orbicularis oris: the lips funnel outward. */
  LipFunneler = "lipFunneler",

  /** AU23, orbicularis oris: the lips narrow and tighten. */
  LipTightener = "lipTightener",

  /** AU24, orbicularis oris: the lips press together. */
  LipPressor = "lipPressor",

  /** AU25: the lips part. */
  LipsPart = "lipsPart",

  /** AU26, masseter and temporalis relaxed: the jaw drops moderately. */
  JawDrop = "jawDrop",

  /** AU27, pterygoids and digastric: the mouth stretches wide open. */
  MouthStretch = "mouthStretch",

  /** AU28, orbicularis oris: the lips are sucked in over the teeth. */
  LipSuck = "lipSuck",

  /** AU38, nasalis alar part: the nostrils flare. */
  NostrilDilator = "nostrilDilator",

  /** AU39, nasalis transverse part and depressor septi: the nostrils narrow. */
  NostrilCompressor = "nostrilCompressor",

  /** AU41, levator relaxed: the upper lid droops. */
  LidDroop = "lidDroop",

  /** AU43, levator relaxed: the eyes close. */
  EyesClosed = "eyesClosed",
}
