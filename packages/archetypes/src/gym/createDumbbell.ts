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
 * A dumbbell: a short handle with a steel head at each end, held in one
 * hand.
 *
 * It lies along `X` with the handle's middle at the origin. Each head is a
 * solid steel cylinder as thick as its own radius times `SQUAT`, sized so
 * the two heads and the handle weigh the dumbbell's mass, so a heavier one
 * is larger. `grip` is the handle, taken from the `-Z` side.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The dumbbell.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it lies, how the heads are sized and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation The heads' size follows from the mass at steel's density, so no head size is stated beside the mass and the two cannot disagree.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, size the heads, lay three rods, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Round heads stand for the hexagonal ones of a rubber dumbbell, and no maker's sizes were read: every band is an estimate and says so.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three rods.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDumbbell(
  params: createDumbbell.IParams,
  seed?: number | string,
): Archetype<createDumbbell.Affordance, createDumbbell.Dimension> {
  const kind: createDumbbell.Kind = ArchetypeDraw.choice(
    "dumbbell",
    "kind",
    params.kind ?? "fixed",
    createDumbbell.KINDS,
  );
  const d: Partial<Record<createDumbbell.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "dumbbell",
      createDumbbell.BANDS[kind],
      seed,
      params,
      createDumbbell.BANDS,
    );
  const half: number = d.handle! / 2;
  const slim: number = d.diameter! / 2;

  // Each head's radius from its share of the mass: a cylinder of steel as
  // thick as SQUAT radii.
  const steel: number =
    Math.max(
      0,
      d.mass! - createDumbbell.STEEL * Math.PI * slim * slim * d.handle!,
    ) / 2;
  const radius: number = Math.max(
    slim,
    Math.cbrt(steel / (createDumbbell.STEEL * Math.PI * createDumbbell.SQUAT)),
  );
  const builder: ArchetypeBuilder<
    createDumbbell.Affordance,
    createDumbbell.Dimension
  > = new ArchetypeBuilder({
    archetype: "dumbbell",
    id: params.id,
    name: "dumbbell",
    dimensions: d,
  });
  builder.rod(
    "handle",
    slim,
    Vector3.create(-half, 0, 0),
    Vector3.create(half, 0, 0),
    { color: "#b8bcc2" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "head-left" : "head-right",
      radius,
      Vector3.create(side * half, 0, 0),
      Vector3.create(side * (half + createDumbbell.SQUAT * radius), 0, 0),
      { color: "#2c2f33" },
    );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter!,
    length: d.handle!,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createDumbbell}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation A closed union and one band per dimension; the heads' size is derived, not a dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle a hand reads and the mass a scene chooses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No head size, balance point or inertia is declared.
 */
export namespace createDumbbell {
  /** The kinds of dumbbell. */
  export type Kind = "fixed";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fixed"];

  /** Steel's density, kilograms per cubic metre. */
  export const STEEL: number = 7850;

  /** A head's thickness in its own radii. An estimate, not read at a source. */
  export const SQUAT: number = 0.8;

  /** The affordance ids: `grip`, the handle between the heads, taken from the `-Z` side. */
  export type Affordance = "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `handle`: the handle's length between the heads.
   * - `diameter`: the handle's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "handle" | "diameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which dumbbell; `fixed` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `dumbbell` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    fixed: {
      handle: ArchetypeBand.metres(
        0.12,
        0.14,
        "an estimate: a handle a little longer than a hand's breadth; no maker's sheet was read",
        true,
      ),
      diameter: ArchetypeBand.metres(
        0.028,
        0.034,
        "an estimate: from a barbell's 28 mm grip to a thick rubber dumbbell's handle; no maker's sheet was read",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        1,
        40,
        "an estimate of the range a gym's rack carries; no maker's sheet was read",
        true,
      ),
    },
  };
}
