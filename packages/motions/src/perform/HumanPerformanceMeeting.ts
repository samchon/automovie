import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
} from "@automovie/interface";

import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { poseBones } from "../posture/poseBones";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * The action context's meeting reader (`IHumanActionContext.meeting`): one
 * record per meeting, computed by the role planned first from where every
 * role stands at its start, and read by every other role while it lies
 * ahead of its own start. Each role states whether a seat bears it then
 * (`AutoMovieMotionMeeting.IRole.seated`): this role from its entry's
 * supports, a partner from the seat window its placed action holds open at
 * that second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the reader computes, who computes it, who reads it and how each role's seat is read.
 * @evidence contracts/development/design.md#principled-representation A closure over the performance's state and one action's place, the context member it fills.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader and the seat test it reads partners by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A partner's seat is its own declared contact, never guessed from its height.
 */
export namespace HumanPerformanceMeeting {
  /**
   * The meeting reader of one placed action.
   *
   * @param self The performance's state.
   * @param subject The action's performer.
   * @param body The performer's body.
   * @param entry The state the action is entered from.
   * @param start The film second of the action's time zero.
   * @returns The reader.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the reader returned.
   * @evidence contracts/development/implementation.md#principled-implementation The roles are this performer at its entry and each partner as placed at the start; the record is keyed by the kind, the whole cast in one order and the window, kept by the role that computed it and returned to every other role while its contact lies ahead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Own role, partners, the kept record or a new one.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A meeting with no partner is this role's alone and is never kept.
   * @evidence contracts/development/implementation.md#efficient-algorithms One meeting per cast and window; each partner's posture and bones read once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `AutoMovieMotionMeeting.of`, `HumanPerformanceRead` and `poseBones`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The state keeps each record for as long as the performance does.
   */
  export function reader(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    start: number,
  ): IAutoMovieMotionHumanActionContext["meeting"] {
    return (
      kind: IAutoMovieMotionMeetingKind,
      role: string,
      partner?:
        | IAutoMovieMotionHumanActionContext.IPartner
        | readonly IAutoMovieMotionHumanActionContext.IPartner[],
      window?: IAutoMovieMotionMeeting.IWindow,
    ): IAutoMovieMotionMeeting => {
      const context: { start: number } = { start };
      const own: IAutoMovieMotionMeetingRole = {
        name: role,
        subject,
        body,
        posture: entry.posture,
        bones: poseBones(body, entry.pose),
        seated: entry.supports.some(
          (s: IAutoMovieMotionHumanEntryState.ISupport): boolean => s.kind === "seat",
        ),
        entry: { posture: entry.posture, pose: entry.pose },
      };
      const others: readonly IAutoMovieMotionHumanActionContext.IPartner[] =
        partner === undefined ? [] : "subject" in partner ? [partner] : partner;
      if (others.length === 0)
        return AutoMovieMotionMeeting.of(kind, [own], context, window);

      // The role planned first computes the meeting; every other reads
      // that record while it still lies ahead of its own start. The key
      // names the whole cast in one order, so each role finds it.
      const key: string = `${kind.name}|${[
        subject,
        ...others.map(
          (other: IAutoMovieMotionHumanActionContext.IPartner): string => other.subject,
        ),
      ]
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .join("|")}|${window?.from ?? ""}|${window?.to ?? ""}`;
      const kept = self.meetings.get(key);
      if (
        kept !== undefined &&
        kept.subject !== subject &&
        kept.meeting.instants.relax > start
      )
        return kept.meeting;
      const meeting: IAutoMovieMotionMeeting =
        AutoMovieMotionMeeting.of(
          kind,
          [
            own,
            ...others.map(
              (
                other: IAutoMovieMotionHumanActionContext.IPartner,
              ): IAutoMovieMotionMeetingRole => {
                const posture: IAutoMovieMotionHumanPosture = HumanPerformanceRead.posture(
                  self,
                  other.subject,
                  start,
                );
                return {
                  name: other.role,
                  subject: other.subject,
                  body: HumanPerformanceRead.person(self, other.subject).performer
                    .body,
                  posture,
                  bones: HumanPerformanceRead.bones(self, other.subject, start),
                  seated: seated(
                    HumanPerformanceRead.segments(self, other.subject),
                    start,
                  ),
                  entry: {
                    posture,
                    pose: HumanPerformanceRead.pose(self, other.subject, start),
                  },
                };
              },
            ),
          ],
          context,
          window,
        );
      self.meetings.set(key, { subject, meeting });
      return meeting;
    };
  }

  /**
   * Whether a seat bears a performer at a film second: the action active
   * then holds a seat window open at its share of that second.
   *
   * @param segments The performer's placed actions.
   * @param seconds Film seconds.
   * @returns Whether a seat bears the performer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test and its inputs.
   * @evidence contracts/development/implementation.md#principled-implementation A seat bears the body exactly while a seat window of its active action is open, the contact the action declares.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the active action, test its windows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A second before the first action or after the last reads the nearest action, as the placed path does.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the actions and the windows.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function seated(
    segments: readonly IAutoMovieMotionHumanSegment[],
    seconds: number,
  ): boolean {
    const active: IAutoMovieMotionHumanSegment | undefined =
      segments.find(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.entryTime <= seconds && seconds < s.end,
      ) ?? segments[segments.length - 1];
    if (active === undefined) return false;
    const share: number = Math.min(
      1,
      Math.max(0, (seconds - active.start) / active.plan.duration),
    );
    return active.plan.contacts.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "seat" && w.from <= share && share <= w.to,
    );
  }
}
