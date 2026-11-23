import type { IAutoMovieScheduleError } from "@automovie/interface";

/**
 * A composition the schedule resolver cannot place, with what it could not
 * place as fields: which reference failed, on which intent, and what the
 * composition offers in its stead.
 *
 * The resolver knows only intents, anchors, events and cue tracks, so the
 * fields name those. A content package that owns the composition's meaning (who
 * performs what) turns the fields into its own author-facing refusal without
 * parsing the message, which stays the sentence it was before this type
 * existed.
 */
export class AutoMovieScheduleError extends Error {
  /** Which check failed. */
  public readonly code: IAutoMovieScheduleError.Code;

  /** The subject of the intent being placed, when the failure belongs to one. */
  public readonly subject: string | undefined;

  /** The capability of that intent. */
  public readonly capability: string | undefined;

  /**
   * The anchor or cue track the composition named, when the failure is about
   * one.
   */
  public readonly of: string | undefined;

  /**
   * The name or number that failed: the anchor, the event, the index, the
   * share.
   */
  public readonly value: string | number;

  /**
   * What would have been accepted in its place: the anchors and tracks placed,
   * or the events of the one named. Empty when no list applies.
   */
  public readonly alternatives: readonly string[];

  /**
   * A schedule error.
   *
   * @param message The sentence for a reader.
   * @param props The same facts as fields.
   */
  public constructor(message: string, props: IAutoMovieScheduleError.IProps) {
    super(message);
    this.name = "AutoMovieScheduleError";
    this.code = props.code;
    this.subject = props.subject;
    this.capability = props.capability;
    this.of = props.of;
    this.value = props.value;
    this.alternatives = props.alternatives ?? [];
  }
}
