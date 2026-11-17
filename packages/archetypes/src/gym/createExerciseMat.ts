import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/**
 * An exercise mat laid on the floor: a thin yoga mat or a thicker gym mat.
 *
 * It lies flat, centred over the origin, its length along `Z`. `surface` is its top, where a body lies, kneels or stands for a floor exercise.
 *
 * @param params The kind, a yoga mat's length and any dimension the author fixes.
 * @param seed The seed that draws a yoga mat's length when it is not given and every dimension left free inside its band; absent, the first length and the middle of each band.
 * @returns The mat.
 * @throws {ArchetypeRefusal} For a length Manduka does not list with a mass, or one named for a gym mat, a fixed dimension outside its band, or one only the other kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the mat lies and its contact.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the length, width and thickness; a yoga mat's length and mass are one of Manduka's mats whole.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick a yoga mat's length, draw the dimensions, one part, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mat is rigid and flat; it does not give under a body.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createExerciseMat(
  params: createExerciseMat.IParams,
  seed?: number | string,
): Archetype<createExerciseMat.Affordance, createExerciseMat.Dimension> {
  const draw: ArchetypeDrawSession<createExerciseMat.Dimension> =
    new ArchetypeDrawSession<createExerciseMat.Dimension>(
      "exerciseMat",
      createExerciseMat.UNITS,
      seed,
      params,
    );
  const kind: createExerciseMat.Kind = ArchetypeDraw.choice(
    "exerciseMat",
    "kind",
    params.kind,
    createExerciseMat.KINDS,
  );
  const size: {
    name: createExerciseMat.Size | undefined;
    figures: Readonly<Partial<Record<createExerciseMat.Dimension, number>>>;
  } = draw.model<createExerciseMat.Size>(
    "size",
    params.size,
    createExerciseMat.SIZES[kind],
  );
  const d: Partial<Record<createExerciseMat.Dimension, number>> = {
    ...draw.dimensions(createExerciseMat.BANDS[kind], createExerciseMat.BANDS),
    ...size.figures,
  };
  const length: number = d.length!;
  const width: number = d.width!;
  const thickness: number = d.thickness!;
  const builder: ArchetypeBuilder<
    createExerciseMat.Affordance,
    createExerciseMat.Dimension
  > = new ArchetypeBuilder({
    material: "foam",
    id: params.id,
    name: size.name === undefined ? `${kind} mat` : `${kind} mat ${size.name}`,
    draw,
  });
  builder.box(
    "mat",
    Vector3.create(width, thickness, length),
    Vector3.create(0, thickness / 2, 0),
    { color: kind === "yoga" ? "#6a5acd" : "#2c2f33" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, thickness, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createExerciseMat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two mats, Manduka's yoga mats picked whole, and one band per remaining dimension each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one top a floor exercise bears on.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each band is a maker's mat as read; the gym mat's two listings are one product's spread, a band; Manduka's 68 in mat has no read mass and is not built.
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /** A yoga mat's lengths, Manduka PRO's that it gives a mass for. */
  export type Size = "71in" | "85in";

  /** The figures each size fixes, by kind, the default first: the Manduka PRO 6 mm at 71 in weighs 7.5 lb (3.4 kg) and at 85 in 4.3 kg (both at the addresses `MANDUKA` gives). */
  export const SIZES: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Size, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    yoga: {
      "71in": { length: 71 * ArchetypeUnits.INCH, mass: 3.4 },
      "85in": { length: 85 * ArchetypeUnits.INCH, mass: 4.3 },
    },
  };

  /** The parameters: the kind, a yoga mat's size, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mat. */
    kind: Kind;

    /** A yoga mat's length; drawn from the seed when absent. A gym mat has one size. */
    size?: Size;

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
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    yoga: {
      width: ArchetypeBand.metres(0.66, 0.66, MANDUKA),
      thickness: ArchetypeBand.metres(0.006, 0.006, MANDUKA),
    },
    gym: {
      length: ArchetypeBand.metres(
        73.2 * ArchetypeUnits.INCH,
        74 * ArchetypeUnits.INCH,
        THICK,
      ),
      width: ArchetypeBand.metres(
        24 * ArchetypeUnits.INCH,
        24.3 * ArchetypeUnits.INCH,
        THICK,
      ),
      thickness: ArchetypeBand.metres(
        0.5 * ArchetypeUnits.INCH,
        0.5 * ArchetypeUnits.INCH,
        THICK,
      ),
      mass: ArchetypeBand.of(
        "kg",
        2.2 * ArchetypeUnits.POUND,
        2.2 * ArchetypeUnits.POUND,
        THICK,
      ),
    },
  };
}
