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
import { AutoMovieArchetypeCane } from "./AutoMovieArchetypeCane";
import { AutoMovieArchetypeInfusionStand } from "./AutoMovieArchetypeInfusionStand";
import { AutoMovieArchetypeWalker } from "./AutoMovieArchetypeWalker";
import * as AutoMovieArchetypeMobilityAidData from "./internal/AutoMovieArchetypeMobilityAidData";

/** Constructs the mobility aid archetype from its recipe. */
export namespace AutoMovieArchetypeMobilityAid {
/**
 * Replay a saved mobilityAid variant with the original dimensions, identifier
 * and model choices.
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
  params: AutoMovieArchetypeMobilityAid.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeMobilityAid.Affordance,
  AutoMovieArchetypeMobilityAid.Dimension
> {
  const kind: AutoMovieArchetypeMobilityAid.Kind = ArchetypeDraw.choice(
    "mobilityAid",
    "kind",
    params.kind,
    AutoMovieArchetypeMobilityAid.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  return AutoMovieArchetypeMobilityAid.PRODUCERS[kind](params, seed);
}

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `cane` selector. */
    cane: typeof AutoMovieArchetypeCane.create;

    /** The named producer for the saved `walker` selector. */
    walker: typeof AutoMovieArchetypeWalker.create;

    /** The named producer for the saved `infusionStand` selector. */
    infusionStand: typeof AutoMovieArchetypeInfusionStand.create;
  }

  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<IProducers> = {
    get cane(): typeof AutoMovieArchetypeCane.create {
      return AutoMovieArchetypeCane.create;
    },
    get walker(): typeof AutoMovieArchetypeWalker.create {
      return AutoMovieArchetypeWalker.create;
    },
    get infusionStand(): typeof AutoMovieArchetypeInfusionStand.create {
      return AutoMovieArchetypeInfusionStand.create;
    },
  };

  /** The kinds: an offset cane, a walking frame and an infusion stand. */
  export type Kind = "cane" | "walker" | "infusionStand";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cane", "walker", "infusionStand"];

  /**
   * The infusion stand's read construction, metres and kilograms: its castors'
   * and base legs' diameters, its outer tube's length, its inner tube's
   * diameter and its weighted base's mass, Provita's I-PRE003 / I-PRE013; its
   * five legs are counted in the catalogue's photographs of the stand (pp. 13
   * and 16), as its text states no count.
   */
  export const STAND: Readonly<{
    legs: number;
    castor: number;
    leg: number;
    outer: number;
    inner: number;
    base: number;
  }> = {
    legs: 5,
    castor: 0.075,
    leg: 0.0337,
    outer: 1.2,
    inner: 0.025,
    base: 8.9,
  };

  /**
   * The cane's offset handle, forward of the shaft, metres: the 120 mm CCOHS
   * recommends for a tool handle
   * (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html), the
   * length a hand closes round.
   */
  export const HANDLE: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `grip`: a cane's handle, taken from above.
   * - `leftGrip`, `rightGrip`: a walker's side rails at `+X` and `-X`, taken from
   *   above.
   * - `tip`: the foot on the floor, facing down.
   * - `hook`: an infusion stand's hooks at its top, where the bags hang.
   */
  export type Affordance = "grip" | "leftGrip" | "rightGrip" | "tip" | "hook";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the handle's top above the floor; an infusion stand's top, where
   *   its hooks are.
   * - `diameter`: a cane's shaft, a walker's tube, an infusion stand's outer
   *   tube.
   * - `width`, `depth`: a walker's across `X` and along `Z`; `width` an infusion
   *   stand's base diameter.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "width" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    width: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which aid. */
    kind: Kind;

    /** A walker's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `mobilityAid` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The walkers read: Drive Medical's deluxe two-button folding walker, adult
   * (10210-1, 10210-4ASM) and junior (10211-4ASM).
   */
  export type Model = "adult" | "junior";

  /**
   * Each kind's models whole, the default first: the adult walker 7.5 lb and
   * the junior 7 lb, the sheet's weights in the order of its item rows
   * (https://shop.drivemedical.com/us/en/products/mobility/walkers/push-button/deluxe-folding-walker-two-button-with-5-wheels/p/10210-1/downloadPdf).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    walker: {
      adult: { mass: 7.5 * AutoMovieArchetypeUnits.POUND },
      junior: { mass: 7 * AutoMovieArchetypeUnits.POUND },
    },
  };

  /**
   * Each walker model's own handle height range, metres: the sheet's 32 to 39
   * in for the adult and 25 to 32.25 in for the junior.
   */
  export const HANDLE_HEIGHTS: Readonly<
    Partial<Record<Model, IAutoMovieArchetypeBand>>
  > = {
    adult: AutoMovieArchetypeBand.metres(
      32 * AutoMovieArchetypeUnits.INCH,
      39 * AutoMovieArchetypeUnits.INCH,
      `${AutoMovieArchetypeMobilityAidData.WALKER}: the adult handle heights`,
    ),
    junior: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      32.25 * AutoMovieArchetypeUnits.INCH,
      `${AutoMovieArchetypeMobilityAidData.WALKER}: the junior handle heights`,
    ),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    cane: {
      height: AutoMovieArchetypeBand.metres(
        30 * AutoMovieArchetypeUnits.INCH,
        39 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeMobilityAidData.CANE,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.75 * AutoMovieArchetypeUnits.INCH,
        0.75 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeMobilityAidData.CANE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.85 * AutoMovieArchetypeUnits.POUND,
        0.85 * AutoMovieArchetypeUnits.POUND,
        AutoMovieArchetypeMobilityAidData.CANE_MASS,
        true,
      ),
    },
    walker: {
      width: AutoMovieArchetypeBand.metres(
        24 * AutoMovieArchetypeUnits.INCH,
        24 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeMobilityAidData.WALKER,
      ),
      depth: AutoMovieArchetypeBand.metres(
        18 * AutoMovieArchetypeUnits.INCH,
        18 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeMobilityAidData.WALKER,
        true,
      ),
      diameter: AutoMovieArchetypeBand.metres(0.03, 0.04, AutoMovieArchetypeMobilityAidData.POWER, true),
    },
    infusionStand: {
      height: AutoMovieArchetypeBand.metres(1.43, 2.26, AutoMovieArchetypeMobilityAidData.PROVITA),
      diameter: AutoMovieArchetypeBand.metres(0.0337, 0.0337, AutoMovieArchetypeMobilityAidData.PROVITA),
      width: AutoMovieArchetypeBand.metres(0.63, 0.63, AutoMovieArchetypeMobilityAidData.PROVITA),
      mass: AutoMovieArchetypeBand.of("kg", 12, 12, AutoMovieArchetypeMobilityAidData.PROVITA),
    },
  };
}
