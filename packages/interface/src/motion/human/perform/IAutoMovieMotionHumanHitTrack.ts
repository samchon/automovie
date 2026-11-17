/**
 * A struck subject's hits as a track of named instants, so an action is
 * synced to a hit as to any instant (#3480: `sync({ hit })`).
 *
 * The track of `on` is named `hit:<on>`, or `hit:<on>:<by>` for the hits by
 * one striking prop or anchored striker; each hit is an instant named
 * `hit`, in time order. The schedule asks for it when an action is placed
 * (`resolveAutoMovieSchedule.ILaws.instants`), so the strikers must be
 * composed before the struck performer, as a pursuit is. While the schedule
 * is being placed the melee stops are not resolved yet, so each placed
 * weapon of another person is swept against the struck person alone, as
 * their placed poses show them (`resolveAutoMovieContactEvents`); the
 * flights and the blasts are the hit record's own. Once everything is
 * placed the record's resolved hits are read instead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation by: The striking prop, or the striker's subject; any striker when absent. index: Which of the matching hits, from 0; the first when absent.
 * @evidence contracts/development/design.md#principled-representation by: The striking prop, or the striker's subject; any striker when absent. index: Which of the matching hits, from 0; the first when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanHitTrack.ts (HumanHitTrack.name, hit).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanHitTrack.name.
 */
export namespace IAutoMovieMotionHumanHitTrack {
  /**
   * The name of a hit's track. A hit to sync to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation by: The striking prop, or the striker's subject; any striker when absent. index: Which of the matching hits, from 0; the first when absent.
   * @evidence contracts/development/design.md#principled-representation by: The striking prop, or the striker's subject; any striker when absent. index: Which of the matching hits, from 0; the first when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanHitTrack.ts (HumanHitTrack.name, hit).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanHitTrack.name.
   */
  export interface IHit {
    /** The struck subject, a performer or a prop. */
    on: string;

    /** The striking prop, or the striker's subject; any striker when absent. */
    by?: string;

    /** Which of the matching hits, from 0; the first when absent. */
    index?: number;
  }
}
