import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLunge,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { StrikingStance } from "../../striking/internal/StrikingStance";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { step } from "../../striking/internal/step";
import { HumanLungePivot } from "./HumanLungePivot";

/*
 * Up.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * A swinging foot's peak lift, a share of stature: the step law's.
 */
const LIFT: number = 0.015;

/*
 * The lunging handler's stance: the horse's bearing from the circle's centre,
 * read on a grid of half swings and unwrapped from the entry's heading, the
 * pivot steps planned on it (`HumanLungePivot`), and the posture at a second,
 * the pelvis turning to the live bearing over `transition` and the feet
 * pivoting round the centre on the schedule, each lifted on a half-sine of
 * `LIFT` of stature while it swings and reached through the stance's leg goals
 * (`StrikingStance.legs`).
 * Parameter context: The lunge's context.
 * Parameter support: The horse's reader.
 * Parameter seconds: The lunge's length, seconds.
 * Parameter transition: The take-up and let-go interval, seconds.
 * Returns: The centre, the pivot schedule and the stance by action second.
 */
export function HumanLungeStance(
  context: Context,
  support: IAutoMovieMotionHumanPropReader,
  seconds: number,
  transition: number,
): HumanLungeStance.IStance {
  const body: Context["body"] = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
    StrikingTarget.feet(context.entry);
  const centre: IAutoMovieVector3 = {
    ...Vector3.lerp(feet.left.ankle, feet.right.ankle, 0.5),
    y: 0,
  };

  // The horse's bearing from the centre, read on a grid of half swings and unwrapped from the entry's heading.
  const swing: number = step.period(body);
  const dt: number = swing / 2;
  const raw: (time: number) => number = (time: number): number => {
    const frame: IAutoMovieRigidTransform = support.frame(context.start + time);
    return (
      (Math.atan2(frame.position.x - centre.x, frame.position.z - centre.z) *
        180) /
      Math.PI
    );
  };
  const unwrap: (angle: number, near: number) => number = (
    angle: number,
    near: number,
  ): number => angle + 360 * Math.round((near - angle) / 360);
  const grid: number[] = [];
  for (let k: number = 0; k * dt <= seconds + dt; ++k)
    grid.push(unwrap(raw(k * dt), k === 0 ? entry.yaw : grid[k - 1]!));
  const bearing: (time: number) => number = (time: number): number => {
    const k: number = Math.max(
      0,
      Math.min(grid.length - 2, Math.floor(time / dt)),
    );
    const u: number = time / dt - k;
    return grid[k]! + (grid[k + 1]! - grid[k]!) * u;
  };
  const schedule: HumanLungePivot.ISchedule = HumanLungePivot.plan(
    bearing,
    seconds,
    entry.yaw,
    swing,
    dt,
  );

  const lift: number = LIFT * body.measure.stature;
  const joints: IAutoMovieMotionHumanPosture["joints"] = {
    ...entry.joints,
  };
  // The stance: the pelvis on the live bearing, the feet on the schedule.
  const stance: (time: number) => IAutoMovieMotionHumanPosture = (
    time: number,
  ): IAutoMovieMotionHumanPosture => {
    const facing: number =
      entry.yaw +
      AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, time / transition)) *
        (unwrap(raw(time), bearing(time)) - entry.yaw);
    const placed = {} as Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    >;
    const down = {} as Record<AutoMovieHumanSide, boolean>;
    for (const side of ["left", "right"] as const) {
      const foot: HumanLungePivot.IFoot = HumanLungePivot.foot(
        schedule,
        side,
        time,
      );
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        UP,
        foot.heading - schedule.heading,
      );
      placed[side] = {
        ankle: Vector3.add(
          Vector3.add(
            centre,
            Quaternion.rotateVector(
              turn,
              Vector3.subtract(feet[side].ankle, centre),
            ),
          ),
          {
            x: 0,
            y:
              foot.swing === undefined
                ? 0
                : lift * Math.sin(Math.PI * foot.swing),
            z: 0,
          },
        ),
        rotation: Quaternion.multiply(turn, feet[side].rotation),
      };
      down[side] = foot.swing === undefined;
    }
    const root: IAutoMovieVector3 = Vector3.add(
      centre,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle(UP, facing - entry.yaw),
        Vector3.subtract(entry.root, centre),
      ),
    );
    return lowerHumanPosture(
      body,
      {
        root: { ...root, y: entry.root.y },
        yaw: facing,
        pitch: entry.pitch,
        roll: entry.roll,
        joints: { ...joints },
        limbs: StrikingStance.legs(body, placed, down),
      },
      lowerHumanPosture.KNEE,
    );
  };
  return { centre, schedule, at: stance };
}

/*
 * The records of HumanLungeStance.
 */
export namespace HumanLungeStance {
  /*
   * The lunging handler's stance, prepared once per lunge.
   */
  export interface IStance {
    /*
     * The circle's centre between the entry's feet, on the ground, world
     * metres.
     */
    centre: IAutoMovieVector3;

    /*
     * The pivot steps planned on the horse's bearing.
     */
    schedule: HumanLungePivot.ISchedule;

    /*
     * The stance at an action second.
     */
    at: (time: number) => IAutoMovieMotionHumanPosture;
  }
}

/*
 * The lunge's context.
 */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLunge>;
