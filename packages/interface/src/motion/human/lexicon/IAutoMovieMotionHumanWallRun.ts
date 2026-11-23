import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Using a staged wall's face as a brief foot support while moving: a wall step
 * plants one foot on the face, and a wall run steps up the face to catch the
 * wall's top in a cat hang, the hands on the top's edge and the feet on the
 * face. Register `HumanWallRun.wallRun` to use it. A tic-tac composes a wall
 * step and a `jump` to the redirected landing; a wall flip composes a wall step
 * and a `jump` with a backward somersault.
 *
 * Every wall contact is checked against the face's friction cone, and a top
 * beyond the climber's reach from the steps is refused with the shortfall.
 */
export namespace IAutoMovieMotionHumanWallRun {
  /** One foot planted on the face, ready for the next move. */
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

  /** Steps up the face to a cat hang from the wall's top. */
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

  /** Parameters: a wall step or a wall run. */
  export type IParams = IWallStep | IRun;
}
