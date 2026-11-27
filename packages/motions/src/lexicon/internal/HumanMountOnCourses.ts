import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import type { prepareSeatedPalms } from "../../everyday/internal/prepareSeatedPalms";
import { seated } from "../../everyday/internal/seated";
import { sitHandMeet } from "../../everyday/internal/sitHandMeet";
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
 * trunk at the one point. On a fitted material seat, that rest starts at
 * the supported seated phase. An entry arm first obstructing a rising thigh
 * does not establish a palm hold while either thigh is still settling.
 *
 * @param props The climb's plan, its timing and the swinging legs.
 * @returns The plan with its swung legs and its hands' courses.
 */
export function HumanMountOnCourses(
  props: HumanMountOnCourses.IProps,
): IAutoMovieMotionHumanActionPlan {
  const { body, climb, crossing, duration }: HumanMountOnCourses.IProps = props;
  const swung: IAutoMovieMotionHumanActionPlan = HumanSwungLeg.plan(
    body,
    props.plan,
    props.swing,
  );
  const approach: Omit<sitHandMeet.IProps, "side"> = {
    body,
    posture: swung.posture,
    entry: props.pose,
    until: climb,
  };
  const meetings: Partial<Record<AutoMovieHumanSide, number>> | undefined =
    props.materialSeat === undefined && crossing === undefined
      ? sitHandMeet({
          ...approach,
          sides: new Set<AutoMovieHumanSide>(["left", "right"]),
        })
      : undefined;
  // The far palm waits for its thigh to finish crossing onto its support.
  // Other palms meet the rising thigh or rest at the climb's end.
  const span = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmPlanned.ISpan => {
    let ready: number = climb;
    if (props.materialSeat === undefined && crossing?.side === side)
      ready = crossing.landing;
    else if (props.materialSeat === undefined) {
      const meet: number | undefined =
        meetings === undefined
          ? sitHandMeet({ ...approach, side })
          : meetings[side];
      if (meet !== undefined && meet > 0 && meet < climb) ready = meet;
    }
    return {
      start: 0,
      ready,
      relax: duration,
      end: duration,
    };
  };
  // Read the same displayed thigh for the first meeting and for the palm
  // goal. A swing may replace the world ankle goal with joint keys.
  const bearing: IAutoMovieMotionHumanActionPlan = {
    ...swung,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      seated.arms(
        body,
        swung.posture(seconds, channels, resolution, projection),
        1,
        resolution,
        projection,
        props.palms,
      ),
  };
  const disc: number = 0.25 * body.measure.thigh;
  // Each hand comes to its own thigh on its own side of the trunk, so the
  // two arms are laid beside each other on the shared base, one arm's
  // problem each, rather than as one problem of both arms
  // (`IAutoMovieMotionHumanArmCarry.beside`), several times the work.
  return courseArmGoal({
    context: { body, entry: { pose: props.pose } },
    plan: bearing,
    side: "left",
    span: span("left"),
    disc,
    beside: AutoMovieMotionHumanArm.together(),
    with: [
      {
        side: "right",
        span: span("right"),
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

    /** The climb's lower-body plan, before its swing keys. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The entry's pose, the hands' hanging rest. */
    pose: IAutoMoviePose;

    /** The flat palms' extents and thigh-local surface readers. */
    palms: ReturnType<typeof prepareSeatedPalms>;

    /** The climb's length to seated, seconds. */
    climb: number;

    /** The plan's length, seconds. */
    duration: number;

    /** The seated phase has a fitted seat and foot supports. */
    materialSeat?: true;

    /** The far leg when its crossing uses prepared joint keys. */
    crossing?: {
      /** The side of the crossing thigh and the hand that rests on it. */
      side: AutoMovieHumanSide;

      /** The second the far foot lands on its stirrup. */
      landing: number;
    };

    /** Each leg's swing, the seconds it leaves and lands, or none. */
    swing: (side: AutoMovieHumanSide) => HumanSwungLeg.Swing | null;
  }
}
