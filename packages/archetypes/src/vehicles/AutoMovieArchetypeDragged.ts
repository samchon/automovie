import { type AutoMovieArchetype } from "../core/index";
import { createDragged as createDraggedImplementation } from "./internal/createDragged";
import { AutoMovieArchetypeDrawSession } from "../core";

/** Public operations for Auto Movie Archetype Dragged. */
export namespace AutoMovieArchetypeDragged {
  /**
   * A load drawn along the ground by a horse's traces rather than rolled on
   * wheels: a walking mouldboard plough, a harrow, a chained log or a sledge on
   * runners.
   *
   * The load stands with its front toward `+Z` and its ground contact on `Y=0`:
   * the plough's share and landside, the harrow's tines, the log's underside, the
   * sledge's runners. Its `coupling` is the clevis, chain ring or bar its
   * whippletree is hooked to, at the front on the centreline. A plough carries
   * two `leftHandle` and `rightHandle` grips behind it, `+X` the ploughman's
   * left, and its `share`, the share's point at the furrow bottom, the frame a
   * working depth is read at; a sledge carries a `bed` it is loaded on. The
   * dimensions are construction estimates, `SIZES`, one set per kind; no maker's
   * drawing was read, so each is provisional, and the author may fix any of
   * them.
   *
   * @param params The kind, any dimension the author fixes, and the load's mass.
   * @returns The load at rest.
   * @throws {AutoMovieArchetypeRefusal} For a nonpositive dimension or mass.
   */
  export function create(params: AutoMovieArchetypeDragged.IParams): AutoMovieArchetype<AutoMovieArchetypeDragged.Affordance, AutoMovieArchetypeDragged.Dimension> {
    return createDraggedImplementation(params);
  }

  /** The kinds of ground-drawn load. */
  export type Kind = "plough" | "harrow" | "log" | "sledge";

  /**
   * The contacts: `coupling` at the front, a plough's `leftHandle`,
   * `rightHandle` and `share`, a sledge's `bed`.
   */
  export type Affordance =
    | "coupling"
    | "leftHandle"
    | "rightHandle"
    | "share"
    | "bed";

  /**
   * The dimensions, metres unless stated: `length` along the load, `width`
   * across it (a log's diameter, a plough's share width), `height` of the
   * coupling or the frame, a plough's `handleHeight` and `handleSpread`, and
   * `mass` in kilograms.
   */
  export type Dimension =
    | "length"
    | "width"
    | "height"
    | "handleHeight"
    | "handleSpread"
    | "mass";

  /** Every dimension, in declaration order. */
  export const DIMENSIONS: readonly Dimension[] = [
    "length",
    "width",
    "height",
    "handleHeight",
    "handleSpread",
    "mass",
  ];

  /** The parameters: the kind and any dimension fixed. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which load. */
    kind: Kind;
    /** The model's id, unique in a scene. */
    id?: string;
  }

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    height: "m",
    handleHeight: "m",
    handleSpread: "m",
    mass: "kg",
  };

  /**
   * Construction estimates per kind, none read from a maker: a walking plough
   * about 2.4 m over its handles with a 0.25 m share and 1.15 m high grips 0.45
   * m apart, about a walker's waist when the share is in the ground; a 1.2 by
   * 1.5 m harrow; a 4 m log 0.4 m through; a 2 m by 0.9 m sledge.
   */
  export const SIZES: Readonly<
    Record<Kind, Readonly<Record<Dimension, number>>>
  > = {
    plough: {
      length: 2.4,
      width: 0.25,
      height: 0.45,
      handleHeight: 1.15,
      handleSpread: 0.45,
      mass: 60,
    },
    harrow: {
      length: 1.5,
      width: 1.2,
      height: 0.15,
      handleHeight: 1,
      handleSpread: 1,
      mass: 50,
    },
    log: {
      length: 4,
      width: 0.4,
      height: 0.2,
      handleHeight: 1,
      handleSpread: 1,
      mass: 300,
    },
    sledge: {
      length: 2,
      width: 0.9,
      height: 0.35,
      handleHeight: 1,
      handleSpread: 1,
      mass: 80,
    },
  };}
