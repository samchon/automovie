/**
 * A performance laid out on the film clock: one track per person, each with
 * the actions placed on it and their named instants.
 */
export interface IPlaygroundTimeline {
  /** Seconds from 0 to the last action's end. */
  duration: number;

  /** One track per performer, in the composition's order. */
  tracks: IPlaygroundTimeline.ITrack[];
}
export namespace IPlaygroundTimeline {
  /** One person's actions. */
  export interface ITrack {
    /** The performer. */
    subject: string;

    /** The placed actions, in film order. */
    spans: ISpan[];
  }

  /** One placed action. */
  export interface ISpan {
    /** The action's name. */
    name: string;

    /** Its anchor, or its name when it has none. */
    id: string;

    /** Film second it becomes active. */
    from: number;

    /** Film second it stops: its cut or its end. */
    to: number;

    /** Whether it rides another action instead of following one. */
    overlay: boolean;

    /** Its named instants inside the span. */
    events: IEvent[];
  }

  /** One named instant. */
  export interface IEvent {
    /** The event's name. */
    name: string;

    /** Its film second. */
    seconds: number;
  }
}
