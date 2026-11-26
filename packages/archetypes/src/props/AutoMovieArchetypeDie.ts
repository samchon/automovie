import { type AutoMovieArchetype } from "../core/index";
import { createDie as createDieImplementation } from "./internal/createDie";
import { TabletopStack } from "./TabletopStack";

/** Public operations for Auto Movie Archetype Die. */
export namespace AutoMovieArchetypeDie {
  /**
   * One six-sided die resting on a face.
   *
   * The die is a cube, its origin the centre of the face it rests on, `+Y` up. It
   * is picked up, rolled and placed by the shared tabletop contacts
   * (`TabletopStack`).
   *
   * @param params The optional scene id.
   * @returns The inert die and its contact frames, metres.
   */
  export function create(params?: AutoMovieArchetypeDie.IParams): AutoMovieArchetype<AutoMovieArchetypeDie.Affordance, AutoMovieArchetypeDie.Dimension> {
    return createDieImplementation(params);
  }

  /** The shared pinch, underside and upper sockets. */
  export type Affordance = TabletopStack.Contact;

  /** The side and the mass. */
  export type Dimension = "side" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `die` when absent. */
    id?: string;
  }

  /** The die's size, metres and kilograms. */
  export interface IDie {
    /** The cube's side, read. */
    side: number;

    /** The die's mass, estimated. */
    mass: number;
  }}
