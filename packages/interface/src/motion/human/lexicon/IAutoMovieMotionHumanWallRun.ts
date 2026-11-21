import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Using a staged wall's face as a brief foot support while moving: a wall
 * step plants one foot on the face, and a wall run steps up the face to
 * catch the wall's top in a cat hang, the hands on the top's edge and the
 * feet on the face. Register `HumanWallRun.wallRun` to use it. A tic-tac
 * composes a wall step and a `jump` to the redirected landing; a wall flip
 * composes a wall step and a `jump` with a backward somersault.
 *
 * Every wall contact is checked against the face's friction cone, and a top
 * beyond the climber's reach from the steps is refused with the shortfall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both moves, the compositions, the checks and the refusals.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on kind; each names the wall, its face and the foot that steps.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry; planWallRun in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No height or friction is restated; they come from the wall and the body.
 */
export namespace IAutoMovieMotionHumanWallRun {
  /**
   * One foot planted on the face, ready for the next move.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and default.
   * @evidence contracts/development/design.md#principled-representation The wall, its face and the stepping foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the wall step reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The step's height follows from the body.
   */
  export interface IWallStep {
    /** Discriminant: a single wall step. */
    kind: "wallStep";

    /** Subject of the fixed wall prop. */
    wall: string;

    /** Id of its `face` surface affordance. */
    face: string;

    /** The foot that plants on the face; `right` when absent. */
    foot?: AutoMovieHumanSide;
  }

  /**
   * Steps up the face to a cat hang from the wall's top.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and default.
   * @evidence contracts/development/design.md#principled-representation The wall, its face, its top edge and the first foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the wall run reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The top's height comes from the ledge affordance.
   */
  export interface IRun {
    /** Discriminant: a wall run to a cat hang. */
    kind: "run";

    /** Subject of the fixed wall prop. */
    wall: string;

    /** Id of its `face` surface affordance. */
    face: string;

    /** Id of its top `ledge` affordance. */
    top: string;

    /** The foot that plants on the face first; `right` when absent. */
    foot?: AutoMovieHumanSide;
  }

  /**
   * Parameters: a wall step or a wall run.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; planWallRun owns the reach and friction refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the variants and the admission owners.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union on kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants planWallRun dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IWallStep | IRun;
}
