import type {
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  IAutoMovieArchetypeBand,
} from "../core";
import type { AutoMovieArchetypeCargoPod } from "./AutoMovieArchetypeCargoPod";
import type { AutoMovieArchetypeMoldedCrate } from "./AutoMovieArchetypeMoldedCrate";
import type { AutoMovieArchetypePlankCoffer } from "./AutoMovieArchetypePlankCoffer";
import type { AutoMovieArchetypeScenicBasket } from "./AutoMovieArchetypeScenicBasket";
import { createScenicContainer as implementation } from "./internal/createScenicContainer";

/**
 * Replays the saved scenic container shapes and their supported placement sites.
 */
export namespace AutoMovieArchetypeScenicContainer {
  /**
   * Build the scenic container selected by a saved recipe.
   *
   * @param params Saved kind, optional scene ID and finite dimensions
   *   admitted by that form's bands. The default ID is `scenicContainer`.
   * @param seed Numeric seed for omitted values. Omission uses the
   *   midpoint of each selected measurement band.
   * @returns The named shape with its supported lid `top` or open floor
   *   `inside`. The saved cargo pod exposes its cap `top`. The named
   *   CargoPod factory also supplies a bottom mounting socket.
   * @throws {AutoMovieArchetypeRefusal} If the kind or fixed value is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypeScenicContainer.IParams,
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeScenicContainer.Affordance,
    AutoMovieArchetypeScenicContainer.Dimension
  > {
    return implementation(params, seed);
  }

  /** The current named factory signatures associated with saved selectors. */
  export interface IProducers {
    /** The basket producer used with `kind: "coilBasket"`. */
    coilBasket: typeof AutoMovieArchetypeScenicBasket.create;
    /** The basket producer used with `kind: "woodenFishBasket"`. */
    woodenFishBasket: typeof AutoMovieArchetypeScenicBasket.create;
    /** The closed plank coffer producer with an upward lid footprint. */
    plankCoffer: typeof AutoMovieArchetypePlankCoffer.create;
    /** The open ribbed crate producer with a supported inner floor. */
    moldedCrate: typeof AutoMovieArchetypeMoldedCrate.create;
    /** The named cargo pod producer that includes the lower mount. */
    cargoPod: typeof AutoMovieArchetypeCargoPod.create;
  }

  /**
   * The named factory lookup used for authoring and gallery previews, including the mounted cargo pod.
   */
  export const PRODUCERS: Readonly<IProducers> = implementation.PRODUCERS;

  /**
   * Saved selectors for two basket forms, a plank coffer, molded crate and fictional cargo pod.
   */
  export type Kind =
    | "coilBasket"
    | "woodenFishBasket"
    | "plankCoffer"
    | "moldedCrate"
    | "cargoPod";

  /** The five accepted saved selectors in gallery order. */
  export const KINDS: readonly Kind[] = implementation.KINDS;

  /**
   * Supported `top` on a lid or cap, or supported `inside` at the floor of an open form.
   */
  export type Affordance = "top" | "inside";

  /**
   * Exterior width along X, depth along Z and height along Y in metres, and estimated mass in kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Physical units shared by every scenic container recipe. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = implementation.UNITS;

  /**
   * Saved shape, optional scene ID and applicable finite dimensions in the shape's bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the body shape, measurements and applicable support site. */
    kind: Kind;
    /** Scene object ID, defaulting to `scenicContainer`. */
    id?: string;
  }

  /** Illustrative sizing and mass ranges indexed by saved shape. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = implementation.BANDS;
}
