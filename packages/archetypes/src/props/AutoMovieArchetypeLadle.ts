import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createLadle as createLadleImplementation } from "./internal/createLadle";

/**
 * Constructs a steel ladle proxy with a pinch grip and a rounded bowl contact.
 */
export namespace AutoMovieArchetypeLadle {
  /**
   * Build a ladle with its handle from Y zero and its bowl toward `+Y`.
   *
   * The simple rounded bowl supplies a working `face` toward `+Z`. The
   * precision `grip` faces `-Z` near the bowl end of the shaft.
   *
   * @param params Optional scene ID and finite overall length, bowl diameter, grip diameter or mass
   *   admitted by the bands. The ID defaults to `tool`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.32 metres overall, a
   *   0.09 metre bowl and a 0.0095 metre grip diameter.
   * @returns The ladle handle and its rounded bowl proxy with their contacts.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "bowl"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLadle.Affordance, AutoMovieArchetypeLadle.Dimension> {
    return createLadleImplementation(params, seed);
  }

  /** Precision handle `grip` and positive-Z bowl `face`. */
  export type Affordance = "face" | "grip";

  /**
   * Overall length along Y, bowl diameter and grip diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "bowl" | "gripDiameter" | "length" | "mass";}
