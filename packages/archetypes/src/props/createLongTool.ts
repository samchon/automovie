import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Broom and mop handles from a maker's listings seen in search results. */
const HANDLES: string =
  "Rubbermaid Commercial broom handle, 60 in by 15/16 in, and mop handles, 54 in by 1 in, listings seen only in search results";

/** D-handle shovels from retailer listings seen in search results. */
const SHOVEL: string =
  "Bully Tools 82510, 41.5 in and 4.5 lb, and Fiskars D-handle shovels, 44.75 to 46 in and 4.85 to 5.6 lb, retailer listings seen only in search results";

/** A maker's spinning rods, read. */
const ROD: string =
  "Daiwa Ninja X spin rods, 7 ft 0 in (213 cm), 131 and 133 g (https://www.daiwa.com/scandinavia/product/n753a5g)";

/**
 * A long tool: a broom, a mop or a shovel that works on the floor or the ground, or a fishing rod.
 *
 * The tool stands upright along `+Y`, its head or blade on the floor at the origin and its shaft rising to the top. Both hands hold the `shaft`, each at a site along it; a shovel also has a D grip at its top. The `face` is the head's working side, facing down. A fishing rod stands on its butt with its tip up: one hand takes its `grip` at the butt, and its `tip` is the rod's end, `+Y` along it.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tool.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tool stands, where the hands go and which way the head faces.
 * @evidence contracts/development/implementation.md#principled-implementation A shaft rod with a head box; the shaft is one `bar` whose sites the two hands share, so the hand spacing is the holding act's choice.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the shaft and the head, then a shovel's grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bristles and strands are one block; a shovel's blade is a flat plate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts for a broom or a mop, a head and a shaft; four for a shovel, with its grip and yoke; one for a fishing rod.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLongTool(
  params: createLongTool.IParams,
  seed?: number | string,
): Archetype<createLongTool.Affordance, createLongTool.Dimension> {
  const kind: createLongTool.Kind = ArchetypeDraw.choice(
    "longTool",
    "kind",
    params.kind,
    createLongTool.KINDS,
  );
  const d: Partial<Record<createLongTool.Dimension, number>> =
    ArchetypeDraw.dimensions<createLongTool.Dimension>(
      "longTool",
      createLongTool.BANDS[kind],
      seed,
      params,
      createLongTool.BANDS,
    );
  const length: number = d.length!;
  const radius: number = d.shaftDiameter! / 2;
  const builder: ArchetypeBuilder<
    createLongTool.Affordance,
    createLongTool.Dimension
  > = new ArchetypeBuilder({
    archetype: "longTool",
    id: params.id,
    name: kind,
    dimensions: d,
  });

  if (kind === "fishingRod") {
    // A rod on its butt: the grip a hand takes and the tip it casts with.
    const grip: number = createLongTool.ROD_GRIP;
    builder.rod("rod", radius, Vector3.create(0, 0, 0), Vector3.create(0, length, 0), {
      color: "#2c2f33",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, grip / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: grip,
    });
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(Vector3.create(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // The head on the floor: a broom's block, a mop's pad, a shovel's blade standing on its edge.
  const head: number =
    kind === "shovel" ? 0.29 : kind === "broom" ? 0.08 : 0.03;
  const wide: number =
    kind === "shovel" ? createLongTool.BLADE_WIDTH : createLongTool.HEAD_WIDTH;
  builder.box(
    "head",
    kind === "shovel"
      ? Vector3.create(wide, head, 0.004)
      : Vector3.create(wide, head, kind === "broom" ? 0.05 : 0.12),
    Vector3.create(0, head / 2, 0),
    {
      color: kind === "shovel" ? "#6c7076" : "#c9a24a",
      density: kind === "shovel" ? 8 : 1,
    },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width: wide,
  });

  const top: number = kind === "shovel" ? length - 0.1 : length;
  builder.rod(
    "shaft",
    radius,
    Vector3.create(0, head, 0),
    Vector3.create(0, top, 0),
    { color: "#b98d5b" },
  );
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, (head + top) / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: 2 * radius,
    length: top - head,
  });

  if (kind === "shovel") {
    // The D grip: a cross bar held from above, joined to the shaft by its yoke.
    builder.rod(
      "grip",
      radius,
      Vector3.create(-createLongTool.D_GRIP / 2, length - radius, 0),
      Vector3.create(createLongTool.D_GRIP / 2, length - radius, 0),
      { color: "#b98d5b" },
    );
    builder.box(
      "yoke",
      Vector3.create(0.12, 0.1 - 2 * radius, 0.01),
      Vector3.create(0, top + (0.1 - 2 * radius) / 2, 0),
      { color: "#b98d5b", density: 0.2 },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.upright(Vector3.create(0, length - radius, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: createLongTool.D_GRIP,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createLongTool}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shaft two hands hold, its length and the mass (#3369, #3361).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The two hands share one bar and its sites instead of two fixed hand places.
 */
export namespace createLongTool {
  /** The kinds of tool. */
  export type Kind = "broom" | "mop" | "shovel" | "fishingRod";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["broom", "mop", "shovel", "fishingRod"];

  /** A fishing rod's grip length, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const ROD_GRIP: number = 0.12;

  /** The width of a broom's or a mop's head along `+X`, metres, which its `face` publishes. An estimate, not read at a source. */
  export const HEAD_WIDTH: number = 0.3;

  /** The width of a shovel's blade along `+X`, metres, which its `face` publishes. An estimate, not read at a source. */
  export const BLADE_WIDTH: number = 0.22;

  /** The length of the cross bar of a shovel's D grip, metres, the run one hand holds. An estimate, not read at a source. */
  export const D_GRIP: number = 0.11;

  /**
   * The affordance ids:
   *
   * - `shaft`: the shaft, a bar both hands hold at sites along it.
   * - `grip`: a shovel's D grip at its top, held from above; a fishing rod's grip at its butt, taken from `-Z`.
   * - `face`: the working side of the head, facing down onto the floor or the ground.
   * - `tip`: a fishing rod's end, `+Y` along it.
   */
  export type Affordance = "shaft" | "grip" | "face" | "tip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `shaftDiameter`: the shaft the hands wrap.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "shaftDiameter" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** The model's id, unique in a scene; `longTool` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    fishingRod: {
      length: ArchetypeBand.metres(2.13, 2.13, ROD),
      shaftDiameter: ArchetypeBand.metres(
        0.032,
        0.038,
        "no rod grip diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a rod's grip",
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.131, 0.133, ROD),
    },
    broom: {
      length: ArchetypeBand.metres(
        1.524,
        1.604,
        `${HANDLES}; the head adds 8 cm`,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(0.0238, 0.0254, HANDLES, true),
      mass: ArchetypeBand.of("kg", 0.5, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    mop: {
      length: ArchetypeBand.metres(
        1.372,
        1.402,
        `${HANDLES}; the head adds 3 cm`,
        true,
      ),
      shaftDiameter: ArchetypeBand.metres(0.0238, 0.0254, HANDLES, true),
      mass: ArchetypeBand.of("kg", 0.5, 0.9, ArchetypeBand.TYPICAL_MASS, true),
    },
    shovel: {
      length: ArchetypeBand.metres(1.054, 1.168, SHOVEL, true),
      shaftDiameter: ArchetypeBand.metres(
        0.032,
        0.038,
        "no shovel shaft diameter was found; the lower end of the 32 to 51 mm power grip band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)",
        true,
      ),
      mass: ArchetypeBand.of("kg", 2.04, 2.54, SHOVEL, true),
    },
  };
}
