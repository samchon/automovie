import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createHammer as createHammerImplementation } from "./internal/createHammer";

/** Constructs an upright hammer with a butt grip and transverse face. */
export namespace AutoMovieArchetypeHammer {
  /**
   * Build a hammer with its shaft along model `+Y`.
   *
   * The power `grip` is near the butt and faces `-Z`. The head's working
   * face lies at its positive-Z end.
   *
   * @param params Optional scene ID and finite overall length, grip diameter or mass
   *   admitted by the bands. The ID defaults to `tool`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.3302 metres in length,
   *   0.035 metres in grip diameter and 0.675 kilograms.
   * @returns The shaft with its butt grasp and the head with its working face.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHammer.Affordance, AutoMovieArchetypeHammer.Dimension> {
    return createHammerImplementation(params, seed);
  }

  /** Power `grip` near the shaft butt and positive-Z head `face`. */
  export type Affordance = "face" | "grip";

  /**
   * Overall Y length and shaft grip diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "gripDiameter" | "length" | "mass";}
