/**
 * A composition the schedule resolver cannot place, with what it could not
 * place as fields: which reference failed, on which intent, and what the
 * composition offers in its stead.
 *
 * The resolver knows only intents, anchors, events and cue tracks, so the
 * fields name those. A content package that owns the composition's meaning
 * (who performs what) turns the fields into its own author-facing refusal
 * without parsing the message, which stays the sentence it was before this
 * type existed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who throws it, what its fields name and why a content package reads the fields; the companion `Code` and `IProps` document each code and member.
 * @evidence contracts/development/design.md#principled-representation A distinct `Error` subtype with a closed code for each kind of reference the resolver checks, the subject and capability of the intent being placed, the name that failed and the names that exist.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the schedule resolver, its only thrower; read by the motions performance, which reports a missing anchor, a missing event and a duplicate anchor as located refusals listing the alternatives.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action vocabulary and no free-form detail bag: every fact has a named member, and the alternatives are the composition's own ids.
 */
export class AutoMovieScheduleError extends Error {
  /** Which check failed. */
  public readonly code: AutoMovieScheduleError.Code;

  /** The subject of the intent being placed, when the failure belongs to one. */
  public readonly subject: string | undefined;

  /** The capability of that intent. */
  public readonly capability: string | undefined;

  /** The anchor or cue track the composition named, when the failure is about one. */
  public readonly of: string | undefined;

  /** The name or number that failed: the anchor, the event, the index, the share. */
  public readonly value: string | number;

  /** What would have been accepted in its place: the anchors and tracks placed, or the events of the one named. Empty when no list applies. */
  public readonly alternatives: readonly string[];

  /**
   * A schedule error.
   *
   * @param message The sentence for a reader.
   * @param props The same facts as fields.
   */
  public constructor(message: string, props: AutoMovieScheduleError.IProps) {
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

/** Companion types of {@link AutoMovieScheduleError}. */
export namespace AutoMovieScheduleError {
  /**
   * The checks:
   *
   * - `anchor`: an anchor or cue track named by an `at` or an `until` is not placed earlier in walk order;
   * - `event`: the anchor, the track or the intent itself has no event of that name;
   * - `index`: the event exists but not that occurrence of it;
   * - `duplicate`: an anchor id is used twice, or names a cue track;
   * - `share`: a cut falls outside the intent's span;
   * - `timing`: the laws gave an invalid duration or contact;
   * - `law`: the laws lack what the composition asks of them (a proximity cut, an alignment).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists each of the seven codes with the check that raises it.
   * @evidence contracts/development/design.md#principled-representation A closed union of the resolver's checks, so a content package switches over every kind of reference failure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven codes, each thrown by `resolveAutoMovieSchedule`; none is declared for a presumed future check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a free string; no code stands for two failures.
   */
  export type Code =
    | "anchor"
    | "event"
    | "index"
    | "duplicate"
    | "share"
    | "timing"
    | "law";

  /**
   * The facts of a schedule error.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names; the optional ones state when they are absent.
   * @evidence contracts/development/design.md#principled-representation The record of the error's fields: the check that failed, the intent's subject and capability, the anchor or track named, the value that failed and what would have been accepted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `resolveAutoMovieSchedule` passes when it throws; every member becomes a field of the error that a content package reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `subject`, `capability` and `of` are optional because a failure may not belong to an intent or an anchor; they combine without meaningless states, and `alternatives` is none when absent.
   */
  export interface IProps {
    /** Which check failed. */
    code: Code;

    /** The subject of the intent being placed. */
    subject?: string | undefined;

    /** Its capability. */
    capability?: string | undefined;

    /** The anchor or track named. */
    of?: string | undefined;

    /** The name or number that failed. */
    value: string | number;

    /** What would have been accepted; none when absent. */
    alternatives?: readonly string[];
  }
}
