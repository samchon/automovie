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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each band is a maker's mat as read.
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

  /** Manduka's PRO mat, read. */
  const MANDUKA: string =
    "Manduka PRO yoga mat 6 mm: 68, 71 and 85 in long, 26 in (66 cm) wide, 7.5 lb (3.4 kg) at 71 in and 4.3 kg at 85 in (https://www.manduka.com/products/manduka-pro-yoga-mat, https://eu.manduka.com/blogs/faq/help-center-pro-series-yoga-mats-manduka-eu)";

  /** A thick exercise mat, read. */
  const THICK: string =
    "Amazon Basics 1/2 in extra thick exercise mat, 74 x 24 x 0.5 in and 2.2 lb, its black variant 73.2 x 24.3 x 0.5 in (https://www.desertcart.com.sa/products/47384932-amazon-basics-1-2-inch-extra-thick-exercise-yoga-mat)";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    yoga: {
      length: ArchetypeBand.metres(68 * 0.0254, 85 * 0.0254, MANDUKA),
      width: ArchetypeBand.metres(0.66, 0.66, MANDUKA),
      thickness: ArchetypeBand.metres(0.006, 0.006, MANDUKA),
      mass: ArchetypeBand.of("kg", 3.4, 4.3, MANDUKA),
    },
    gym: {
      length: ArchetypeBand.metres(73.2 * 0.0254, 74 * 0.0254, THICK),
      width: ArchetypeBand.metres(24 * 0.0254, 24.3 * 0.0254, THICK),
      thickness: ArchetypeBand.metres(0.5 * 0.0254, 0.5 * 0.0254, THICK),
      mass: ArchetypeBand.of("kg", 1, 1, THICK),
    },
  };
}