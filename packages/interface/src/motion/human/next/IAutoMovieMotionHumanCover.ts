import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Moving against a cover: peeking, sidling, a window and a breach, with the back or the chest against the wall.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Climb family, each taking the law's own parameter type.
 */
export interface IAutoMovieMotionHumanCover<Chain> {
  /**
   * Take cover: peek round it, sidle along it, look out of a window or breach.
   *
   * @param params One of the variants of `IAutoMovieMotionHumanCover.IParams`: `IPeek`, `ISidle`, `IWindow` or `IBreach`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   */
  cover(params: IAutoMovieMotionHumanCover.ICover, anchor?: string): Chain;
}

/**
 * The parameter types of the Cover methods.
 */
export namespace IAutoMovieMotionHumanCover {
  /**
   * The parameters of `cover`: the lexicon law's own `IAutoMovieMotionHumanCover.IParams` (imported as `IAutoMovieMotionHumanCover`), unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged, with its import name.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The lexicon's `IAutoMovieMotionHumanCover` owns the type; the alias serves this family's `cover` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `cover` takes the type its law reads.
   */
  export type ICover = IAutoMovieMotionHumanCover.IParams;
}

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
