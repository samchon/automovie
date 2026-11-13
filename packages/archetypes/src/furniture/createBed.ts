import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** UK bed sizes. */
const SIZES: string =
  "National Bed Federation, UK bed sizes: single 90 x 190 cm, double 135 x 190 cm (https://bedadvice.co.uk/bed-talk/bed-sizes-uk-bed-and-mattress-size-guide/)";

/** The bed heights a hospital bed study found safest to rise from. */
const HEIGHT: string =
  "hospital bed height study, mid-range bed heights of 39 to 63 cm (DOI 10.1177/10711813251369356, https://stacks.cdc.gov/view/cdc/259417/cdc_259417_DS1.pdf)";

/** Mattress thickness, for which no source was found. */
const MATTRESS: string = "mattress thickness, not read at a source";

/**
 * A bed: a single or a double bed, or a mattress on the floor.
 *
 * The model is a mattress on a base with a headboard, or the mattress alone. The lying surface is centred over the origin, the head toward `-Z`. Each long side is also a seat, facing out, for sitting on the edge and for rising from the bed.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The bed.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, where the head is and that the sides are seats.
 * @evidence contracts/development/implementation.md#principled-implementation Two boxes and a headboard from the drawn width, length and surface height; the side seats follow the `seat` convention with their front edge on the mattress's long edge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, lay the mattress and base, then the surface and the two side seats.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pillow or bedding: the head end is a coordinate of the surface.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBed(
  params: createBed.IParams,
  seed?: number | string,
): Archetype<createBed.Affordance, createBed.Dimension> {
  const kind: createBed.Kind = ArchetypeDraw.choice(
    "bed",
    "kind",
    params.kind,
    createBed.KINDS,
  );
  const d: Partial<Record<createBed.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "bed",
      createBed.BANDS[kind],
      seed,
      params,
      createBed.BANDS,
    );
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;
  const height: number = d.height ?? thick;
  const builder: ArchetypeBuilder<createBed.Affordance, createBed.Dimension> =
    new ArchetypeBuilder({
      archetype: "bed",
      id: params.id,
      name: kind === "mattress" ? "mattress" : `${kind} bed`,
      dimensions: d,
    });
  builder.box(
    "mattress",
    Vector3.create(width, thick, length),
    Vector3.create(0, height - thick / 2, 0),
    { color: "#e7e3da", density: 0.3 },
  );
  if (kind !== "mattress") {
    builder.box(
      "base",
      Vector3.create(width, height - thick, length),
      Vector3.create(0, (height - thick) / 2, 0),
      { color: "#8a6a4a", density: 0.3 },
    );
    builder.box(
      "headboard",
      Vector3.create(width, height + 0.4, 0.04),
      Vector3.create(0, (height + 0.4) / 2, -length / 2 - 0.02),
      { color: "#8a6a4a" },
    );
  }
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  for (const [id, sign] of [
    ["leftSide", 1],
    ["rightSide", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "seat",
      frame: ArchetypeFrame.facing(
        Vector3.create((sign * width) / 2, height, 0),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, -sign),
      ),
      extent: null,
      width: length,
      depth: width / 2,
    });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createBed}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The surface a body lies on and the height it rises from (#3370, #3363).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A mattress on the floor has no height of its own: its surface is its thickness.
 */
export namespace createBed {
  /** The kinds of bed. */
  export type Kind = "single" | "double" | "mattress";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["single", "double", "mattress"];

  /**
   * The affordance ids:
   *
   * - `surface`: the lying surface, its `depth` the bed's length with the head at `v = 0`.
   * - `leftSide`, `rightSide`: the long edges on `+X` and `-X` as seats facing out, as wide as the bed is long.
   */
  export type Affordance = "surface" | "leftSide" | "rightSide";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: across the bed.
   * - `length`: from head to foot.
   * - `height`: the lying surface above the floor; a mattress on the floor has none.
   * - `thickness`: the mattress.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "length" | "height" | "thickness" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bed. */
    kind: Kind;

    /** The model's id, unique in a scene; `bed` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    single: {
      width: ArchetypeBand.metres(0.9, 0.9, SIZES),
      length: ArchetypeBand.metres(1.9, 1.9, SIZES),
      height: ArchetypeBand.metres(0.39, 0.63, HEIGHT),
      thickness: ArchetypeBand.metres(0.15, 0.25, MATTRESS, true),
      mass: ArchetypeBand.of("kg", 30, 50, ArchetypeBand.TYPICAL_MASS, true),
    },
    double: {
      width: ArchetypeBand.metres(1.35, 1.35, SIZES),
      length: ArchetypeBand.metres(1.9, 1.9, SIZES),
      height: ArchetypeBand.metres(0.39, 0.63, HEIGHT),
      thickness: ArchetypeBand.metres(0.15, 0.25, MATTRESS, true),
      mass: ArchetypeBand.of("kg", 45, 75, ArchetypeBand.TYPICAL_MASS, true),
    },
    mattress: {
      width: ArchetypeBand.metres(0.9, 1.35, SIZES),
      length: ArchetypeBand.metres(1.9, 1.9, SIZES),
      thickness: ArchetypeBand.metres(0.15, 0.25, MATTRESS, true),
      mass: ArchetypeBand.of("kg", 10, 30, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
