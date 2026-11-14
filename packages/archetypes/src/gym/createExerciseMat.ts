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
 * An exercise mat laid on the floor: a thin yoga mat or a thicker gym mat.
 *
 * It lies flat, centred over the origin, its length along `Z`. `surface` is its top, where a body lies, kneels or stands for a floor exercise.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The mat.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the mat lies and its contact.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the drawn length, width and thickness.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mat is rigid and flat; it does not give under a body.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createExerciseMat(
  params: createExerciseMat.IParams,
  seed?: number | string,
): Archetype<createExerciseMat.Affordance, createExerciseMat.Dimension> {
  const kind: createExerciseMat.Kind = ArchetypeDraw.choice(
    "exerciseMat",
    "kind",
    params.kind,
    createExerciseMat.KINDS,
  );
  const d: Record<createExerciseMat.Dimension, number> =
    ArchetypeDraw.dimensions(
      "exerciseMat",
      createExerciseMat.BANDS[kind],
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createExerciseMat.Affordance,
    createExerciseMat.Dimension
  > = new ArchetypeBuilder({
    archetype: "exerciseMat",
    id: params.id,
    name: `${kind} mat`,
    dimensions: d,
  });
  builder.box(
    "mat",
    Vector3.create(d.width, d.thickness, d.length),
    Vector3.create(0, d.thickness / 2, 0),
    { color: kind === "yoga" ? "#6a5acd" : "#2c2f33" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.thickness, 0)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createExerciseMat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two mats and one band per dimension each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one top a floor exercise bears on.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read for a mat, so every band is provisional.
 */
export namespace createExerciseMat {
  /** The kinds. */
  export type Kind = "yoga" | "gym";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["yoga", "gym"];

  /** The affordance ids: `surface`, the mat's top. */
  export type Affordance = "surface";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `width`, `thickness`: the mat's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mat. */
    kind: Kind;

    /** The model's id, unique in a scene; `exerciseMat` when absent. */
    id?: string;
  }

  /** What a maker's mat reads as, not read at a source. */
  const MAKER: string = "a common maker's mat, not read at a source";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    yoga: {
      length: ArchetypeBand.metres(1.73, 1.83, MAKER, true),
      width: ArchetypeBand.metres(0.61, 0.66, MAKER, true),
      thickness: ArchetypeBand.metres(0.003, 0.006, MAKER, true),
      mass: ArchetypeBand.of("kg", 1, 2.5, MAKER, true),
    },
    gym: {
      length: ArchetypeBand.metres(1.8, 2, MAKER, true),
      width: ArchetypeBand.metres(0.6, 1, MAKER, true),
      thickness: ArchetypeBand.metres(0.01, 0.05, MAKER, true),
      mass: ArchetypeBand.of("kg", 2, 8, MAKER, true),
    },
  };
}
