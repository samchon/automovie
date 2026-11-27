import { type AutoMovieArchetype } from "../core/index";
import { createBag as createBagImplementation } from "./internal/createBag";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand } from "../core";
import { BAG_BANDS } from "./constants/BAG_BANDS";

/** Public operations for Auto Movie Archetype Bag. */
export namespace AutoMovieArchetypeBag {
  /**
   * A carried bag: a tote open at the top with handles and a shoulder strap, its
   * hollow reached through its `opening` and its floor the `inside` surface, a
   * backpack, a cabin suitcase with a telescopic handle, a briefcase, a toolbox,
   * a handbag or a duffel.
   *
   * The bag stands on its base at the origin, its wide face toward `+Z`; a
   * suitcase's, a briefcase's, a toolbox's and a duffel's top handle is the
   * Revised NIOSH Lifting Equation's optimal handle, applied, and a handbag's
   * handle is that handle's bar and length standing its read drop above the top:
   * a bar of its diameter band and its 11.5 cm length, standing its 5 cm
   * clearance above the top; a backpack's straps are on its `-Z` face, against
   * the back of a wearer who faces `-Z`. A suitcase's pull handle is a part on
   * the `telescope` slider, so drawing it out raises it to the height it is
   * pulled at.
   *
   * @param params The kind, the load and any dimension the author fixes.
   * @param seed The seed that picks the model when none is given and draws every
   *   dimension left free inside its band; absent, the first model and the middle
   *   of each band.
   * @returns The bag.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
   *   or a load the kind does not carry.
   */
  export function create(params: AutoMovieArchetypeBag.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBag.Affordance, AutoMovieArchetypeBag.Dimension> {
    return createBagImplementation(params, seed);
  }

  /**
   * An open tote's wall and bottom thickness, metres (provisional: a stiff
   * canvas or leather panel).
   */
  export const WALL: number = 0.006;

  /** The kinds of bag. */
  export type Kind =
    | "tote"
    | "backpack"
    | "suitcase"
    | "briefcase"
    | "toolbox"
    | "handbag"
    | "duffel";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "tote",
    "backpack",
    "suitcase",
    "briefcase",
    "toolbox",
    "handbag",
    "duffel",
  ];

  /**
   * The Revised NIOSH Lifting Equation's optimal handle's length and clearance,
   * metres, applied to a suitcase's, a briefcase's, a toolbox's, a duffel's and
   * a handbag's handle (Applications Manual, NIOSH 94-110, Table 6 note 1, p.
   * 30, https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf): at least
   * 11.5 cm long, 5 cm clear of the top.
   */
  export const HANDLE: Readonly<{ length: number; clearance: number }> = {
    length: 0.115,
    clearance: 0.05,
  };

  /**
   * The affordance ids:
   *
   * - `handle`: the carrying handle above the top, gripped from above; every
   *   kind.
   * - `strap`: the top of a tote's shoulder strap, hooked over the shoulder or
   *   the fingers.
   * - `leftStrap`, `rightStrap`: a backpack's shoulder straps, each frame at the
   *   strap's middle with the strap's length along it so a site names its top,
   *   on the left (`-X`) and the right of a wearer who faces `-Z` with the bag
   *   on the back.
   * - `telescope`: a suitcase's telescopic handle, a slider travelling up.
   * - `pull`: the bar of that handle, which rides the telescope.
   */
  export type Affordance =
    | "handle"
    | "strap"
    | "leftStrap"
    | "rightStrap"
    | "telescope"
    | "pull"
    | "opening"
    | "inside";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the body along `+X`, `+Y` and `+Z`.
   * - `handleDrop`: the top of a tote's or a handbag's handles above its body.
   * - `strapDrop`: the top of a tote's shoulder strap above its body.
   * - `pullHeight`: a suitcase's pull bar above the floor when drawn out.
   * - `handleDiameter`: a suitcase's, a briefcase's, a toolbox's, a duffel's or a
   *   handbag's handle bar, or a tote's or a backpack's handle and strap
   *   webbing.
   * - `mass`: the empty bag, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "handleDrop"
    | "strapDrop"
    | "pullHeight"
    | "handleDiameter"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    handleDrop: "m",
    strapDrop: "m",
    pullHeight: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, the load, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bag. */
    kind: Kind;

    /** A suitcase's cabin limit; drawn from the seed when absent. */
    model?: Model;

    /** A suitcase's pull height; drawn from the seed when absent. */
    pull?: Pull;

    /** The model's id, unique in a scene; `bag` when absent. */
    id?: string;

    /**
     * The mass of what the bag holds, kilograms: up to 16 for a tote, a
     * backpack, a briefcase, a toolbox, a handbag or a duffel and 27.7 for a
     * suitcase; empty when absent.
     */
    load?: number;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The suitcases read: the two cabin limits, Lufthansa's and IATA's guide. */
  export type Model = "lufthansa" | "iata";

  /**
   * Each kind's models whole, the default first: a suitcase's height x width x
   * depth, Lufthansa's carry-on limit 55 x 40 x 23 cm
   * (https://www.lufthansa.com/us/en/carry-on-baggage) and IATA's 56 x 45 x 25
   * cm guide
   * (https://www.iata.org/en/programs/ops-infra/baggage/passenger-baggage-rules/).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    suitcase: {
      lufthansa: { height: 0.55, width: 0.4, depth: 0.23 },
      iata: { height: 0.56, width: 0.45, depth: 0.25 },
    },
  };

  /** The pull heights read: the two a luggage-pulling study tested. */
  export type Pull = "pull100" | "pull110";

  /**
   * Each kind's pull heights, the default first: 100 and 110 cm, tested in
   * Industrial Health 45(6):756-765, 2007
   * (https://www.jstage.jst.go.jp/article/indhealth/45/6/45_6_756/_article).
   */
  export const PULLS: Readonly<
    Partial<Record<Kind, Readonly<Record<Pull, Figures>>>>
  > = {
    suitcase: {
      pull100: { pullHeight: 1 },
      pull110: { pullHeight: 1.1 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = BAG_BANDS;}
