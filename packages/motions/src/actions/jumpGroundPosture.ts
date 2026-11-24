import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { deriveHumanPosture } from "../posture/deriveHumanPosture";
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
 * @returns Corrected ground-phase demands for both endpoint construction and
 *   playback.
 */
export function jumpGroundPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  phase: JumpGroundPosturePhase,
  read: ReturnType<typeof prepareHumanPoseResolution>,
): IAutoMovieMotionHumanPosture {
  const lowered: IAutoMovieMotionHumanPosture =
    phase === "landing"
      ? posture
      : rangeSteppingFoot(body, posture, phase, read);
  return HumanArmSwing.of(body, lowered, ARMS, read);
}
/** The alternatives of `JumpGroundPostureSamplePhase`'s site. */
type JumpGroundPostureSamplePhase = "left" | "right" | "landing";

/** Native observation of the ground writer and its same-instant leg fit. */
export namespace jumpGroundPosture {
  /**
   * Clear both arms using the actual current legs and offer that fit to the
   * unchanged bare display when its assembly shares every leg dependency.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The input holds current lowered world demands. The display may take the result once after the resolver verifies unchanged leg dependencies.
   * @evidence contracts/development/implementation.md#principled-implementation The shared swing owner reads the very same resolved legs and writes only direct shoulder angles. The ordinary assembly verifies the current arm ROM, and inherited independently checks every leg dependency.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Pose the rocker where present, fit the lowered posture, clear its arms, then offer its derived current-leg solution to the display.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual world plants and current room checks. Changed inputs, a whole-body turn or a second read have no transferable fit.
   * @evidence contracts/development/implementation.md#efficient-algorithms One paired leg fit covers clearance and display when the fit's ordinary dependency proof succeeds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The clearance and display can share this sample's leg roots, chain records, toe records and goals after exact resolver checks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sample owns only its current fit and assembly for a synchronous transfer. It retains no reader, projector or prior frame.
   */
  export function sample(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    phase: JumpGroundPostureSamplePhase,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): HumanPreparedPlayback.ISample {
    const lowered: IAutoMovieMotionHumanPosture =
      phase === "landing"
        ? posture
        : rangeSteppingFoot(body, posture, phase, read);
    const assembled: resolveHumanPostureSource.IAssembled =
      resolveHumanPostureSource.assemble(body, lowered, undefined, projection);
    const seeded: deriveHumanPosture.ISolved["seeded"] =
      resolveHumanPostureSource.fit(body, assembled, undefined, {}, read);
    const cleared: IAutoMovieMotionHumanPosture = HumanArmSwing.of(
      body,
      lowered,
      ARMS,
      read,
      projection,
      seeded.pose,
    );
    let current: deriveHumanPosture.ISolved | undefined = { assembled, seeded };
    return {
      posture: cleared,
      takeFit: (): deriveHumanPosture.ISolved["seeded"] | undefined => {
        const fit: deriveHumanPosture.ISolved | undefined = current;
        current = undefined;
        if (fit === undefined) return undefined;
        return deriveHumanPosture.inherited(
          body,
          deriveHumanPosture(body, fit.assembled, cleared),
          fit,
        );
      },
    };
  }
}
