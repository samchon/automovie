import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanCourse } from "../../compose/internal/AutoMovieMotionHumanCourse";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanBalance } from "./HumanBalance";
import type { kneelKeys } from "./kneelKeys";

/** A root offset in metres along the kneeling step. */
type Course = (seconds: number) => number;
type Solver = (
  from: number,
  to: number,
  start: number,
  through: number,
) => Course;

/** The two neighbouring key numbers and the progress between them. */
interface IKeyPair {
  from: number;
  to: number;
}
interface IPhaseReading {
  phase: IKeyPair;
  u: number;
}

interface IInputs {
  body: IAutoMovieMotionHumanBody;
  standing: IAutoMovieMotionHumanPosture;
  forward: IAutoMovieVector3;
  feet: kneelKeys.IKey["feet"];
  yaw: number;
  at: (seconds: number) => IPhaseReading;
  write: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    along: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ) => IAutoMovieMotionHumanPosture;
}

/**
 * Resolve the fixed heading's initial centre and the middle of the planted
 * soles. Each moving phase follows its original target from its original start
 * through the last observable cubic interval.
 */
export function prepareKneelBalance(props: IInputs): Solver {
  const { body, standing, forward, feet, yaw, at, write }: IInputs = props;
  // How far along the step the course stands at a second: going down it
  // goes from where the body stands to the step's end as the foot travels;
  // coming up it is back over the standing foot while the knee leaves the
  // floor, before the foot behind lifts.
  const share: (seconds: number) => number = (seconds: number): number => {
    const { phase, u }: ReturnType<typeof at> = at(seconds);
    return phase.from < phase.to
      ? phase.from === 0
        ? u
        : 1
      : phase.from === 2
        ? 1 - u
        : 0;
  };

  const centre: (posture: IAutoMovieMotionHumanPosture) => number = (
    posture: IAutoMovieMotionHumanPosture,
  ): number => Vector3.dot(HumanBalance.centre(body, posture), forward);
  const stood: number = centre(standing);
  const middle: number =
    (["left", "right"] as const)
      .map((side: AutoMovieHumanSide): number => {
        const foot: kneelKeys.IFoot = feet[side];
        return Vector3.dot(
          HumanFoot.point(
            body,
            side,
            "sole",
            HumanFoot.pivot(
              body,
              side,
              "mtp",
              foot.at,
              foot.heading,
              foot.pitch,
            ),
            foot.toes,
          ),
          forward,
        );
      })
      .reduce((x: number, y: number): number => x + y, 0) / 2;
  const course: Solver = (
    from: number,
    to: number,
    start: number,
    through: number,
  ): Course =>
    AutoMovieMotionHumanCourse.solve(
      {
        body,
        yaw,
        posture: (
          seconds: number,
          along: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
        ): IAutoMovieMotionHumanPosture =>
          write(standing, seconds, along, resolution),
        target: (seconds: number): number =>
          stood + (middle - stood) * share(seconds),
        from,
        to,
        start,
      },
      through,
    );
  return course;
}
