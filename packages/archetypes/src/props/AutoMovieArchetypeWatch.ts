import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./internal/WornPropDraw";
import { createWatch as createWatchImplementation } from "./internal/createWatch";

/** Constructs a wristwatch laid flat with an upward readable dial. */
export namespace AutoMovieArchetypeWatch {
  /**
   * Build a wristwatch resting dial up with its straight strap along Z.
   *
   * The dial's 12 o'clock lies toward model `-Z`. The `hold` pinches the
   * case sideways and `wear` is the downward socket below the strap.
   *
   * @param params Optional ID and finite case width and thickness, strap length or mass
   *   admitted by the bands. The default ID is `wearable`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.0367 metres case width,
   *   0.0085 metres case thickness and a 0.22 metre strap.
   * @returns The flat watch with the case hold, dial plane and wrist socket.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWatch.Affordance, AutoMovieArchetypeWatch.Dimension> {
    return createWatchImplementation(params, seed);
  }

  /**
   * Side case `hold`, upward readable `face` and a downward wrist `wear` socket.
   */
  export type Affordance = "face" | "hold" | "wear";

  /**
   * Case width and thickness, and strap length along Z, in metres. Mass is in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}
