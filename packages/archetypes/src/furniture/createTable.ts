import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The UK furniture schedule. */
const ADM: string =
  "Approved Document M Volume 1, Appendix D furniture schedule (https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/540330/BR_PDF_AD_M1_2015_with_2016_amendments_V3.pdf)";

/** The kitchen planning guidelines. */
const NKBA: string =
  "NKBA Kitchen Planning Guidelines with Access Standards (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf)";

/** The office desk standard. */
const EN527: string =
  "EN 527-1:2011 Table 1 (https://cdn.standards.iteh.ai/samples/26022/6cc3729a004c4ce9a231c68a38e8620c/SIST-EN-527-1-2012.pdf)";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createTable.Kind, string>> = {
  dining: "dining table",
  desk: "desk",
  counter: "counter",
  coffee: "coffee table",
};

/**
 * A table: a dining table, a desk, a counter or a coffee table.
 *
 * The model is a top on four legs, or on a solid base for a counter. The top is centred over the origin with its length along `+X`; the `+Z` edge is the front, where a person sits or stands at it.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The table.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled and which edge is the front.
 * @evidence contracts/development/implementation.md#principled-implementation A top slab at the drawn height on legs or a plinth; the top is declared twice, as the `surface` a person works and leans at and as the `stack-top` an object is set on, and each edge is a `ledge` facing out.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the top and its support, then the top's contacts and the four edges.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No drawer or apron. The top overhangs its legs by 25 mm on every side; a counter's top overhangs its base by 50 mm at the front, the base flush with the top at the back and at both ends.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTable(
  params: createTable.IParams,
  seed?: number | string,
): Archetype<createTable.Affordance, createTable.Dimension> {
  const kind: createTable.Kind = ArchetypeDraw.choice(
    "table",
    "kind",
    params.kind,
    createTable.KINDS,
  );
  const d: Record<createTable.Dimension, number> = ArchetypeDraw.dimensions(
    "table",
    createTable.BANDS[kind],
    seed,
    params,
    createTable.BANDS,
  );
  const { height, length, depth }: Record<createTable.Dimension, number> = d;
  const builder: ArchetypeBuilder<
    createTable.Affordance,
    createTable.Dimension
  > = new ArchetypeBuilder({
    archetype: "table",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  const slab: number = 0.04;
  builder.box(
    "top",
    Vector3.create(length, slab, depth),
    Vector3.create(0, height - slab / 2, 0),
    { color: "#a9825a" },
  );
  if (kind === "counter")
    builder.box(
      "base",
      Vector3.create(length, height - slab, depth - 0.05),
      Vector3.create(0, (height - slab) / 2, -0.025),
      { color: "#d9d5cc", density: 0.3 },
    );
  else
    for (const [name, sx, sz] of [
      ["leg-front-left", 1, 1],
      ["leg-front-right", -1, 1],
      ["leg-back-left", 1, -1],
      ["leg-back-right", -1, -1],
    ] as const)
      builder.rod(
        name,
        0.025,
        Vector3.create(sx * (length / 2 - 0.05), 0, sz * (depth / 2 - 0.05)),
        Vector3.create(
          sx * (length / 2 - 0.05),
          height - slab,
          sz * (depth / 2 - 0.05),
        ),
        { color: "#a9825a" },
      );

  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width: length,
    depth,
  });
  builder.affordance({
    id: "stack",
    kind: "stack-top",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: [
      Vector3.create(-length / 2, 0, -depth / 2),
      Vector3.create(length / 2, 0, -depth / 2),
      Vector3.create(length / 2, 0, depth / 2),
      Vector3.create(-length / 2, 0, depth / 2),
    ],
  });

  // Each edge of the top: the edge along the affordance's +X, +Z out from the table.
  for (const [id, x, z, span] of [
    ["front", 0, 1, length],
    ["back", 0, -1, length],
    ["left", 1, 0, depth],
    ["right", -1, 0, depth],
  ] as const)
    builder.affordance({
      id,
      kind: "ledge",
      frame: ArchetypeFrame.facing(
        Vector3.create((x * length) / 2, height, (z * depth) / 2),
        Vector3.create(0, 1, 0),
        Vector3.create(z, 0, -x),
      ),
      extent: null,
      length: span,
    });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createTable}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The height a seated or standing person works at and the top's size (#3370).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every kind has every dimension, so the bands are total records.
 */
export namespace createTable {
  /** The kinds of table. */
  export type Kind = "dining" | "desk" | "counter" | "coffee";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["dining", "desk", "counter", "coffee"];

  /**
   * The affordance ids:
   *
   * - `top`: the top as a face a person writes, leans or places a hand on.
   * - `stack`: the same top as a face an object is set down on.
   * - `front`, `back`, `left`, `right`: the top's edges on `+Z`, `-Z`, `+X` and `-X`, each facing out.
   */
  export type Affordance =
    | "top"
    | "stack"
    | "front"
    | "back"
    | "left"
    | "right";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the floor.
   * - `length`: the top along `+X`.
   * - `depth`: the top along `+Z`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "depth" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which table. */
    kind: Kind;

    /** The model's id, unique in a scene; `table` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    dining: {
      height: ArchetypeBand.metres(
        0.71,
        0.762,
        `2010 ADA Standards 902.3, dining surface at least 28 in high (https://www.access-board.gov/ada/), up to the 30 in table of ${NKBA}`,
      ),
      length: ArchetypeBand.metres(
        0.8,
        1.65,
        `${ADM}: dining table 800 mm deep and 800 to 1650 mm long`,
      ),
      depth: ArchetypeBand.metres(0.8, 0.8, `${ADM}: dining table 800 mm deep`),
      mass: ArchetypeBand.of("kg", 20, 45, ArchetypeBand.TYPICAL_MASS, true),
    },
    desk: {
      height: ArchetypeBand.metres(
        0.72,
        0.76,
        `${EN527}: fixed height desk, 740 mm plus or minus 20`,
      ),
      length: ArchetypeBand.metres(
        1.17,
        1.52,
        "ANSI/HFES 100-2007, work surface at least 46 in wide and 60 in recommended, as quoted by the University of Washington furniture guide (https://facilities.uw.edu/files/media/uwf-ds-eh-and-s-office-ergonomics-furniture-design.pdf)",
        true,
      ),
      depth: ArchetypeBand.metres(
        0.6,
        0.8,
        `${EN527}: desk top at least 800 mm deep, 600 mm acceptable in some situations`,
      ),
      mass: ArchetypeBand.of("kg", 20, 45, ArchetypeBand.TYPICAL_MASS, true),
    },
    counter: {
      height: ArchetypeBand.metres(
        0.914,
        0.914,
        `${NKBA}: 36 in (914 mm) high counters`,
      ),
      length: ArchetypeBand.metres(
        1.2,
        2.4,
        "counter run length, not read at a source",
        true,
      ),
      depth: ArchetypeBand.metres(
        0.508,
        0.635,
        `${NKBA}: 508 to 635 mm deep counter`,
      ),
      mass: ArchetypeBand.of("kg", 40, 90, ArchetypeBand.TYPICAL_MASS, true),
    },
    coffee: {
      height: ArchetypeBand.metres(
        0.4,
        0.45,
        "coffee table height, not read at a source",
        true,
      ),
      length: ArchetypeBand.metres(
        1.05,
        1.05,
        `${ADM}: coffee table 500 x 1050 mm`,
      ),
      depth: ArchetypeBand.metres(
        0.5,
        0.5,
        `${ADM}: coffee table 500 x 1050 mm`,
      ),
      mass: ArchetypeBand.of("kg", 8, 20, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
