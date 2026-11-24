import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * Book trim sizes: a print service's list, and the UK paperback formats from a
 * secondary source.
 */
const BOOK: string =
  "Amazon KDP print options, trim sizes 12.7 x 20.32 cm to 15.6 x 23.39 cm (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6); the smaller end is the UK A-format paperback, 110 x 178 mm (Wikipedia, Book size, https://en.wikipedia.org/wiki/Book_size)";

/**
 * Book thickness from a page count and a paper caliper, neither read at a
 * primary source.
 */
const THICKNESS: string =
  "150 to 650 pages inside the 24 to 828 page range of Amazon KDP (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6) at about 0.06 mm per page, a printer's spine formula seen only in search results";

/** Office paper sizes from a secondary source. */
const PAPER: string =
  "ISO 216 A4, 210 x 297 mm, and US Letter, 216 x 279 mm (Wikipedia, Paper size, https://en.wikipedia.org/wiki/Paper_size)";

/** A ballpoint pen from a secondary source, with the precision handle band. */
const PEN: string =
  "BIC Cristal, 14.45 cm without and 14.9 cm with its cap (Wikipedia, Bic Cristal, https://en.wikipedia.org/wiki/Bic_Cristal); barrel inside the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)";

/**
 * Michelin's folded road map: its folded size read at the maker, its thickness
 * and mass seen only in listings.
 */
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

/** The seeded recipes originally published as `createStationery`. */
export namespace StationeryDraw {
  /** The kinds. */
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
   * - `grip`: the hold: a book by the middle of its spine, the hand closing
   *   across its thickness (the frame's `+Y` is up, out of the cover) along the
   *   spine's length; a sheet pinched from above at its near edge, a clipboard
   *   or a map pinched at its `+Z` edge, a pen pinched 30 mm from its tip (an
   *   estimate).
   * - `face`: the working face: a book's front cover, which rides the hinge; a
   *   sheet's, a clipboard's or a map's upper side; a pen's tip, facing along
   *   the pen.
   * - `hinge` and `edge`: a book's cover hinge and its riding fore-edge.
   * - `page` and `page-edge`: a book's single leaf hinge and its riding
   *   fore-edge.
   * - `fold` and `fold-edge`: a map's crease and its riding free edge.
   * - `support-grip`: the `+Z` edge of the map's base panel, held across just
   *   that panel while folding.
   *
   * Each hinge lifts its part with positive travel from the closed position
   * through 180 degrees.
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
   */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** A clipboard's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `stationery` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The clipboards read: Esselte's 56055 and 604037, both A4. */
  export type Model = "56055" | "604037";

  /**
   * Each kind's models whole, the default first: Esselte's 232 x 3 x 349 mm
   * clipboards (W x H x D), 168 g for the 56055 and 190 g for the 604037
   * (https://docs.rs-online.com/6055/A700000015150044.pdf,
   * https://docs.rs-online.com/86b9/A700000015142764.pdf).
   */
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
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    book: {
      width: AutoMovieArchetypeBand.metres(0.11, 0.156, BOOK, true),
      length: AutoMovieArchetypeBand.metres(0.178, 0.234, BOOK, true),
      thickness: AutoMovieArchetypeBand.metres(0.009, 0.039, THICKNESS, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.17,
        0.34,
        "mass-market paperback mass, bookseller figures seen only in search results",
        true,
      ),
    },
    paper: {
      width: AutoMovieArchetypeBand.metres(0.21, 0.216, PAPER, true),
      length: AutoMovieArchetypeBand.metres(0.279, 0.297, PAPER, true),
      thickness: AutoMovieArchetypeBand.metres(
        0.0001,
        0.0001,
        "80 g/m2 office paper is about 0.1 mm thick, not read at a source",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.0048,
        0.005,
        "80 g/m2 over the sheet's area, the grammage not read at a source",
        true,
      ),
    },
    pen: {
      length: AutoMovieArchetypeBand.metres(0.1445, 0.149, PEN, true),
      thickness: AutoMovieArchetypeBand.metres(0.006, 0.013, PEN, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.005,
        0.01,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    clipboard: {},
    map: {
      width: AutoMovieArchetypeBand.metres(0.11, 0.11, MAP),
      length: AutoMovieArchetypeBand.metres(0.25, 0.25, MAP),
      thickness: AutoMovieArchetypeBand.metres(0.007, 0.007, MAP, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.089, 0.09, MAP, true),
    },
  };

  /** What {@link prepare} prepares for its caller. */
  export interface IPrepareResult<Id extends Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Prepare an empty builder and the previously recorded stationery dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene
   *   ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or
   *   undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter
   *   lies outside its admitted recipe.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "stationery",
        UNITS,
        seed,
        params,
      );
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
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: kind === "paper" || kind === "map" ? "paper" : "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /** A paper panel's size. */
  export interface IPanel {
    /** Across the panel, metres. */
    width: number;

    /** Along the panel, metres. */
    length: number;

    /** The panel thickness, metres. */
    thick: number;
  }

  /**
   * Register the edge pinch and working face of a writing surface. The grip
   * lies on the near edge at `+Z`, so the face's top, its head or clip end, is
   * toward `-Z`, the face frame's own `-Z`.
   *
   * @param builder The prop under construction.
   * @param dimensions The panel width, length and thickness in metres.
   * @param gripInset How far the grip lies from the near edge, in metres.
   * @param rides The hinge that carries a folded panel's working face.
   */
  export function addPanelContacts(
    builder: AutoMovieArchetypeBuilder<Affordance, Dimension>,
    dimensions: IPanel,
    gripInset: number,
    rides?: "fold",
  ): void {
    const { width, length, thick }: typeof dimensions = dimensions;
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
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
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, thick, 0)),
      extent: null,
      width,
      depth: length,
      ...(rides === undefined ? {} : { rides }),
    });
  }
}
