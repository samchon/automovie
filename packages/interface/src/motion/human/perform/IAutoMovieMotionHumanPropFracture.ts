import type { IAutoMovieInteractionEvent } from "../../../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanObject } from "./IAutoMovieMotionHumanObject";

/**
 * A staged breakaway prop uses the contact already observed in a performance.
 * The author supplies the energy and momentum budget for the visual fragments.
 * A model supplies its own split and keeps its concrete type in the result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging boundary, the budget's owner, and the placement result.
 * @evidence contracts/development/design.md#principled-representation Connects a canonical interaction event and placed frames to the model's deterministic replacement pieces.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPerformance prepares a requested split once and publishes a frame reader to scene consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No inferred material or striking response. An intact prop before the event remains the caller's original model.
 */
export namespace IAutoMovieMotionHumanPropFracture {
  /**
   * The contact and model for one authored breakaway.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the placed prop, recorded hit, model and local budget units. The model splits deterministically or returns null to keep the prop intact.
   * @evidence contracts/development/design.md#principled-representation The exact hit id and its target disambiguate placement. The budget goes directly to the model's declared split.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPerformance resolves the event target and reads the prop frame. The model owns piece generation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry inference or test-dependent outcome is encoded in the request.
   */
  export interface IRequest<Piece extends IAutoMovieMotionHumanObject.IModel> {
    /** The placed prop that changes at the contact. */
    subject: string;

    /** The id of a hit on that prop, as returned by the performance's hit reader. */
    hit: string;

    /** The same breakaway model used to place the prop. */
    model: IAutoMovieMotionHumanObject.IModel & {
      /**
       * Split deterministically from the authored budget, or return null when intact.
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

    /** Authored energy in joules and fragment momentum in kg m/s in the model's frame. */
    budget: { energy: number; momentum: IAutoMovieVector3 };
  }

  /**
   * One replacement piece on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the piece identity, its preserved model type and its world frame.
   * @evidence contracts/development/design.md#principled-representation A concrete model and one world transform are sufficient to place each sampled piece.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPerformance publishes instances from the fracture plan's sampler.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No extra model or body representation is introduced.
   */
  export interface IPlaced<Piece> {
    /** Null for the held remainder, or the fragment id declared by the model. */
    fragment: string | null;

    /** The remainder or fragment model. */
    model: Piece;

    /** World rigid frame in metres. */
    frame: IAutoMovieRigidTransform;
  }

  /**
   * The replacement contact and a sampler for the geometry present from it onward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when replacement pieces become visible and what the sampler returns before the contact.
   * @evidence contracts/development/design.md#principled-representation One canonical interaction event anchors the returned frame function on the film clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The scene consumes the event and sampled replacement. All trajectory construction stays in the planner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No change to collision geometry or independent timeline is implied by this staging result.
   */
  export interface IPlan<Piece> {
    /** The replacement contact at the original hit's film second. */
    contact: IAutoMovieInteractionEvent;

    /**
     * The visible pieces at a finite film second, or null before the contact.
     */
    at(seconds: number): readonly IPlaced<Piece>[] | null;
  }
}
