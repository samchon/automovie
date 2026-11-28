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
import { AutoMovieArchetypeVesselData } from "./internal/AutoMovieArchetypeVesselData";

/** Replays saved bowls, ashtrays, cooking pots and vases. */
export namespace AutoMovieArchetypeVessel {
/**
 * Build the named vessel selected by a saved recipe.
 *
 * @param params Saved kind, optional scene ID and applicable finite
 *   measurements. The model field selects only a bowl or ashtray.
 * @param seed Numeric seed for omitted band values or catalogue choice.
 *   Omit it for the original first models and band defaults.
 * @returns The named vessel with its supported inside floor, opening
 *   rim and kind-specific grips. The default ID is `vessel`.
 * @throws {AutoMovieArchetypeRefusal} If the kind, compatible model or fixed value is inadmissible.
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

  /** The existing named factory signatures for each saved vessel selector. */
  export interface IProducers {
    /** The ceramic bowl catalogue constructor. */
    bowl: typeof AutoMovieArchetypeBowl.create;

    /** The glass ashtray catalogue constructor. */
    ashtray: typeof AutoMovieArchetypeAshtray.create;

    /** The cooking-pot factory used with `kind: "saucepan"`. */
    saucepan: typeof AutoMovieArchetypeCookingPot.create;

    /** The cooking-pot factory used with `kind: "stockpot"`. */
    stockpot: typeof AutoMovieArchetypeCookingPot.create;

    /** The upright glass vase constructor. */
    vase: typeof AutoMovieArchetypeVase.create;
  }

  /** Look up the named authoring factory for each admitted saved selector. */
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

  /** Saved selectors for a bowl, ashtray, saucepan, stockpot or vase. */
  export type Kind = "bowl" | "ashtray" | "saucepan" | "stockpot" | "vase";

  /** The five admitted selectors in gallery order. */
  export const KINDS: readonly Kind[] = [
    "bowl",
    "ashtray",
    "saucepan",
    "stockpot",
    "vase",
  ];

  /** Estimated wall and floor thickness, 0.005 metres. */
  export const WALL: number = 0.005;

  /** Authored diameter of the cooking-pot handle rods, 0.025 metres. */
  export const GRIP: number = 0.025;

  /** The saucepan handle's 0.18 metre exposed length beyond the body. */
  export const HANDLE: number = 0.18;

  /** Fixed sRGB body colours indexed by the saved vessel kind. */
  export const COLORS: Readonly<Record<Kind, string>> = {
    bowl: "#f2efe8",
    ashtray: "#8fa3ad",
    saucepan: "#b9bcc0",
    stockpot: "#b9bcc0",
    vase: "#a9c8d8",
  };

  /**
   * The `rim` opening and physically supported `inside` floor. Bowls,
   * ashtrays and vases add `body`. A saucepan uses `handle`, and a
   * stockpot uses `leftHandle` at `+X` and `rightHandle` at `-X`.
   */
  export type Affordance =
    | "rim"
    | "inside"
    | "body"
    | "handle"
    | "leftHandle"
    | "rightHandle";

  /**
   * Outside rim span and rim height in metres. Empty model mass uses kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** Common units for the five vessel shapes' band or catalogue values. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * Saved selector, scene ID, applicable finite dimensions and optional bowl or ashtray model.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * Selects the body, material, admissible measurements and grip arrangement.
     */
    kind: Kind;

    /**
     * Catalogue selector for the bowl or ashtray. Other saved kinds disregard this legacy field.
     */
    model?: Model;

    /** Scene object ID, defaulting to `vessel`. */
    id?: string;
  }

  /** Correlated outside size, rim height and mass of one bowl or ashtray. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The recorded IDs for three bowls and two glass ashtrays. */
  export type Model =
    | "ikea365"
    | "sunnyDay18"
    | "sunnyDayCereal"
    | "nachtmann"
    | "harris";

  /**
   * Complete bowl and ashtray sizes and masses by model, first row
   * used without a seed. The IKEA 365+ mass is a provisional packed weight.
   *
   * @see https://www.ikea.com/gb/en/p/ikea-365-bowl-rounded-sides-white-20278351/
   * @see https://www.thomas-porzellan.de/en-de/bowl-18-cm/10850-408547-13388.html
   * @see https://www.thomas-porzellan.de/en-de/cereal-bowl/10850-408530-15456.html
   * @see https://www.galaxus.de/en/s14/product/nachtmann-cigar-cuba-ashtrays-10169053
   * @see https://www.centrepointstores.com/sa/en/buy-harris-glass-ashtray/p/163634992
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
   * Admitted dimensions for cooking pots and vases. Bowls and ashtrays use complete catalogue rows.
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
