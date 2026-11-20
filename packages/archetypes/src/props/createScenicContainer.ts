import {
  Archetype,
  ArchetypeDraw,
  ArchetypeDrawSession,
  type IArchetypeBand,
} from "../core";
import { SCENIC_CONTAINER_BANDS } from "./SCENIC_CONTAINER_BANDS";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import { createCargoPod } from "./createCargoPod";
import { createMoldedCrate } from "./createMoldedCrate";
import { createPlankCoffer } from "./createPlankCoffer";
import { createScenicBasket } from "./createScenicBasket";

/** The canonical constructions for persisted scenicContainer selectors. */
const PRODUCERS: Readonly<
  Record<
    createScenicContainer.Kind,
    (
      params: createScenicContainer.IParams,
      seed?: number | string,
    ) => Archetype<
      createScenicContainer.Affordance,
      createScenicContainer.Dimension
    >
  >
> = {
  coilBasket: (params, seed) =>
    ScenicContainerConstruction.baskets("coilBasket", params, seed),
  woodenFishBasket: (params, seed) =>
    ScenicContainerConstruction.baskets("woodenFishBasket", params, seed),
  plankCoffer: (params, seed) =>
    ScenicContainerConstruction.closedCoffer(params, seed),
  moldedCrate: (params, seed) =>
    ScenicContainerConstruction.openCrate(params, seed),
  cargoPod: (params, seed) =>
    ScenicContainerConstruction.scenicPod(params, seed),
};

/**
 * Replay a saved scenicContainer variant with the original dimensions, identifier and model choices.
 *
 * @param params The historic selector and optional fixed settings in the original units.
 * @param seed Draws the omitted settings. Omit it for the original seedless defaults.
 * @returns The original generated model and its local contacts.
 * @throws {ArchetypeRefusal} If the selector or any author setting is outside its admitted range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Replay a saved scenicContainer variant with the original dimensions, identifier and model choices.
 * @evidence contracts/development/implementation.md#principled-implementation Validate the saved selector and run its original shape construction in the scenicContainer draw namespace.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Dispatch one checked selector through the table. Each construction owns its named geometry and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pass author inputs through to the same dimension and model checks.
 * @evidence contracts/development/implementation.md#efficient-algorithms One table lookup followed by the selected construction.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares each construction and its seed data with the named producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createScenicContainer(
  params: createScenicContainer.IParams,
  seed?: number | string,
): Archetype<
  createScenicContainer.Affordance,
  createScenicContainer.Dimension
> {
  const kind: createScenicContainer.Kind = ArchetypeDraw.choice(
    "scenicContainer",
    "kind",
    params.kind,
    createScenicContainer.KINDS,
  );
  return PRODUCERS[kind](params, seed);
}

/**
 * Silhouettes, sizing and placement vocabulary for {@link createScenicContainer}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies dimensions, local axes and which surface exists on each silhouette.
 * @evidence contracts/development/design.md#principled-representation A closed silhouette union draws one band per dimension and each kind declares one real support.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The props producer owns the shape and uses the standard archetype surface contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Illustrative bands carry provenance and the fictional kind is identified as such.
 */
export namespace createScenicContainer {
  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<{
    coilBasket: typeof createScenicBasket;
    woodenFishBasket: typeof createScenicBasket;
    plankCoffer: typeof createPlankCoffer;
    moldedCrate: typeof createMoldedCrate;
    cargoPod: typeof createCargoPod;
  }> = {
    get coilBasket(): typeof createScenicBasket {
      return createScenicBasket;
    },
    get woodenFishBasket(): typeof createScenicBasket {
      return createScenicBasket;
    },
    get plankCoffer(): typeof createPlankCoffer {
      return createPlankCoffer;
    },
    get moldedCrate(): typeof createMoldedCrate {
      return createMoldedCrate;
    },
    get cargoPod(): typeof createCargoPod {
      return createCargoPod;
    },
  };

  /**
   * The four historical scene forms and one fictional design.
   */
  export type Kind =
    | "coilBasket"
    | "woodenFishBasket"
    | "plankCoffer"
    | "moldedCrate"
    | "cargoPod";

  /**
   * The kinds in order from ancient through fictional future.
   */
  export const KINDS: readonly Kind[] = [
    "coilBasket",
    "woodenFishBasket",
    "plankCoffer",
    "moldedCrate",
    "cargoPod",
  ];

  /**
   * The closed lid or the floor of an open container, respectively.
   */
  export type Affordance = "top" | "inside";

  /**
   * Overall width along X, depth along Z, height along Y in metres, and estimated prop mass in kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /**
   * Units used by the dimension draw.
   */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * A selected silhouette and optional fixed members of its dimension bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The selected silhouette. */
    kind: Kind;

    /** The model id in the scene. Defaults to scenicContainer. */
    id?: string;
  }

  /**
   * Illustrative sizing bands and their sources by kind.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = SCENIC_CONTAINER_BANDS;
}
