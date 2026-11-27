import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture } from "@automovie/interface";

import type { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanArmSwing } from "../../posture/internal/HumanArmSwing";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPostureSource } from "../../posture/internal/resolveHumanPostureSource";
import { rangeSteppingFoot } from "./rangeSteppingFoot";
import * as JumpGroundPostureData from "./JumpGroundPostureData";

/*
 * Fit the reaching foot during push-off and clear the arms against the bent
 * legs.
 * Parameter body: The jumping body's limb lengths and collision geometry.
 * Parameter posture: The ground phase's actual lowered posture and world goals.
 * Parameter phase: The reaching side during push-off, or the two-foot landing.
 * Parameter read: The operation's FK reader, shared with lowering and fitting.
 * Parameter solved: The stepping foot's prepared pitch (`rangeSteppingFoot.pitch`).
 * Returns: Corrected ground-phase demands for both endpoint construction and
 * playback.
 */
export function jumpGroundPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  phase: JumpGroundPosturePhase,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  solved?: number,
  hinted?: HumanArmSwing.Angles,
): IAutoMovieMotionHumanPosture {
  const lowered: IAutoMovieMotionHumanPosture =
    phase === "landing"
      ? posture
      : rangeSteppingFoot(body, posture, phase, read, undefined, solved);
  return HumanArmSwing(
    body,
    lowered,
    JumpGroundPostureData.ARMS,
    read,
    undefined,
    undefined,
    undefined,
    hinted,
  );
}
/*
 * Native observation of the ground writer and its same-instant leg fit.
 */
export namespace jumpGroundPosture {
  /*
   * Prepare the arm clearance hints over a fixed push or landing phase.
   */
  export function course(
    body: IAutoMovieMotionHumanBody,
    from: number,
    to: number,
    phase: JumpGroundPosturePhase,
    posture: (seconds: number) => IAutoMovieMotionHumanPosture,
    pitch?: (seconds: number) => number,
  ): ReturnType<typeof HumanArmSwing.course> {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return HumanArmSwing.course(
      body,
      from,
      to,
      (seconds: number): IAutoMovieMotionHumanPosture => {
        const raw: IAutoMovieMotionHumanPosture = posture(seconds);
        return phase === "landing"
          ? raw
          : rangeSteppingFoot(
              body,
              raw,
              phase,
              read,
              undefined,
              pitch?.(seconds),
            );
      },
      JumpGroundPostureData.ARMS,
    );
  }

  /*
   * The ground writer's sample: the legs lowered onto the stepping foot's
   * range, fitted, and both arms cleared of those fitted legs.
   * Parameter body: The body.
   * Parameter posture: The ground posture.
   * Parameter phase: The stepping foot, or the landing.
   * Parameter read: The forward-kinematics reader.
   * Parameter projection: The range-of-motion projector, if borrowed.
   * Parameter solved: The stepping foot's solved range, if any.
   * Returns: The sample.
   */
  export function sample(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    phase: JumpGroundPostureSamplePhase,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    solved?: number,
    hinted?: HumanArmSwing.Angles,
  ): HumanPreparedPlayback.ISample {
    const lowered: IAutoMovieMotionHumanPosture =
      phase === "landing"
        ? posture
        : rangeSteppingFoot(body, posture, phase, read, undefined, solved);
    const assembled: resolveHumanPostureSource.IAssembled =
      resolveHumanPostureSource.assemble(body, lowered, undefined, projection);
    const seeded: ReturnType<typeof resolveHumanPostureSource.fit> =
      resolveHumanPostureSource.fit(body, assembled, undefined, {}, read);
    const cleared: IAutoMovieMotionHumanPosture = HumanArmSwing(
      body,
      lowered,
      JumpGroundPostureData.ARMS,
      read,
      projection,
      seeded.pose,
      undefined,
      hinted,
    );
    return { posture: cleared };
  }
}
/*
 * The alternatives of `JumpGroundPosturePhase`'s site.
 */
type JumpGroundPosturePhase = "left" | "right" | "landing";

/*
 * The alternatives of `JumpGroundPostureSamplePhase`'s site.
 */
type JumpGroundPostureSamplePhase = "left" | "right" | "landing";
