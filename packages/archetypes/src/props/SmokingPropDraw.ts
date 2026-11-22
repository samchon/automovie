import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core";

/** Cigarette lengths and the 3R4F reference cigarette, neither read at a primary source. */
const CIGARETTE: string =
  "regular 70 mm to 100s 100 mm (Wikipedia, Cigarette, https://en.wikipedia.org/wiki/Cigarette); the 3R4F reference cigarette's 24.8 mm circumference and 27 mm filter (Adamson et al. 2012, Chemistry Central Journal 6:98, Table 2, seen only in search results)";

/**
 * The seeded recipes originally published as `createSmoking`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The seeded recipes originally published as `createSmoking`.
 * @evidence contracts/development/design.md#principled-representation The original dimension order, units, bands and model choices define the saved seed streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named producers read their recipes here and own their geometry and contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Makes no alternate draws for a named producer.
 */
export namespace SmokingPropDraw {
  /**
   * The kinds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved recipe's closed selector.
   * @evidence contracts/development/design.md#principled-representation One literal identifies each saved prop recipe, including stored selections.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dispatcher and seeded preparation consume the same names.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second producer or geometry is drawn for a saved alias.
   */
  export type Kind = "cigarette" | "lighter";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cigarette", "lighter"];

  /**
   * The affordance ids:
   *
   * - `grip`: a cigarette's pinch just beyond its filter, or the hand round a lighter's body.
   * - `mouth`: a cigarette's filter end, which the lips take.
   * - `flame`: where fire is: a cigarette's lit end, or the point above a lighter's top where its flame stands.
   * - `wheel`: a lighter's spark wheel, a knob the thumb rolls a quarter turn (the turn is an estimate).
   * - `valve`: a lighter's gas lever, a button under the thumb pressed 3 mm (an estimate).
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved contact identifiers for these props.
   * @evidence contracts/development/design.md#principled-representation A closed union covers the contacts built by every shape in this family.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The compatibility surface keeps existing contact names while named producers declare the contacts they own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The saved union does not manufacture contact frames absent from a shape.
   */
  export type Affordance = "grip" | "mouth" | "flame" | "wheel" | "valve";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: a cigarette's length, or a lighter's height.
   * - `diameter`: a cigarette's diameter, or a lighter's thickness along `+Z`.
   * - `width`: a lighter's width along `+X`.
   * - `filter`: the length of a cigarette's filter.
   * - `mass`: kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved axis names for drawn dimensions.
   * @evidence contracts/development/design.md#principled-representation Each member records a length, mass, or documented quantity in the associated unit table.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded preparation records values under the names that existing callers inspect.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The variant and model tables determine which values can be overridden.
   */
  export type Dimension = "length" | "diameter" | "width" | "filter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    width: "m",
    filter: "m",
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
    /** Which thing. */
    kind: Kind;

    /** A lighter's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `smoking` when absent. */
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
   * The lighters read: BIC's Maxi J26 and Mini J25.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The admitted manufacturer model names.
   * @evidence contracts/development/design.md#principled-representation A closed union identifies each named set of recorded manufacturer dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the saved selector and by the relevant named producer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Model choice retains its original table and selection order.
   */
  export type Model = "J26" | "J25";

  /** Each kind's models whole, the default first: a lighter's height (length), thickness (diameter), width and mass, 8.2 x 1.5 x 2.5 cm and 24.667 g for the J26 and 6.2 x 1.1 x 2.2 cm and 13 g for the J25 (https://bicgraphic.com/gb/bic-j26-lighter-3460002320.html, https://www.bicgraphic.com/fi/bic-j25-lighter-3460002360.html). */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    lighter: {
      J26: { length: 0.082, diameter: 0.015, width: 0.025, mass: 0.024667 },
      J25: { length: 0.062, diameter: 0.011, width: 0.022, mass: 0.013 },
    },
  };

  /** The band of each free dimension, by kind; a lighter's are its model's. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    cigarette: {
      length: AutoMovieArchetypeBand.metres(0.07, 0.1, CIGARETTE, true),
      diameter: AutoMovieArchetypeBand.metres(0.0079, 0.0079, CIGARETTE, true),
      filter: AutoMovieArchetypeBand.metres(0.02, 0.027, CIGARETTE, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.0008,
        0.001,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    lighter: {},
  };

  /**
   * What {@link prepare} prepares for its caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the builder and the drawn dimensions prepare returns, in the family's recorded units.
   * @evidence contracts/development/design.md#principled-representation The builder typed by the caller's contact ids and the draw's own dimension record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the named producers read after prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is optional where every call sets it.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Prepare an empty builder and the previously recorded smoking dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prepare an empty builder and the previously recorded smoking dimensions.
   * @evidence contracts/development/implementation.md#principled-implementation The `smoking` draw session uses the original seeds, model table, and bands in their original order.
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
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "smoking",
        UNITS,
        seed,
        params,
      );
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A lighter is one of BIC's two models whole.
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
        name: model.name === undefined ? kind : ` ${model.name}`,
        draw,
      });
    return { builder, d };
  }
}
