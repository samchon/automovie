import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
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
const NAMES: Readonly<Record<createStationery.Kind, string>> = {
  book: "book",
  paper: "sheet of paper",
  pen: "pen",
  clipboard: "clipboard",
  map: "folded map",
};

/**
 * A book, a sheet of paper, a pen, a clipboard or a folded road map.
 *
 * A book lies closed on its back cover at the origin, its spine along `+Z` on the `-X` side; its front half is a part on the `hinge` along the spine, so opening the book turns it. A sheet, a clipboard and a folded map lie flat at the origin, their long side along `+Z`; a clipboard's and a map's `grip` is their whole `+Z` edge, pinched across their thickness, and their `face` their upper side. A clipboard's clip waits for a source of its size, and a map does not unfold.
 *
 * @param params The kind, the kind's model where it has read models, and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The book, the sheet or the pen.
 * @throws {ArchetypeRefusal} For a model the kind does not have, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each thing lies and what opens.
 * @evidence contracts/development/implementation.md#principled-implementation Dimensioned boxes and a rod; the book's two halves share the spine as a hinge axis, turning about `+Z` so a positive travel lifts the front cover over toward `-X`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pages are not modelled; a book opens as two blocks.
 * @evidence contracts/development/implementation.md#efficient-algorithms One or two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createStationery(
  params: createStationery.IParams,
  seed?: number | string,
): Archetype<createStationery.Affordance, createStationery.Dimension> {
  const draw: ArchetypeDrawSession<createStationery.Dimension> =
    new ArchetypeDrawSession<createStationery.Dimension>(
      "stationery",
      createStationery.UNITS,
      seed,
      params,
    );
  const kind: createStationery.Kind = ArchetypeDraw.choice(
    "stationery",
    "kind",
    params.kind,
    createStationery.KINDS,
  );
  const drawn: Partial<Record<createStationery.Dimension, number>> =
    draw.dimensions(createStationery.BANDS[kind], createStationery.BANDS);
  // A clipboard is one of Esselte's two models whole.
  const model: {
    name: createStationery.Model | undefined;
    figures: createStationery.Figures;
  } = draw.model<createStationery.Model>(
    "model",
    params.model,
    createStationery.MODELS[kind],
  );
  const d: Partial<Record<createStationery.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createStationery.Affordance,
    createStationery.Dimension
  > = new ArchetypeBuilder({
    material: kind === "paper" || kind === "map" ? "paper" : "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;

  if (kind === "pen") {
    builder.rod(
      "barrel",
      thick / 2,
      Vector3.create(0, thick / 2, 0),
      Vector3.create(0, thick / 2, length),
      { color: "#2a4d8f" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, thick / 2, length - 0.03),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "precision",
      aperture: thick,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, thick / 2, length),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  if (kind === "paper" || kind === "clipboard" || kind === "map") {
    builder.box(
      kind === "paper" ? "sheet" : kind === "clipboard" ? "board" : "map",
      Vector3.create(width, thick, length),
      Vector3.create(0, thick / 2, 0),
      { color: kind === "clipboard" ? "#8a6a4a" : "#f4f2ec" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(
          0,
          thick / 2,
          length / 2 - (kind === "paper" ? 0.02 : 0),
        ),
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
    });
    return builder.build(d.mass!);
  }

  // A book: two blocks stacked, the upper one turning about the spine at the hinge's frame.
  builder.box(
    "back",
    Vector3.create(width, thick / 2, length),
    Vector3.create(0, thick / 4, 0),
    { color: "#7a3b2e" },
  );
  builder.box(
    "front",
    Vector3.create(width, thick / 2, length),
    Vector3.create(0, (3 * thick) / 4, 0),
    { color: "#8d4636" },
  );
  builder.affordance({
    id: "hinge",
    kind: "hinge",
    frame: ArchetypeFrame.facing(
      Vector3.create(-width / 2, thick / 2, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    travel: 180,
    parts: ["front"],
  });

  // The closed book is held by its spine, the `-X` edge the hinge lies on, which stays where it is when the book opens.
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(-width / 2, thick / 2, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: thick,
    length,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.upright(Vector3.create(0, thick, 0)),
    extent: null,
    width,
    depth: length,
    rides: "hinge",
  });
  builder.affordance({
    id: "edge",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(width / 2, (3 * thick) / 4, 0),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    length,
    rides: "hinge",
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createStationery}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sizes a hold, a page turn and a pen grip read (#3369).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `grip` and `face` name the same role on each kind, so an act written for one reads the others.
 */
export namespace createStationery {
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
   * - `grip`: the hold: a book by the middle of its spine, the hand closing across its thickness (the frame's `+Y` is up, out of the cover) along the spine's length; a sheet pinched from above at its near edge, a clipboard or a map pinched at its `+Z` edge, a pen pinched 30 mm from its tip (an estimate).
   * - `face`: the working face: a book's front cover, which rides the hinge; a sheet's, a clipboard's or a map's upper side; a pen's tip, facing along the pen.
   * - `hinge`: a book's spine, turning the front half up to 180 degrees.
   * - `edge`: the fore-edge of a book's front half, pinched to open it; it rides the hinge.
   */
  export type Affordance = "grip" | "face" | "hinge" | "edge";

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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    length: "m",
    thickness: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
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
}
