import { type AutoMovieArchetype } from "../core/index";
import { createShowcase as createShowcaseImplementation } from "./internal/createShowcase";
import { AutoMovieArchetypeDrawSession, AutoMovieArchetypeUnits } from "../core";

/** Constructs a display counter with catalogue size and mass. */
export namespace AutoMovieArchetypeShowcase {
  /**
   * Build a closed display-case model from a Full Vision catalogue entry.
   *
   * The case spans X, with the customer on `+Z` and the clerk on `-Z`.
   * Both entries stand 38 inches high and 20 inches deep. The chosen entry
   * supplies the body length and mass together.
   *
   * @param params Optional catalogue model and scene object ID.
   * @param seed Numeric seed for an omitted model. Without either choice
   *   the 48 inch `PW/SC482` model is selected.
   * @returns The case's solid geometry, upper `top` surface and customer
   *   side `edge` on that surface's boundary.
   * @throws {AutoMovieArchetypeRefusal} If the catalogue model is unavailable.
   */
  export function create(params?: AutoMovieArchetypeShowcase.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeShowcase.Affordance, AutoMovieArchetypeShowcase.Dimension> {
    return createShowcaseImplementation(params, seed);
  }

  /** Econoco Full Vision catalogue IDs for the 48 and 70 inch cases. */
  export type Model = "PW/SC482" | "PW/SC702";

  /**
   * Catalogue-owned length along X in metres and empty case mass in kilograms.
   */
  export type Dimension = "length" | "mass";

  /** Uses metres for catalogue length and kilograms for catalogue mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    mass: "kg",
  };

  /**
   * Recorded Econoco Full Vision length and mass pairs in SI units.
   * The 48 inch model weighs 170 pounds and the 70 inch model weighs
   * 190 pounds. The 48 inch entry is the seedless default.
   *
   * @see https://www.econoco.com/media/contentmanager/content/brochure/Showcases_and_Counters_-_2025_1.pdf
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

  /** The upward `top` surface and its customer-side `edge` along model X. */
  export type Affordance = "top" | "edge";

  /**
   * Clerk-side door dimensions in metres when recorded. The current catalogue stores `null` and generates a closed case.
   */
  export const DOORS: Readonly<{ width: number; height: number }> | null = null;

  /** Optional catalogue model and scene object ID for a display case. */
  export interface IParams {
    /**
     * Selects either recorded size and mass pair. Defaults to the 48 inch model without a seed.
     */
    model?: Model;

    /** Scene object ID, defaulting to `showcase`. */
    id?: string;
  }}
