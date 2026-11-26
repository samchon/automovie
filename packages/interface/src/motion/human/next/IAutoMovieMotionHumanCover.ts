import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Authoring inputs for peeking from, hiding behind and breaching cover.
 */
export namespace IAutoMovieMotionHumanCover {
  /** Which way the body faces the wall it sidles along. */
  export type Against = "back" | "chest";

  /** Lean the head out past a wall's end and back, the feet behind the end. */
  export interface IPeek {
    /** Discriminant: a corner peek. */
    kind: "peek";

    /** Subject of the fixed wall prop. */
    wall: string;

    /** Id of its `face` surface affordance. */
    face: string;

    /** The end of the face peeked past, as seen facing the face. */
    side: AutoMovieHumanSide;

    /** How far the head crosses the end's plane, metres; 0.12 m when absent. */
    exposure?: number;

    /**
     * Seconds the head holds out, between the lean out and the lean back; 0.8 s
     * when absent.
     */
    hold?: number;
  }

  /** Step sideways along a wall's face, the back or chest against it. */
  export interface ISidle {
    /** Discriminant: a wall sidle. */
    kind: "sidle";

    /** Subject of the fixed wall prop. */
    wall: string;

    /** Id of its `face` surface affordance. */
    face: string;

    /**
     * Where to stop along the face from its middle, metres; positive toward its
     * right end as seen facing it.
     */
    along: number;

    /** The side against the wall; `back` when absent. */
    against?: Against;

    /** The trunk's gap from the face, metres; 0.05 when absent. */
    offset?: number;
  }

  /** Pass along a wall under a window, the head below its sill. */
  export interface IWindow {
    /** Discriminant: a window passage. */
    kind: "window";

    /** Subject of the fixed window prop. */
    window: string;

    /**
     * Where to stop past the window from its middle, metres; positive toward
     * its right end as seen facing it from the room's side.
     */
    along: number;
  }

  /** Kick a closed door open at its latch side. */
  export interface IBreach {
    /** Discriminant: a door breach. */
    kind: "breach";

    /** Subject of the hinged door prop. */
    door: string;
  }

  /** Parameters: one of the four cover moves. */
  export type IParams = IPeek | ISidle | IWindow | IBreach;
}
