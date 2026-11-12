import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
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

/** The readable name of each kind. */
const NAMES: Readonly<Record<createStationery.Kind, string>> = {
  book: "book",
  paper: "sheet of paper",
  pen: "pen",
};

/**
 * A book, a sheet of paper or a pen.
 *
 * A book lies closed on its back cover at the origin, its spine along `+Z` on the `-X` side; its front half is a part on the `hinge` along the spine, so opening the book turns it. A sheet lies flat at the origin, its long side along `+Z`. A pen lies along `+Z` from its end at the origin to its tip.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The book, the sheet or the pen.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
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
  const kind: createStationery.Kind = ArchetypeDraw.choice(
    "stationery",
    "kind",
    params.kind,
    createStationery.KINDS,
  );
  const d: Partial<Record<createStationery.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "stationery",
      createStationery.BANDS[kind],
      seed,
      params,
      createStationery.BANDS,
    );
  const builder: ArchetypeBuilder<
    createStationery.Affordance,
    createStationery.Dimension
  > = new ArchetypeBuilder({
    archetype: "stationery",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
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
      frame: ArchetypeFrame.facing(
        Vector3.create(0, thick / 2, length),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  if (kind === "paper") {
    builder.box(
      "sheet",
      Vector3.create(width, thick, length),
      Vector3.create(0, thick / 2, 0),
      { color: "#f4f2ec" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, thick / 2, length / 2 - 0.02),
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
    frame: ArchetypeFrame.upright(Vector3.create(0, thick, 0)),
    extent: null,
    width,
    depth: length,
    rides: "hinge",
  });
  builder.affordance({
    id: "edge",
    kind: "handle",
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
  export type Kind = "book" | "paper" | "pen";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["book", "paper", "pen"];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold: a book by the middle of its spine, the hand closing across its thickness (the frame's `+Y` is up, out of the cover) along the spine's length; a sheet pinched from above at its near edge, a pen pinched 30 mm from its tip (an estimate).
   * - `face`: the working face: a book's front cover, which rides the hinge; a sheet's upper side; a pen's tip, facing along the pen.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** The model's id, unique in a scene; `stationery` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
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
  };
}
