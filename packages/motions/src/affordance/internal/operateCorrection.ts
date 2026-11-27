import { ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/AutoMovieMotionHumanArmCourse";
import { prepareHumanPostureCorrection } from "../../compose/internal/prepareHumanPostureCorrection";
import { HumanBalance } from "../../everyday/HumanBalance";
import { prepareHumanTrunkBalance } from "../../everyday/internal/prepareHumanTrunkBalance";
import { HumanPhysics } from "../../law/HumanPhysics";
import { HumanFrame } from "../../posture/HumanFrame";

/**
 * An operated mechanism's balance correction, written with the reach's lean: a
 * hip correction moves the root along the facing onto the feet's support
 * (`HumanPhysics.supportOffset`), a trunk correction tilts the lumbar spine
 * over it (`prepareHumanTrunkBalance`). Either is solved at its knots, the
 * clock's instants within the window among them, on the posture it corrects
 * (the base under the lean) and read from their course
 * (`prepareHumanPostureCorrection`), so a read resolves no posture.
 *
 * @param body The body.
 * @param window The balance window.
 * @param base The plan's base.
 * @param clock The operation's clock.
 * @param duration The plan's seconds.
 * @param reachLean The reach's lean, when the body stands on the floor.
 * @returns The correction's primitive.
 */
export function operateCorrection(
  body: IAutoMovieMotionHumanBody,
  window: NonNullable<HumanPhysics.Window>,
  base: IAutoMovieMotionHumanActionPlan,
  clock: IAutoMovieMotionClock,
  duration: number,
  reachLean: IAutoMovieMotionHumanPrimitive | undefined,
): IAutoMovieMotionHumanPrimitive {
  const trunk: ReturnType<typeof prepareHumanTrunkBalance> | undefined =
    window.by === "trunk" ? prepareHumanTrunkBalance(body) : undefined;
  const exact = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const weight: number = HumanPhysics.weightAt(window, seconds);
    if (weight === 0) return posture;
    if (trunk !== undefined) return trunk(posture, weight);
    const direction: IAutoMovieVector3 = HumanFrame.forward(posture.yaw);
    const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(
      HumanBalance.support(body, posture),
      direction,
    );
    return shift === null || shift === 0
      ? posture
      : {
          ...posture,
          root: Vector3.addScaled(posture.root, direction, shift * weight),
        };
  };
  const course: ReturnType<typeof prepareHumanPostureCorrection> =
    prepareHumanPostureCorrection(
      (seconds: number): IAutoMovieMotionHumanPosture => {
        const below: IAutoMovieMotionHumanPosture = base.posture(seconds);
        return reachLean?.write(below, seconds) ?? below;
      },
      window,
      clock.instants.map(
        (instant: IAutoMovieMotionClock["instants"][number]): number =>
          instant.seconds,
      ),
      exact,
      {
        root: HumanBalance.TOLERANCE,
        angle: ROM_TOLERANCE,
        step: AutoMovieMotionHumanArmCourse.STEP,
      },
    );
  return {
    ...reachLean,
    channels: reachLean?.channels ?? [window.by === "trunk" ? "trunk" : "root"],
    from: reachLean?.from ?? Math.max(0, window.from),
    to: reachLean?.to ?? Math.min(duration, window.to),
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
      projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
    ): IAutoMovieMotionHumanPosture =>
      course(
        reachLean?.write(posture, seconds, before, resolution, projection) ??
          posture,
        seconds,
      ),
  };
}
