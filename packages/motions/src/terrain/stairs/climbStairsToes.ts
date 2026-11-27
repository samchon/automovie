import { AutoMovieEngineRomTolerance } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../../actions/internal/walkLeg";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { humanFootOffset } from "../../posture/internal/humanFootOffset";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import type { climbStairsRocker } from "./climbStairsRocker";

/*
 * A stair climb's toe extension at each second: as the other foot takes the
 * weight, the heel can rise around its fixed forefoot before toe-off, and the
 * same rocker (`climbStairsRocker`) follows the swing and settles as the newly
 * landed foot accepts weight. The rocker's heel-rise search runs only here, on
 * the standing posture the climb writes over, at knots AutoKnots places
 * (Vitenti et al. 2024, arXiv:2412.13423) to the rocker's angular resolution
 * (`AutoMovieEngineRomTolerance`); each foot's extension is read between them from a course
 * split at its own toe-offs and tread contacts (`prepareHumanSampledCourse`),
 * so a read searches nothing.
 * Parameter scope: The climb's clock, steps, frames, load and rocker.
 * Returns: Each foot's toe extension at a second, degrees.
 */
export function climbStairsToes(
  scope: climbStairsToes.IScope,
): Record<AutoMovieHumanSide, (seconds: number) => number[]> {
  const {
    duration,
    clock,
    steps,
    frameAt,
    rightLoad,
    rock,
    standing,
  }: climbStairsToes.IScope = scope;

  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const flexion: (side: AutoMovieHumanSide, s: number) => number = (
    side: AutoMovieHumanSide,
    s: number,
  ): number => {
    const at: climbStairsToes.IFrame = frameAt(standing, s, read);
    const load: number = rightLoad(s);
    return rock(
      side,
      at.feet[side].placement,
      at.hips[side],
      walkLeg.dorsal(side === "right" ? load : 1 - load),
    ).flexion;
  };
  const course: (side: AutoMovieHumanSide) => (s: number) => number[] = (
    side: AutoMovieHumanSide,
  ): ((s: number) => number[]) =>
    prepareHumanSampledCourse({
      from: 0,
      to: duration,
      breaks: steps.flatMap(
        (step: { side: AutoMovieHumanSide }, j: number): number[] =>
          step.side === side
            ? [clock.at(`toeOff${j + 1}`), clock.at(`treadContact${j + 1}`)]
            : [],
      ),
      sample: (s: number): number[] => [flexion(side, s)],
      tolerance: { kind: "absolute", absolute: AutoMovieEngineRomTolerance },
      step: AutoMovieMotionHumanArmCourse.STEP,
    });
  return { left: course("left"), right: course("right") };
}

/*
 * The climb's frame, its scope and the toes' closed-form placement.
 */
export namespace climbStairsToes {
  /*
   * The climb's pelvis and feet at a second.
   */
  export interface IFrame {
    /*
     * The leaned posture over the root path.
     */
    placed: IAutoMovieMotionHumanPosture;

    /*
     * Each foot as its stance or swing has it.
     */
    feet: Record<
      AutoMovieHumanSide,
      { placement: IAutoMovieMotionHumanFoot.IPlacement; planted: boolean }
    >;

    /*
     * The root as high as both legs reach.
     */
    root: IAutoMovieVector3;

    /*
     * The hip joints under it, world metres.
     */
    hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;
  }

  /*
   * What the toes' course reads of the climb.
   */
  export interface IScope {
    /*
     * The climb's length, seconds.
     */
    duration: number;

    /*
     * Its clock, with each step's toe-off and tread contact.
     */
    clock: IAutoMovieMotionClock;

    /*
     * The steps in order, by the foot that takes each.
     */
    steps: readonly { side: AutoMovieHumanSide }[];

    /*
     * The pelvis and feet at a second on a posture.
     */
    frameAt: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
    ) => IFrame;

    /*
     * The right foot's share of the weight at a second.
     */
    rightLoad: (seconds: number) => number;

    /*
     * The stair rocker.
     */
    rock: ReturnType<typeof climbStairsRocker>;

    /*
     * The standing posture the climb writes over.
     */
    standing: IAutoMovieMotionHumanPosture;
  }

  /*
   * A scheduled foot with its heel risen about its ball by a toe extension, the
   * toes taking back the pitch the foot gave up (closed form).
   * Parameter body: The body's rest joints and sole sockets.
   * Parameter side: The foot.
   * Parameter scheduled: The foot as scheduled.
   * Parameter flexion: The toe extension, degrees.
   * Returns: The placement.
   */
  export function place(
    body: humanFootOffset.IBody,
    side: AutoMovieHumanSide,
    scheduled: IAutoMovieMotionHumanFoot.IPlacement,
    flexion: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    if (flexion === 0) return scheduled;
    const turned: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(scheduled.rotation);
    return HumanFoot.pivot(
      body,
      side,
      "mtp",
      HumanFoot.point(body, side, "mtp", scheduled),
      turned.heading,
      turned.pitch - flexion,
    );
  }
}
