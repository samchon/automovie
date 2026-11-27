import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./internal/WornPropDraw";
import { createCyclingHelmet as createCyclingHelmetImplementation } from "./internal/createCyclingHelmet";

/** Public operations for Auto Movie Archetype Cycling Helmet. */
export namespace AutoMovieArchetypeCyclingHelmet {
  /**
   * Cycling helmet with a rim hold and a shell socket. It rests on its rim, shell
   * up, front toward `+Z`; `hold` is the rim at its right side (`-X`) where a
   * right hand puts it on by the side of the head, closing over the shell on its
   * height (the hold declares no aperture, so a grasp reads the shell's span
   * along its `+Y`), and `wear` is the shell's inside top, `+Y` toward the head,
   * which rests on the head's crown under the foam.
   *
   * @param params The optional scene ID and any fixed free dimension in metres or
   *   kilograms.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When a fixed parameter lies outside its
   *   admitted band.
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

  /** The contacts this producer builds. */
  export type Affordance = "hold" | "wear";

  /**
   * The dimensions this producer draws, in metres unless the draw records
   * kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}
