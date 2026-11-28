import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createSpoon as createSpoonImplementation } from "./internal/createSpoon";

/** Constructs a steel spoon with a precision grip and outward bowl contact. */
export namespace AutoMovieArchetypeSpoon {
  /**
   * Build a steel spoon from a cylindrical handle and a flat bowl proxy.
   *
   * The handle runs along `+Y` from its butt at the origin. The bowl's
   * outer rim marks the spoon's full length and its `face` points `+Z`.
   *
   * @param params Optional scene ID and finite length, grip diameter or mass
   *   in their bands. The ID defaults to `tool`.
   * @param seed Numeric seed for omitted band values. Seedless defaults are
   *   0.15 metres long, 0.0095 metres grip diameter and 0.04 kilograms.
   * @returns The spoon with a precision `grip` and a normal bowl `face`.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSpoon.Affordance, AutoMovieArchetypeSpoon.Dimension> {
    return createSpoonImplementation(params, seed);
  }

  /** Precision `grip` facing `-Z` and `face` on the bowl's `+Z` side. */
  export type Affordance = "face" | "grip";

  /** Overall Y length and handle diameter in metres. Mass is in kilograms. */
  export type Dimension = "gripDiameter" | "length" | "mass";}
