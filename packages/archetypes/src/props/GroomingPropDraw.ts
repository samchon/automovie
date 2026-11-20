import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { CARE_ITEM_BANDS } from "./CARE_ITEM_BANDS";

/** Alltub's laminate tubes data sheet. */
const ALLTUB: string =
  "Alltub laminate tubes data sheet (https://www.alltub.com/wp-content/uploads/2024/04/ft-tubes-lamines-en.pdf)";
/** The readable name of each kind. */
const NAMES: Readonly<Record<GroomingPropDraw.Kind, string>> = {
  tissue: "tissue",
  comb: "comb",
  toothbrush: "toothbrush",
  tube: "cream tube",
  razor: "razor",
  lipstick: "lipstick",
};

/**
 * The seeded recipes originally published as `createCareItem`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The seeded recipes originally published as `createCareItem`.
 * @evidence contracts/development/design.md#principled-representation The original dimension order, units, bands and model choices define the saved seed streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named producers read their recipes here and own their geometry and contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Makes no alternate draws for a named producer.
 */
export namespace GroomingPropDraw {
  /**
   * The kinds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved recipe's closed selector.
   * @evidence contracts/development/design.md#principled-representation One literal identifies each saved prop recipe, including stored selections.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dispatcher and seeded preparation consume the same names.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second producer or geometry is drawn for a saved alias.
   */
  export type Kind =
    | "tissue"
    | "comb"
    | "toothbrush"
    | "tube"
    | "razor"
    | "lipstick";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "tissue",
    "comb",
    "toothbrush",
    "tube",
    "razor",
    "lipstick",
  ];

  /** A razor's cartridge across and from front to back, metres: an estimate; the razors' pages read do not give it. */
  export const CARTRIDGE: Readonly<{ width: number; depth: number }> = {
    width: 0.04,
    depth: 0.015,
  };

  /** A lipstick's bullet out of its case, metres: an estimate; the cases read give its 12.1 mm across but not how far it stands out. */
  export const BULLET: number = 0.015;

  /**
   * The affordance ids:
   *
   * - `grip`: the hold: a tissue pinched at its middle, a comb's spine held sideways, a toothbrush's or a razor's handle, a tube's body, a lipstick's case.
   * - `face`: the working end: a tissue's upper side, the line of a comb's teeth facing down, a toothbrush's bristles and a razor's blades facing up, a tube's mouth facing along it, a lipstick's bullet's tip.
   * - `cap`: a tube's cap, a knob turned two turns to open (the turn is an estimate).
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved contact identifiers for these props.
   * @evidence contracts/development/design.md#principled-representation A closed union covers the contacts built by every shape in this family.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The compatibility surface keeps existing contact names while named producers declare the contacts they own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The saved union does not manufacture contact frames absent from a shape.
   */
  export type Affordance = "grip" | "face" | "cap";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `+Z`.
   * - `width`: a tissue's or a comb's width, a toothbrush's or a razor's handle's, a tube's or a lipstick's diameter.
   * - `thickness`: a tissue's or a comb's thickness.
   * - `mass`: kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved axis names for drawn dimensions.
   * @evidence contracts/development/design.md#principled-representation Each member records a length, mass, or documented quantity in the associated unit table.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded preparation records values under the names that existing callers inspect.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The variant and model tables determine which values can be overridden.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside its band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The input to the prop recipe.
   * @evidence contracts/development/design.md#principled-representation The optional identifier and dimensions use the existing declared units and per-variant bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The input carries the selection fields and has no separate copied geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime admission rejects refused values and dependent overrides.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which item. */
    kind: Kind;

    /** A tube's diameter or a razor's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `careItem` when absent. */
    id?: string;
  }

  /**
   * A model's read figures, by dimension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read figures of a manufacturer model.
   * @evidence contracts/development/design.md#principled-representation The optional per-dimension entries describe the figures a model fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded preparation records figures on the chosen model axis.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Fields fixed by a model remain fixed by that choice.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The models read: Alltub's ten laminate tube diameters, and Edwin Jagger's and Gillette's Mach3 razors.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The admitted manufacturer model names.
   * @evidence contracts/development/design.md#principled-representation A closed union identifies each named set of recorded manufacturer dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the saved selector and by the relevant named producer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Model choice retains its original table and selection order.
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

  /** Each kind's models whole, the default first. A tube's diameter (`width`) is one of Alltub's ten (https://www.alltub.com/wp-content/uploads/2024/04/ft-tubes-lamines-en.pdf), its length drawn in that diameter's own range (`TUBE_LENGTHS`). A razor's length and mass: Edwin Jagger's Mach3, 129 mm and 87 g (https://www.edwinjagger.co.uk/edwin-jagger-grey-chrome-mach-3-razor.html), and Gillette's Mach3, 5.4 in and 35 g (https://www.toolsofmen.com/?p=46812). */
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
      gilletteMach3: { length: 5.4 * ArchetypeUnits.INCH, mass: 0.035 },
    },
  };

  /** Each Alltub tube diameter's own range of lengths, metres, from the data sheet. */
  export const TUBE_LENGTHS: Readonly<Partial<Record<Model, IArchetypeBand>>> =
    {
      alltub13_5: ArchetypeBand.metres(
        0.045,
        0.16,
        `${ALLTUB}: the 13.5 mm tube's lengths`,
      ),
      alltub19: ArchetypeBand.metres(
        0.045,
        0.16,
        `${ALLTUB}: the 19 mm tube's lengths`,
      ),
      alltub22: ArchetypeBand.metres(
        0.075,
        0.125,
        `${ALLTUB}: the 22 mm tube's lengths`,
      ),
      alltub25: ArchetypeBand.metres(
        0.075,
        0.16,
        `${ALLTUB}: the 25 mm tube's lengths`,
      ),
      alltub28: ArchetypeBand.metres(
        0.075,
        0.19,
        `${ALLTUB}: the 28 mm tube's lengths`,
      ),
      alltub30: ArchetypeBand.metres(
        0.075,
        0.19,
        `${ALLTUB}: the 30 mm tube's lengths`,
      ),
      alltub35: ArchetypeBand.metres(
        0.075,
        0.181,
        `${ALLTUB}: the 35 mm tube's lengths`,
      ),
      alltub38: ArchetypeBand.metres(
        0.075,
        0.205,
        `${ALLTUB}: the 38 mm tube's lengths`,
      ),
      alltub40: ArchetypeBand.metres(
        0.06,
        0.2,
        `${ALLTUB}: the 40 mm tube's lengths`,
      ),
      alltub50: ArchetypeBand.metres(
        0.06,
        0.2,
        `${ALLTUB}: the 50 mm tube's lengths`,
      ),
    };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = CARE_ITEM_BANDS;

  /**
   * Prepare an empty builder and the previously recorded careItem dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prepare an empty builder and the previously recorded careItem dimensions.
   * @evidence contracts/development/implementation.md#principled-implementation The `careItem` draw session uses the original seeds, model table, and bands in their original order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The named producer chooses a kind. This helper handles admission, provenance, and identity before geometry is added.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The session rejects inadmissible overrides or model names and records the values that a producer consumes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Draws a bounded list of dimensions and prepares one builder.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producers and the saved dispatcher share their exact recipe preparation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number | string,
  ): {
    builder: ArchetypeBuilder<Id, Dimension>;
    d: Partial<Record<Dimension, number>>;
  } {
    const draw: ArchetypeDrawSession<Dimension> =
      new ArchetypeDrawSession<Dimension>("careItem", UNITS, seed, params);
    // A tube is one of Alltub's diameters, its length drawn in that diameter's own range; a razor one of the two razors read, whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    // The model's own range bands its length, so the author's length is checked in it.
    const range: IArchetypeBand | undefined =
      model.name === undefined ? undefined : TUBE_LENGTHS[model.name];
    const d: Partial<Record<Dimension, number>> = {
      ...draw.dimensions(
        range === undefined ? BANDS[kind] : { ...BANDS[kind], length: range },
        BANDS,
      ),
      ...model.figures,
    };
    const builder: ArchetypeBuilder<Id, Dimension> = new ArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: NAMES[kind],
      draw,
    });
    return { builder, d };
  }

  /**
   * Add the handle and flat head of a grooming tool.
   *
   * @param builder The grooming prop under construction.
   * @param dimensions The overall length, handle diameter, and head dimensions, in metres.
   * @param colors The body and head colors.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Add the handle and flat head of a grooming tool.
   * @evidence contracts/development/implementation.md#principled-implementation The top of the rectangular head marks the face. The cylindrical handle carries the grip between its ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The brush and the razor supply their head measurements and colors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The assembly uses the existing rigid head proxy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds two parts and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The brush and razor share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
   */
  export function addHead(
    builder: ArchetypeBuilder<"grip" | "face", Dimension>,
    dimensions: { length: number; width: number; head: number; across: number },
    colors: { handle: string; head: string },
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.upright(
        Vector3.create(0, width * 1.6, length - head / 2),
      ),
      extent: null,
      width: across,
      depth: head,
    });
  }
}
