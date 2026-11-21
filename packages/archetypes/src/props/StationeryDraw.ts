import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Book trim sizes: a print service's list, and the UK paperback formats from a secondary source. */
const BOOK: string =
  "Amazon KDP print options, trim sizes 12.7 x 20.32 cm to 15.6 x 23.39 cm (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6); the smaller end is the UK A-format paperback, 110 x 178 mm (Wikipedia, Book size, https://en.wikipedia.org/wiki/Book_size)";

/** Book thickness from a page count and a paper caliper, neither read at a primary source. */
const THICKNESS: string =
  "150 to 650 pages inside the 24 to 828 page range of Amazon KDP (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6) at about 0.06 mm per page, a printer's spine formula seen only in search results";

/** Office paper sizes from a secondary source. */
const PAPER: string =
  "ISO 216 A4, 210 x 297 mm, and US Letter, 216 x 279 mm (Wikipedia, Paper size, https://en.wikipedia.org/wiki/Paper_size)";

/** A ballpoint pen from a secondary source, with the precision handle band. */
const PEN: string =
  "BIC Cristal, 14.45 cm without and 14.9 cm with its cap (Wikipedia, Bic Cristal, https://en.wikipedia.org/wiki/Bic_Cristal); barrel inside the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)";

/** Michelin's folded road map: its folded size read at the maker, its thickness and mass seen only in listings. */
const MAP: string =
  "Michelin regional map, folded 11 x 25 cm (https://boutique.laventure.michelin.com/en/product/ouest-france-map-of-calvados-michelin/); 0.7 cm thick and 89 to 90 g, Michelin maps 333, 585 and 707 seen only in search results";

/** The readable name of each kind. */
const NAMES: Readonly<Record<StationeryDraw.Kind, string>> = {
  book: "book",
  paper: "sheet of paper",
  pen: "pen",
  clipboard: "clipboard",
  map: "folded map",
};

/**
 * The seeded recipes originally published as `createStationery`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The seeded recipes originally published as `createStationery`.
 * @evidence contracts/development/design.md#principled-representation The original dimension order, units, bands and model choices define the saved seed streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named producers read their recipes here and own their geometry and contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Makes no alternate draws for a named producer.
 */
