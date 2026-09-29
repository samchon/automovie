/**
 * The simple tier of body parameters: the numbers a person knows about a
 * body, which currently expand into legacy basis-channel weights in a body
 * document. Those weights are reproduction coordinates of the existing skin
 * basis, not anatomical muscle, bone or fat measurements.
 *
 * The existing document is canonical for replay against its fixed basis;
 * this is an editable projection of that document. Five values are required,
 * the ones on an identity card: sex, age, stature, mass and muscularity. Six
 * exterior girths and one internal rig-joint breadth are optional; when given
 * they are solved against the basis's
 * measurement rules so the built body actually measures them, and when
 * absent the body's sex, age and mass decide them. The expansion
 * (`expandHumanBodySimpleShape`) is a numeric table of terms per channel
 * plus measured inversions: stature against the basis's own height rule,
 * mass through the skin volume, and each tape measurement against its rule.
 * Age, mass and training drive legacy authored exterior responses. Sarcopenia,
 * gluteal and breast ptosis and fat redistribution motivate their directions,
 * but the table's knots are not a clinical forecast for an individual;
 * published adult gluteal studies disagree on an independent age effect
 * (Gonzalez 2006, doi:10.1007/s00266-005-0051-y; Babuccu et al. 2004,
 * doi:10.1007/s00266-004-4010-9). Muscle raises mass and tone and a trained V, and
 * muscle definition appears only where the body fat lets it: the fat the
 * definition reads subtracts the fat-free mass the muscle adds, so a trained
 * body at an athlete's mass index reads an athlete's fat. `projectHumanBodySimpleShape` reads these values back off any
 * detailed legacy shape, so a simple edit changes only what it names and
 * keeps the existing basis residue. These inferred channels do not assert an
 * individual's internal tissue volumes or the correctness of joint contact.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShape {
  /** Feminine -1 through masculine +1, continuous. */
  sex: number;

  /** Years, inside the basis's age nodes (the source's child node is 11 years, its old node 90). */
  ageYears: number;

  /** Standing height in metres, crown to floor, solved against the measured height rule. */
  statureMetres: number;

  /** Body mass in kilograms, solved against the measured skin volume at the estimated fat fraction's density. */
  massKilograms: number;

  /** Muscularity -1 through +2, the source's muscle macro before the age loss the table applies; 1 is a trained body, 2 the source's competition node. */
  muscle: number;

  /** Waist girth in metres, the smallest horizontal girth of the trunk, solved against its rule when given. */
  waistMetres?: number;

  /** Hip girth in metres, the horizontal girth where the buttocks stand furthest back (ANSUR's buttock circumference), solved against its rule when given. */
  hipsMetres?: number;

  /** Bust girth in metres at the basis nipple-height landmark, solved against its rule when given; this is not a search for the global maximum chest section. */
  bustMetres?: number;

  /** Distance in metres between basis shoulder joint centres, not a palpable biacromial breadth; solved against its rule when given. */
  shoulderMetres?: number;

  /** Thigh girth in metres, the largest girth of the thigh across its axis in its upper part, solved against its rule when given; both thighs move together. */
  thighMetres?: number;

  /** Upper arm girth in metres, the largest girth of the relaxed upper arm across its axis, solved against its rule when given; both arms move together. */
  upperArmMetres?: number;

  /** Calf girth in metres, the largest girth of the calf across its axis, solved against its rule when given; both calves move together. */
  calfMetres?: number;
}
