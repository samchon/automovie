import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeAshtray } from "./AutoMovieArchetypeAshtray";
import { AutoMovieArchetypeBowl } from "./AutoMovieArchetypeBowl";
import { AutoMovieArchetypeCookingPot } from "./AutoMovieArchetypeCookingPot";
import { AutoMovieArchetypeVase } from "./AutoMovieArchetypeVase";
import * as AutoMovieArchetypeVesselData from "./internal/AutoMovieArchetypeVesselData";

/** Constructs the vessel archetype from its recipe. */
export namespace AutoMovieArchetypeVessel {
/**
 * Replay a saved vessel variant with the original dimensions, identifier and
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
  params: AutoMovieArchetypeVessel.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeVessel.Affordance, AutoMovieArchetypeVessel.Dimension> {
  const kind: AutoMovieArchetypeVessel.Kind = ArchetypeDraw.choice(
    "vessel",
    "kind",
    params.kind,
    AutoMovieArchetypeVessel.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeVessel.Kind,
      (
        params: AutoMovieArchetypeVessel.IParams,
        seed?: number,
      ) => AutoMovieArchetype<AutoMovieArchetypeVessel.Affordance, AutoMovieArchetypeVessel.Dimension>
    >
  > = {
    bowl: (p, s) => AutoMovieArchetypeBowl.create({ ...p, model: ArchetypeDraw.admit("vessel", "model", p.model, ["ikea365", "sunnyDay18", "sunnyDayCereal"] as const) }, s),
    ashtray: (p, s) => AutoMovieArchetypeAshtray.create({ ...p, model: ArchetypeDraw.admit("vessel", "model", p.model, ["nachtmann", "harris"] as const) }, s),
    saucepan: ({ model: _model, ...rest }, s) => AutoMovieArchetypeCookingPot.create({ ...rest, kind: "saucepan" }, s),
    stockpot: ({ model: _model, ...rest }, s) => AutoMovieArchetypeCookingPot.create({ ...rest, kind: "stockpot" }, s),
    vase: ({ model: _model, ...rest }, s) => AutoMovieArchetypeVase.create(rest, s),
  };
  return variants[kind](params, seed);
}

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `bowl` selector. */
    bowl: typeof AutoMovieArchetypeBowl.create;

    /** The named producer for the saved `ashtray` selector. */
    ashtray: typeof AutoMovieArchetypeAshtray.create;

    /** The named producer for the saved `saucepan` selector. */
    saucepan: typeof AutoMovieArchetypeCookingPot.create;

    /** The named producer for the saved `stockpot` selector. */
    stockpot: typeof AutoMovieArchetypeCookingPot.create;

