/**
 * The simple tier of body parameters: the numbers a person knows about a
 * body, which expand into the detailed tier, the channel weights of a body
 * document.
 *
 * The detailed tier is the canonical one; this is a generator over it and
 * a projection back from it. Five values are required, the ones on an
 * identity card: sex, age, stature, mass and a muscularity. Four tape
 * measurements are optional; when given they are solved against the basis's
 * measurement rules so the built body actually measures them, and when
 * absent the body's sex, age and mass decide them. The expansion
 * (`expandHumanBodySimpleShape`) is a numeric table of terms per channel
 * plus measured inversions: stature against the basis's own height rule,
 * mass through the skin volume, and each tape measurement against its rule.
 * Age moves the tissue the way the clinical literature says it does
 * (gluteal ptosis, sarcopenia, fat redistribution toward the trunk, loss of
 * firmness), and muscle definition appears only where the body fat estimate
 * lets it. `projectHumanBodySimpleShape` reads these values back off any
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

  /** Muscularity -1 through +1, the source's muscle macro before the age loss the table applies. */
  muscle: number;

  /** Waist girth in metres, the smallest horizontal girth of the trunk, solved against its rule when given. */
  waistMetres?: number;

  /** Hip girth in metres, the largest horizontal girth over the buttocks, solved against its rule when given. */
  hipsMetres?: number;

  /** Bust girth in metres, the largest horizontal girth of the chest, solved against its rule when given. */
  bustMetres?: number;

  /** Shoulder breadth in metres, between the shoulder joints, solved against its rule when given. */
  shoulderMetres?: number;
}
