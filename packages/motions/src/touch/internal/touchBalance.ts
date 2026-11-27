import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouchStance,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanRoot } from "../../compose/internal/AutoMovieMotionHumanRoot";
import { prepareHumanPostureCorrection } from "../../compose/internal/prepareHumanPostureCorrection";
import { HumanBalance } from "../../everyday/internal/HumanBalance";
import { prepareHumanTrunkBalance } from "../../everyday/internal/prepareHumanTrunkBalance";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";

/**
 * Prepare the requested correction for a grounded touch. The stance is already
 * written when the correction reads it. The arm reaches its fixed site from the
 * corrected body, and the existing hip or lumbar balance owner sees that arm's
 * geometric demand when it places the mass.
 *
 * A hip correction's shift, a search (`HumanBalance.shift`), is solved here on
 * the stance as written at knots AutoKnots places over the window (Vitenti et
 * al. 2024, arXiv:2412.13423; `prepareHumanSampledCourse`), each of the clock's
 * instants inside it a knot, and read between those knots from a knot course
 * (`prepareHumanKnotCourse`, a minimum-jerk path after Flash and Hogan 1985, J.
 * Neurosci. 5(7):1688), so a read searches nothing.
 *
 * @param body The canonical body.
 * @param window The admitted action-local balance window.
 * @param side The working arm.
 * @param arm The arm's working goal on the current stance.
 * @param clock The touch's clock, whose instants are knots of the shift.
 * @param written The stance as written before the correction, composed once
 *   here for a hip correction.
 * @returns The correction, or none when balance does not apply.
 */
export function touchBalance(
  body: IAutoMovieMotionHumanBody,
  window: HumanPhysics.Window,
  side: AutoMovieHumanSide,
  arm: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal,
  clock: IAutoMovieMotionClock,
  written: () => IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanTouchStance.ICorrection | undefined {
  if (window === null) return undefined;
  const weighed = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture => ({
    ...posture,
    limbs: { ...posture.limbs, [`${side}Arm`]: arm(posture) },
  });
  const moved = (
    posture: IAutoMovieMotionHumanPosture,
    back: number,
  ): IAutoMovieMotionHumanPosture =>
    AutoMovieMotionHumanRoot.place(posture, {
      point: { x: 0, y: 0, z: -back },
      yaw: 0,
    });
  if (window.by === "trunk") {
    // The lumbar correction, solved at the knots on the stance as written
    // there and read from their course (`prepareHumanPostureCorrection`).
    const trunk: ReturnType<typeof prepareHumanTrunkBalance> =
      prepareHumanTrunkBalance(body);
    const stance: IAutoMovieMotionHumanActionPlan = written();
    const course: ReturnType<typeof prepareHumanPostureCorrection> =
      prepareHumanPostureCorrection(
        (seconds: number): IAutoMovieMotionHumanPosture =>
          stance.posture(seconds),
        window,
        clock.instants.map(
          (instant: IAutoMovieMotionClock["instants"][number]): number =>
            instant.seconds,
        ),
        (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          const weight: number = HumanPhysics.weightAt(window, seconds);
          return weight === 0
            ? posture
            : {
                ...posture,
                joints: trunk(weighed(posture), weight).joints,
              };
        },
        {
          root: HumanBalance.TOLERANCE,
          angle: ROM_TOLERANCE,
          step: AutoMovieMotionHumanArmCourse.STEP,
        },
      );
    return {
      channel: "trunk",
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => course(posture, seconds),
    };
  }
  // The hip shift, on the stance as written there, at knots AutoKnots
  // places over the window (Vitenti et al. 2024, arXiv:2412.13423) to the
  // balance search's own resolution (`HumanBalance.TOLERANCE`), a knot at
  // each of the clock's instants, where the touch's phase changes.
  const stance: IAutoMovieMotionHumanActionPlan = written();
  const shift: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: window.from,
    to: window.to,
    marks: clock.instants.map(
      (instant: IAutoMovieMotionClock["instants"][number]): number =>
        instant.seconds,
    ),
    sample: (t: number): number[] => {
      const at: IAutoMovieMotionHumanPosture = weighed(stance.posture(t));
      return [
        HumanBalance.shift(
          body,
          (back: number): IAutoMovieMotionHumanPosture => moved(at, back),
        ),
      ];
    },
    tolerance: { kind: "absolute", absolute: HumanBalance.TOLERANCE },
    step: AutoMovieMotionHumanArmCourse.STEP,
  });
  return {
    channel: "root",
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const back: number =
        shift(seconds)[0]! * HumanPhysics.weightAt(window, seconds);
      return back === 0
        ? posture
        : { ...posture, root: moved(weighed(posture), back).root };
    },
  };
}
