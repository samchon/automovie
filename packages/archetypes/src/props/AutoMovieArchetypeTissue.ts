import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createTissue as createTissueImplementation } from "./internal/createTissue";

/** Constructs a flat tissue with a centred pinch and upward wiping surface. */
export namespace AutoMovieArchetypeTissue {
  /**
   * Build a flat tissue centred in the XZ plane with its bottom at Y zero.
   *
   * The `grip` lies halfway through the sheet at its centre and the
   * `face` covers the full upper surface.
   *
   * @param params Optional scene ID and finite length, width, thickness or mass
   *   admitted by the bands. The ID defaults to `careItem`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.204 metres along Z, 0.208 metres
   *   across X, 0.0005 metres thick and 0.0015 kilograms.
   * @returns The tissue's centred precision pinch and upward wiping face.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass" | "thickness"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeTissue.Affordance, AutoMovieArchetypeTissue.Dimension> {
    return createTissueImplementation(params, seed);
  }

  /**
   * Centred precision `grip` through the thickness and upward wiping `face`.
   */
  export type Affordance = "face" | "grip";

  /**
   * Length along Z, width along X and Y thickness in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";}
