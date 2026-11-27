import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { CARE_ITEM_BANDS } from "../constants/CARE_ITEM_BANDS";

/*
 * Alltub's laminate tubes data sheet.
 */
const ALLTUB: string =
  "Alltub laminate tubes data sheet (https://www.alltub.com/wp-content/uploads/2024/04/ft-tubes-lamines-en.pdf)";
/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<GroomingPropDraw.Kind, string>> = {
  tissue: "tissue",
  comb: "comb",
  toothbrush: "toothbrush",
  tube: "cream tube",
  razor: "razor",
  lipstick: "lipstick",
};

/*
 * The seeded recipes originally published as `createCareItem`.
 */
export namespace GroomingPropDraw {
  /** The kinds. */
  export type Kind =
    | "tissue"
    | "comb"
    | "toothbrush"
    | "tube"
    | "razor"
    | "lipstick";

  /*
   * Every kind, for a caller that reads one at run time.
   */
  export const KINDS: readonly Kind[] = [
    "tissue",
    "comb",
    "toothbrush",
    "tube",
    "razor",
    "lipstick",
  ];

  /*
   * The shape of CARTRIDGE.
   */
  export interface ICartridge {
    /*
     * The `width` entry.
     */
    width: number;

    /*
     * The `depth` entry.
     */
    depth: number;
  }

  /*
   * A razor's cartridge across and from front to back, metres: an estimate; the
   * razors' pages read do not give it.
   */
  export const CARTRIDGE: Readonly<ICartridge> = {
    width: 0.04,
    depth: 0.015,
  };

  /*
   * A lipstick's bullet out of its case, metres: an estimate; the cases read
   * give its 12.1 mm across but not how far it stands out.
   */
  export const BULLET: number = 0.015;

  /**
   * The affordance ids:
   *
   * - `grip`: the hold: a tissue pinched at its middle, a comb's spine held
   *   sideways, a toothbrush's or a razor's handle, a tube's body, a lipstick's
   *   case.
   * - `face`: the working end: a tissue's upper side, the line of a comb's teeth
   *   facing down, a toothbrush's bristles and a razor's blades facing up, a
   *   tube's mouth facing along it, a lipstick's bullet's tip.
   * - `cap`: a tube's cap, a knob turned two turns to open (the turn is an
   *   estimate).
   */
  export type Affordance = "grip" | "face" | "cap";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `+Z`.
   * - `width`: a tissue's or a comb's width, a toothbrush's or a razor's
   *   handle's, a tube's or a lipstick's diameter.
   * - `thickness`: a tissue's or a comb's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /*
   * Each dimension's unit, which its band and any model's figure for it share.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which item. */
    kind: Kind;

    /** A tube's diameter or a razor's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `careItem` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The models read: Alltub's ten laminate tube diameters, and Edwin Jagger's
   * and Gillette's Mach3 razors.
   */
  export type Model =
    | "alltub13_5"
    | "alltub19"
    | "alltub22"
    | "alltub25"
    | "alltub28"
    | "alltub30"
    | "alltub35"
    | "alltub38"
    | "alltub40"
    | "alltub50"
    | "edwinJagger"
    | "gilletteMach3";

