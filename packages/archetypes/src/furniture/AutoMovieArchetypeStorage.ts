import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { STORAGE_BANDS } from "./STORAGE_BANDS";
import { createBookcase } from "./createBookcase";
import { AutoMovieArchetypeDrawerUnit } from "./AutoMovieArchetypeDrawerUnit";
import { AutoMovieArchetypeHingedCabinet } from "./AutoMovieArchetypeHingedCabinet";
import type { IArchetypeDispatch } from "../core/IArchetypeDispatch";

/** Constructs the storage archetype from its recipe. */
export namespace AutoMovieArchetypeStorage {
/**
 * Replay a saved storage variant with the original dimensions, identifier and
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
  params: AutoMovieArchetypeStorage.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStorage.Affordance, AutoMovieArchetypeStorage.Dimension> {
  const kind: AutoMovieArchetypeStorage.Kind = ArchetypeDraw.choice(
    "storage",
    "kind",
    params.kind,
    AutoMovieArchetypeStorage.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeStorage.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeStorage.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeStorage.Affordance, AutoMovieArchetypeStorage.Dimension>
      >
    >
  > = {
    wardrobe: { build: AutoMovieArchetypeHingedCabinet.create },
    chest: { build: AutoMovieArchetypeDrawerUnit.create },
    filingCabinet: { build: AutoMovieArchetypeDrawerUnit.create },
    locker: { build: AutoMovieArchetypeHingedCabinet.create },
    bookcase: { build: createBookcase },
  };
  return variants[kind].build(params, seed);
}
}

/** Companion types and bands of {@link createStorage}. */
export namespace AutoMovieArchetypeStorage {
  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `wardrobe` selector. */
    wardrobe: typeof AutoMovieArchetypeHingedCabinet.create;

    /** The named producer for the saved `chest` selector. */
    chest: typeof AutoMovieArchetypeDrawerUnit.create;

    /** The named producer for the saved `filingCabinet` selector. */
    filingCabinet: typeof AutoMovieArchetypeDrawerUnit.create;

    /** The named producer for the saved `locker` selector. */
    locker: typeof AutoMovieArchetypeHingedCabinet.create;

    /** The named producer for the saved `bookcase` selector. */
    bookcase: typeof createBookcase;
  }

  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<IProducers> = {
    get wardrobe(): typeof AutoMovieArchetypeHingedCabinet.create {
      return AutoMovieArchetypeHingedCabinet.create;
    },
    get chest(): typeof AutoMovieArchetypeDrawerUnit.create {
      return AutoMovieArchetypeDrawerUnit.create;
    },
    get filingCabinet(): typeof AutoMovieArchetypeDrawerUnit.create {
      return AutoMovieArchetypeDrawerUnit.create;
    },
    get locker(): typeof AutoMovieArchetypeHingedCabinet.create {
      return AutoMovieArchetypeHingedCabinet.create;
    },
    get bookcase(): typeof createBookcase {
      return createBookcase;
    },
  };

  /** The kinds of cabinet. */
  export type Kind =
    | "wardrobe"
    | "chest"
    | "filingCabinet"
    | "locker"
    | "bookcase";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "wardrobe",
    "chest",
    "filingCabinet",
    "locker",
    "bookcase",
  ];

  /**
   * The affordance ids:
   *
   * - `push`: the `+X` side face, pushed to move the cabinet.
   * - `top`: the upper face.
   * - `leftDoor`, `rightDoor`: a wardrobe's door hinges on `+X` and `-X`.
   * - `leftPull`, `rightPull`: the doors' pulls, each riding its hinge.
   * - `drawer1` upward: a chest's or a filing cabinet's drawers from the bottom,
   *   each a slider running out along `+Z`.
   * - `pull1` upward: a chest's drawer pulls, each riding its slider.
   * - `door`: a locker's door hinge on its `-X` edge.
   * - `shelf1` upward: a bookcase's shelves from the bottom, each a `stack-top`;
   *   a locker's hat shelf, `shelf1`.
   */
  export type Affordance =
    | "push"
    | "top"
    | "leftDoor"
    | "rightDoor"
    | "leftPull"
    | "rightPull"
    | "door"
    | `drawer${number}`
    | `pull${number}`
    | `shelf${number}`;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the cabinet along `+X`, `+Y` and `+Z`; a
   *   locker's height is its body's, above its legs.
   * - `pullHeight`: a wardrobe's door pulls above the floor.
   * - `swing`: how far a wardrobe door opens, degrees.
   * - `travel`: how far a drawer slides out.
   * - `legs`: a locker's legs.
   * - `mass`: the empty cabinet, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "pullHeight"
    | "swing"
    | "travel"
    | "legs"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    pullHeight: "m",
    swing: "degrees",
    travel: "m",
    legs: "m",
    mass: "kg",
  };

  /**
   * The read models: Blum's CLIP top hinges, Accuride's 3832E slides and Lyon's
   * 72 in single tier lockers by width by depth.
   */
  export type Model =
    | "CLIP top 95"
    | "CLIP top 110"
    | "3832-E12"
    | "3832-E14"
    | "3832-E16"
    | "12x12"
    | "12x15"
    | "12x18"
    | "15x18"
    | "18x18"
    | "18x21";

  /**
   * The parameters: the kind, the model, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "swing">, number>
  > {
    /** Which cabinet. */
    kind: Kind;

    /**
     * A wardrobe's hinge, a chest's drawer slide or a locker's size; drawn from
     * the seed when absent. The other kinds have one read model.
     */
    model?: Model;

    /** The model's id, unique in a scene; `storage` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = STORAGE_BANDS;
}
