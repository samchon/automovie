import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { prepareHumanPostureCorrection } from "../../compose/internal/prepareHumanPostureCorrection";
import { HumanBalance } from "../../everyday/internal/HumanBalance";
import type { prepareBearingTrunkBalance } from "../../everyday/internal/prepareBearingTrunkBalance";
import type { HumanPhysics } from "../../law/internal/HumanPhysics";

/**
 * The crawl's whole primitive with its trunk correction solved at its knots on
 * the crawl over its standing base and read from their course
 * (`prepareHumanPostureCorrection`).
 *
 * @param window The trunk's balance window.
 * @param whole The crawl's primitive over every channel.
 * @param adjust The exact trunk correction.
 * @param standing The standing posture the crawl's base holds.
 * @returns The primitive with the correction read from its course.
 */
export function crawlCorrected(
  window: NonNullable<HumanPhysics.Window>,
  whole: IAutoMovieMotionHumanPrimitive,
  adjust: ReturnType<typeof prepareBearingTrunkBalance>,
  standing: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPrimitive {
  // The base the crawl is written over holds its standing posture, so the
  // crawl at a second is its primitive over that posture.
  const course: ReturnType<typeof prepareHumanPostureCorrection> =
    prepareHumanPostureCorrection(
      (seconds: number): IAutoMovieMotionHumanPosture =>
        whole.write(standing, seconds),
      window,
      [],
      (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => adjust(posture, seconds),
      {
        root: HumanBalance.TOLERANCE,
        angle: ROM_TOLERANCE,
        step: AutoMovieMotionHumanArmCourse.STEP,
      },
    );
  return {
    ...whole,
    write: (
      ...args: Parameters<IAutoMovieMotionHumanPrimitive["write"]>
    ): IAutoMovieMotionHumanPosture => course(whole.write(...args), args[1]),
  };
}
