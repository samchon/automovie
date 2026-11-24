import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { createStorage } from "./createStorage";

/**
 * A wardrobe with movable leaves or a locker with a resting hinge frame.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createHingedCabinet(
  params: createHingedCabinet.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createHingedCabinet.Affordance,
  createHingedCabinet.Dimension
> {
  return StorageMechanisms.hinged(
    ArchetypeDraw.choice(
      "storage",
      "kind",
      params.kind,
      createHingedCabinet.KINDS,
    ),
    params,
    seed,
  );
}

/** The authorable settings and local contact IDs of {@link createHingedCabinet}. */
export namespace createHingedCabinet {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "depth"
    | "height"
    | "legs"
    | "mass"
    | "pullHeight"
    | "swing"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "door"
    | "leftDoor"
    | "leftPull"
    | "push"
    | "rightDoor"
    | "rightPull"
    | `shelf${number}`
    | "top";

  /** The admitted settings and optional model ID. */
  export type IParams = IWardrobeParams | ILockerParams;

  /** The read hinge angles a wardrobe may carry. */
  export type Hinge = "CLIP top 95" | "CLIP top 110";

  /** The read locker body sizes, width by depth in inches. */
  export type LockerSize =
    | "12x12"
    | "12x15"
    | "12x18"
    | "15x18"
    | "18x18"
    | "18x21";

  /** The settings both hinged cabinets share. */
  export type IBaseParams = Pick<
    createStorage.IParams,
    "id" | "height" | "mass"
  >;

  /** A wardrobe with its choice of hinge. */
  export interface IWardrobeParams
    extends
      IBaseParams,
      Pick<createStorage.IParams, "width" | "depth" | "pullHeight"> {
    /** A wardrobe. */
    kind: "wardrobe";

    /** The read hinge angle, drawn from the seed when absent. */
    model?: Hinge;
  }

  /** A steel locker with its choice of body size. */
  export interface ILockerParams
    extends IBaseParams, Pick<createStorage.IParams, "legs"> {
    /** A steel locker. */
    kind: "locker";

    /** The read width by depth designation in inches, drawn when absent. */
    model?: LockerSize;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["wardrobe", "locker"];
}
