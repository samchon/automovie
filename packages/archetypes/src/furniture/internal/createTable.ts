import { AutoMovieArchetypeTable } from "../AutoMovieArchetypeTable";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";
import "../constants/TABLE_BANDS";

/**
 * A table: a dining table, a desk, a counter, a coffee table, a raised bar
 * counter, a service counter, a workbench, a pupil desk or an altar.
 *
 * The model is a top on four legs, on a solid base for a counter, a bar counter
 * and a service counter, or on two pedestals for an altar. The top is centred
 * over the origin with its length along `+X`; the `+Z` edge is the front, where
 * a person sits or stands at it.
 *
 * @param params The kind, a service counter's or a pupil desk's listed size,
 *   and any dimension the author fixes.
 * @param seed The seed that picks a listed size when none is given and draws
 *   every dimension left free inside its band; absent, the first size and the
 *   middle of each band.
 * @returns The table.
 * @throws {AutoMovieArchetypeRefusal} For a size the kind does not list, or a
 *   fixed dimension outside its band.
 */
export function createTable(
  params: AutoMovieArchetypeTable.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTable.Affordance, AutoMovieArchetypeTable.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTable.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTable.Dimension>(
      "table",
      AutoMovieArchetypeTable.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeTable.Kind = ArchetypeDraw.choice(
    "table",
    "kind",
    params.kind,
    AutoMovieArchetypeTable.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeTable.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeTable.BANDS[kind],
    AutoMovieArchetypeTable.BANDS,
  );
  // A service counter's length and a pupil desk's height are one of the sizes their sheets list, never a value between two.
  const size: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeTable.Dimension, number>>>;
  } = draw.model("size", params.size, AutoMovieArchetypeTable.SIZES[kind]);
  const sized: Partial<Record<AutoMovieArchetypeTable.Dimension, number>> = {
    ...d,
    ...size.figures,
  };
  const height: number = sized.height!;
  const length: number = sized.length!;
  const depth: number = sized.depth!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTable.Affordance,
    AutoMovieArchetypeTable.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const slab: number = kind === "pupilDesk" ? AutoMovieArchetypeTable.PUPIL_TOP : 0.04;
  builder.box(
    "top",
    Vector3.create(length, slab, depth),
    Vector3.create(0, height - slab / 2, 0),
    { color: "#a9825a" },
  );
  if (kind === "altar") {
    // Two pedestals under the top's ends, each standing the legs' inset in from its end.
    const wide: number = length * AutoMovieArchetypeTable.ALTAR_PEDESTAL.width;
    const deep: number = depth * AutoMovieArchetypeTable.ALTAR_PEDESTAL.depth;
    for (const [name, sx] of [
      ["pedestal-left", 1],
      ["pedestal-right", -1],
    ] as const)
      builder.box(
        name,
        Vector3.create(wide, height - slab, deep),
        Vector3.create(
          sx * (length / 2 - AutoMovieArchetypeTable.LEG_INSET - wide / 2),
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
      kind === "bar" ? KNEE : AutoMovieArchetypeTable.COUNTER_OVERHANG;
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
        AutoMovieArchetypeTable.LEG_RADIUS,
        Vector3.create(
          sx * (length / 2 - AutoMovieArchetypeTable.LEG_INSET),
          0,
          sz * (depth / 2 - AutoMovieArchetypeTable.LEG_INSET),
        ),
        Vector3.create(
          sx * (length / 2 - AutoMovieArchetypeTable.LEG_INSET),
          height - slab,
          sz * (depth / 2 - AutoMovieArchetypeTable.LEG_INSET),
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

/** The readable name of each kind. */
const NAMES: Readonly<Record<AutoMovieArchetypeTable.Kind, string>> = {
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

/**
 * A bar counter's knee space under its top's front, metres: NKBA Guideline 9's
 * 12 in (305 mm) for a 42 in counter.
 */
const KNEE: number = 0.305;
