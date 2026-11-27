import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieMotionHumanUseTool,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { useTool } from "./useTool";

/**
 * The hand's working pose on the tool for the work's kind: the arm's bend
 * solved to the grip with the tool held toward the work (`posed`), forward for
 * a hammer or a screwdriver, downward for stirring, and along the stroke for a
 * saw.
 *
 * Part of `useTool.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `pose`.
 */
export function useToolPose(prepared: useToolPose.IPrepared): useTool.IWork {
  const {
    kind,
    posed,
    forward,
    down,
    body,
    context,
    side,
    up,
    strain,
  }: useToolPose.IPrepared = prepared;
  return ((): useTool.IWork => {
    switch (kind) {
      case "hammer":
      case "screwdriver":
        return posed(forward);
      case "stir":
        return posed(down);
      case "saw": {
        const bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare> =
          AutoMovieMotionHumanBend.prepare({
            body,
            posture: context.entry.posture,
            side,
          });
        const poses: useTool.IWork[] = useTool.SLOPES.map(
          (degrees: number): useTool.IWork => {
            const slope: number = (degrees * Math.PI) / 180;
            return posed(
              Vector3.subtract(
                Vector3.scale(forward, Math.cos(slope)),
                Vector3.scale(up, Math.sin(slope)),
              ),
            );
          },
        );
        const strains: number[] = poses.map(
          (candidate: useTool.IWork): number => strain(candidate, bends),
        );
        return poses[strains.indexOf(Math.min(...strains))]!;
      }
    }
  })();
}

/** The `pose` of `useTool.plan`, built from what that plan prepared. */
export namespace useToolPose {
  /** What `useTool.plan` prepared for its `pose`. */
  export interface IPrepared {
    /** The `kind` `useTool.plan` prepared. */
    kind: IAutoMovieMotionHumanToolWork.Kind;

    /** The `posed` `useTool.plan` prepared. */
    posed: (axis: IAutoMovieVector3) => useTool.IWork;

    /** The `forward` `useTool.plan` prepared. */
    forward: IAutoMovieVector3;

    /** The `down` `useTool.plan` prepared. */
    down: IAutoMovieVector3;

    /** The `body` `useTool.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `context` `useTool.plan` prepared. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanUseTool.IParams>;

    /** The `side` `useTool.plan` prepared. */
    side: AutoMovieHumanSide;

    /** The `up` `useTool.plan` prepared. */
    up: IAutoMovieVector3;

    /** The `strain` `useTool.plan` prepared. */
    strain: (
      pose: useTool.IWork,
      bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare>,
    ) => number;
  }
}
