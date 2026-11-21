import { ArchetypeMaterial } from "./ArchetypeMaterial";

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
   * - `felt`: a tennis ball's felt cover.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each material.
   * @evidence contracts/development/design.md#principled-representation A closed union of the materials the measured pairs name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; what a part's surface and a body's rest and ground name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
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
    | "brick"
    | "felt";

  /** The ground a model's body friction is taken against when its producer names none: concrete, the paving and floor slab most staged ground is, and the ground most measured pairs here share. */
  export const GROUND: Material = "concrete";

  /**
   * One measured pair's coefficients.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The static and kinetic coefficients as the measurement gives them, a value or a range.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Aliases the shared material catalogue's one friction-record shape, used by builder and part queries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported pairs and missing kinetic measurements remain explicit; this alias adds no duplicate coefficients.
   */
  export type ICoefficients = ArchetypeMaterial.IFriction;

  /** Every measured pair, keyed by its two materials in alphabetical order joined by `/`. */
  export const PAIRS: Readonly<Record<string, ICoefficients>> =
    ArchetypeMaterial.FRICTION;

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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to the shared physical material catalogue's unordered lookup.
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
    return ArchetypeMaterial.friction(a, b, archetype);
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
