/**
 * A struck subject's hits as a track of named instants, so an action is synced
 * to a hit as to any instant (`sync({ hit })`).
 *
 * The track of `on` is named `hit:<on>`, or `hit:<on>:<by>` for the hits by one
 * striking prop or anchored striker; each hit is an instant named `hit`, in
 * time order. The schedule asks for it when an action is placed
 * (`resolveAutoMovieSchedule.ILaws.instants`), so the strikers must be composed
 * before the struck performer, as a pursuit is. While the schedule is being
 * placed the melee stops are not resolved yet, so each placed weapon of another
 * person is swept against the struck person alone, as their placed poses show
 * them (`resolveAutoMovieContactEvents`); the flights and the blasts are the
 * hit record's own. Once everything is placed the record's resolved hits are
 * read instead.
 */
export namespace IAutoMovieMotionHumanHitTrack {
  /** The name of a hit's track. A hit to sync to. */
  export interface IHit {
    /** The struck subject, a performer or a prop. */
    on: string;

    /** The striking prop, or the striker's subject; any striker when absent. */
    by?: string;

    /** Which of the matching hits, from 0; the first when absent. */
    index?: number;
  }
}