  /*
   * Each kind's models whole, the default first. A tube's diameter (`width`) is
   * one of Alltub's ten
   * (https://www.alltub.com/wp-content/uploads/2024/04/ft-tubes-lamines-en.pdf),
   * its length drawn in that diameter's own range (`TUBE_LENGTHS`). A razor's
   * length and mass: Edwin Jagger's Mach3, 129 mm and 87 g
   * (https://www.edwinjagger.co.uk/edwin-jagger-grey-chrome-mach-3-razor.html),
   * and Gillette's Mach3, 5.4 in and 35 g
   * (https://www.toolsofmen.com/?p=46812).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Partial<Record<Model, Figures>>>>>
  > = {
    tube: {
      alltub13_5: { width: 0.0135 },
      alltub19: { width: 0.019 },
      alltub22: { width: 0.022 },
      alltub25: { width: 0.025 },
      alltub28: { width: 0.028 },
      alltub30: { width: 0.03 },
      alltub35: { width: 0.035 },
      alltub38: { width: 0.038 },
      alltub40: { width: 0.04 },
      alltub50: { width: 0.05 },
    },
    razor: {
      edwinJagger: { length: 0.129, mass: 0.087 },
      gilletteMach3: {
        length: 5.4 * AutoMovieArchetypeUnits.INCH,
        mass: 0.035,
      },
    },
  };

  /*
   * Each Alltub tube diameter's own range of lengths, metres, from the data
   * sheet.
   */
  export const TUBE_LENGTHS: Readonly<
    Partial<Record<Model, IAutoMovieArchetypeBand>>
  > = {
    alltub13_5: AutoMovieArchetypeBand.metres(
      0.045,
      0.16,
      `${ALLTUB}: the 13.5 mm tube's lengths`,
    ),
    alltub19: AutoMovieArchetypeBand.metres(
      0.045,
      0.16,
      `${ALLTUB}: the 19 mm tube's lengths`,
    ),
    alltub22: AutoMovieArchetypeBand.metres(
      0.075,
      0.125,
      `${ALLTUB}: the 22 mm tube's lengths`,
    ),
    alltub25: AutoMovieArchetypeBand.metres(
      0.075,
      0.16,
      `${ALLTUB}: the 25 mm tube's lengths`,
    ),
    alltub28: AutoMovieArchetypeBand.metres(
      0.075,
      0.19,
      `${ALLTUB}: the 28 mm tube's lengths`,
    ),
    alltub30: AutoMovieArchetypeBand.metres(
      0.075,
      0.19,
      `${ALLTUB}: the 30 mm tube's lengths`,
    ),
    alltub35: AutoMovieArchetypeBand.metres(
      0.075,
      0.181,
      `${ALLTUB}: the 35 mm tube's lengths`,
    ),
    alltub38: AutoMovieArchetypeBand.metres(
      0.075,
      0.205,
      `${ALLTUB}: the 38 mm tube's lengths`,
    ),
    alltub40: AutoMovieArchetypeBand.metres(
      0.06,
      0.2,
      `${ALLTUB}: the 40 mm tube's lengths`,
    ),
    alltub50: AutoMovieArchetypeBand.metres(
      0.06,
      0.2,
      `${ALLTUB}: the 50 mm tube's lengths`,
    ),
  };

  /*
   * The band of each free dimension, by kind.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = CARE_ITEM_BANDS;

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
   * Prepare an empty builder and the previously recorded careItem dimensions.
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
      new AutoMovieArchetypeDrawSession<Dimension>(
        "careItem",
        UNITS,
        seed,
        params,
      );
    // A tube is one of Alltub's diameters, its length drawn in that diameter's own range; a razor one of the two razors read, whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    // The model's own range bands its length, so the author's length is checked in it.
    const range: IAutoMovieArchetypeBand | undefined =
      model.name === undefined ? undefined : TUBE_LENGTHS[model.name];
    const d: Partial<Record<Dimension, number>> = {
      ...draw.dimensions(
        range === undefined ? BANDS[kind] : { ...BANDS[kind], length: range },
        BANDS,
      ),
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /*
   * The contact ids addHead builds or reads.
   */
  export type AddHeadContact = "grip" | "face";

  /*
   * A grooming prop's handle and head size.
   */
  export interface IHead {
    /*
     * The whole prop length, metres.
     */
    length: number;

    /*
     * The handle diameter, metres.
     */
    width: number;

    /*
     * The head length, metres.
     */
    head: number;

    /*
     * The head width, metres.
     */
    across: number;
  }

  /*
   * A grooming prop's two finishes.
   */
  export interface IHeadColors {
    /*
     * The handle colour.
     */
    handle: string;

    /*
     * The head colour.
     */
    head: string;
  }

  /*
   * Add the handle and flat head of a grooming tool.
   * Parameter builder: The grooming prop under construction.
   * Parameter dimensions: The overall length, handle diameter, and head dimensions,
   * in metres.
   * Parameter colors: The body and head colors.
   */
  export function addHead(
    builder: AutoMovieArchetypeBuilder<AddHeadContact, Dimension>,
    dimensions: IHead,
    colors: IHeadColors,
  ): void {
    const { length, width, head, across }: typeof dimensions = dimensions;
    builder.rod(
      "handle",
      width / 2,
      Vector3.create(0, width / 2, 0),
      Vector3.create(0, width / 2, length - head),
      { color: colors.handle },
    );
    builder.box(
      "head",
      Vector3.create(across, width * 1.6, head),
      Vector3.create(0, width * 0.8, length - head / 2),
      { color: colors.head },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, width / 2, (length - head) / 2),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: width,
      length: length - head,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, width * 1.6, length - head / 2),
      ),
      extent: null,
      width: across,
      depth: head,
    });
  }
}
