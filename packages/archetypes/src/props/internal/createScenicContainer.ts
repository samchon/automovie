import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { SCENIC_CONTAINER_BANDS } from "../constants/SCENIC_CONTAINER_BANDS";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import { AutoMovieArchetypeCargoPod } from "../AutoMovieArchetypeCargoPod";
import { AutoMovieArchetypeMoldedCrate } from "../AutoMovieArchetypeMoldedCrate";
import { AutoMovieArchetypePlankCoffer } from "../AutoMovieArchetypePlankCoffer";
import { AutoMovieArchetypeScenicBasket } from "../AutoMovieArchetypeScenicBasket";

/**
 * Replay a saved scenicContainer variant with the original dimensions,
 * identifier and model choices.
 *
 * A saved cargo pod keeps its original single top surface. The named
 * {@link AutoMovieArchetypeCargoPod.create} builds the same geometry and adds the bottom `mount`
 * for stacking, so the saved selector keeps the surface-only construction.
 *
 * @param params The historic selector and optional fixed settings in the
 *   original units.
 * @param seed Draws the omitted settings. Omit it for the original seedless
 *   defaults.
 * @returns The original generated model and its local contacts.
 * @throws {AutoMovieArchetypeRefusal} If the selector or any author setting is
 *   outside its admitted range.
 */
export function createScenicContainer(
  params: createScenicContainer.IParams,
  seed?: number,
): AutoMovieArchetype<
  createScenicContainer.Affordance,
  createScenicContainer.Dimension
> {
  const kind: createScenicContainer.Kind = ArchetypeDraw.choice(
    "scenicContainer",
    "kind",
    params.kind,
    createScenicContainer.KINDS,
  );
  if (kind === "cargoPod")
    return ScenicContainerConstruction.scenicPod(params, seed);

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      Exclude<createScenicContainer.Kind, "cargoPod">,
      (
        params: createScenicContainer.IParams,
        seed?: number,
      ) => AutoMovieArchetype<createScenicContainer.Affordance, createScenicContainer.Dimension>
    >
  > = {
    coilBasket: (p, s) => AutoMovieArchetypeScenicBasket.create({ ...p, kind: "coilBasket" }, s),
    woodenFishBasket: (p, s) => AutoMovieArchetypeScenicBasket.create({ ...p, kind: "woodenFishBasket" }, s),
    plankCoffer: (p, s) => AutoMovieArchetypePlankCoffer.create({ ...p }, s),
    moldedCrate: (p, s) => AutoMovieArchetypeMoldedCrate.create({ ...p }, s),
  };
  return variants[kind](params, seed);
}

/**
 * Silhouettes, sizing and placement vocabulary for
 * {@link createScenicContainer}.
 */
export namespace createScenicContainer {
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
  export const PRODUCERS: Readonly<IProducers> = {
    get coilBasket(): typeof AutoMovieArchetypeScenicBasket.create {
      return AutoMovieArchetypeScenicBasket.create;
    },
    get woodenFishBasket(): typeof AutoMovieArchetypeScenicBasket.create {
      return AutoMovieArchetypeScenicBasket.create;
    },
    get plankCoffer(): typeof AutoMovieArchetypePlankCoffer.create {
      return AutoMovieArchetypePlankCoffer.create;
    },
    get moldedCrate(): typeof AutoMovieArchetypeMoldedCrate.create {
      return AutoMovieArchetypeMoldedCrate.create;
    },
    get cargoPod(): typeof AutoMovieArchetypeCargoPod.create {
      return AutoMovieArchetypeCargoPod.create;
    },
  };

  /** The four historical scene forms and one fictional design. */
  export type Kind =
    | "coilBasket"
    | "woodenFishBasket"
    | "plankCoffer"
    | "moldedCrate"
    | "cargoPod";

  /** The kinds in order from ancient through fictional future. */
  export const KINDS: readonly Kind[] = [
    "coilBasket",
    "woodenFishBasket",
    "plankCoffer",
    "moldedCrate",
    "cargoPod",
  ];

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
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

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
  > = SCENIC_CONTAINER_BANDS;
}
