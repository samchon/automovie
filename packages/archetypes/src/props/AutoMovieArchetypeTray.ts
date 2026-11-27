import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeCarryBasket } from "./AutoMovieArchetypeCarryBasket";
import { AutoMovieArchetypeServingTray } from "./AutoMovieArchetypeServingTray";

/** What no source read gives. */
const UNREAD: string = "the IKEA pages read give no weight of the item alone";

/** Constructs the tray archetype from its recipe. */
export namespace AutoMovieArchetypeTray {
/**
 * Replay a saved tray variant with the original dimensions, identifier and
 * model choices.
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
  params: AutoMovieArchetypeTray.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTray.Affordance, AutoMovieArchetypeTray.Dimension> {
  const kind: AutoMovieArchetypeTray.Kind = ArchetypeDraw.choice(
    "tray",
    "kind",
    params.kind,
    AutoMovieArchetypeTray.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeTray.Kind,
      (
        params: AutoMovieArchetypeTray.IParams,
        seed?: number,
      ) => AutoMovieArchetype<AutoMovieArchetypeTray.Affordance, AutoMovieArchetypeTray.Dimension>
    >
  > = {
    tray: (p, s) => AutoMovieArchetypeServingTray.create({ ...p, model: ArchetypeDraw.admit("tray", "model", p.model, ["smorling", "grilltider", "smula"] as const) }, s),
    basket: (p, s) => AutoMovieArchetypeCarryBasket.create({ ...p, model: ArchetypeDraw.admit("tray", "model", p.model, ["risatorp25", "risatorp42"] as const) }, s),
  };
  return variants[kind](params, seed);
}

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `tray` selector. */
    tray: typeof AutoMovieArchetypeServingTray.create;

    /** The named producer for the saved `basket` selector. */
    basket: typeof AutoMovieArchetypeCarryBasket.create;
  }

  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<IProducers> = {
    get tray(): typeof AutoMovieArchetypeServingTray.create {
      return AutoMovieArchetypeServingTray.create;
    },
    get basket(): typeof AutoMovieArchetypeCarryBasket.create {
      return AutoMovieArchetypeCarryBasket.create;
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

  /**
   * A basket handle's height above the rim, metres: a hand's clearance, an
   * estimate.
   */
  export const CLEARANCE: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `inside`: the floor inside, facing up.
   * - `leftHandle`, `rightHandle`: a tray's short end rims at `+X` and `-X`,
   *   taken from outside.
   * - `handle`: a basket's bar over its middle, along `Z`.
   * - `palm`: a serving tray's flat-hand hold under its floor's centre.
   * - `rest`: a serving tray's socket on its floor's centre, where a glass
   *   stands.
   */
  export type Affordance =
    | "inside"
    | "leftHandle"
    | "rightHandle"
    | "handle"
    | "palm"
    | "rest";

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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
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

  /**
   * The models read: IKEA's SMÖRLING, GRILLTIDER and SMULA trays and its two
   * RISATORP baskets. GOKVÄLLÅ is not built: its page gives no height.
   */
  export type Model =
    | "smorling"
    | "grilltider"
    | "smula"
    | "risatorp25"
    | "risatorp42";

  /**
   * Each kind's models whole, the default first, width x depth x height:
   * SMÖRLING 36 x 20 x 3, GRILLTIDER 40 x 30 x 2 and SMULA 52 x 35 x 3 cm
   * (https://www.ikea.com/gb/en/p/smoerling-serving-tray-set-of-2-beech-10570660/,
   * https://www.ikea.com/gb/en/p/grilltider-serving-tray-stainless-steel-40615153/,
   * https://www.ikea.com/gb/en/p/smula-tray-transparent-40041131/); RISATORP 25
   * x 26 x 18 and 42 x 27 x 23 cm
   * (https://www.ikea.com/au/en/p/risatorp-basket-white-60480544/,
   * https://www.ikea.com/gb/en/p/risatorp-basket-white-20527633/).
   */
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
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    tray: {
      mass: AutoMovieArchetypeBand.of("kg", 0.4, 1, UNREAD, true),
    },
    basket: {
      mass: AutoMovieArchetypeBand.of("kg", 0.3, 0.8, UNREAD, true),
    },
  };
}
