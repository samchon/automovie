import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { TABLE_BANDS } from "./TABLE_BANDS";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createTable.Kind, string>> = {
  dining: "dining table",
  desk: "desk",
  counter: "counter",
  coffee: "coffee table",
  bar: "bar counter",
  serviceCounter: "service counter",
  workbench: "workbench",
  pupilDesk: "pupil desk",
  altar: "altar",
};

/** A bar counter's knee space under its top's front, metres: NKBA Guideline 9's 12 in (305 mm) for a 42 in counter. */
const KNEE: number = 0.305;

/**
 * A table: a dining table, a desk, a counter, a coffee table, a raised bar counter, a service counter, a workbench, a pupil desk or an altar.
 *
 * The model is a top on four legs, on a solid base for a counter, a bar counter and a service counter, or on two pedestals for an altar. The top is centred over the origin with its length along `+X`; the `+Z` edge is the front, where a person sits or stands at it.
 *
 * @param params The kind, a service counter's or a pupil desk's listed size, and any dimension the author fixes.
 * @param seed The seed that picks a listed size when none is given and draws every dimension left free inside its band; absent, the first size and the middle of each band.
 * @returns The table.
 * @throws {AutoMovieArchetypeRefusal} For a size the kind does not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled and which edge is the front.
 * @evidence contracts/development/implementation.md#principled-implementation A top slab at the drawn height on legs or a plinth; the top is declared twice, as the `surface` a person works and leans at and as the `stack-top` an object is set on, and each edge is a `ledge` facing out.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions and pick a listed size, build the top and its support, then the top's contacts and the four edges.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No drawer or apron. The legs stand with their centres `LEG_INSET` in from the top's edges and are `LEG_RADIUS` round, so the top overhangs their outer faces by the difference on every side, and an altar's pedestals stand `LEG_INSET` in from the top's ends; a counter's and a service counter's top overhangs its base by `COUNTER_OVERHANG` at the front and a bar counter's by the guideline's knee space, each base flush with the top at the back and at both ends. A pupil desk's top is its sheet's 5/8 in; the others' 40 mm and an altar's pedestals (`ALTAR_PEDESTAL`) are construction estimates no act reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTable(
  params: createTable.IParams,
  seed?: number | string,
): AutoMovieArchetype<createTable.Affordance, createTable.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createTable.Dimension> =
    new AutoMovieArchetypeDrawSession<createTable.Dimension>(
      "table",
      createTable.UNITS,
      seed,
      params,
    );
  const kind: createTable.Kind = ArchetypeDraw.choice(
    "table",
    "kind",
    params.kind,
    createTable.KINDS,
  );
  const d: Partial<Record<createTable.Dimension, number>> = draw.dimensions(
    createTable.BANDS[kind],
    createTable.BANDS,
  );
  // A service counter's length and a pupil desk's height are one of the sizes their sheets list, never a value between two.
  const size: {
    figures: Readonly<Partial<Record<createTable.Dimension, number>>>;
  } = draw.model("size", params.size, createTable.SIZES[kind]);
  const sized: Partial<Record<createTable.Dimension, number>> = {
    ...d,
    ...size.figures,
  };
  const height: number = sized.height!;
  const length: number = sized.length!;
  const depth: number = sized.depth!;
  const builder: AutoMovieArchetypeBuilder<
    createTable.Affordance,
    createTable.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const slab: number = kind === "pupilDesk" ? createTable.PUPIL_TOP : 0.04;
  builder.box(
    "top",
    Vector3.create(length, slab, depth),
    Vector3.create(0, height - slab / 2, 0),
    { color: "#a9825a" },
  );
  if (kind === "altar") {
    // Two pedestals under the top's ends, each standing the legs' inset in from its end.
    const wide: number = length * createTable.ALTAR_PEDESTAL.width;
    const deep: number = depth * createTable.ALTAR_PEDESTAL.depth;
    for (const [name, sx] of [
      ["pedestal-left", 1],
      ["pedestal-right", -1],
    ] as const)
      builder.box(
        name,
        Vector3.create(wide, height - slab, deep),
        Vector3.create(
          sx * (length / 2 - createTable.LEG_INSET - wide / 2),
          (height - slab) / 2,
          0,
        ),
        { color: "#a9825a" },
      );
  } else if (
    kind === "counter" ||
    kind === "bar" ||
    kind === "serviceCounter"
  ) {
    const overhang: number =
      kind === "bar" ? KNEE : createTable.COUNTER_OVERHANG;
    builder.box(
      "base",
      Vector3.create(length, height - slab, depth - overhang),
      Vector3.create(0, (height - slab) / 2, -overhang / 2),
      { color: "#d9d5cc", density: 0.3 },
    );
  } else
    for (const [name, sx, sz] of [
      ["leg-front-left", 1, 1],
      ["leg-front-right", -1, 1],
      ["leg-back-left", 1, -1],
      ["leg-back-right", -1, -1],
    ] as const)
      builder.rod(
        name,
        createTable.LEG_RADIUS,
        Vector3.create(
          sx * (length / 2 - createTable.LEG_INSET),
          0,
          sz * (depth / 2 - createTable.LEG_INSET),
        ),
        Vector3.create(
          sx * (length / 2 - createTable.LEG_INSET),
          height - slab,
          sz * (depth / 2 - createTable.LEG_INSET),
        ),
        { color: "#a9825a" },
      );

  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width: length,
    depth,
  });
  builder.affordance({
    id: "stack",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
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
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create((x * length) / 2, height, (z * depth) / 2),
        Vector3.create(0, 1, 0),
        Vector3.create(z, 0, -x),
      ),
      extent: null,
      length: span,
    });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createTable}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The height a seated or standing person works at and the top's size (#3370, #3468 N6, N12, N16).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A size a sheet lists as discrete steps is picked whole from `SIZES`, never drawn between two; every other dimension is a band.
 */
