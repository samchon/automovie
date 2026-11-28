import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./internal/WornPropDraw";
import { createCyclingHelmet as createCyclingHelmetImplementation } from "./internal/createCyclingHelmet";

/** Constructs a cycling helmet with a side rim hold and crown seat. */
export namespace AutoMovieArchetypeCyclingHelmet {
  /**
   * Build a cycling helmet with its rim at model Y zero and front along `+Z`.
   *
   * The `hold` faces up at the right rim (`-X`), with its grasp span
   * read from shell geometry. The `wear` socket faces down from the
   * inside crown, 0.02 metres below the shell top.
   *
   * @param params Optional ID and finite shell width, depth, height or mass
   *   admitted by the bands. The default ID is `wearable`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   a 0.21 metre shell width,
   *   0.27 metre depth and 0.15 metre height.
   * @returns The shell with a rim grasp and model-space wearing socket.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCyclingHelmet.Affordance,
  AutoMovieArchetypeCyclingHelmet.Dimension
> {
    return createCyclingHelmetImplementation(params, seed);
  }

  /** Right rim `hold` and downward crown `wear` socket. */
  export type Affordance = "hold" | "wear";

  /**
   * Shell width along X, front-to-back depth along Z and height along Y in metres. Mass is in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}
