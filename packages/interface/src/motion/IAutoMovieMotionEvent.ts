/**
 * A named instant inside one action, as a share of its duration: a footfall,
 * a toe-off, a kick's chamber or impact, a grip closing.
 *
 * A share is dimensionless in [0, 1], 0 at the action's start and 1 at its
 * end, so an event keeps its place when proficiency or a measure stretches the
 * action's seconds. Names are unique within one action and are what an author
 * cuts at (`until: { event }`) and what a reaction aligns to. The type cannot
 * bound the share; the action's owner validates it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the share's unit and range, the uniqueness of names and what authors and reactions use events for.
 * @evidence contracts/development/design.md#principled-representation A share of the action's duration, so an event keeps its place when proficiency or a measure stretches the seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only a name and a share; timing in seconds stays with the action that owns the duration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts States that the type cannot bound the share and names the owner that validates it.
 */
export interface IAutoMovieMotionEvent {
  /** Event name, unique within its action, such as `rightToeOff` or `impact`. */
  name: string;

  /** Place in the action, a share of its duration in [0, 1]. */
  share: number;
}
