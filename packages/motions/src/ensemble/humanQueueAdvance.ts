import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanQueueAdvance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanCrowd } from "./HumanCrowd";
import { HumanEnsemble } from "./HumanEnsemble";

/** World-metre tolerance for floating-point projection onto the queue line. */
const LINE_TOLERANCE: number = 1e-8;

/**
 * Advance a stationary single-file service queue by one position. Order the
 * ensemble head first and place it on one level, straight line. The head walks
 * toward the exit on the named release. Every follower walks to the mark
 * vacated immediately ahead, starting after that walk ends and the declared
 * wait passes. Each rank is a fully performed person.
 *
 * The release cue is an absolute film time even when these chains are included
 * in a larger composition. Walk anchors are fixed per subject, so use this
 * advance once per performer in the performance.
 *
 * Ziemer, Seyfried and Schadschneider measured successive stopped and moving
 * pedestrians in single-file ring trials (https://arxiv.org/abs/1602.03053).
 * Bilintoh et al. found that the fitted zero-speed headway varied across
 * cohorts (0.210 m in Ghana and 0.365 m in Germany,
 * https://doi.org/10.1016/j.heliyon.2023.e19378, Table 2). The service cue,
 * standing marks and delay are authored for the scene. Requiring the
 * predecessor's walk to end is a conservative staging rule for this release,
 * rather than an estimate of pedestrian reaction or flow.
 *
 * @param ensemble Fully performed queue members in head-to-tail order.
 * @param request The release cue, head's exit and optional follower wait.
 * @returns A parallel composition whose walk dependencies run head first.
 * @throws {HumanRefusal} If the exit or wait is invalid, a rank lacks a fully
 *   performed body, or the marks fail line, order or shoulder-disc clearance
 *   checks.
 */
export function humanQueueAdvance(
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  request: IAutoMovieMotionHumanQueueAdvance,
): IAutoMovieComposition {
  const members: readonly IAutoMovieMotionHumanEnsemble.IMember[] =
    ensemble.members;
  const head: IAutoMovieMotionHumanEnsemble.IMember | undefined = members[0];
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
    (member: IAutoMovieMotionHumanEnsemble.IMember): number => {
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
    const ahead: IAutoMovieMotionHumanEnsemble.IMember = members[rank - 1]!;
    const member: IAutoMovieMotionHumanEnsemble.IMember = members[rank]!;
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

  // The scheduler resolves each anchor after it fits the predecessor's walk.
  return HumanEnsemble.chains(
    ensemble,
    (
      member: IAutoMovieMotionHumanEnsemble.IMember,
      chain: IAutoMovieMotionHumanChain,
    ): IAutoMovieMotionHumanChain => {
      const ahead: IAutoMovieMotionHumanEnsemble.IMember | undefined =
        members[member.index - 1];
      return chain
        .walk(
          { to: ahead?.place.at ?? request.exit },
          `${member.subject}.queueAdvance`,
        )
        .sync(
          ahead === undefined
            ? request.on
            : {
                of: `${ahead.subject}.queueAdvance`,
                event: "end",
                offset: wait,
              },
        );
    },
  );
}
