import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Moving in cover along staged walls and doors: peeking past a wall's end,
 * sidling along its face, passing under a window and breaching a door.
 * Register `HumanCover.moveInCover` to use it. A door stack is a composition of
 * sidles to slots beside the door and `passThrough` entries in order.
 *
 * Every variant reads the named prop's own affordances: a wall's `face`
 * surface gives its plane and its two ends, a window's `aperture` and `sill`
 * give the opening to stay below, and a door's `hinge` articulation and its
 * handle give the leaf to drive and where to strike it. Refusals name the
 * dimension that does not fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four variants, the composition for a stack, the affordances read and the refusals.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on kind; each variant names the prop and the few controls its move takes, in metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry; planCover in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No wall plane, opening or hinge is restated; they come from the props.
 */
export namespace IAutoMovieMotionHumanCover {
  /**
   * Which way the body faces the wall it sidles along.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both values.
   * @evidence contracts/development/design.md#principled-representation A closed choice of the side against the wall.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the sidle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted values are declared here directly.
   */
  export type Against = "back" | "chest";

  /**
   * Lean the head out past a wall's end and back, the feet behind the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The wall's face and the end peeked past; exposure in metres past the end's plane; hold in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the peek reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The end's plane comes from the face's width.
   */
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

    /** Seconds the head holds out, between the lean out and the lean back; 0.8 s when absent. */
    hold?: number;
  }

  /**
   * Step sideways along a wall's face, the back or chest against it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The face, the signed distance along it in metres and the trunk's gap from it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the sidle reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The lane follows from the face and the body's depth.
   */
  export interface ISidle {
    /** Discriminant: a wall sidle. */
    kind: "sidle";

    /** Subject of the fixed wall prop. */
    wall: string;

    /** Id of its `face` surface affordance. */
    face: string;

    /** Where to stop along the face from its middle, metres; positive toward its right end as seen facing it. */
    along: number;

    /** The side against the wall; `back` when absent. */
    against?: Against;

    /** The trunk's gap from the face, metres; 0.05 when absent. */
    offset?: number;
  }

  /**
   * Pass along a wall under a window, the head below its sill.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and unit.
   * @evidence contracts/development/design.md#principled-representation The window prop and the signed distance past it along its wall, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the window passage reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The sill height and opening width come from the window.
   */
  export interface IWindow {
    /** Discriminant: a window passage. */
    kind: "window";

    /** Subject of the fixed window prop. */
    window: string;

    /** Where to stop past the window from its middle, metres; positive toward its right end as seen facing it from the room's side. */
    along: number;
  }

  /**
   * Kick a closed door open at its latch side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The door prop; its hinge and handle place the strike and the swing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The field the breach reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A door that opens toward the performer or is out of reach is refused at runtime.
   */
  export interface IBreach {
    /** Discriminant: a door breach. */
    kind: "breach";

    /** Subject of the hinged door prop. */
    door: string;
  }

  /**
   * Parameters: one of the four cover moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the variants.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union on kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants planCover dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IPeek | ISidle | IWindow | IBreach;
}
