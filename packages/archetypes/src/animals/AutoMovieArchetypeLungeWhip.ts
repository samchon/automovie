import { type AutoMovieArchetype } from "../core/index";
import { createLungeWhip as createLungeWhipImplementation } from "./fittings/createLungeWhip";

/** Public operations for Auto Movie Archetype Lunge Whip. */
export namespace AutoMovieArchetypeLungeWhip {
  /**
   * A lunge whip: a handle at the butt and a long stock up `+Y`, the shaft a
   * handler points at a lunged equid's quarters.
   *
   * The handle runs from the butt at the origin up `HANDLE.length`; the stock
   * carries on to the shaft's length. `grip` is the handle's middle on its
   * surface, its line along the shaft, where the whip hand closes. The lash and
   * popper hang from a real whip's tip; they are not laid, so the whip shows its
   * shaft only.
   *
   * @param params The model's id.
   * @returns The whip.
   */
  export function create(params?: AutoMovieArchetypeLungeWhip.IParams): AutoMovieArchetype<AutoMovieArchetypeLungeWhip.Affordance, never> {
    return createLungeWhipImplementation(params);
  }

  /** The contacts: `grip`, the handle a hand closes on. */
  export type Affordance = "grip";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `lungeWhip` when absent. */
    id?: string;
  }}
