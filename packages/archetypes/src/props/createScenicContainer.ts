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

/** A saved recipe's producer as the dispatcher calls it. */
type Producer = (
  params: createScenicContainer.IParams,
  seed?: number | string,
) => Archetype<
  createScenicContainer.Affordance,
  createScenicContainer.Dimension
>;

/**
 * Replay a saved scenicContainer variant with the original dimensions, identifier and model choices.
 *
 * A saved cargo pod keeps its original single top surface. The named
 * {@link createCargoPod} builds the same geometry and adds the bottom `mount`
 * for stacking, so the saved selector keeps the surface-only construction.
 *
 * @param params The historic selector and optional fixed settings in the original units.
 * @param seed Draws the omitted settings. Omit it for the original seedless defaults.
 * @returns The original generated model and its local contacts.
 * @throws {ArchetypeRefusal} If the selector or any author setting is outside its admitted range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Replay a saved scenicContainer variant with the original dimensions, identifier and model choices, and the cargo pod's retained contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Validate the saved selector and call its named producer, which runs the original shape construction in the scenicContainer draw namespace. A saved cargo pod runs the shared pod construction without the added mount.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Dispatch one checked selector through the public producer table, except the saved cargo pod whose contact set differs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pass author inputs through to the same dimension and model checks.
 * @evidence contracts/development/implementation.md#efficient-algorithms One table lookup followed by the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls are the same producer with the same seed data. The cargo pod's two paths share its geometry construction and draw.
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
  if (kind === "cargoPod")
    return ScenicContainerConstruction.scenicPod(params, seed);

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  const produce: Producer = createScenicContainer.PRODUCERS[kind] as Producer;
  return produce(params, seed);
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
  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `coilBasket` selector. */
    coilBasket: typeof createScenicBasket;

    /** The named producer for the saved `woodenFishBasket` selector. */
    woodenFishBasket: typeof createScenicBasket;

    /** The named producer for the saved `plankCoffer` selector. */
    plankCoffer: typeof createPlankCoffer;

    /** The named producer for the saved `moldedCrate` selector. */
    moldedCrate: typeof createMoldedCrate;

    /** The named producer for the saved `cargoPod` selector. */
    cargoPod: typeof createCargoPod;
  }

  /** The named producer for each saved selector, resolved on demand. A saved cargo pod keeps its surface-only contacts, so its entry names the producer the gallery opens. */
  export const PRODUCERS: Readonly<IProducers> = {
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
