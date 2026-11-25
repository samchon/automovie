import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core";
import { BED_BANDS } from "./BED_BANDS";
import { createBunkBed } from "./createBunkBed";
import { createCrib } from "./createCrib";
import { createGurney } from "./createGurney";
import { createHospitalBed } from "./createHospitalBed";
import { createMattress } from "./createMattress";
import { createPlatformBed } from "./createPlatformBed";
import type { IArchetypeDispatch } from "../core/IArchetypeDispatch";

/**
 * Replay a saved bed variant with the original dimensions, identifier and model
 * choices.
 *
 * @param params The historic selector and optional fixed settings in the
 *   original units.
 * @param seed Draws the omitted settings. Omit it for the original seedless
 *   defaults.
 * @returns The original generated model and its local contacts.
 * @throws {AutoMovieArchetypeRefusal} If the selector or any author setting is
 *   outside its admitted range.
 */
export function createBed(
  params: createBed.IParams,
  seed?: number,
): AutoMovieArchetype<createBed.Affordance, createBed.Dimension> {
  const kind: createBed.Kind = ArchetypeDraw.choice(
    "bed",
    "kind",
    params.kind,
    createBed.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      createBed.Kind,
      IArchetypeDispatch<
        Omit<createBed.IParams, "kind">,
        AutoMovieArchetype<createBed.Affordance, createBed.Dimension>
      >
    >
  > = {
    single: { build: createPlatformBed },
    double: { build: createPlatformBed },
    mattress: { build: createMattress },
    hospital: { build: createHospitalBed },
    gurney: { build: createGurney },
    crib: { build: createCrib },
    bunk: { build: createBunkBed },
  };
  return variants[kind].build(params, seed);
}

/** Companion types and bands of {@link createBed}. */
export namespace createBed {
  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `single` selector. */
    single: typeof createPlatformBed;

    /** The named producer for the saved `double` selector. */
    double: typeof createPlatformBed;

    /** The named producer for the saved `mattress` selector. */
    mattress: typeof createMattress;

    /** The named producer for the saved `hospital` selector. */
    hospital: typeof createHospitalBed;

    /** The named producer for the saved `gurney` selector. */
    gurney: typeof createGurney;

    /** The named producer for the saved `crib` selector. */
    crib: typeof createCrib;

    /** The named producer for the saved `bunk` selector. */
    bunk: typeof createBunkBed;
  }

  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<IProducers> = {
    get single(): typeof createPlatformBed {
      return createPlatformBed;
    },
    get double(): typeof createPlatformBed {
      return createPlatformBed;
    },
    get mattress(): typeof createMattress {
      return createMattress;
    },
    get hospital(): typeof createHospitalBed {
      return createHospitalBed;
    },
    get gurney(): typeof createGurney {
      return createGurney;
    },
    get crib(): typeof createCrib {
      return createCrib;
    },
    get bunk(): typeof createBunkBed {
      return createBunkBed;
    },
  };

  /** The kinds of bed. */
  export type Kind =
    | "single"
    | "double"
    | "mattress"
    | "hospital"
    | "gurney"
    | "crib"
    | "bunk";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "single",
    "double",
    "mattress",
    "hospital",
    "gurney",
    "crib",
    "bunk",
  ];

  /**
   * The affordance ids:
   *
   * - `surface`: the lying surface, its `depth` the bed's length with the head at
   *   `v = 0`; a bunk's lower bed.
   * - `leftSide`, `rightSide`: the long edges on `+X` and `-X` as seats facing
   *   out, as wide as the bed is long; a crib has none.
   * - `leftRail`, `rightRail`: a hospital bed's siderails or a crib's top rails,
   *   bars on `+X` and `-X`.
   * - `upper`: a bunk's upper lying surface; `guard`: its continuous guardrail, a
   *   bar.
   */
  export type Affordance =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "leftRail"
    | "rightRail"
    | "upper"
    | "guard";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: across the lying surface.
   * - `length`: the lying surface from head to foot.
   * - `height`: the lying surface above the floor; a crib's rail tops; a bunk's
   *   overall height; a mattress on the floor has none.
   * - `thickness`: the mattress.
   * - `overallLength`, `overallWidth`: a hospital bed's, a stretcher's or a
   *   bunk's frame.
   * - `litter`: a hospital bed's or a stretcher's litter top above the floor.
   * - `rail`: a hospital bed's siderail top above its mattress; a crib's rail top
   *   above its mattress support at its lowest.
   * - `gap`, `clearance`: a bunk's distance between its two beds and the free
   *   height under its lower one, where each mattress rests.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "length"
    | "height"
    | "thickness"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "rail"
    | "gap"
    | "clearance"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
    height: "m",
    thickness: "m",
    overallLength: "m",
    overallWidth: "m",
    litter: "m",
    rail: "m",
    gap: "m",
    clearance: "m",
    mass: "kg",
  };

  /** The UK sizes a loose mattress is made in. */
  export type Mattress = "single" | "double";

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bed. */
    kind: Kind;

    /**
     * A loose mattress's UK size; drawn from the seed when absent. Other beds
     * have none.
     */
    size?: Mattress;

    /** The model's id, unique in a scene; `bed` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = BED_BANDS;
}
