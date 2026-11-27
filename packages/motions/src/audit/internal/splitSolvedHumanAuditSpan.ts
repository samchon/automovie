import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/*
 * One placed action as the audit reads it around the span a solved window owns
 * some of the person's segments (`solvedHumanAuditSpans`): before and after the
 * span as declared, and inside it with the windows of the owned parts removed
 * and the solver's contact episodes that overlap it added as bearing windows
 * (`bear`), their film seconds turned into shares of the action's duration from
 * its start, clamped to [0, 1]. Where the solver owns the root, the inside
 * piece takes no balance judgement (`physical: false`). An action that does not
 * overlap the span is read as it is.
 * Parameter span: The placed action, film seconds.
 * Parameter owned: The owned span and whether it takes the root.
 * Parameter solved: The solver's contact episodes of the person, film seconds.
 * Parameter owns: Whether a declared window bears on an owned segment.
 * Returns: The pieces, in film order.
 */
export function splitSolvedHumanAuditSpan(
  span: IAutoMovieMotionHumanAuditMotion.ISpan,
  owned: splitSolvedHumanAuditSpan.IOwned,
  solved: readonly splitSolvedHumanAuditSpan.IContact[],
  owns: (window: IAutoMovieMotionHumanContactWindow) => boolean,
): IAutoMovieMotionHumanAuditMotion.ISpan[] {
  if (!(span.entryTime < owned.to && owned.from < span.end)) return [span];
  const from: number = Math.max(span.entryTime, owned.from);
  const to: number = Math.min(span.end, owned.to);
  const share: (seconds: number) => number = (seconds: number): number =>
    span.plan.duration > 0
      ? Math.min(1, Math.max(0, (seconds - span.start) / span.plan.duration))
      : 0;
  const inside: IAutoMovieMotionHumanAuditMotion.ISpan = {
    ...span,
    entryTime: from,
    end: to,
    ...(owned.root ? { physical: false } : {}),
    plan: {
      ...span.plan,
      contacts: [
        ...span.plan.contacts.filter(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            !owns(window),
        ),
        ...solved
          .filter(
            (contact: splitSolvedHumanAuditSpan.IContact): boolean =>
              contact.from < to && from < contact.to,
          )
          .map(
            (
              contact: splitSolvedHumanAuditSpan.IContact,
            ): IAutoMovieMotionHumanContactWindow => ({
              part: contact.part,
              kind: "bear",
              from: share(Math.max(from, contact.from)),
              to: share(Math.min(to, contact.to)),
              support: contact.support,
            }),
          ),
      ],
    },
  };
  return [
    ...(span.entryTime < from ? [{ ...span, end: from }] : []),
    inside,
    ...(to < span.end ? [{ ...span, entryTime: to }] : []),
  ];
}

/*
 * Companion types of splitSolvedHumanAuditSpan.
 */
export namespace splitSolvedHumanAuditSpan {
  /*
   * The span a solved window owns, film seconds.
   */
  export interface IOwned {
    /*
     * First film second the solver owns a segment of the person.
     */
    from: number;

    /*
     * Last film second it does.
     */
    to: number;

    /*
     * Whether it owns the root segment, the body's whole support.
     */
    root: boolean;
  }

  /*
   * A solver contact episode of the person as a bearing window, film seconds.
   */
  export interface IContact {
    /*
     * The person's part in contact.
     */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /*
     * What it bears on.
     */
    support: IAutoMovieMotionHumanContactWindow.Support;

    /*
     * First film second.
     */
    from: number;

    /*
     * Last film second.
     */
    to: number;
  }
}
