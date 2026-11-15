import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { BED_BANDS } from "./BED_BANDS";
import { CareBedConstruction } from "./CareBedConstruction";
import { MATTRESS_SIZES } from "./MATTRESS_SIZES";

/**
 * A bed: a single or a double bed, a mattress on the floor, a hospital bed, a hospital stretcher, a crib or a bunk bed.
 *
 * The lying surface is centred over the origin, the head toward `-Z`. A single or a double bed is a mattress on a base with a headboard, a mattress on the floor the mattress alone; each long side is also a seat, facing out, for sitting on the edge and rising from the bed. A hospital bed, a stretcher, a crib and a bunk bed are built by `CareBedConstruction`, whose functions say what each adds: a hospital bed's siderails, a crib's top rails, a bunk's upper bed and guardrail.
 *
 * A bunk bed rests on its pine posts: wood on concrete (`ArchetypeFriction`).
 *
 * @param params The kind, a loose mattress's size and any dimension the author fixes.
 * @param seed The seed that draws a loose mattress's size when it is not given and every dimension left free inside its band; absent, the single size and the middle of each band.
 * @returns The bed.
 * @throws {ArchetypeRefusal} For a size named for a bed that has none, a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, where the head is, that the sides are seats, and where the care and children's beds are described.
 * @evidence contracts/development/implementation.md#principled-implementation Two boxes and a headboard from the drawn width, length and surface height; the side seats follow the `seat` convention with their front edge on the mattress's long edge; the other kinds are their construction's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick a loose mattress's size, draw the dimensions with its width and length over them, then the plain bed here or the kind's construction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pillow or bedding: the head end is a coordinate of the surface.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts for a plain bed, about sixty for a crib's slats.
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
  const size: Readonly<Partial<Record<createBed.Dimension, number>>> =
    ArchetypeDraw.model<createBed.Mattress, createBed.Dimension>(
      "bed",
      "size",
      params.size,
      MATTRESS_SIZES[kind],
      seed,
      params,
    ).figures;
  const d: Partial<Record<createBed.Dimension, number>> = {
    ...ArchetypeDraw.dimensions(
      "bed",
      createBed.BANDS[kind],
      seed,
      params,
      createBed.BANDS,
    ),
    ...size,
  };
  const builder: ArchetypeBuilder<createBed.Affordance, createBed.Dimension> =
    new ArchetypeBuilder({
      archetype: "bed",
      id: params.id,
      name:
        kind === "mattress"
          ? "mattress"
          : kind === "gurney"
            ? "stretcher"
            : `${kind} bed`,
      dimensions: d,
    });
  if (
    kind === "hospital" ||
    kind === "gurney" ||
    kind === "crib" ||
    kind === "bunk"
  ) {
    CareBedConstruction[kind](builder, d);
    return builder.build(d.mass!, kind === "bunk" ? { rests: "wood" } : {});
  }
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;
  const height: number = d.height ?? thick;
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The surface a body lies on, the height it rises from, and the rails, upper bed and guardrail the care and children's beds add (#3370, #3363, #3468 N5, N13, N16).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A mattress on the floor has no height of its own: its surface is its thickness.
 */
export namespace createBed {
  /** The kinds of bed. */
  export type Kind =
    | "single"
    | "double"
    | "mattress"
    | "hospital"
    | "gurney"
    | "crib"
    | "bunk";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "single",
    "double",
    "mattress",
    "hospital",
    "gurney",
    "crib",
    "bunk",
  ];

  /**
   * The affordance ids:
   *
   * - `surface`: the lying surface, its `depth` the bed's length with the head at `v = 0`; a bunk's lower bed.
   * - `leftSide`, `rightSide`: the long edges on `+X` and `-X` as seats facing out, as wide as the bed is long; a crib has none.
   * - `leftRail`, `rightRail`: a hospital bed's siderails or a crib's top rails, bars on `+X` and `-X`.
   * - `upper`: a bunk's upper lying surface; `guard`: its continuous guardrail, a bar.
   */
  export type Affordance =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "leftRail"
    | "rightRail"
    | "upper"
    | "guard";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: across the lying surface.
   * - `length`: the lying surface from head to foot.
   * - `height`: the lying surface above the floor; a crib's rail tops; a bunk's overall height; a mattress on the floor has none.
   * - `thickness`: the mattress.
   * - `overallLength`, `overallWidth`: a hospital bed's, a stretcher's or a bunk's frame.
   * - `litter`: a hospital bed's or a stretcher's litter top above the floor.
   * - `rail`: a hospital bed's siderail top above its mattress; a crib's rail top above its mattress support at its lowest.
   * - `gap`, `clearance`: a bunk's distance between its two beds and the free height under its lower one, where each mattress rests.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "length"
    | "height"
    | "thickness"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "rail"
    | "gap"
    | "clearance"
    | "mass";

  /** The UK sizes a loose mattress is made in. */
  export type Mattress = "single" | "double";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bed. */
    kind: Kind;

    /** A loose mattress's UK size; drawn from the seed when absent. Other beds have none. */
    size?: Mattress;

    /** The model's id, unique in a scene; `bed` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = BED_BANDS;
}
