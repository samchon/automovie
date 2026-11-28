import { type AutoMovieArchetype } from "../core/index";
import { createCookingPot as createCookingPotImplementation } from "./internal/createCookingPot";
import { type AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/** Constructs an open steel saucepan or stockpot with usable handles. */
export namespace AutoMovieArchetypeCookingPot {
  /**
   * Build a floor-supported steel cooking vessel with an open top.
   *
   * The saucepan's 0.18 metre grip extends along `+X`. Stockpot grips
   * run along Z on opposite X sides and have two attachments to the
   * walls. Both forms expose an upward rim and supported inner floor.
   *
   * @param params Required saucepan or stockpot kind, optional scene ID
   *   and finite dimensions in its bands. The ID defaults to `vessel`.
   * @param seed Numeric seed for omitted mass. Seedless masses are
   *   1.1 kilograms for the saucepan and 2.4 for the stockpot.
   * @returns The joined pot with its opening, supported inner floor and grips.
   * @throws {AutoMovieArchetypeRefusal} If the kind or fixed value is inadmissible.
   */
  export function create(params: AutoMovieArchetypeCookingPot.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCookingPot.Affordance, AutoMovieArchetypeCookingPot.Dimension> {
    return createCookingPotImplementation(params, seed);
  }

  /**
   * Selects the single-handle saucepan or the stockpot with two attached handles.
   */
  export type Kind = "saucepan" | "stockpot";

  /**
   * Outside vessel span and rim height in metres, and assembled size-specific mass in kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /**
   * Opening `rim` and floor `inside`, plus one `handle` or opposed `leftHandle` and `rightHandle`.
   */
  export type Affordance =
    | "handle"
    | "inside"
    | "leftHandle"
    | "rightHandle"
    | "rim";

  /**
   * Required cooking-pot kind, optional scene ID and finite measurements in that form's bands.
   */
  export interface IParams extends Pick<
    AutoMovieArchetypeVessel.IParams,
    "id" | "diameter" | "height" | "mass"
  > {
    /** Selects `saucepan` for a long handle or `stockpot` for side handles. */
    kind: Kind;
  }

  /** The two cooking-pot shapes in saucepan then stockpot order. */
  export const KINDS: readonly IParams["kind"][] = ["saucepan", "stockpot"];}
