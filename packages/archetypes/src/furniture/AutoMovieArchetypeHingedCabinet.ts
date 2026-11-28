import { type AutoMovieArchetype } from "../core/index";
import { createHingedCabinet as createHingedCabinetImplementation } from "./internal/createHingedCabinet";
import { type AutoMovieArchetypeStorage } from "./AutoMovieArchetypeStorage";

/** Constructs wardrobes with movable leaves and lockers with resting hinges. */
export namespace AutoMovieArchetypeHingedCabinet {
  /**
   * Build a wardrobe or a single-tier locker.
   *
   * A wardrobe carries a grip on each hinged leaf. A locker exposes a
   * resting hinge and an interior hat shelf. Its door has no authored
   * opening range.
   *
   * @param params Cabinet kind, optional scene ID, fixed dimensions and
   *   optional hinge or body-size choice. Defaults to ID `storage`.
   * @param seed Numeric seed for free dimensions and the model choice.
   *   Omit it for band midpoints, a 95 degree wardrobe hinge or a 12
   *   by 12 inch locker body.
   * @returns The cabinet with its assembled geometry and local contacts.
   * @throws {AutoMovieArchetypeRefusal} If the kind, a model choice or
   *   a fixed dimension is inadmissible.
   * @example
   *   const wardrobe = AutoMovieArchetypeHingedCabinet.create({
   *     kind: "wardrobe", model: "CLIP top 110"
   *   });
   *   const open = wardrobe.articulate({ leftDoor: 90 });
   */
  export function create(params: AutoMovieArchetypeHingedCabinet.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeHingedCabinet.Affordance,
  AutoMovieArchetypeHingedCabinet.Dimension
> {
    return createHingedCabinetImplementation(params, seed);
  }

  /**
   * Cabinet size, locker leg length and wardrobe pull height in metres, empty mass in kilograms and wardrobe swing in degrees.
   */
  export type Dimension =
    | "depth"
    | "height"
    | "legs"
    | "mass"
    | "pullHeight"
    | "swing"
    | "width";

  /**
   * The common `push` and `top`, paired wardrobe door and pull contacts, or a locker's `door` and `shelf1`.
   */
  export type Affordance =
    | "door"
    | "leftDoor"
    | "leftPull"
    | "push"
    | "rightDoor"
    | "rightPull"
    | `shelf${number}`
    | "top";

  /** Selects wardrobe hinge geometry or locker body size. */
  export type IParams = IWardrobeParams | ILockerParams;

  /** Blum CLIP top models with 95 or 110 degrees of wardrobe door travel. */
  export type Hinge = "CLIP top 95" | "CLIP top 110";

  /** Paired width and depth of a Lyon single-tier locker body in inches. */
  export type LockerSize =
    | "12x12"
    | "12x15"
    | "12x18"
    | "15x18"
    | "18x18"
    | "18x21";

  /** Optional scene ID, body height in metres and empty mass in kilograms. */
  export type IBaseParams = Pick<
    AutoMovieArchetypeStorage.IParams,
    "id" | "height" | "mass"
  >;

  /**
   * Wardrobe options including dimensions and a catalogue hinge controlling both door travels.
   */
  export interface IWardrobeParams
    extends
      IBaseParams,
      Pick<AutoMovieArchetypeStorage.IParams, "width" | "depth" | "pullHeight"> {
    /** Selects the two-leaf wardrobe. */
    kind: "wardrobe";

    /**
     * Selects the two doors' shared travel. Defaults to the 95 degree hinge without a seed.
     */
    model?: Hinge;
  }

  /**
   * Single-tier steel locker options. Body width and depth come together from the catalogue size.
   */
  export interface ILockerParams
    extends IBaseParams, Pick<AutoMovieArchetypeStorage.IParams, "legs"> {
    /** Selects the single-tier locker. */
    kind: "locker";

    /**
     * Selects body width by depth in inches. Defaults to the 12 by 12 inch body without a seed.
     */
    model?: LockerSize;
  }

  /** Lists the two kind values accepted by `create`. */
  export const KINDS: readonly IParams["kind"][] = ["wardrobe", "locker"];}
