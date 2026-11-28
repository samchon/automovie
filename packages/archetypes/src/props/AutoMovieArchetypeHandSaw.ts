import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createHandSaw as createHandSawImplementation } from "./internal/createHandSaw";

/**
 * Constructs a hand-saw proxy with a heel grip and a full-length tooth edge.
 */
export namespace AutoMovieArchetypeHandSaw {
  /**
   * Build a hand saw with its blade running along model `+Y`.
   *
   * The heel `grip` faces `+X`. Its handle axis lies across the line to
   * the teeth. The straight tooth ledge faces `+Z`.
   * Two heel cheeks join the transverse handle to the blade root.
   *
   * @param params Optional ID, finite overall and blade length, grip diameter
   *   and mass in their bands. The ID defaults to `tool`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.615 metres overall, a
   *   0.525 metre blade and a 0.035 metre grip diameter.
   * @returns The saw's heel grasp and tooth ledge.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHandSaw.Affordance, AutoMovieArchetypeHandSaw.Dimension> {
    return createHandSawImplementation(params, seed);
  }

  /** Power `grip` across the heel and positive-Z tooth ledge as `face`. */
  export type Affordance = "face" | "grip";

  /**
   * Overall and blade lengths along Y, and grip diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "blade" | "gripDiameter" | "length" | "mass";}
