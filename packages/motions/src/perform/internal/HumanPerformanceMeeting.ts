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

import { AutoMovieMotionMeeting } from "../../compose/internal/AutoMovieMotionMeeting";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * The action context's meeting reader (`IHumanActionContext.meeting`): one
 * record per meeting, computed by the role planned first from where every role
 * stands at its start, and read by every other role while it lies ahead of its
 * own start. Each role states whether a seat bears it then
 * (`AutoMovieMotionMeeting.IRole.seated`): this role from its entry's supports,
 * a partner from the seat window its placed action holds open at that second.
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
      partner?: ReaderPartner,
      window?: IAutoMovieMotionMeeting.IWindow,
    ): IAutoMovieMotionMeeting => {
      const context: IReaderContext = { start };
      const own: IAutoMovieMotionMeetingRole = {
        name: role,
        subject,
        body,
        posture: entry.posture,
        bones: poseBones(body, entry.pose),
        seated: entry.supports.some(
          (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
            s.kind === "seat",
        ),
        entry: { posture: entry.posture, pose: entry.pose },
      };
      const others: readonly IAutoMovieMotionHumanActionContext.IPartner[] =
        partner === undefined ? [] : "subject" in partner ? [partner] : partner;
      if (others.length === 0)
        return AutoMovieMotionMeeting(kind, [own], context, window);

      // The role planned first computes the meeting; every other reads
      // that record while it still lies ahead of its own start. The key
      // names the whole cast in one order, so each role finds it.
      const key: string = `${kind.name}|${[
        subject,
        ...others.map(
          (other: IAutoMovieMotionHumanActionContext.IPartner): string =>
            other.subject,
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
      const meeting: IAutoMovieMotionMeeting = AutoMovieMotionMeeting(
        kind,
        [
          own,
          ...others.map(
            (
              other: IAutoMovieMotionHumanActionContext.IPartner,
            ): IAutoMovieMotionMeetingRole => {
              const posture: IAutoMovieMotionHumanPosture =
                HumanPerformanceRead.posture(self, other.subject, start);
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
   * Whether a seat bears a performer at a film second: the action active then
   * holds a seat window open at its share of that second.
   *
   * @param segments The performer's placed actions.
   * @param seconds Film seconds.
   * @returns Whether a seat bears the performer.
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
    const duration: number = active.plan.duration;
    const placed: number = Math.min(
      active.start + duration,
      Math.max(active.start, seconds),
    );
    // Compare on the film clock so a rounded share at the inclusive edge
    // cannot lose a contact that starts or ends at that film second.
    return active.plan.contacts.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "seat" &&
        active.start + w.from * duration <= placed &&
        placed <= active.start + w.to * duration,
    );
  }
}

/** The record of `IReaderContext`'s site. */
type IReaderContext = { start: number };

/** The alternatives of `ReaderPartner`'s site. */
type ReaderPartner =
  | IAutoMovieMotionHumanActionContext.IPartner
  | readonly IAutoMovieMotionHumanActionContext.IPartner[];