export namespace createTable {
  /** The kinds of table. */
  export type Kind =
    | "dining"
    | "desk"
    | "counter"
    | "coffee"
    | "bar"
    | "serviceCounter"
    | "workbench"
    | "pupilDesk"
    | "altar";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "dining",
    "desk",
    "counter",
    "coffee",
    "bar",
    "serviceCounter",
    "workbench",
    "pupilDesk",
    "altar",
  ];

  /** The sizes a sheet lists in steps: a service counter's lengths (`length30`, `length36`, `length50`, Delfield's 30, 36 and 50 in) and a pupil desk's heights (`height19` to `height31`, Smith System's 19 to 31 in in 1 in steps). */
  export type Size =
    | "length30"
    | "length36"
    | "length50"
    | "height19"
    | "height20"
    | "height21"
    | "height22"
    | "height23"
    | "height24"
    | "height25"
    | "height26"
    | "height27"
    | "height28"
    | "height29"
    | "height30"
    | "height31";

  /** Each kind's listed sizes, the default first, each with the dimension it fixes, metres; a kind not listed has none. */
  export const SIZES: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<
          Partial<Record<Size, Readonly<Partial<Record<Dimension, number>>>>>
        >
      >
    >
  > = {
    serviceCounter: {
      length30: { length: 30 * AutoMovieArchetypeUnits.INCH },
      length36: { length: 36 * AutoMovieArchetypeUnits.INCH },
      length50: { length: 50 * AutoMovieArchetypeUnits.INCH },
    },
    pupilDesk: {
      height19: { height: 19 * AutoMovieArchetypeUnits.INCH },
      height20: { height: 20 * AutoMovieArchetypeUnits.INCH },
      height21: { height: 21 * AutoMovieArchetypeUnits.INCH },
      height22: { height: 22 * AutoMovieArchetypeUnits.INCH },
      height23: { height: 23 * AutoMovieArchetypeUnits.INCH },
      height24: { height: 24 * AutoMovieArchetypeUnits.INCH },
      height25: { height: 25 * AutoMovieArchetypeUnits.INCH },
      height26: { height: 26 * AutoMovieArchetypeUnits.INCH },
      height27: { height: 27 * AutoMovieArchetypeUnits.INCH },
      height28: { height: 28 * AutoMovieArchetypeUnits.INCH },
      height29: { height: 29 * AutoMovieArchetypeUnits.INCH },
      height30: { height: 30 * AutoMovieArchetypeUnits.INCH },
      height31: { height: 31 * AutoMovieArchetypeUnits.INCH },
    },
  };

  /** How far in from the top's edges the legs' centres stand, metres: a construction estimate no act reads. */
  export const LEG_INSET: number = 0.05;

  /** A leg's radius, metres: a construction estimate no act reads. */
  export const LEG_RADIUS: number = 0.025;

  /** How far a counter's and a service counter's top reaches past its base at the front, metres: a construction estimate no act reads. */
  export const COUNTER_OVERHANG: number = 0.05;

  /** A pupil desk's top thickness, metres: its sheet's 5/8 in. */
  export const PUPIL_TOP: number = (5 / 8) * AutoMovieArchetypeUnits.INCH;

  /** An altar's two pedestals as shares of its top's length and depth: construction estimates no act reads, since the catalog draws but does not size them. */
  export const ALTAR_PEDESTAL: Readonly<{ width: number; depth: number }> = {
    width: 0.2,
    depth: 0.7,
  };

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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    depth: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which table. */
    kind: Kind;

    /** A service counter's length or a pupil desk's height, one of the kind's `SIZES`; drawn from the seed when absent. */
    size?: Size;

    /** The model's id, unique in a scene; `table` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind: every dimension's, except a service counter's length and a pupil desk's height, which are picked from `SIZES`. */
  export const BANDS: Readonly<
    Record<
      Exclude<Kind, "serviceCounter" | "pupilDesk">,
      Readonly<Record<Dimension, IAutoMovieArchetypeBand>>
    > & {
      serviceCounter: Readonly<
        Record<Exclude<Dimension, "length">, IAutoMovieArchetypeBand>
      >;
      pupilDesk: Readonly<
        Record<Exclude<Dimension, "height">, IAutoMovieArchetypeBand>
      >;
    }
  > = TABLE_BANDS;
}
