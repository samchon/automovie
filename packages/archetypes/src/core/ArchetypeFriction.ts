import { ArchetypeRefusal } from "./ArchetypeRefusal";

/** The College Physics textbook's table of measured pairs. */
const OPENSTAX: string =
  "OpenStax, College Physics 2e (2022), Table 5.1, Coefficients of Static and Kinetic Friction (https://openstax.org/books/college-physics-2e/pages/5-1-friction)";

/** The Physics Hypertextbook's table, each row with its primary source. */
const ELERT: string =
  "G. Elert, The Physics Hypertextbook, Friction, coefficient table (https://physics.info/friction/)";

/**
 * Friction by material pair: what a part's surface is made of, and the static and kinetic coefficients of each measured pair of materials, each with the source it was read at.
 *
 * A producer declares each touching part's surface (`ArchetypeBuilder.IOptions.surface`) and what the model rests on and on what ground (`ArchetypeBuilder.build`); the archetype's body then carries that pair's coefficients, and `Archetype.friction` gives any declared part's against any material. A pair no source here measured is refused, never guessed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a material and a pair are, who declares them and what is refused.
 * @evidence contracts/development/design.md#principled-representation A closed union of materials and one table keyed by the unordered pair, each row the measured static coefficient (a range where the source gives one), the kinetic one or null where the source gives none, and its citation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The materials the package's producers rest on, hold or stand on, and the pairs among them that a read source measured (#3433, B15 of the archetypes campaign).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default coefficient: an unmeasured pair is refused.
 */
export namespace ArchetypeFriction {
  /**
   * What a surface is made of:
   *
   * - `rubber`: a tyre or a rubber foot.
   * - `wood`: bare wood, including a wooden wheel's rim.
   * - `steel`: steel or iron, including an iron-shod wheel's tyre.
   * - `leather`: leather, as a strap or a grip.
   * - `teflon`: PTFE.
   * - `sole`: a shoe's sole.
   * - `hoof`: a shod hoof, its horseshoe.
   * - `ice`: ice.
   * - `concrete`, `asphalt`, `stone`, `brick`: grounds; `stone` includes cobbles.
   */
  export type Material =
    | "rubber"
    | "wood"
    | "steel"
    | "leather"
    | "teflon"
    | "sole"
    | "hoof"
    | "ice"
    | "concrete"
    | "asphalt"
    | "stone"
    | "brick";

  /** The ground a model's body friction is taken against when its producer names none: concrete, the paving and floor slab most staged ground is, and the ground most measured pairs here share. */
  export const GROUND: Material = "concrete";

  /** One measured pair's coefficients. */
  export interface ICoefficients {
    /** The static coefficient, or the measured range's least and greatest values. */
    static: number | readonly [number, number];

    /** The kinetic coefficient, or its range; null when the source measured none. */
    kinetic: number | readonly [number, number] | null;

    /** Where it was read. */
    source: string;
  }

  /** Every measured pair, keyed by its two materials in alphabetical order joined by `/`. */
  export const PAIRS: Readonly<Record<string, ICoefficients>> = {
    "concrete/rubber": {
      static: 1,
      kinetic: 0.7,
      source: `${OPENSTAX}: rubber on dry concrete`,
    },
    "wood/wood": {
      static: 0.5,
      kinetic: 0.3,
      source: `${OPENSTAX}: wood on wood`,
    },
    "steel/wood": {
      static: 0.5,
      kinetic: 0.3,
      source: `${OPENSTAX}: metal on wood`,
    },
    "steel/steel": {
      static: 0.6,
      kinetic: 0.3,
      source: `${OPENSTAX}: steel on steel, dry`,
    },
    "steel/teflon": {
      static: 0.04,
      kinetic: 0.04,
      source: `${OPENSTAX}: Teflon on steel`,
    },
    "sole/wood": {
      static: 0.9,
      kinetic: 0.7,
      source: `${OPENSTAX}: shoes on wood`,
    },
    "ice/sole": {
      static: 0.1,
      kinetic: 0.05,
      source: `${OPENSTAX}: shoes on ice`,
    },
    "ice/ice": {
      static: 0.1,
      kinetic: 0.03,
      source: `${OPENSTAX}: ice on ice`,
    },
    "ice/steel": {
      static: 0.04,
      kinetic: 0.02,
      source: `${OPENSTAX}: steel on ice`,
    },
    "asphalt/rubber": {
      static: [0.84, 0.98],
      kinetic: 0.72,
      source: `${ELERT}: car tyre on asphalt, after the American Journal of Physics (https://doi.org/10.1119/1.1321812)`,
    },
    "concrete/hoof": {
      static: 0.48,
      kinetic: 0.47,
      source: `${ELERT}: horseshoe on concrete (https://doi.org/10.1017/S1478061506617234)`,
    },
    "asphalt/hoof": {
      static: 0.44,
      kinetic: 0.42,
      source: `${ELERT}: horseshoe on asphalt (https://doi.org/10.1017/S1478061506617234)`,
    },
    "hoof/stone": {
      static: 0.42,
      kinetic: 0.38,
      source: `${ELERT}: horseshoe on cobblestone (https://doi.org/10.1017/S1478061506617234)`,
    },
    "hoof/rubber": {
      static: 0.68,
      kinetic: 0.67,
      source: `${ELERT}: horseshoe on rubber (https://doi.org/10.1017/S1478061506617234)`,
    },
    "steel/stone": {
      static: [0.3, 0.7],
      kinetic: null,
      source: `${ELERT}: iron on stone, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
    "brick/wood": {
      static: 0.6,
      kinetic: null,
      source: `${ELERT}: wood on brick, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
    "stone/wood": {
      static: 0.4,
      kinetic: null,
      source: `${ELERT}: wood on stone, after W. J. M. Rankine, A Manual of Applied Mechanics (1858)`,
    },
    "leather/steel": {
      static: 0.56,
      kinetic: null,
      source: `${ELERT}: leather on metals, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
    "leather/wood": {
      static: [0.27, 0.38],
      kinetic: null,
      source: `${ELERT}: leather on wood, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
  };

  /**
   * The measured coefficients of a pair of materials, in either order.
   *
   * @param a One material.
   * @param b The other.
   * @param archetype The producer asking, which a refusal names.
   * @returns The pair's row.
   * @throws {ArchetypeRefusal} When no source here measured the pair, listing the pairs that were.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order-free lookup and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Coulomb friction between two surfaces is a property of the pair, not of either alone, so the key is the unordered pair.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unmeasured pair is refused rather than given a mean of its materials' other pairs.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function over a constant table.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pair(
    a: Material,
    b: Material,
    archetype: string,
  ): ICoefficients {
    const key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
    const row: ICoefficients | undefined = PAIRS[key];
    if (row === undefined)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "friction",
        value: key,
        feasible: { kind: "alternatives", values: Object.keys(PAIRS) },
        reason: `no source read here measured the friction of ${a} on ${b}`,
        fix: "declare surfaces whose pair a source measured, or read a source for this pair and add its row",
      });
    return row;
  }

  /**
   * A coefficient's single value: itself, or the middle of its measured range.
   *
   * @param value A coefficient or its range.
   * @returns The value.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a range becomes.
   * @evidence contracts/development/implementation.md#principled-implementation A measured range's middle stands for it where one number is carried, as the body's coefficient is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function value(value: number | readonly [number, number]): number {
    return typeof value === "number" ? value : (value[0] + value[1]) / 2;
  }
}
