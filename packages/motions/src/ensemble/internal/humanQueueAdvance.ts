import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanQueueAdvance,
} from "@automovie/interface";

import { HumanEnsemble } from "../HumanEnsemble";
import { humanQueueMarks } from "./humanQueueMarks";

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
  humanQueueMarks(members, request);
  const wait: number = request.wait ?? 0;

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
