import {
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { STORAGE_BANDS } from "./constants/STORAGE_BANDS";
import { AutoMovieArchetypeBookcase } from "./AutoMovieArchetypeBookcase";
import { AutoMovieArchetypeDrawerUnit } from "./AutoMovieArchetypeDrawerUnit";
import { AutoMovieArchetypeHingedCabinet } from "./AutoMovieArchetypeHingedCabinet";
import type { IArchetypeDispatch } from "../core/internal/IArchetypeDispatch";

/** Replays saved storage selectors through the named furniture producers. */
export namespace AutoMovieArchetypeStorage {
/**
 * Replay a saved wardrobe, chest, filing cabinet, locker or bookcase.
 *
 * The selected producer uses the same draw namespace as the saved recipe.
 * All variants expose `push` and `top` in the model's floor-based frame.
 *
 * @param params Saved kind, optional scene ID and optional applicable
 *   dimensions or catalogue choice. Defaults to ID `storage`.
 * @param seed Numeric seed for free dimensions and catalogue choices. Omit
 *   it for band midpoints and the first available catalogue entry.
 * @returns The selected storage model with its geometry and kind-specific
 *   motion contacts.
 * @throws {AutoMovieArchetypeRefusal} If the chosen kind, a supplied model
 *   or a fixed known dimension is inadmissible for that kind.
 * @example
 *   const cabinet = AutoMovieArchetypeStorage.create({ kind: "locker" });
 *   const hatShelf = cabinet.affordance("shelf1");
 */
export function create(
  params: AutoMovieArchetypeStorage.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStorage.Affordance, AutoMovieArchetypeStorage.Dimension> {
  const kind: AutoMovieArchetypeStorage.Kind = ArchetypeDraw.choice(
    "storage",
    "kind",
    params.kind,
    AutoMovieArchetypeStorage.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeStorage.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeStorage.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeStorage.Affordance, AutoMovieArchetypeStorage.Dimension>
      >
    >
  > = {
    wardrobe: { build: AutoMovieArchetypeHingedCabinet.create },
    chest: { build: AutoMovieArchetypeDrawerUnit.create },
    filingCabinet: { build: AutoMovieArchetypeDrawerUnit.create },
    locker: { build: AutoMovieArchetypeHingedCabinet.create },
    bookcase: { build: AutoMovieArchetypeBookcase.create },
  };
  return variants[kind].build(params, seed);
}

  /** Maps each saved kind to its current authoring factory. */
  export interface IProducers {
    /** The hinged factory accepting the `wardrobe` options. */
    wardrobe: typeof AutoMovieArchetypeHingedCabinet.create;

    /** The drawer factory accepting the `chest` options. */
    chest: typeof AutoMovieArchetypeDrawerUnit.create;

    /** The drawer factory accepting the `filingCabinet` options. */
    filingCabinet: typeof AutoMovieArchetypeDrawerUnit.create;

    /** The hinged factory accepting the `locker` options. */
    locker: typeof AutoMovieArchetypeHingedCabinet.create;

    /** The open bookcase factory with optional body and mass settings. */
    bookcase: typeof AutoMovieArchetypeBookcase.create;
  }

  /**
   * Maps each saved kind to the existing named producer function. Call the selected factory with that producer's params.
   */
  export const PRODUCERS: Readonly<IProducers> = {
    get wardrobe(): typeof AutoMovieArchetypeHingedCabinet.create {
      return AutoMovieArchetypeHingedCabinet.create;
    },
    get chest(): typeof AutoMovieArchetypeDrawerUnit.create {
      return AutoMovieArchetypeDrawerUnit.create;
    },
    get filingCabinet(): typeof AutoMovieArchetypeDrawerUnit.create {
      return AutoMovieArchetypeDrawerUnit.create;
    },
    get locker(): typeof AutoMovieArchetypeHingedCabinet.create {
      return AutoMovieArchetypeHingedCabinet.create;
    },
    get bookcase(): typeof AutoMovieArchetypeBookcase.create {
      return AutoMovieArchetypeBookcase.create;
    },
  };

  /** Selects hinged, sliding or open geometry for a saved storage recipe. */
  export type Kind =
    | "wardrobe"
    | "chest"
    | "filingCabinet"
    | "locker"
    | "bookcase";

  /** Lists the saved kind values accepted by `create`. */
  export const KINDS: readonly Kind[] = [
    "wardrobe",
    "chest",
    "filingCabinet",
    "locker",
    "bookcase",
  ];

  /**
   * Contact names used across all saved storage kinds.
   *
   * All kinds expose the `+X` side `push` surface and the upper `top`
   * surface. Wardrobes expose `leftDoor` on the `+X` hinge edge,
   * `rightDoor` on the `-X` edge and their carried `leftPull` and
   * `rightPull` grips. Chests expose three drawers and three carried pulls.
   * Filing cabinets expose four drawers. Drawer IDs start at `drawer1`
   * from the bottom and travel along model `+Z`. Locker `door` gives a
   * resting hinge at the `-X` edge with no authored travel. Each bookcase
   * has `shelf1` to `shelf5` from the bottom. Locker `shelf1` is its hat
   * shelf. Shelf contacts are `stack-top` surfaces.
   */
  export type Affordance =
    | "push"
    | "top"
    | "leftDoor"
    | "rightDoor"
    | "leftPull"
    | "rightPull"
    | "door"
    | `drawer${number}`
    | `pull${number}`
    | `shelf${number}`;

  /**
   * Dimension names reported by the selected storage kind.
   *
   * `width`, `height` and `depth` span model X, Y and Z in metres. The
   * locker body's `height` excludes `legs`. `pullHeight` is the wardrobe
   * grip height above the floor. `travel` is drawer displacement in
   * metres. `swing` is the wardrobe hinge travel in degrees. `mass` is
   * the empty unit's mass in kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "pullHeight"
    | "swing"
    | "travel"
    | "legs"
    | "mass";

  /**
   * Gives the unit for each dimension in the bands, catalogue figures and provenance.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    pullHeight: "m",
    swing: "degrees",
    travel: "m",
    legs: "m",
    mass: "kg",
  };

  /**
   * Catalogue choices by saved storage kind.
   *
   * Wardrobes select a Blum CLIP top hinge angle. Chests select an
   * Accuride 3832E drawer slide length. Lockers select a Lyon body width
   * and depth in inches. Filing cabinets and bookcases use their bands.
   */
  export type Model =
    | "CLIP top 95"
    | "CLIP top 110"
    | "3832-E12"
    | "3832-E14"
    | "3832-E16"
    | "12x12"
    | "12x15"
    | "12x18"
    | "15x18"
    | "18x18"
    | "18x21";

  /**
   * Saved storage recipe with the kind and optional fixed dimensions.
   *
   * Use a dimension listed in the selected kind's `BANDS` row. Supply
   * the model name for catalogue-owned figures such as drawer travel
   * on a chest or locker width and depth.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "swing">, number>
  > {
    /** Chooses the saved construction, catalogue and applicable dimensions. */
    kind: Kind;

    /**
     * Selects a wardrobe hinge, a chest slide or a locker width by depth.
     * When omitted, the seed selects one of that kind's models. A seedless
     * draw uses `CLIP top 95`, `3832-E12` or `12x12`, respectively.
     */
    model?: Model;

    /** Scene object ID for the generated model. Defaults to `storage`. */
    id?: string;
  }

  /**
   * Lists the applicable fixed or drawn dimensions by kind. Catalogue-owned figures come from the selected model.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = STORAGE_BANDS;
}
