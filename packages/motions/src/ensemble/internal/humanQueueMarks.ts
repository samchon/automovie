import type {
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanQueueAdvance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanCrowd } from "./HumanCrowd";

/*
 * World-metre tolerance for floating-point projection onto the queue line.
 */
const LINE_TOLERANCE: number = 1e-8;

/*
 * Admit a single-file service queue's release (`humanQueueAdvance`): the queue
 * is ordered head first on one level, straight line toward the head's exit,
 * every rank fully performed, the wait nonnegative, and each pair of neighbours
 * clears their summed shoulder radii (`HumanCrowd.half`) both where they stand
 * and where they stand after the release, each follower on the mark vacated
 * ahead of it and the head on the exit.
 * Parameter members: The queue's members, head first.
 * Parameter request: The release's exit and wait.
 * Returns: Each member's distance along the queue line from the head toward the
 * exit, metres.
 * If the queue is empty, the wait is negative or not a
 * number, the exit is not a distinct mark at the head's level, a rank is off
 * the line or not fully performed, or two neighbours are out of order or too
 * close at either layout.
 */
export function humanQueueMarks(
  members: readonly humanQueueMarks.IMember[],
  request: Pick<IAutoMovieMotionHumanQueueAdvance, "exit" | "wait">,
): number[] {
  const head: humanQueueMarks.IMember | undefined = members[0];
  if (head === undefined)
    throw new HumanRefusal({
      kind: "participant",
      axis: "queue",
      value: 0,
      reason: "a release needs at least one person",
      fix: "give the queue a head",
    });

  const wait: number = request.wait ?? 0;
  if (!(wait >= 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "wait",
      value: wait,
      reason: "the follower wait must be finite and nonnegative seconds",
      fix: "give a finite wait of zero seconds or more",
    });

  const origin: IAutoMovieVector3 = head.place.at;
  const dx: number = request.exit.x - origin.x;
  const dz: number = request.exit.z - origin.z;
  const distance: number = Math.hypot(dx, dz);
  if (
    !(distance > LINE_TOLERANCE) ||
    !(Math.abs(request.exit.y - origin.y) <= LINE_TOLERANCE)
  )
    throw new HumanRefusal({
      kind: "parameter",
      performer: head.subject,
      axis: "exit",
      value: request.exit,
      reason:
        "the queue head needs a distinct clearance mark at its floor level",
      fix: "place the exit ahead of the head on the queue line",
    });

  // Project once so both sets of standing marks share the same queue axis.
  const x: number = dx / distance;
  const z: number = dz / distance;
  const marks: number[] = members.map(
    (member: humanQueueMarks.IMember): number => {
      const at: IAutoMovieVector3 = member.place.at;
      const offsetX: number = at.x - origin.x;
      const offsetZ: number = at.z - origin.z;
      if (
        member.detail !== "full" ||
        !(Math.abs(at.y - origin.y) <= LINE_TOLERANCE) ||
        !(Math.abs(offsetX * z - offsetZ * x) <= LINE_TOLERANCE)
      )
        throw new HumanRefusal({
          kind: "participant",
          performer: member.subject,
          axis: "queue",
          value: { at, detail: member.detail },
          reason:
            "every rank needs a full performer standing on the same level queue line",
          fix: "place this performer on the queue line and set its detail to full",
        });
      return offsetX * x + offsetZ * z;
    },
  );

  // Check both layouts, because a different pair occupies each gap after release.
  for (let rank: number = 1; rank < members.length; ++rank) {
    const ahead: humanQueueMarks.IMember = members[rank - 1]!;
    const member: humanQueueMarks.IMember = members[rank]!;
    const before: number = marks[rank - 1]! - marks[rank]!;
    const after: number =
      (rank === 1 ? distance : marks[rank - 2]!) - marks[rank - 1]!;
    const minimum: number = HumanCrowd.half(ahead) + HumanCrowd.half(member);
    if (Math.min(before, after) < minimum)
      throw new HumanRefusal({
        kind: "participant",
        performer: member.subject,
        axis: "queue",
        value: { ahead: ahead.subject, before, after, minimum },
        reason:
          "queue ranks must keep head-first order and clear the summed shoulder radii at both marks",
        fix: "order the queue head-first and separate the marks, including the exit",
      });
  }
  return marks;
}

/*
 * Companion types of humanQueueMarks.
 */
export namespace humanQueueMarks {
  /*
   * What the queue reads of a member: its name, mark, detail and breadth.
   */
  export interface IMember
    extends
      Pick<
        IAutoMovieMotionHumanEnsemble.IMember,
        "subject" | "place" | "detail"
      >,
      HumanCrowd.IHalfMember {}
}
