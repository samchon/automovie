import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Moving against a cover: peeking, sidling, a window and a breach, with the
 * back or the chest against the wall.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanCover` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanCover<Chain> {
  /**
   * Take cover: peek round it, sidle along it, look out of a window or breach.
   *
   * Registered law: `registered("cover", params)`; not a chain method.
   *
   * @param params One of the variants of `IAutoMovieMotionHumanCover.IParams`:
   *   `IPeek`, `ISidle`, `IWindow` or `IBreach`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  cover(params: IAutoMovieMotionHumanCover.IParams, anchor?: string): Chain;
}

/**
 * Moving in cover along staged walls and doors: peeking past a wall's end,
 * sidling along its face, passing under a window and breaching a door. Register
 * `HumanCover.moveInCover` to use it. A door stack is a composition of sidles
 * to slots beside the door and `passThrough` entries in order.
 *
 * Every variant reads the named prop's own affordances: a wall's `face` surface
 * gives its plane and its two ends, a window's `aperture` and `sill` give the
 * opening to stay below, and a door's `hinge` articulation and its handle give
 * the leaf to drive and where to strike it. Refusals name the dimension that
 * does not fit.
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
