import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createScrewdriver as createScrewdriverImplementation } from "./internal/createScrewdriver";

/** Constructs an axial screwdriver with a round handle and shank tip. */
export namespace AutoMovieArchetypeScrewdriver {
  /**
   * Build a screwdriver with its handle from Y zero and shank along `+Y`.
   *
   * The power `grip` faces `-Z` and wraps the round handle. The axial
   * `face` sits at the far end of the shank.
   *
   * @param params Optional ID, finite overall length, `blade` shank length,
   *   grip diameter and mass in their bands. The ID defaults to `tool`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.20955 metres overall,
   *   a 0.1016 metre shank and a 0.035 metre grip.
   * @returns The handle grip and axial shank contact.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  >, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeScrewdriver.Affordance,
  AutoMovieArchetypeScrewdriver.Dimension
> {
    return createScrewdriverImplementation(params, seed);
  }

  /** Round power `grip` and axial `face` at the positive-Y shank tip. */
  export type Affordance = "face" | "grip";

  /**
   * Overall length, shank length as `blade` and grip diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "blade" | "gripDiameter" | "length" | "mass";}
