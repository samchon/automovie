import { type AutoMovieArchetype } from "../core/index";
import { createHalter as createHalterImplementation } from "./internal/createHalter";

/** Public operations for Auto Movie Archetype Halter. */
export namespace AutoMovieArchetypeHalter {
  /**
   * A halter fitted to one equid's head: a crown loop behind the poll, a noseband
   * loop round the nose and a cheek strap down each side between them.
   *
   * The halter is built in its head's own frame, the frame its `seat` names: the
   * origin at the poll, `+Y` along the head from the poll to the nose, `+X` to
   * the animal's left. Each loop is four flat straps round a square that just
   * clears the head's radius, so the halter sits on the head it was fitted to
   * without passing into it; a halter is sized to its horse (Schockemöhle's
   * Fremont lists an 11.5 in noseband and 27 in crown for a full horse, a cob's
   * smaller), and the fit here is that sizing made exact. `grip` is the crown's
   * top, where a hand carries the halter. Strap width and thickness, the
   * noseband's place and the mass are authored.
   *
   * @param head The head it is fitted to: the head capsule's length from poll to
   *   nose and its radius, metres.
   * @param params The model's id.
   * @returns The halter.
   */
  export function create(head: AutoMovieArchetypeHalter.IHead, params?: AutoMovieArchetypeHalter.IParams): AutoMovieArchetype<AutoMovieArchetypeHalter.Affordance, never> {
    return createHalterImplementation(head, params);
  }

  /**
   * The contacts: `grip`, the crown's top a hand carries it by; `seat`, the
   * halter's own head frame, laid on the horse's `headgear`.
   */
  export type Affordance = "grip" | "seat";

  /** The head a halter is fitted to. */
  export interface IHead {
    /** The head capsule's length from poll to nose, metres. */
    length: number;

    /** The head capsule's radius, metres. */
    radius: number;
  }

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `halter` when absent. */
    id?: string;
  }}
