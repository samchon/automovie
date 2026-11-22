import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { walk } from "../actions/walk";
import { AutoMovieMotionHumanShankClear } from "../compose/AutoMovieMotionHumanShankClear";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanMount } from "./HumanMount";
import { HumanMountOnFrame } from "./HumanMountOnFrame";
import { HumanMountPlace } from "./HumanMountPlace";
import { HumanMountPush } from "./HumanMountPush";

/**
 * A swinging leg's course in getting onto a high seat (`HumanMountOn`): the
 * ankle travels from where it leaves to its place (`HumanMount.between`),
 * kept a little short of the leg's straight reach, the knee bending toward
 * a pole that turns from where an unturned hip points it to the rest's own
 * (`HumanMountPush.pole`), rising clear of the seat's carrier and passing
 * beside the other leg's shank, and a pushing foot turning from its roll back to
 * its rest's own turn. Its toes are not yet turned down (`HumanMountPush.tip`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ankle's course, the reach bound, the pole and the pushing foot's turn.
 * @evidence contracts/development/design.md#principled-representation One swinging leg's goal at an instant, a pure read of the climb's own courses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanMountOn` asks of a leg in flight, and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's or `HumanMount`'s; every share is the flight's own.
 */
export namespace HumanMountFlight {
  /** How many equal shares of a swinging foot's course its rise is read at. */
  const RISES: number = 8;

  /** What a leg's flight reads from the climb. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** Each leg's flight, the seconds it leaves and arrives. */
    flight: Record<AutoMovieHumanSide, readonly [number, number]>;

    /** The pelvis at an instant. */
    frameAt: (t: number) => HumanMountOnFrame.Frame;

    /** The hip joints at an instant, world metres. */
    hipsAt: (t: number) => Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /** The standing legs over a pelvis root. */
    legged: ReturnType<typeof stand.prepareLegs>;

    /** Each foot's floor place, world metres. */
    floor: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /** Whether each foot starts on the floor. */
    onFloor: Record<AutoMovieHumanSide, boolean>;

    /** Each foot where it starts off the floor. */
    starts: Record<AutoMovieHumanSide, HumanMount.IFoot>;

    /** Each foot's place on the seated body. */
    places: Record<AutoMovieHumanSide, HumanMountPlace.IPlace>;

    /** The second each foot starts to bear on its rest. */
    bearing: Record<AutoMovieHumanSide, number>;

    /** The pushing leg. */
    push: AutoMovieHumanSide;

    /** The pushing foot as it leaves the floor. */
    left: () => HumanMountPush.IRoll;

    /** The heading the climb starts from, degrees. */
    yaw: number;

    /** Whether the seat is sat astride. */
    astride: boolean;

    /** The point the far foot crosses the seat over, world metres. */
    over: IAutoMovieVector3;

