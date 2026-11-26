import { type AutoMovieArchetype } from "../core/index";
import { createExerciseMat as createExerciseMatImplementation } from "./internal/createExerciseMat";
import { AutoMovieArchetypeDrawSession, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Exercise Mat. */
export namespace AutoMovieArchetypeExerciseMat {
  /**
   * An exercise mat laid on the floor: a thin yoga mat or a thicker gym mat.
   *
   * It lies flat, centred over the origin, its length along `Z`. `surface` is its
   * top, where a body lies, kneels or stands for a floor exercise.
   *
   * @param params The kind, a yoga mat's length and any dimension the author
   *   fixes.
   * @param seed The seed that draws a yoga mat's length when it is not given and
   *   every dimension left free inside its band; absent, the first length and the
   *   middle of each band.
   * @returns The mat.
   * @throws {AutoMovieArchetypeRefusal} For a length Manduka does not list with a
   *   mass, or one named for a gym mat, a fixed dimension outside its band, or
   *   one only the other kind has.
   */
  export function create(params: AutoMovieArchetypeExerciseMat.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeExerciseMat.Affordance,
  AutoMovieArchetypeExerciseMat.Dimension
> {
    return createExerciseMatImplementation(params, seed);
  }

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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /** A yoga mat's lengths, Manduka PRO's that it gives a mass for. */
  export type Size = "71in" | "85in";

  /**
   * The figures each size fixes, by kind, the default first: the Manduka PRO 6
   * mm at 71 in weighs 7.5 lb (3.4 kg) and at 85 in 4.3 kg (both at the
   * addresses `MANDUKA` gives).
   */
  export const SIZES: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Size, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    yoga: {
      "71in": { length: 71 * AutoMovieArchetypeUnits.INCH, mass: 3.4 },
      "85in": { length: 85 * AutoMovieArchetypeUnits.INCH, mass: 4.3 },
    },
  };

  /**
   * The parameters: the kind, a yoga mat's size, and any free dimension fixed
   * to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mat. */
    kind: Kind;

    /**
     * A yoga mat's length; drawn from the seed when absent. A gym mat has one
     * size.
     */
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
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    yoga: {
      width: AutoMovieArchetypeBand.metres(0.66, 0.66, MANDUKA),
      thickness: AutoMovieArchetypeBand.metres(0.006, 0.006, MANDUKA),
    },
    gym: {
      length: AutoMovieArchetypeBand.metres(
        73.2 * AutoMovieArchetypeUnits.INCH,
        74 * AutoMovieArchetypeUnits.INCH,
        THICK,
      ),
      width: AutoMovieArchetypeBand.metres(
        24 * AutoMovieArchetypeUnits.INCH,
        24.3 * AutoMovieArchetypeUnits.INCH,
        THICK,
      ),
      thickness: AutoMovieArchetypeBand.metres(
        0.5 * AutoMovieArchetypeUnits.INCH,
        0.5 * AutoMovieArchetypeUnits.INCH,
        THICK,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        2.2 * AutoMovieArchetypeUnits.POUND,
        2.2 * AutoMovieArchetypeUnits.POUND,
        THICK,
      ),
    },
  };}
