import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { walk } from "../actions/walk";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanMount } from "./HumanMount";
import { HumanMountOnFrame } from "./HumanMountOnFrame";
import { HumanMountPlace } from "./HumanMountPlace";
import { HumanMountPush } from "./HumanMountPush";

/**
 * The flight's reader.
 *
 * @param props What the flight reads from the climb.
 * @returns A leg's goal at a second of the climb; each ankle's distance from
 *   its hip as it leaves is read once.
 */
export function HumanMountFlight(
  props: HumanMountFlight.IProps,
): (side: AutoMovieHumanSide, t: number) => HumanMountFlight.IFlown {
  const { body, hipsAt, places, push }: HumanMountFlight.IProps = props;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const departed: Partial<Record<AutoMovieHumanSide, number>> = {};
  return (side: AutoMovieHumanSide, t: number): HumanMountFlight.IFlown => {
    const [leaves, arrives]: readonly [number, number] = props.flight[side];
    const share: number = minimumJerk.share((t - leaves) / (arrives - leaves));
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(
      HumanFrame.turn(props.frameAt(t).yaw),
      { x: 0, y: 0, z: 1 },
    );
    const hip: IAutoMovieVector3 = hipsAt(t)[side];
    const from: HumanMount.IFoot = props.onFloor[side]
      ? {
          ankle: side === push ? props.left().goal.point : props.floor[side],
          bend: props.legged(props.frameAt(t).root, props.floor)[`${side}Leg`]!
            .bend,
          yaw: props.yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
        }
      : props.starts[side];
    const course: HumanMount.IFoot = HumanMount.between(
      from,
      places[side].foot,
      share,
      walk.LIFT * m.hipHeight,
      props.astride && side === push ? props.over : undefined,
    );
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
}

/**
 * A swinging leg's course in getting onto a high seat (`HumanMountOn`): the
 * ankle travels from where it leaves to its place (`HumanMount.between`), kept
 * a little short of the leg's straight reach, the knee bending toward a pole
 * that turns from where an unturned hip points it to the rest's own
 * (`HumanMountPush.pole`), and a pushing foot turning from its roll back to its
 * rest's own turn. Its toes are not yet turned down (`HumanMountPush.tip`).
 */
export namespace HumanMountFlight {
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
}
