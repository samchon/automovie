import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouchStance,
} from "@automovie/interface";

import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { prepareHumanPostureCorrection } from "../compose/prepareHumanPostureCorrection";
import { HumanBalance } from "../everyday/HumanBalance";
import { prepareHumanTrunkBalance } from "../everyday/prepareHumanTrunkBalance";
import { HumanPhysics } from "../law/HumanPhysics";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";

/**
 * Prepare the requested correction for a grounded touch. The stance is already
 * written when the correction reads it. The arm reaches its fixed site from the
 * corrected body, and the existing hip or lumbar balance owner sees that arm's
 * geometric demand when it places the mass.
 *
 * A hip correction's shift, a search (`HumanBalance.shift`), is solved here on
 * the stance as written at the window's two ends, each of the clock's instants
 * inside it and the middle of each interval between two of them, and read
 * between those knots from a knot course (`prepareHumanKnotCourse`, a
 * minimum-jerk path after Flash and Hogan 1985, J. Neurosci. 5(7):1688), so a
 * read searches nothing.
 *
 * @param body The canonical body.
 * @param window The admitted action-local balance window.
 * @param side The working arm.
 * @param arm The arm's working goal on the current stance.
 * @param clock The touch's clock, whose instants are the shift's knots.
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
      );
    return {
      channel: "trunk",
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => course(posture, seconds),
    };
  }
  // The hip shift at the knots, on the stance as written there.
  const stance: IAutoMovieMotionHumanActionPlan = written();
  const times: number[] = knots(window, clock);
  const shift: (seconds: number) => number[] = prepareHumanSampledCourse(
    times,
    (t: number): number[] => {
      const at: IAutoMovieMotionHumanPosture = weighed(stance.posture(t));
      return [
        HumanBalance.shift(
          body,
          (back: number): IAutoMovieMotionHumanPosture => moved(at, back),
        ),
      ];
    },
  );
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

/**
 * The knot seconds of a hip shift: the window's two ends and the clock's
 * instants strictly inside it, with the middle of each interval between two of
 * them.
 *
 * @param window The balance window, not null.
 * @param clock The touch's clock.
 * @returns The knot seconds, ascending.
 */
function knots(
  window: NonNullable<HumanPhysics.Window>,
  clock: IAutoMovieMotionClock,
): number[] {
  const events: number[] = [
    window.from,
    ...clock.instants
      .map(
        (instant: IAutoMovieMotionClock["instants"][number]): number =>
          instant.seconds,
      )
      .filter((t: number): boolean => t > window.from && t < window.to),
    window.to,
  ]
    .sort((a: number, b: number): number => a - b)
    .filter(
      (t: number, i: number, all: number[]): boolean =>
        i === 0 || t > all[i - 1]!,
    );
  const out: number[] = [];
  for (let i: number = 0; i < events.length; i++) {
    if (i > 0) out.push((events[i - 1]! + events[i]!) / 2);
    out.push(events[i]!);
  }
  return out;
}
