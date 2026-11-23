import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanSwungLeg } from "./HumanSwungLeg";

/**
 * The limb courses laid over a climb onto a high seat (`HumanMountOn`): a
 * swinging leg is keyed in joint space where its world course leaves the leg's
 * range (`HumanSwungLeg`), since a course over a saddle asks the ankle past
 * what the hip reaches and a fit pinned there flips its knee; and the hands go
 * from hanging to the thighs over the climb as planned courses
 * (`courseArmGoal`), the way a low sit lays them. The plan's thigh goals are
 * where the hands come to rest, and the planner lays the way there clear of the
 * trunk as it rises, leans, swings and turns onto the seat, and of the swung
 * leg. The course starts with the climb: an arm held at its entry angles while
 * the pelvis rises toward the stirrup has no planned clearance and passes into
 * the hips before any course begins; fitted frame by frame on a goal ramp, the
 * forearm crossed the spine. A palm resting on a thigh rests anywhere on its
 * front: the region the palm may land in spans the thigh's middle half about
 * the front's mid station (`thighFront`, at half the thigh), so a rider's hand
 * slides along the splayed thigh where the forearm would otherwise graze the
 * trunk at the one point.
 *
 * @param props The climb's plan, its timing and the swinging legs.
 * @returns The plan with its swung legs and its hands' courses.
 */
export function HumanMountOnCourses(
  props: HumanMountOnCourses.IProps,
): IAutoMovieMotionHumanActionPlan {
  const { body, climb, duration }: HumanMountOnCourses.IProps = props;
  const swung: IAutoMovieMotionHumanActionPlan = HumanSwungLeg.plan(
    body,
    props.plan,
    props.swing,
  );
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: climb,
    relax: duration,
    end: duration,
  };
  const disc: number = 0.25 * body.measure.thigh;
  // Each hand comes to its own thigh on its own side of the trunk, so the
  // two arms are laid beside each other on the shared base, one arm's
  // problem each, rather than as one problem of both arms
  // (`IAutoMovieMotionHumanArmCarry.beside`), several times the work.
  return courseArmGoal({
    body,
    plan: swung,
    side: "left",
    rest: AutoMovieMotionHumanArm.angles(props.pose, "left"),
    span,
    disc,
    beside: AutoMovieMotionHumanArm.together(),
    with: [
      {
        side: "right",
        rest: AutoMovieMotionHumanArm.angles(props.pose, "right"),
        span,
        disc,
      },
    ],
  });
}

/** What the climb's limb courses read. */
export namespace HumanMountOnCourses {
  /** The climb's plan, its timing and the swinging legs. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The climb's plan, before its courses. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The entry's pose, the hands' hanging rest. */
    pose: IAutoMoviePose;

    /** The climb's length to seated, seconds. */
    climb: number;

    /** The plan's length, seconds. */
    duration: number;

    /** Each leg's swing, the seconds it leaves and lands, or none. */
    swing: (side: AutoMovieHumanSide) => HumanSwungLeg.Swing | null;
  }
}
