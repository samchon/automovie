import {
  Archetype,
  ArchetypeBand,
  ArchetypeDraw,
  ArchetypeDrawSession,
  type IArchetypeBand,
} from "../core";
import { createCarryBasket } from "./createCarryBasket";
import { createServingTray } from "./createServingTray";

/** What no source read gives. */
const UNREAD: string = "the IKEA pages read give no weight of the item alone";

/** A saved recipe's producer as the dispatcher calls it. */
type Producer = (
  params: createTray.IParams,
  seed?: number | string,
) => Archetype<createTray.Affordance, createTray.Dimension>;

/**
 * Replay a saved tray variant with the original dimensions, identifier and model choices.
 *
 * @param params The historic selector and optional fixed settings in the original units.
 * @param seed Draws the omitted settings. Omit it for the original seedless defaults.
 * @returns The original generated model and its local contacts.
 * @throws {ArchetypeRefusal} If the selector or any author setting is outside its admitted range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Replay a saved tray variant with the original dimensions, identifier and model choices.
 * @evidence contracts/development/implementation.md#principled-implementation Validate the saved selector and call its named producer, which runs the original shape construction in the tray draw namespace.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Dispatch one checked selector through the public producer table. Each named producer owns its geometry and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pass author inputs through to the same dimension and model checks.
 * @evidence contracts/development/implementation.md#efficient-algorithms One table lookup followed by the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls are the same producer with the same seed data.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createTray(
  params: createTray.IParams,
  seed?: number | string,
): Archetype<createTray.Affordance, createTray.Dimension> {
  const kind: createTray.Kind = ArchetypeDraw.choice(
    "tray",
    "kind",
    params.kind,
    createTray.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  const produce: Producer = createTray.PRODUCERS[kind] as Producer;
  return produce(params, seed);
}

/**
 * Companion types, constants and bands of {@link createTray}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two carriers and one band per dimension each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The floor things are set on and the holds it is carried by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sizes are the products' as read; their weights are not given, so the mass bands are provisional; the wall's and the handle's sizes are named estimates.
 */
export namespace createTray {
  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<{
    tray: typeof createServingTray;
    basket: typeof createCarryBasket;
  }> = {
    get tray(): typeof createServingTray {
      return createServingTray;
    },
    get basket(): typeof createCarryBasket {
      return createCarryBasket;
    },
  };

  /** The kinds. */
  export type Kind = "tray" | "basket";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["tray", "basket"];

  /** The floor's and the walls' thickness, metres: an estimate. */
  export const WALL: number = 0.012;

  /** A basket handle's diameter, metres: an estimate. */
  export const GRIP: number = 0.025;

  /** A basket handle's height above the rim, metres: a hand's clearance, an estimate. */
  export const CLEARANCE: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `inside`: the floor inside, facing up.
   * - `leftHandle`, `rightHandle`: a tray's short end rims at `+X` and `-X`, taken from outside.
   * - `handle`: a basket's bar over its middle, along `Z`.
   */
  export type Affordance = "inside" | "leftHandle" | "rightHandle" | "handle";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: along `X`.
   * - `depth`: along `Z`.
   * - `height`: the walls' top above the base.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /** The kind's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `tray` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The models read: IKEA's SMÖRLING, GRILLTIDER and SMULA trays and its two RISATORP baskets. GOKVÄLLÅ is not built: its page gives no height. */
  export type Model =
    | "smorling"
    | "grilltider"
    | "smula"
    | "risatorp25"
    | "risatorp42";

  /** Each kind's models whole, the default first, width x depth x height: SMÖRLING 36 x 20 x 3, GRILLTIDER 40 x 30 x 2 and SMULA 52 x 35 x 3 cm (https://www.ikea.com/gb/en/p/smoerling-serving-tray-set-of-2-beech-10570660/, https://www.ikea.com/gb/en/p/grilltider-serving-tray-stainless-steel-40615153/, https://www.ikea.com/gb/en/p/smula-tray-transparent-40041131/); RISATORP 25 x 26 x 18 and 42 x 27 x 23 cm (https://www.ikea.com/au/en/p/risatorp-basket-white-60480544/, https://www.ikea.com/gb/en/p/risatorp-basket-white-20527633/). */
  export const MODELS: Readonly<
    Record<Kind, Readonly<Partial<Record<Model, Figures>>>>
  > = {
    tray: {
      smorling: { width: 0.36, depth: 0.2, height: 0.03 },
      grilltider: { width: 0.4, depth: 0.3, height: 0.02 },
      smula: { width: 0.52, depth: 0.35, height: 0.03 },
    },
    basket: {
      risatorp25: { width: 0.25, depth: 0.26, height: 0.18 },
      risatorp42: { width: 0.42, depth: 0.27, height: 0.23 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    tray: {
      mass: ArchetypeBand.of("kg", 0.4, 1, UNREAD, true),
    },
    basket: {
      mass: ArchetypeBand.of("kg", 0.3, 0.8, UNREAD, true),
    },
  };
}
