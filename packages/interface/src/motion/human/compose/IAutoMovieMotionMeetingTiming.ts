/**
 * The ready, decisive stroke and relaxation instants of a meeting, in seconds.
 * The containing field or operation states the origin: role-local timing,
 * resolved film time or converted action-local time.
 */
export interface IAutoMovieMotionMeetingTiming {
  /** When the roles are ready to meet, seconds. */
  ready: number;

  /** When the contact is made, seconds. */
  stroke: number;

  /** When the contact is left, seconds. */
  relax: number;
}
