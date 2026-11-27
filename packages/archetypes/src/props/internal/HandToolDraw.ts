import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { TOOL_BANDS } from "../constants/TOOL_BANDS";

/*
 * The seeded recipes originally published as `createTool`.
 */
export namespace HandToolDraw {
  /** The kinds of tool. */
  export type Kind =
    | "hammer"
    | "saw"
    | "screwdriver"
    | "spoon"
    | "fork"
    | "ladle"
    | "knife"
    | "primingWire";

  /*
   * Every kind, for a caller that reads one at run time.
   */
  export const KINDS: readonly Kind[] = [
    "hammer",
    "saw",
    "screwdriver",
    "spoon",
    "fork",
    "ladle",
    "knife",
    "primingWire",
  ];

  /*
   * A table knife blade's thickness as a share of its read width from spine to
   * edge: a construction estimate that no act reads and no band declares.
   */
  export const KNIFE_THICKNESS: number = 0.1;

  /*
   * The shape of TINES.
   */
  export interface ITines {
    /*
     * The `width` entry.
     */
    width: number;

    /*
     * The `length` entry.
     */
    length: number;
  }

  /*
   * A fork's tines as one plate, across and along, metres: an estimate, not
   * read at a source.
   */
  export const TINES: Readonly<ITines> = {
    width: 0.025,
    length: 0.045,
  };

  /*
   * A saw blade's depth from its spine to its teeth, metres: an estimate, not
   * read at a source.
   */
  export const BLADE_DEPTH: number = 0.1;

  /*
   * The length of handle a hand holds, metres: the 120 mm CCOHS recommends for
   * a tool handle
   * (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html).
   */
  export const GRIP: number = 0.12;

  /*
   * The radius of a spoon's bowl, metres: the bowl is a disc of this radius
   * whose far rim ends the spoon, and the handle is the rest of the length. An
   * estimate, not read at a source.
   */
  export const BOWL: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `grip`: the handle, held at its butt end on a hammer, across the heel on a
   *   saw and next to the working part on the others; a priming wire's ring,
   *   pinched.
   * - `face`: the working end: a hammer's striking face, the edge of a saw's
   *   teeth, a screwdriver's tip, the hollow of a spoon's bowl, the points of a
   *   fork's tines, a ladle's bowl, a table knife's edge, a priming wire's
   *   point.
   */
  export type Affordance = "grip" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `gripDiameter`: the handle's diameter; a spoon's or a fork's handle's
   *   width.
   * - `blade`: the length of a saw's or a table knife's blade, a screwdriver's
   *   shank.
   * - `bladeWidth`: a table knife's blade from its spine to its edge.
   * - `bowl`: a ladle's bowl, across.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "gripDiameter"
    | "blade"
    | "bladeWidth"
    | "bowl"
    | "mass";

  /*
   * Each dimension's unit, which its band and any model's figure for it share.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    gripDiameter: "m",
    blade: "m",
    bladeWidth: "m",
    bowl: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** A table knife's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `tool` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The table knives read: Eichenlaub's Altdeutsch and Robert Welch's Malvern. */
  export type Model = "eichenlaub" | "robertWelch";

  /*
   * Each kind's models whole, the default first, length, blade, blade width and
   * mass: Eichenlaub's Altdeutsch 22.5 cm, 12.5 cm, 1.7 cm and 60 g
   * (https://www.scharferladen.de/en/eichenlaub-series-altdeutsch-table-knife-houndwood),
   * and Robert Welch's Malvern 24.6 cm, 12 cm, 2.1 cm, the blade the knife's
   * widest part, and 130 g
   * (https://www.johnlewis.com/robert-welch-malvern-stainless-steel-table-knife-12cm/p707599).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    knife: {
      eichenlaub: {
        length: 0.225,
        blade: 0.125,
        bladeWidth: 0.017,
        mass: 0.06,
      },
      robertWelch: {
        length: 0.246,
        blade: 0.12,
        bladeWidth: 0.021,
        mass: 0.13,
      },
    },
  };

  /*
   * The band of each free dimension, by kind.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = TOOL_BANDS;

  /*
   * What prepare prepares for its caller.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /*
     * The prepared `builder` this call returns.
     */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /*
     * The prepared `d` this call returns.
     */
    d: Partial<Record<Dimension, number>>;
  }

  /*
   * Prepare an empty builder and the previously recorded tool dimensions.
   * Parameter params: Fixed dimensions in metres or kilograms, an optional scene
   * ID, and a model where the saved recipe has one.
   * Parameter seed: The seed that draws the saved dimensions and model, or
   * undefined for the original defaults.
   * Parameter kind: The saved kind whose recipe is used.
   * Returns: The builder and dimensions the named producer reads.
   * When the model or a fixed parameter
   * lies outside its admitted recipe.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>("tool", UNITS, seed, params);
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A table knife is one of the two read knives whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    const d: Partial<Record<Dimension, number>> = {
      ...drawn,
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: kind,
        draw,
      });
    return { builder, d };
  }

  /*
   * The contact ids handle builds or reads.
   */
  export type HandleContact = "grip" | "face";

  /*
   * Add a straight grip to a one-hand tool standing along +Y.
   * Parameter builder: The tool under construction.
   * Parameter length: The handle length in metres.
   * Parameter radius: Its radius in metres.
   * Parameter options: The material, grip style and position on the handle.
   */
  export function handle(
    builder: AutoMovieArchetypeBuilder<HandleContact, Dimension>,
    length: number,
    radius: number,
    options: {
      steel?: boolean;
      precision?: boolean;
      round?: boolean;
      atButt?: boolean;
    } = {},
  ): void {
    builder.rod(
      "handle",
      radius,
      Vector3.create(0, 0, 0),
      Vector3.create(0, length, 0),
      options.steel === true
        ? { color: "#b9bcc0", surface: "steel" }
        : { color: "#8a5a35" },
    );
    const held: number = Math.min(length, GRIP);
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: options.round === true ? "round" : "half",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(
          0,
          options.atButt === true ? held / 2 : length - held / 2,
          0,
        ),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: options.precision === true ? "precision" : "power",
      aperture: 2 * radius,
      length: held,
    });
  }
}
