import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanObject } from "./IAutoMovieMotionHumanObject";

/**
 * A staged breakaway prop uses the contact already observed in a performance.
 * The author supplies the energy and momentum budget for the visual fragments.
 * A model supplies its own split and keeps its concrete type in the result.
 */
export namespace IAutoMovieMotionHumanPropFracture {
  /** The contact and model for one authored breakaway. */
  export interface IRequest<Piece extends IAutoMovieMotionHumanObject.IModel> {
    /** The placed prop that changes at the contact. */
    subject: string;

    /**
     * The id of a hit on that prop, as returned by the performance's hit
     * reader.
     */
    hit: string;

    /** The same breakaway model used to place the prop. */
    model: IAutoMovieMotionHumanObject.IModel & {
      /**
       * Split deterministically from the authored budget, or return null when
       * intact.
       */
      broken(budget: IRequest<Piece>["budget"]): {
        remainder: Piece | null;
        fragments: readonly {
          id: string;
          archetype: Piece;
          /** Launch velocity in the model frame, in metres per second. */
          velocity: IAutoMovieVector3;
        }[];
      } | null;
    };

    /**
     * Authored energy in joules and fragment momentum in kg m/s in the model's
     * frame.
     */
    budget: { energy: number; momentum: IAutoMovieVector3 };
  }

  /** One replacement piece on the film clock. */
  export interface IPlaced<Piece> {
    /** Null for the held remainder, or the fragment id declared by the model. */
    fragment: string | null;

    /** The remainder or fragment model. */
    model: Piece;

    /** World rigid frame in metres. */
    frame: IAutoMovieRigidTransform;
  }

  /**
   * The replacement contact and a sampler for the geometry present from it
   * onward.
   */
  export interface IPlan<Piece> {
    /** The replacement contact at the original hit's film second. */
    contact: IAutoMovieInteractionEvent;

    /** The visible pieces at a finite film second, or null before the contact. */
    at(seconds: number): readonly IPlaced<Piece>[] | null;
  }
}
