import type { AutoMovieArchetype, AutoMovieArchetypeDrawSession, IAutoMovieArchetypeBand } from "../core";
import { createScenicContainer as implementation } from "./internal/createScenicContainer";
import type { AutoMovieArchetypeMoldedCrate } from "./AutoMovieArchetypeMoldedCrate";
import type { AutoMovieArchetypePlankCoffer } from "./AutoMovieArchetypePlankCoffer";
import type { AutoMovieArchetypeScenicBasket } from "./AutoMovieArchetypeScenicBasket";

/** Public scenic-container producer and its authoring vocabulary. */
export namespace AutoMovieArchetypeScenicContainer {
  /**
   * Replay a saved scenicContainer variant with the original dimensions,
   * identifier and model choices.
   *
   * A saved cargo pod keeps its original single top surface. The named
   * `AutoMovieArchetypeCargoPod.create` builds the same geometry and adds
   * the bottom `mount` for stacking, so the saved selector keeps the
   * surface-only construction.
   *
   * @param params The historic selector and optional fixed settings in the
   *   original units.
   * @param seed Draws the omitted settings. Omit it for the original seedless
   *   defaults.
   * @returns The original generated model and its local contacts.
   * @throws {AutoMovieArchetypeRefusal} If the selector or any author setting is
   *   outside its admitted range.
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

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `coilBasket` selector. */
    coilBasket: typeof AutoMovieArchetypeScenicBasket.create;
    /** The named producer for the saved `woodenFishBasket` selector. */
    woodenFishBasket: typeof AutoMovieArchetypeScenicBasket.create;
    /** The named producer for the saved `plankCoffer` selector. */
    plankCoffer: typeof AutoMovieArchetypePlankCoffer.create;
    /** The named producer for the saved `moldedCrate` selector. */
    moldedCrate: typeof AutoMovieArchetypeMoldedCrate.create;
    /** The named producer for the saved `cargoPod` selector. */
    cargoPod: typeof AutoMovieArchetypeCargoPod.create;
  }

  /**
   * The named producer for each saved selector, resolved on demand. A saved
   * cargo pod keeps its surface-only contacts, so its entry names the producer
   * the gallery opens.
   */
  export const PRODUCERS: Readonly<IProducers> = implementation.PRODUCERS;

  /** The four historical scene forms and one fictional design. */
  export type Kind =
    | "coilBasket"
    | "woodenFishBasket"
    | "plankCoffer"
    | "moldedCrate"
    | "cargoPod";

  /** The kinds in order from ancient through fictional future. */
  export const KINDS: readonly Kind[] = implementation.KINDS;

  /** The closed lid or the floor of an open container, respectively. */
  export type Affordance = "top" | "inside";

  /**
   * Overall width along X, depth along Z, height along Y in metres, and
   * estimated prop mass in kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Units used by the dimension draw. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = implementation.UNITS;

  /** A selected silhouette and optional fixed members of its dimension bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The selected silhouette. */
    kind: Kind;
    /** The model id in the scene. Defaults to scenicContainer. */
    id?: string;
  }

  /** Illustrative sizing bands and their sources by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = implementation.BANDS;
}