    /** The named producer for the saved `vase` selector. */
    vase: typeof AutoMovieArchetypeVase.create;
  }

  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<IProducers> = {
    get bowl(): typeof AutoMovieArchetypeBowl.create {
      return AutoMovieArchetypeBowl.create;
    },
    get ashtray(): typeof AutoMovieArchetypeAshtray.create {
      return AutoMovieArchetypeAshtray.create;
    },
    get saucepan(): typeof AutoMovieArchetypeCookingPot.create {
      return AutoMovieArchetypeCookingPot.create;
    },
    get stockpot(): typeof AutoMovieArchetypeCookingPot.create {
      return AutoMovieArchetypeCookingPot.create;
    },
    get vase(): typeof AutoMovieArchetypeVase.create {
      return AutoMovieArchetypeVase.create;
    },
  };

  /** The kinds. */
  export type Kind = "bowl" | "ashtray" | "saucepan" | "stockpot" | "vase";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "bowl",
    "ashtray",
    "saucepan",
    "stockpot",
    "vase",
  ];

  /** The wall's and the floor's thickness, metres: an estimate. */
  export const WALL: number = 0.005;

  /** A handle's diameter, metres: an estimate. */
  export const GRIP: number = 0.025;

  /**
   * A saucepan handle's length, metres: the IKEA saucepan's 35 cm with its
   * handle less its 17 cm across.
   */
  export const HANDLE: number = 0.18;

  /** Each kind's flat colour, sRGB. */
  export const COLORS: Readonly<Record<Kind, string>> = {
    bowl: "#f2efe8",
    ashtray: "#8fa3ad",
    saucepan: "#b9bcc0",
    stockpot: "#b9bcc0",
    vase: "#a9c8d8",
  };

  /**
   * The affordance ids:
   *
   * - `rim`: the rim's top, facing up.
   * - `inside`: the floor inside, facing up.
   * - `body`: a bowl or an ashtray held from beneath; a vase round its middle.
   * - `handle`: a saucepan's long handle along `+X`.
   * - `leftHandle`, `rightHandle`: a stockpot's two side handles at `+X` and
   *   `-X`.
   */
  export type Affordance =
    | "rim"
    | "inside"
    | "body"
    | "handle"
    | "leftHandle"
    | "rightHandle";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: across the rim.
   * - `height`: the rim's top above the base.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which vessel. */
    kind: Kind;

    /** A bowl's or an ashtray's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `vessel` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The models read: IKEA 365+'s bowl and Thomas's Sunny Day bowl 18 cm and
   * cereal bowl; Nachtmann's Cigar Cuba and Harris's glass ashtrays.
   */
  export type Model =
    | "ikea365"
    | "sunnyDay18"
    | "sunnyDayCereal"
    | "nachtmann"
    | "harris";

  /**
   * Each kind's models whole, the default first. The bowls: IKEA 365+ bowl,
   * rounded sides, 16 cm across and 7 cm high, 0.44 kg packed, a provisional
   * mass the bowl alone is lighter than by an unread amount
   * (https://www.ikea.com/gb/en/p/ikea-365-bowl-rounded-sides-white-20278351/);
   * Thomas Sunny Day bowl 18 cm, 16.60 cm across, 7.90 cm high, 477 g
   * (https://www.thomas-porzellan.de/en-de/bowl-18-cm/10850-408547-13388.html);
   * Thomas Sunny Day cereal bowl, 12.20 cm across, 8.00 cm high, 300 g
   * (https://www.thomas-porzellan.de/en-de/cereal-bowl/10850-408530-15456.html).
   *
   * The ashtrays: 10 cm across, 3 cm high and 258 g
   * (https://www.galaxus.de/en/s14/product/nachtmann-cigar-cuba-ashtrays-10169053)
   * and 16.8 cm across, 3.5 cm high and 1.7 kg
   * (https://www.centrepointstores.com/sa/en/buy-harris-glass-ashtray/p/163634992),
   * retailer listings.
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Partial<Record<Model, Figures>>>>>
  > = {
    bowl: {
      ikea365: { diameter: 0.16, height: 0.07, mass: 0.44 },
      sunnyDay18: { diameter: 0.166, height: 0.079, mass: 0.477 },
      sunnyDayCereal: { diameter: 0.122, height: 0.08, mass: 0.3 },
    },
    ashtray: {
      nachtmann: { diameter: 0.1, height: 0.03, mass: 0.258 },
      harris: { diameter: 0.168, height: 0.035, mass: 1.7 },
    },
  };

  /**
   * The band of each free dimension, by kind; a bowl's and an ashtray's are its
   * model's.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    bowl: {},
    ashtray: {},
    saucepan: {
      diameter: AutoMovieArchetypeBand.metres(0.17, 0.17, AutoMovieArchetypeVesselData.SAUCEPAN),
      height: AutoMovieArchetypeBand.metres(0.1, 0.1, AutoMovieArchetypeVesselData.SAUCEPAN),
      mass: AutoMovieArchetypeBand.of("kg", 0.8, 1.4, AutoMovieArchetypeVesselData.UNREAD, true),
    },
    stockpot: {
      diameter: AutoMovieArchetypeBand.metres(
        9 * AutoMovieArchetypeUnits.INCH,
        9 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeVesselData.POT,
      ),
      height: AutoMovieArchetypeBand.metres(
        6 * AutoMovieArchetypeUnits.INCH,
        6 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeVesselData.POT,
      ),
      mass: AutoMovieArchetypeBand.of("kg", 1.8, 3, AutoMovieArchetypeVesselData.UNREAD, true),
    },
    vase: {
      diameter: AutoMovieArchetypeBand.metres(0.115, 0.16, AutoMovieArchetypeVesselData.VASE, true),
      height: AutoMovieArchetypeBand.metres(0.3, 0.3, AutoMovieArchetypeVesselData.VASE),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1.35,
        1.35,
        `${AutoMovieArchetypeVesselData.VASE}; the packed weight, which the vase alone is lighter than by an amount no page gives`,
        true,
      ),
    },
  };
}
