/**
 * The simple tier of body parameters: the numbers a person knows about a
 * body, which expand into the detailed tier, the channel weights of a body
 * document.
 *
 * The detailed tier is the canonical one; this is a generator over it and
 * a projection back from it. Five values are required, the ones on an
 * identity card: sex, age, stature, mass and a muscularity. Seven tape
 * measurements are optional (the trunk and limb girths a tailor takes and
 * the shoulder breadth); when given they are solved against the basis's
 * measurement rules so the built body actually measures them, and when
 * absent the body's sex, age and mass decide them. The expansion
 * (`expandHumanBodySimpleShape`) is a numeric table of terms per channel
 * plus measured inversions: stature against the basis's own height rule,
 * mass through the skin volume, and each tape measurement against its rule.
 * Age moves the tissue the way the clinical literature says it does
 * (gluteal and breast ptosis, sarcopenia, fat redistribution toward the
 * trunk, loss of tone), muscle raises mass and tone and a trained V, and
 * muscle definition appears only where the body fat lets it: the fat the
 * definition reads subtracts the fat-free mass the muscle adds, so a trained
 * body at an athlete's mass index reads an athlete's fat. `projectHumanBodySimpleShape` reads these values back off any
 * detailed shape, so a simple edit changes only what it names and keeps the
 * detailed residue.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Names the identity-card values and the tape measurements a user can author a body from, and what each is measured in.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Fixes the parameter envelope the expansion refuses outside of.
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

  /** Bust girth in metres, the largest horizontal girth of the chest, solved against its rule when given. */
  bustMetres?: number;

  /** Shoulder breadth in metres, between the shoulder joints, solved against its rule when given. */
  shoulderMetres?: number;

  /** Thigh girth in metres, the largest girth of the thigh across its axis in its upper part, solved against its rule when given; both thighs move together. */
  thighMetres?: number;

  /** Upper arm girth in metres, the largest girth of the relaxed upper arm across its axis, solved against its rule when given; both arms move together. */
  upperArmMetres?: number;

  /** Calf girth in metres, the largest girth of the calf across its axis, solved against its rule when given; both calves move together. */
  calfMetres?: number;
}