    /** How far a point a swinging foot passes must rise to clear what carries the seat (`HumanMountClear`); none for a seat no prop carries. */
    rise?: (point: IAutoMovieVector3) => number;
  }

  /** A swinging leg's goal at an instant, before its toes turn down. */
  export interface IFlown {
    /** How far through its flight the leg is, 0 to 1. */
    share: number;

    /** The leg's hip joint, world metres. */
    hip: IAutoMovieVector3;

    /** The leg's goal. */
    goal: IAutoMovieHumanLimbGoal;
  }

  /**
   * The flight's reader.
   *
   * @param props What the flight reads from the climb.
   * @returns A leg's goal at a second of the climb; each ankle's distance from its hip as it leaves is read once.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the reader returned.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle's course, the reach bound and the pole are the climb's own closed forms, read at the flight's minimum-jerk share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Course, reach, pole, turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every length is the body's or `HumanMount`'s.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work a read; the leaving reach is read once a leg.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The leaving reach is cached per leg for the plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the props and two numbers for the plan's life.
   */
  export function of(
    props: IProps,
  ): (side: AutoMovieHumanSide, t: number) => IFlown {
    const { body, hipsAt, places, push }: IProps = props;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const departed: Partial<Record<AutoMovieHumanSide, number>> = {};
    const risen: Partial<Record<AutoMovieHumanSide, number[]>> = {};
    const flown = (side: AutoMovieHumanSide, t: number): IFlown => {
      const [leaves, arrives]: readonly [number, number] = props.flight[side];
      const share: number = minimumJerk.share(
        (t - leaves) / (arrives - leaves),
      );
      const facing: IAutoMovieVector3 = Quaternion.rotateVector(
        HumanFrame.turn(props.frameAt(t).yaw),
        { x: 0, y: 0, z: 1 },
      );
      const hip: IAutoMovieVector3 = hipsAt(t)[side];
      const from: HumanMount.IFoot = props.onFloor[side]
        ? {
            ankle: side === push ? props.left().goal.point : props.floor[side],
            bend: props.legged(props.frameAt(t).root, props.floor)[
              `${side}Leg`
            ]!.bend,
            yaw: props.yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
          }
        : props.starts[side];
      const between = (along: number): HumanMount.IFoot =>
        HumanMount.between(
          from,
          places[side].foot,
          along,
          walk.LIFT * m.hipHeight,
          props.astride && side === push ? props.over : undefined,
        );
      // The course rises clear of what carries the seat (`HumanMountClear`):
      // the rise read at evenly spaced shares of the course, nil at its two
      // ends on the floor and the rest, and linear between.
      const rises: number[] | undefined =
        props.rise === undefined
          ? undefined
          : (risen[side] ??= Array.from(
              { length: RISES + 1 },
              (_: unknown, i: number): number =>
                i === 0 || i === RISES
                  ? 0
                  : props.rise!(between(i / RISES).ankle),
            ));
      const ahead: HumanMount.IFoot = between(share);
      const index: number = Math.min(RISES - 1, Math.floor(share * RISES));
      const lifted: number =
        rises === undefined
          ? 0
          : rises[index]! +
            (rises[index + 1]! - rises[index]!) * (share * RISES - index);
      // It passes beside the other leg's shank, never through it
      // (`AutoMovieMotionHumanShankClear`): the pushing leg beside the other
      // wherever that is, on the floor, on its way or on its rest, and the
      // other beside the pushing leg while that still stands.
      const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
      const stance: IAutoMovieVector3 | undefined =
        props.onFloor[other] && t < props.flight[other][0]
          ? other === push
            ? props.left().goal.point
            : props.floor[other]
          : side !== push
            ? undefined
            : t >= props.flight[other][1]
              ? places[other].foot.ankle
              : flown(other, t).goal.point;
      const raised: IAutoMovieVector3 = {
        ...ahead.ankle,
        y: ahead.ankle.y + lifted,
      };
      const course: HumanMount.IFoot = {
        ...ahead,
        ankle:
          stance === undefined
            ? raised
            : AutoMovieMotionHumanShankClear(
                body,
                raised,
                stance,
                hipsAt(t)[other],
              ),
      };
      // The swinging ankle keeps within the leg's reach of its hip, a
      // little short of straight: a course past it leaves the limb fit to
      // snap between the poses on its reach. A leg that left the floor
      // straighter than that, as an extended push leaves it, bends to it
      // over the swing rather than at once.
      const fromHip: IAutoMovieVector3 = Vector3.subtract(course.ankle, hip);
      const span: number = Vector3.length(fromHip);
      const short: number = HumanMount.SWING_REACH * (m.thigh + m.shank);
      const away: number = (departed[side] ??= Vector3.length(
        Vector3.subtract(from.ankle, hipsAt(leaves)[side]),
      ));
      const reach: number = short + Math.max(0, away - short) * (1 - share);
      const foot: HumanMount.IFoot =
        span <= reach
          ? course
          : {
              ...course,
              ankle: Vector3.add(hip, Vector3.scale(fromHip, reach / span)),
            };
      // The knee bends toward its pole, turning from where an unturned hip
      // points it to the rest's own pole as the foot swings.
      const leg: IAutoMovieHumanLimbGoal = HumanMount.leg(
        body,
        side,
        {
          ...foot,
          bend: HumanMountPush.pole(
            body,
            hip,
            foot.ankle,
            facing,
            Vector3.subtract(places[side].foot.bend, hipsAt(arrives)[side]),
            share,
          ),
        },
        places[side].rests && t >= props.bearing[side],
      );
      // The pushing foot leaves as it was rolled and turns back to its
      // rest's own turn over the swing, its toes straightening.
      const goal: IAutoMovieHumanLimbGoal =
        side === push && props.onFloor[side] && leg.rotation !== undefined
          ? {
              ...leg,
              rotation: Quaternion.slerp(
                props.left().goal.rotation ?? leg.rotation,
                leg.rotation,
                share,
              ),
            }
          : leg;
      return { share, hip, goal };
    };
    return flown;
  }
}
