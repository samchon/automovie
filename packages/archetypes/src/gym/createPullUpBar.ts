import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The norm that sizes a gymnastics horizontal bar. */
const FIG: string =
  "Fédération Internationale de Gymnastique, Apparatus Norms, the horizontal bar: the bar 2.8 m above the floor, 2.4 m long between its uprights and 28 mm across";

/**
 * A bar to hang from: a gym's pull-up bar or gymnastics' horizontal bar, a
 * round bar level between two uprights.
 *
 * It stands on the floor with the middle of its footprint at the origin,
 * the bar along `X`. `bar` is the bar's middle, on its axis, with `+Y` up:
 * hands take it from below at any place along its length.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The bar.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds, how it stands and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation One bar at its height and an upright under each end; the horizontal bar's three sizes are the norm's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, three rods, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No guy wires, feet or wall mounts; a gym bar's sizes are estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three rods.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPullUpBar(
  params: createPullUpBar.IParams,
  seed?: number | string,
): Archetype<createPullUpBar.Affordance, createPullUpBar.Dimension> {
  const kind: createPullUpBar.Kind = ArchetypeDraw.choice(
    "pullUpBar",
    "kind",
    params.kind,
    createPullUpBar.KINDS,
  );
  const d: Partial<Record<createPullUpBar.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "pullUpBar",
      createPullUpBar.BANDS[kind],
      seed,
      params,
      createPullUpBar.BANDS,
    );
  const half: number = d.length! / 2;
  const height: number = d.height!;
  const builder: ArchetypeBuilder<
    createPullUpBar.Affordance,
    createPullUpBar.Dimension
  > = new ArchetypeBuilder({
    archetype: "pullUpBar",
    id: params.id,
    name: kind === "gym" ? "pull-up bar" : "horizontal bar",
    dimensions: d,
  });
  builder.rod(
    "bar",
    d.diameter! / 2,
    Vector3.create(-half, height, 0),
    Vector3.create(half, height, 0),
    { color: "#b8bcc2" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "upright-left" : "upright-right",
      createPullUpBar.UPRIGHT,
      Vector3.create(side * (half + createPullUpBar.UPRIGHT), 0, 0),
      Vector3.create(side * (half + createPullUpBar.UPRIGHT), height, 0),
      { color: "#5a5f66" },
    );
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    length: d.length!,
    aperture: d.diameter!,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createPullUpBar}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one band per dimension per kind, the norm's for the horizontal bar and marked estimates for a gym's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bar's height, length and thickness a hanging body reads, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared.
 */
export namespace createPullUpBar {
  /** The kinds of bar. */
  export type Kind = "gym" | "horizontalBar";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["gym", "horizontalBar"];

  /** An upright's radius, metres. An estimate, not read at a source. */
  export const UPRIGHT: number = 0.03;

  /** The affordance ids: `bar`, the bar's middle on its axis, `+Y` up, hung from below. */
  export type Affordance = "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the bar's axis above the floor.
   * - `length`: the bar's, between its uprights.
   * - `diameter`: the bar's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "diameter" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bar. */
    kind: Kind;

    /** The model's id, unique in a scene; `pullUpBar` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    gym: {
      height: ArchetypeBand.metres(
        2.0,
        2.4,
        "an estimate: above a standing adult's reach, under a room's ceiling; no maker's sheet was read",
        true,
      ),
      length: ArchetypeBand.metres(
        1.0,
        1.3,
        "an estimate: a power rack's width; no maker's sheet was read",
        true,
      ),
      diameter: ArchetypeBand.metres(
        0.028,
        0.034,
        "an estimate: from a competition bar's 28 mm to a thick rack bar; no maker's sheet was read",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        15,
        40,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
    horizontalBar: {
      height: ArchetypeBand.metres(2.8, 2.8, FIG),
      length: ArchetypeBand.metres(2.4, 2.4, FIG),
      diameter: ArchetypeBand.metres(0.028, 0.028, FIG),
      mass: ArchetypeBand.of(
        "kg",
        40,
        80,
        "an estimate; the norm states no mass",
        true,
      ),
    },
  };
}
