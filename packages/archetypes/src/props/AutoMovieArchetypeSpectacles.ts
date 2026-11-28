import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./internal/WornPropDraw";
import { createSpectacles as createSpectaclesImplementation } from "./internal/createSpectacles";

/** Constructs spectacles with a front bridge pinch and rear nose socket. */
export namespace AutoMovieArchetypeSpectacles {
  /**
   * Build spectacles with the front at Z zero and temples extending toward `-Z`.
   *
   * The `hold` faces `+Z` from the bridge. The `wear` socket faces `-Z`
   * from the back of the front at nose height.
   *
   * @param params Optional ID and finite frame width and height, temple depth or mass
   *   admitted by the bands. The default ID is `wearable`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   a front 0.122 metres across
   *   and 0.041 metres high with 0.15 metre temple depth.
   * @returns The front, two temples and their two contact frames.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSpectacles.Affordance, AutoMovieArchetypeSpectacles.Dimension> {
    return createSpectaclesImplementation(params, seed);
  }

  /** Forward bridge `hold` and rearward nose `wear` socket. */
  export type Affordance = "hold" | "wear";

  /**
   * Front width and height and temple depth in metres. Mass is in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}
