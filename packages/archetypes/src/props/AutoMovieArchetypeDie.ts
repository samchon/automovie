import { type AutoMovieArchetype } from "../core/index";
import { createDie as createDieImplementation } from "./internal/createDie";
import { TabletopStack } from "./internal/TabletopStack";

/**
 * Constructs a plain plastic die cube with upper pinch and stacking sockets.
 */
export namespace AutoMovieArchetypeDie {
  /**
   * Build a six-sided plastic die resting on its lower face at Y zero.
   *
   * The cube spans 0.016 metres on each axis. Its full side sets the
   * grip aperture at the upper face.
   *
   * @param params Optional scene ID, defaulting to `die`.
   * @returns The unmarked cube with its upper pinch and two stacking sockets.
   */
  export function create(params?: AutoMovieArchetypeDie.IParams): AutoMovieArchetype<AutoMovieArchetypeDie.Affordance, AutoMovieArchetypeDie.Dimension> {
    return createDieImplementation(params);
  }

  /**
   * Upper precision `grip` and `top` socket, with a `base` socket on the resting face.
   */
  export type Affordance = TabletopStack.Contact;

  /** Cube side in metres and estimated whole mass in kilograms. */
  export type Dimension = "side" | "mass";

  /** Optional scene ID for the fixed-size die. */
  export interface IParams {
    /** Scene object ID, defaulting to `die`. */
    id?: string;
  }

  /** The fixed cube side and estimated mass. */
  export interface IDie {
    /** Cube side, 0.016 metres. */
    side: number;

    /** Estimated whole die mass, 0.005 kilograms. */
    mass: number;
  }}
