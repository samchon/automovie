import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createFork as createForkImplementation } from "./internal/createFork";

/** Constructs a steel fork with a precision grip and axial tines contact. */
export namespace AutoMovieArchetypeFork {
  /**
   * Build a steel fork with its butt at Y zero and tines toward `+Y`.
   *
   * @param params Optional scene ID and finite length, grip diameter or mass
   *   admitted by the fork bands. The ID defaults to `tool`.
   * @param seed Numeric seed for omitted band values. The default handle
   *   diameter is 0.0095 metres. Length is 0.19 metres and mass 0.045 kilograms.
   * @returns A handle with a `grip` facing `-Z` and the axial `face` at the tines.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeFork.Affordance, AutoMovieArchetypeFork.Dimension> {
    return createForkImplementation(params, seed);
  }

  /**
   * Precision `grip` near the tines and axial `face` at their positive-Y tip.
   */
  export type Affordance = "face" | "grip";

  /** Overall Y length and handle diameter in metres. Mass is in kilograms. */
  export type Dimension = "gripDiameter" | "length" | "mass";}
