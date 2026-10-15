/**
 * A facial action unit of the Facial Action Coding System (FACS; Ekman and Friesen 1978), named by its action.
 *
 * Each unit is the visible effect of one muscle or muscle group, so an expression authored as action units states which muscles act, and the face generator pulls the surface along each muscle's anatomy. The FACS number follows each name. Units for gross behaviour (tongue show, jaw thrust, cheek puff and the like), head position and gaze are not facial deformation and are not listed: head position is a pose and gaze rotates the eye bones. Blink (45) and wink (46) are timed or one-sided forms of eye closure, authored as `eyesClosed` with a side.
 *
 * @author Samchon
 */
export type AutoMovieHumanActionUnit =
  /** AU1, frontalis medial part: the inner brow rises. */
  | "innerBrowRaiser"

  /** AU2, frontalis lateral part: the outer brow rises. */
  | "outerBrowRaiser"

  /** AU4, corrugator, depressor supercilii and procerus: brows down and together. */
  | "browLowerer"

  /** AU5, levator palpebrae superioris: the upper lid rises. */
  | "upperLidRaiser"

  /** AU6, orbicularis oculi orbital part: the cheek rises toward the eye. */
  | "cheekRaiser"

  /** AU7, orbicularis oculi palpebral part: the lids tighten. */
  | "lidTightener"

  /** AU9, levator labii superioris alaeque nasi: the nose wrinkles. */
  | "noseWrinkler"

  /** AU10, levator labii superioris: the upper lip rises. */
  | "upperLipRaiser"

  /** AU11, zygomaticus minor: the nasolabial furrow deepens. */
  | "nasolabialDeepener"

  /** AU12, zygomaticus major: the mouth corner pulls up and back. */
  | "lipCornerPuller"

  /** AU13, levator anguli oris: the mouth corner rises sharply. */
  | "sharpLipPuller"

  /** AU14, buccinator: the mouth corner draws in, dimpling. */
  | "dimpler"

  /** AU15, depressor anguli oris: the mouth corner lowers. */
  | "lipCornerDepressor"

  /** AU16, depressor labii inferioris: the lower lip lowers. */
  | "lowerLipDepressor"

  /** AU17, mentalis: the chin skin and lower lip rise. */
  | "chinRaiser"

  /** AU18, incisivus labii: the lips push forward and gather. */
  | "lipPucker"

  /** AU20, risorius with platysma: the mouth corner stretches sideways. */
  | "lipStretcher"

  /** AU21, platysma: the neck tightens. */
  | "neckTightener"

  /** AU22, orbicularis oris: the lips funnel outward. */
  | "lipFunneler"

  /** AU23, orbicularis oris: the lips narrow and tighten. */
  | "lipTightener"

  /** AU24, orbicularis oris: the lips press together. */
  | "lipPressor"

  /** AU25: the lips part. */
  | "lipsPart"

  /** AU26, masseter and temporalis relaxed: the jaw drops moderately. */
  | "jawDrop"

  /** AU27, pterygoids and digastric: the mouth stretches wide open. */
  | "mouthStretch"

  /** AU28, orbicularis oris: the lips are sucked in over the teeth. */
  | "lipSuck"

  /** AU38, nasalis alar part: the nostrils flare. */
  | "nostrilDilator"

  /** AU39, nasalis transverse part and depressor septi: the nostrils narrow. */
  | "nostrilCompressor"

  /** AU41, levator relaxed: the upper lid droops. */
  | "lidDroop"

  /** AU43, levator relaxed: the eyes close. */
  | "eyesClosed";
