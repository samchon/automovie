import { type AutoMovieArchetype } from "../core/index";
import { createShowcase as createShowcaseImplementation } from "./internal/createShowcase";
import { AutoMovieArchetypeDrawSession, AutoMovieArchetypeUnits } from "../core";

/** Public operations for Auto Movie Archetype Showcase. */
export namespace AutoMovieArchetypeShowcase {
  /**
   * A glass showcase counter: a case with a glass top and front, shown to the
   * customer at `+Z` and served from the clerk's side at `-Z`.
   *
   * The case stands on the floor centred on the origin, its length along `X`. It
   * is one of the maker's two showcases read, whole: the model given, or one
   * drawn from the seed. `top` is the glass top, leaned on or set on; `edge` is
   * its customer-side edge, where hands and forearms rest.
   *
   * @param params The model, if the author fixes it.
   * @param seed The seed that draws the model when it is not given; absent, the
   *   first.
   * @returns The showcase.
   * @throws {AutoMovieArchetypeRefusal} For a model the maker's sheet does not
   *   list.
   */
  export function create(params?: AutoMovieArchetypeShowcase.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeShowcase.Affordance, AutoMovieArchetypeShowcase.Dimension> {
    return createShowcaseImplementation(params, seed);
  }

  /** The models read: Econoco's Full Vision showcases, 48 and 70 in long. */
  export type Model = "PW/SC482" | "PW/SC702";

  /**
   * The dimensions, each its model's: `length`, the case along `X`, metres;
   * `mass`, kilograms.
   */
  export type Dimension = "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    mass: "kg",
  };

  /**
   * Each showcase's length and mass, the default first: Econoco Showcases and
   * Counters 2025, Full Vision Showcase, "Available in two lengths; 48" long
   * and 70" long", "48" unit weighs 170 lbs. 70" unit weighs 190 lbs."
   * (https://www.econoco.com/media/contentmanager/content/brochure/Showcases_and_Counters_-_2025_1.pdf).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "PW/SC482": {
      length: 48 * AutoMovieArchetypeUnits.INCH,
      mass: 170 * AutoMovieArchetypeUnits.POUND,
    },
    "PW/SC702": {
      length: 70 * AutoMovieArchetypeUnits.INCH,
      mass: 190 * AutoMovieArchetypeUnits.POUND,
    },
  };

  /**
   * The affordance ids:
   *
   * - `top`: the glass top, facing up.
   * - `edge`: the top's customer-side edge along `X`.
   */
  export type Affordance = "top" | "edge";

  /**
   * The clerk-side sliding doors' width and height, metres: unread, since the
   * sheet names "solid sliding privacy doors" but sizes neither. A read size
   * replaces this `null`, and the doors then become `slider` contacts.
   */
  export const DOORS: Readonly<{ width: number; height: number }> | null = null;

  /** The parameters: the model, if fixed. */
  export interface IParams {
    /** Which showcase; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `showcase` when absent. */
    id?: string;
  }}
