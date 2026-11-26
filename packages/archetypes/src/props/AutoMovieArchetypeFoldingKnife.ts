import { type AutoMovieArchetype } from "../core/index";
import { createFoldingKnife as createFoldingKnifeImplementation } from "./internal/createFoldingKnife";

/** Public operations for Auto Movie Archetype Folding Knife. */
export namespace AutoMovieArchetypeFoldingKnife {
  /**
   * A folding knife whose blade swings from inside its handle to open and locks
   * there.
   *
   * The handle runs along `+Z` from its butt at the origin to the pivot at its
   * far end, its spine up (`+Y`). The blade turns about the pivot's `+X` on the
   * `blade` hinge, from folded into the handle's slot at 0, its edge inside, to
   * open and locked at 180 degrees, pointing along `+Z`: a lock holds the blade
   * at the hinge's end, which the drive's last travel keeps. `grip` is the
   * handle, taken from below; `stud` is the thumb stud on the blade's spine that
   * opens it; `point` the blade's tip.
   *
   * @param params The optional scene id.
   * @returns The knife and its contacts, metres.
   */
  export function create(params?: AutoMovieArchetypeFoldingKnife.IParams): AutoMovieArchetype<
  AutoMovieArchetypeFoldingKnife.Affordance,
  AutoMovieArchetypeFoldingKnife.Dimension
> {
    return createFoldingKnifeImplementation(params);
  }

  /** The blade's hinge, the handle, the thumb stud and the point. */
  export type Affordance = "blade" | "grip" | "stud" | "point";

  /** The blade's length, the handle's and the mass. */
  export type Dimension = "blade" | "handle" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `foldingKnife` when absent. */
    id?: string;
  }

  /** The knife's size, metres and kilograms. */
  export interface ISize {
    /** The blade from the pivot. */
    blade: number;

    /** The handle, butt to bolster. */
    handle: number;

    /** The handle's depth, spine to belly. */
    width: number;

    /** The handle's thickness. */
    thickness: number;

    /** The mass. */
    mass: number;
  }}
