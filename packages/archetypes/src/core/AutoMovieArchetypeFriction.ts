import { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/**
 * Friction by material pair: what a part's surface is made of, and the static
 * and kinetic coefficients of each measured pair of materials, each with the
 * source it was read at.
 *
 * A producer declares each touching part's surface
 * (`AutoMovieArchetypeBuilder.IOptions.surface`) and what the model rests on
 * and on what ground (`AutoMovieArchetypeBuilder.build`); the archetype's body
 * then carries that pair's coefficients, and `AutoMovieArchetype.friction`
 * gives any declared part's against any material. A pair no source here
 * measured is refused, never guessed.
 */
export namespace AutoMovieArchetypeFriction {
  /**
   * The refusal for a part whose surface its producer did not declare.
   *
   * @param archetype The producer's name.
   * @param owner The archetype's name or id.
   * @param part The part named.
   * @param surfaces The surfaces the producer declared, by part.
   * @returns The refusal to throw, listing the parts that do declare one.
   */
  export function undeclared(
    archetype: string,
    owner: string,
    part: string,
    surfaces: Readonly<Record<string, unknown>>,
  ): AutoMovieArchetypeRefusal {
    return new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "surface",
      value: part,
      feasible: { kind: "alternatives", values: Object.keys(surfaces) },
      reason: `${owner} declares no surface for its part "${part}"`,
      fix: "name a part whose surface the producer declares",
    });
  }

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

  /**
   * The ground a model's body friction is taken against when its producer names
   * none: concrete, the paving and floor slab most staged ground is, and the
   * ground most measured pairs here share.
   */
  export const GROUND: Material = "concrete";

  /** One measured pair's coefficients. */
  export type ICoefficients = AutoMovieArchetypeMaterial.IFriction;

  /** A coefficient's measured or authored minimum and maximum. */
  export interface IRange {
    /** Smallest coefficient. */
    readonly minimum: number;

    /** Largest coefficient. */
    readonly maximum: number;
  }

  /**
   * Every measured pair, keyed by its two materials in alphabetical order
   * joined by `/`.
   */
  export const PAIRS: Readonly<Record<string, ICoefficients>> =
    AutoMovieArchetypeMaterial.FRICTION;

  /**
   * The measured coefficients of a pair of materials, in either order.
   *
   * @param a One material.
   * @param b The other.
   * @param archetype The producer asking, which a refusal names.
   * @returns The pair's row.
   * @throws {AutoMovieArchetypeRefusal} When no source here measured the pair,
   *   listing the pairs that were.
   */
  export function pair(
    a: Material,
    b: Material,
    archetype: string,
  ): ICoefficients {
    return AutoMovieArchetypeMaterial.friction(a, b, archetype);
  }

  /**
   * A coefficient's single value: itself, or the middle of its measured range.
   *
   * @param value A coefficient or its range, with named minimum and maximum.
   * @returns The value.
   */
  export function value(value: number | IRange): number {
    return typeof value === "number"
      ? value
      : (value.minimum + value.maximum) / 2;
  }
}