export namespace StationeryDraw {
  /**
   * The kinds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved recipe's closed selector.
   * @evidence contracts/development/design.md#principled-representation One literal identifies each saved prop recipe, including stored selections.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dispatcher and seeded preparation consume the same names.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second producer or geometry is drawn for a saved alias.
   */
  export type Kind = "book" | "paper" | "pen" | "clipboard" | "map";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "book",
    "paper",
    "pen",
    "clipboard",
    "map",
  ];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold: a book by the middle of its spine, the hand closing across its thickness (the frame's `+Y` is up, out of the cover) along the spine's length; a sheet pinched from above at its near edge, a clipboard or a map pinched at its `+Z` edge, a pen pinched 30 mm from its tip (an estimate).
   * - `face`: the working face: a book's front cover, which rides the hinge; a sheet's, a clipboard's or a map's upper side; a pen's tip, facing along the pen.
   * - `hinge` and `edge`: a book's cover hinge and its riding fore-edge.
   * - `page` and `page-edge`: a book's single leaf hinge and its riding fore-edge.
   * - `fold` and `fold-edge`: a map's crease and its riding free edge.
   * - `support-grip`: the `+Z` edge of the map's base panel, held across just that panel while folding.
   *
   * Each hinge lifts its part with positive travel from the closed position through 180 degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved contact identifiers for these props.
   * @evidence contracts/development/design.md#principled-representation A closed union covers the contacts built by every shape in this family.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The compatibility surface keeps existing contact names while named producers declare the contacts they own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The saved union does not manufacture contact frames absent from a shape.
   */
  export type Affordance =
    | "grip"
    | "face"
    | "hinge"
    | "edge"
    | "page"
    | "page-edge"
    | "fold"
    | "fold-edge"
    | "support-grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: along `+X`; a pen has none.
   * - `length`: along `+Z`.
   * - `thickness`: along `+Y`; a pen's barrel diameter.
   * - `mass`: kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The saved axis names for drawn dimensions.
   * @evidence contracts/development/design.md#principled-representation Each member records a length, mass, or documented quantity in the associated unit table.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded preparation records values under the names that existing callers inspect.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The variant and model tables determine which values can be overridden.
   */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    length: "m",
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
    /** Which thing. */
    kind: Kind;

    /** A clipboard's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `stationery` when absent. */
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
   * The clipboards read: Esselte's 56055 and 604037, both A4.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The admitted manufacturer model names.
   * @evidence contracts/development/design.md#principled-representation A closed union identifies each named set of recorded manufacturer dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the saved selector and by the relevant named producer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Model choice retains its original table and selection order.
   */
  export type Model = "56055" | "604037";

  /** Each kind's models whole, the default first: Esselte's 232 x 3 x 349 mm clipboards (W x H x D), 168 g for the 56055 and 190 g for the 604037 (https://docs.rs-online.com/6055/A700000015150044.pdf, https://docs.rs-online.com/86b9/A700000015142764.pdf). */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    clipboard: {
      "56055": { width: 0.232, length: 0.349, thickness: 0.003, mass: 0.168 },
      "604037": { width: 0.232, length: 0.349, thickness: 0.003, mass: 0.19 },
    },
  };

  /** The band of each free dimension, by kind; a clipboard's are its model's. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    book: {
      width: ArchetypeBand.metres(0.11, 0.156, BOOK, true),
      length: ArchetypeBand.metres(0.178, 0.234, BOOK, true),
      thickness: ArchetypeBand.metres(0.009, 0.039, THICKNESS, true),
      mass: ArchetypeBand.of(
        "kg",
        0.17,
        0.34,
        "mass-market paperback mass, bookseller figures seen only in search results",
        true,
      ),
    },
    paper: {
      width: ArchetypeBand.metres(0.21, 0.216, PAPER, true),
      length: ArchetypeBand.metres(0.279, 0.297, PAPER, true),
      thickness: ArchetypeBand.metres(
        0.0001,
        0.0001,
        "80 g/m2 office paper is about 0.1 mm thick, not read at a source",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.0048,
        0.005,
        "80 g/m2 over the sheet's area, the grammage not read at a source",
        true,
      ),
    },
    pen: {
      length: ArchetypeBand.metres(0.1445, 0.149, PEN, true),
      thickness: ArchetypeBand.metres(0.006, 0.013, PEN, true),
      mass: ArchetypeBand.of(
        "kg",
        0.005,
        0.01,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    clipboard: {},
    map: {
      width: ArchetypeBand.metres(0.11, 0.11, MAP),
      length: ArchetypeBand.metres(0.25, 0.25, MAP),
      thickness: ArchetypeBand.metres(0.007, 0.007, MAP, true),
      mass: ArchetypeBand.of("kg", 0.089, 0.09, MAP, true),
    },
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
    builder: ArchetypeBuilder<Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Prepare an empty builder and the previously recorded stationery dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prepare an empty builder and the previously recorded stationery dimensions.
   * @evidence contracts/development/implementation.md#principled-implementation The `stationery` draw session uses the original seeds, model table, and bands in their original order.
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
    const draw: ArchetypeDrawSession<Dimension> =
      new ArchetypeDrawSession<Dimension>("stationery", UNITS, seed, params);
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A clipboard is one of Esselte's two models whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    const d: Partial<Record<Dimension, number>> = {
      ...drawn,
      ...model.figures,
    };
    const builder: ArchetypeBuilder<Id, Dimension> = new ArchetypeBuilder({
      material: kind === "paper" || kind === "map" ? "paper" : "composite",
      id: params.id,
      name: NAMES[kind],
      draw,
    });
    return { builder, d };
  }

  /**
   * A paper panel's size.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the panel size addPanelContacts places contacts on, in metres.
   * @evidence contracts/development/design.md#principled-representation The panel width, length and thickness.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members addPanelContacts reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required.
   */
  export interface IPanel {
    /** Across the panel, metres. */
    width: number;

    /** Along the panel, metres. */
    length: number;

    /** The panel thickness, metres. */
    thick: number;
  }

  /**
   * Register the edge pinch and working face of a writing surface.
   *
   * @param builder The prop under construction.
   * @param dimensions The panel width, length and thickness in metres.
   * @param gripInset How far the grip lies from the near edge, in metres.
   * @param rides The hinge that carries a folded panel's working face.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Register the edge pinch and working face of a writing surface.
   * @evidence contracts/development/implementation.md#principled-implementation The edge contact follows the panel thickness and the face is at its top.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The clipboard or paper owns the panel and any hinge. This function shares the contact geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The moving paper face rides its own fold while the stack grip stays unposed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds two contact frames.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Paper and clipboard use the same edge pinch and face placement rule.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
   */
  export function addPanelContacts(
    builder: ArchetypeBuilder<Affordance, Dimension>,
    dimensions: IPanel,
    gripInset: number,
    rides?: "fold",
  ): void {
    const { width, length, thick }: typeof dimensions = dimensions;
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, thick / 2, length / 2 - gripInset),
        Vector3.create(0, 1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: thick,
      length: width,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.upright(Vector3.create(0, thick, 0)),
      extent: null,
      width,
      depth: length,
      ...(rides === undefined ? {} : { rides }),
    });
  }
}
