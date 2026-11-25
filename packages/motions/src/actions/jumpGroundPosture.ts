import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { rangeSteppingFoot } from "./rangeSteppingFoot";

/** The rotating push and landing have two direct arms to clear, in this order. */
const ARMS: readonly AutoMovieHumanSide[] = ["left", "right"];
/** The alternatives of `JumpGroundPosturePhase`'s site. */
type JumpGroundPosturePhase = "left" | "right" | "landing";

/**
 * Fit the reaching foot during push-off and clear the arms against the bent
 * legs.
 *
 * @param body The jumping body's limb lengths and collision geometry.
 * @param posture The ground phase's actual lowered posture and world goals.
 * @param phase The reaching side during push-off, or the two-foot landing.
 * @param read The operation's FK reader, shared with lowering and fitting.
 * @param solved The stepping foot's prepared pitch (`rangeSteppingFoot.pitch`).
 * @returns Corrected ground-phase demands for both endpoint construction and
 *   playback.
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
    ARMS,
    read,
    undefined,
    undefined,
    undefined,
    hinted,
  );
}
/** The alternatives of `JumpGroundPostureSamplePhase`'s site. */
type JumpGroundPostureSamplePhase = "left" | "right" | "landing";

/** Native observation of the ground writer and its same-instant leg fit. */
export namespace jumpGroundPosture {
  /** Prepare the arm clearance hints over a fixed push or landing phase. */
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
      ARMS,
    );
  }

  /**
   * The ground writer's sample: the legs lowered onto the stepping foot's
   * range, fitted, and both arms cleared of those fitted legs.
   *
   * @param body The body.
   * @param posture The ground posture.
   * @param phase The stepping foot, or the landing.
   * @param read The forward-kinematics reader.
   * @param projection The range-of-motion projector, if borrowed.
   * @param solved The stepping foot's solved range, if any.
   * @returns The sample.
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
      ARMS,
      read,
      projection,
      seeded.pose,
      undefined,
      hinted,
    );
    return { posture: cleared };
  }
}
