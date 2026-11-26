import { type AutoMovieArchetype } from "../core/index";
import { createHobble as createHobbleImplementation } from "./internal/createHobble";

/** Public operations for Auto Movie Archetype Hobble. */
export namespace AutoMovieArchetypeHobble {
  /**
   * A fore hobble: a cuff round each foreleg's cannon and a strap between them.
   *
   * Each cuff is a short ring round the cannon along the leg's axis (`+Y`). The
   * inner radius fits the cannon and the leather extends outward; at rest the
   * cuffs' middles stand the strap's length apart along `+X`, the left at `+X`.
   * The strap is a span from the inner side of one cuff to the inner side of the
   * other, its rest length the strap's length less the two cuffs' radii, so the
   * cuffs' middles never stand farther apart than the strap's length while it is
   * not drawn past its rest length, and a pose that draws it shorter reports it
   * slack. The cuffs are posed onto a hobbled equid's forelegs by
   * `AutoMovieArchetypeEquineHobble`. The cuff's width and thickness, the strap's
   * radius and the mass are authored.
   *
   * @param cannon The radius of the cannon the cuffs close round, metres.
   * @param params The strap's length and the model's id.
   * @returns The hobble.
   * @throws {RangeError} For a nonpositive cannon radius or strap length.
   */
  export function create(cannon: number, params: AutoMovieArchetypeHobble.IParams): AutoMovieArchetype<never, never> {
    return createHobbleImplementation(cannon, params);
  }

  /** The parameters. */
  export interface IParams {
    /**
     * The most the cuffs' middles stand apart, metres, more than the two cuffs
     * are wide.
     */
    strap: number;

    /** The model's id, unique in a scene; `hobble` when absent. */
    id?: string;
  }}
