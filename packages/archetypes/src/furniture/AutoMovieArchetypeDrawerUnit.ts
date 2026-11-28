import { type AutoMovieArchetype } from "../core/index";
import { createDrawerUnit as createDrawerUnitImplementation } from "./internal/createDrawerUnit";
import { type AutoMovieArchetypeStorage } from "./AutoMovieArchetypeStorage";

/** Constructs chests and filing cabinets with separately sliding drawers. */
export namespace AutoMovieArchetypeDrawerUnit {
  /**
   * Build a three-drawer chest or a four-drawer filing cabinet.
   *
   * Drawers start at `drawer1` at the bottom and move along model `+Z`.
   * Each chest pull moves with its drawer. Both variants expose side
   * `push` and upper `top` surfaces.
   *
   * @param params Unit kind, optional scene ID and the applicable dimensions
   *   or chest slide model. Defaults to ID `storage`.
   * @param seed Numeric seed for free dimensions and the chest slide model.
   *   Omit it for band midpoints and the 12 inch chest slide.
   * @returns The drawer unit with its drawer mechanisms and contacts.
   * @throws {AutoMovieArchetypeRefusal} If the variant, catalogue choice or
   *   a fixed dimension is inadmissible.
   * @example
   *   const chest = AutoMovieArchetypeDrawerUnit.create({ kind: "chest" });
   *   const open = chest.articulate({ drawer1: 0.15 });
   */
  export function create(params: AutoMovieArchetypeDrawerUnit.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeDrawerUnit.Affordance, AutoMovieArchetypeDrawerUnit.Dimension> {
    return createDrawerUnitImplementation(params, seed);
  }

  /**
   * Width, height, depth and drawer travel in metres and empty mass in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "travel" | "width";

  /**
   * Side `push`, upper `top` and bottom-up `drawer1` onward. A chest also has one carried `pull` per drawer.
   */
  export type Affordance = "push" | "top" | `drawer${number}` | `pull${number}`;

  /**
   * Selects a chest's slide option or a filing cabinet's full-suspension geometry.
   */
  export type IParams = IChestParams | IFilingCabinetParams;

  /**
   * Accuride 3832E choices providing 12, 14 or 16 inches of chest drawer travel.
   */
  export type Slide = "3832-E12" | "3832-E14" | "3832-E16";

  /**
   * Optional scene ID, body width, depth and height in metres, and mass in kilograms.
   */
  export type IBaseParams = Pick<
    AutoMovieArchetypeStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;

  /**
   * Builds a three-drawer chest with carried pull grips and catalogue-controlled travel.
   */
  export interface IChestParams extends IBaseParams {
    /** Selects the three-drawer chest. */
    kind: "chest";

    /**
     * Selects the Accuride slide and its travel. Defaults to the 12 inch slide without a seed.
     */
    model?: Slide;
  }

  /**
   * Builds the four-drawer HON 510 body. Its `travel` band equals 23.5 inches.
   */
  export interface IFilingCabinetParams
    extends IBaseParams, Pick<AutoMovieArchetypeStorage.IParams, "travel"> {
    /** Selects the four-drawer filing cabinet. */
    kind: "filingCabinet";
  }

  /** Lists the two kind values accepted by `create`. */
  export const KINDS: readonly IParams["kind"][] = ["chest", "filingCabinet"];}
