import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A squat rack: two uprights, each with a hook a barbell rests on.
 *
 * It stands on the floor with the middle of its footprint at the origin,
 * the uprights on either side of `X`, the hooks reaching toward `-Z`,
 * where the lifter stands. `rest` is the place between the two hooks where
 * the bar's middle lies, on the bar's axis, with `+Y` up.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The rack.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it stands, which side the lifter is on and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation Two uprights the rack's width apart and a short hook on each at the rest's height; the rest is where a bar laid on both hooks has its middle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, two uprights, two hooks, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No base, safeties or cross-members; every band is an estimate and says so.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four shapes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createRack(
  params: createRack.IParams,
  seed?: number | string,
): Archetype<createRack.Affordance, createRack.Dimension> {
  const kind: createRack.Kind = ArchetypeDraw.choice(
    "rack",
    "kind",
    params.kind ?? "squat",
    createRack.KINDS,
  );
  const d: Partial<Record<createRack.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "rack",
      createRack.BANDS[kind],
      seed,
      params,
      createRack.BANDS,
    );
  const half: number = d.width! / 2;
  const builder: ArchetypeBuilder<createRack.Affordance, createRack.Dimension> =
    new ArchetypeBuilder({
      archetype: "rack",
      id: params.id,
      name: "squat rack",
      dimensions: d,
    });
  for (const side of [1, -1] as const) {
    const name: string = side === 1 ? "left" : "right";
    builder.box(
      `upright-${name}`,
      Vector3.create(createRack.POST, d.height!, createRack.POST),
      Vector3.create(side * half, d.height! / 2, 0),
      { color: "#5a5f66" },
    );
    builder.box(
      `hook-${name}`,
      Vector3.create(createRack.POST, createRack.LIP, createRack.HOOK),
      Vector3.create(
        side * half,
        d.rest! - createRack.SEAT - createRack.LIP / 2,
        -(createRack.POST + createRack.HOOK) / 2,
      ),
      { color: "#b8bcc2" },
    );
  }
  builder.affordance({
    id: "rest",
    kind: "ledge",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, d.rest!, -(createRack.POST + createRack.HOOK) / 2),
    ),
    extent: null,
    width: d.width!,
    depth: createRack.HOOK,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createRack}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation A closed union and one band per dimension, each marked provisional.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rest's height and the rack's width a racked bar reads, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared.
 */
export namespace createRack {
  /** The kinds of rack. */
  export type Kind = "squat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["squat"];

  /** An upright's square section, metres. An estimate, not read at a source. */
  export const POST: number = 0.06;

  /** A hook's reach before its upright, metres. An estimate, not read at a source. */
  export const HOOK: number = 0.08;

  /** A hook's thickness, metres. An estimate, not read at a source. */
  export const LIP: number = 0.02;

  /** How far a resting bar's axis lies above the hook's top, metres: half a 28 mm bar. */
  export const SEAT: number = 0.014;

  /** The affordance ids: `rest`, where a bar laid on both hooks has its middle, on the bar's axis, `+Y` up. */
  export type Affordance = "rest";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the uprights'.
   * - `width`: between the uprights' middles.
   * - `rest`: a resting bar's axis above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "width" | "rest" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which rack; `squat` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `rack` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    squat: {
      height: ArchetypeBand.metres(
        1.8,
        2.3,
        "an estimate; no maker's sheet was read",
        true,
      ),
      width: ArchetypeBand.metres(
        1.05,
        1.2,
        "an estimate: inside a barbell's 1.31 m between collars; no maker's sheet was read",
        true,
      ),
      rest: ArchetypeBand.metres(
        0.9,
        1.6,
        "an estimate: from a bench press's rest to a tall lifter's shoulders; no maker's sheet was read",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        30,
        80,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
  };
}
