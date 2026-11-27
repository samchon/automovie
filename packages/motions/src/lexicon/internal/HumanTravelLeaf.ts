import {
  AutoMovieEngineMotionSampling,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTravelLeaf,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { bendLower } from "../../everyday/internal/bendLower";
import { pickUpPosture } from "../../handling/internal/pickUpPosture";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanTravelLeafHolds } from "./HumanTravelLeafHolds";
import { HumanTravelLeafPlants } from "./HumanTravelLeafPlants";
import { HumanTravelLeafShown } from "./HumanTravelLeafShown";
import { HumanTravelLeafWalk } from "./HumanTravelLeafWalk";
import { HumanTravelLeafWrite } from "./HumanTravelLeafWrite";

/*
 * Opening a door by its handle and holding it: the hand reaches the handle,
 * closes on it and goes with it while the leaf swings, the person standing, and
 * walking round with the leaf when the arm alone would lose the handle.
 * Register `HumanTravelLeaf.openDoor` to use it.
 *
 * The leaf's swing is the scene's: the door is a prop whose handle moves within
 * it (`IHumanProp.point`, as `AutoMovieMotionHumanObject.prop` gives an archetype's
 * articulated contact), and the hand follows the handle at every instant. The
 * hand turns to the handle's frame and closes on the door's own colliders
 * (`HumanMountRider.hold`, `HumanMountRider.closed`), reaching it over `TAKE`
 * seconds on the minimum-jerk profile (Flash and Hogan 1985). The arm is laid
 * as one course over that goal (`courseArmGoal`), so it keeps one branch while
 * the leaf swings. A handle the standing arm does not reach as the hand takes
 * it, such as a car door's below the shoulder, is taken leaning toward it, the
 * body lowered as a pick up lowers it. While the arm's own fit keeps the wrist
 * within `HOLD` of the hold from where the person stands the feet stay there;
 * otherwise the person walks with the leaf, backward and round it, facing it,
 * keeping the place relative to it the handle was taken from, at the handle's
 * pace (`HumanTravelLeafWalk`). A swing the hand still loses, faster or farther
 * than the person can walk with it, is refused as a `reach` refusal on `handle`
 * naming the largest swing followed. First pass: the closure is the one at the
 * instant the hand arrives.
 */
export namespace HumanTravelLeaf {
  /*
   * How far the arm's fit may leave the wrist from where the hold asks it,
   * metres (the campaign's 5 mm contact bound).
   */
  export const HOLD: number = 0.005;

  /*
   * Seconds the hand takes to reach the handle (provisional).
   */
  export const TAKE: number = 0.6;

  /*
   * The most of the arm's length, shoulder to wrist, the handle may be from the
   * shoulder (provisional: the elbow is not locked straight).
   */
  export const REACH: number = 0.97;

  /*
   * Open a door by its handle, standing or following its leaf. The plan checks
   * the hold at every 24th of a second from `TAKE` with the arm's own fit:
   * standing first, and only where standing loses the handle, walking with the
   * leaf; a swing still lost is refused. The checks share one
   * forward-kinematics reader and one range-of-motion projector, which end with
   * the plan's construction; each posture of the plan reads the base and the
   * hold through the reader its caller gives, or one of its own.
   */
  export const openDoor: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTravelLeaf.IParams> =
    {
      name: "openDoor",
      interrupts: {
        walk: [
          {
            window: { start: 0, end: 1 },
            kind: "inertialize",
            entry: 0,
            blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          },
        ],
      },
      yields: ["head"],
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelLeaf.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const body: IAutoMovieMotionHumanBody = context.body;
        const side: AutoMovieHumanSide = context.params.hand ?? "right";
        const seconds: number = context.params.duration;
        if (!(seconds > TAKE))
          throw new AutoMovieMotionHumanRefusal({
            kind: "parameter",
            axis: "duration",
            value: seconds,
            feasible: {
              kind: "range",
              minimum: TAKE,
              maximum: null,
              unit: "s",
              open: "minimum",
            },
            reason: `a door is held after the hand has reached it, which takes ${TAKE} s`,
            fix: "hold the door longer",
          });
        const door: IAutoMovieMotionHumanPropReader = context.prop(
          context.params.door,
        );
        const id: string = context.params.handle;
        const rest: IOpenDoorRest | undefined = door.prop.points[id];
        if (rest === undefined)
          throw new AutoMovieMotionHumanRefusal({
            kind: "affordance",
            axis: "handle",
            value: id,
            feasible: {
              kind: "alternatives",
              values: Object.keys(door.prop.points),
            },
            reason: `${context.params.door} has no point ${id} to take hold of`,
            fix: "name one of the door's points",
          });
        const affordance: IAutoMovieAffordance | undefined =
          door.prop.affordances?.find(
            (a: IAutoMovieAffordance): boolean => a.id === id,
          );

        // The handle at a film second: the moving point the door knows, or its rest point carried by the door's frame; its axis is its rest frame's +X carried by the door's frame.
        const handle: (
          film: number,
        ) => Parameters<typeof HumanMountRider.hold>[3] = (
          film: number,
        ): Parameters<typeof HumanMountRider.hold>[3] => {
          const frame: IAutoMovieRigidTransform = door.frame(film);
          const moved: IOpenDoorHandleMoved | undefined = door.prop.point?.(
            id,
            film,
          );
          const turn: IAutoMovieQuaternion | undefined =
            affordance?.frame.rotation;
          return {
            point:
              moved?.point ??
              Vector3.add(
                frame.position,
                Quaternion.rotateVector(frame.rotation, rest.point),
              ),
            normal:
              moved?.normal ??
              Quaternion.rotateVector(frame.rotation, rest.normal),
            ...(turn === undefined
              ? {}
              : {
                  axis: Quaternion.rotateVector(
                    Quaternion.multiply(frame.rotation, turn),
                    { x: 1, y: 0, z: 0 },
                  ),
                }),
            ...(affordance?.aperture === undefined
              ? {}
              : { radius: affordance.aperture / 2 }),
          };
        };
        // The body stands while it opens, its sway signed in the opening
        // hand's frame, so a left-handed opening mirrors a right one.
        const validation: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        const standing: IAutoMovieMotionHumanActionPlan = stand.plan(
          { ...context, params: { hold: seconds } },
          side,
        );
        const start: IAutoMovieMotionHumanPosture = standing.posture(
          0,
          undefined,
          validation,
        );

        // The hand keeps the side of the handle's axis it took it from, the
        // side the body faced as the hand arrived, however the body turns with
        // the leaf after.
        const taken: Parameters<typeof HumanMountRider.hold>[3] = handle(
          context.start + TAKE,
        );
        const facing: IAutoMovieVector3 = Quaternion.rotateVector(
          humanPostureHeading(start),
          { x: 0, y: 0, z: 1 },
        );
        const across: OpenDoorAcross =
          taken.axis !== undefined &&
          Vector3.dot(Vector3.cross(taken.axis, taken.normal), facing) < 0
            ? -1
            : 1;
        const grip: (
          film: number,
        ) => Parameters<typeof HumanMountRider.hold>[3] = (
          film: number,
        ): Parameters<typeof HumanMountRider.hold>[3] => ({
          ...handle(film),
          across,
        });

        // The wrist must stay within the arm's reach of the shoulder.
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          resolveHumanPosture.seeded(
            body,
            { ...start, limbs: {} },
            undefined,
            undefined,
            validation,
          ).pose,
          validation(),
          new Set<AutoMovieHumanoidBone>([
            `${side}UpperArm`,
            `${side}LowerArm`,
            `${side}Hand`,
          ]),
        );
        const shoulder: IAutoMovieVector3 = bones.get(
          `${side}UpperArm`,
        )!.worldPosition;
        const arm: number =
          Vector3.length(
            Vector3.subtract(
              bones.get(`${side}LowerArm`)!.worldPosition,
              shoulder,
            ),
          ) +
          Vector3.length(
            Vector3.subtract(
              bones.get(`${side}Hand`)!.worldPosition,
              bones.get(`${side}LowerArm`)!.worldPosition,
            ),
          );
        const projector: ReturnType<typeof prepareHumanPostureProjection> =
          prepareHumanPostureProjection(body);
        // Where the hold puts the wrist on the handle at a second.
        const wristAt: (
          t: number,
          posture: IAutoMovieMotionHumanPosture,
          target?: Parameters<typeof HumanMountRider.hold>[3],
        ) => IAutoMovieVector3 = (
          t: number,
          posture: IAutoMovieMotionHumanPosture,
          target: Parameters<typeof HumanMountRider.hold>[3] = grip(
            context.start + t,
          ),
        ): IAutoMovieVector3 =>
          HumanMountRider.hold(body, side, posture, target, 1, {}).arm.point;

        // A handle the standing arm does not reach as the hand takes it, such
        // as a car door's below the shoulder, is taken leaning toward it, the
        // body lowered over the reach as a pick up lowers it.
        const taking: IAutoMovieVector3 = wristAt(TAKE, start);
        const lowered: pickUpPosture.IStance | null =
          Vector3.length(Vector3.subtract(taking, shoulder)) <= REACH * arm
            ? null
            : // Lowered until the wrist the hold asks is within the bend's near
              // full extension of the arm (`bendLower.REACH`), the reach the
              // bend lowers a palm to.
              pickUpPosture.lowered(
                context,
                side,
                taking,
                bendLower.REACH * arm,
              );
        const base: IAutoMovieMotionHumanActionPlan["posture"] = (
          t: number,
          channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
          projection?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[3],
        ): IAutoMovieMotionHumanPosture =>
          lowered === null
            ? standing.posture(t, channels, resolution, projection)
            : lowered.at(
                AutoMovieEngineMotionSampling.minimumJerkShare(
                  Math.min(1, t / TAKE),
                ),
                resolution,
                projection,
              );

        const holds: HumanTravelLeafHolds.Holds = HumanTravelLeafHolds({
          context,
          body,
          side,
          grip,
        });
        const readings: number[] = [];
        for (let t: number = TAKE; t <= seconds + 1e-9; t += 1 / 24)
          readings.push(t);

        // Standing while the arm holds the handle from there throughout;
        // otherwise walking with the leaf (`HumanTravelLeafWalk`).
        const lostStanding: number | undefined = readings.find(
          (t: number): boolean =>
            !holds(
              base(t, undefined, validation, projector),
              t,
              validation,
              projector,
            ),
        );
        const walked: IAutoMovieMotionHumanActionPlan | null =
          lostStanding === undefined
            ? null
            : HumanTravelLeafWalk.plan({
                context,
                seconds,
                take: TAKE,
                handle: (t: number): IOpenDoorWalkedResult => {
                  const target: Parameters<typeof HumanMountRider.hold>[3] =
                    grip(context.start + t);
                  return {
                    point: wristAt(
                      t,
                      base(t, undefined, validation, projector),
                      target,
                    ),
                    normal: target.normal,
                  };
                },
              });
        const shown: IAutoMovieMotionHumanActionPlan["posture"] =
          HumanTravelLeafShown({ body, walked, lowered, base });

        // A swing the walk cannot follow is refused with the largest followed;
        // with no walk the standing check above already found where it lost.
        const heading: (v: IAutoMovieVector3) => number = (
          v: IAutoMovieVector3,
        ): number => (Math.atan2(v.x, v.z) * 180) / Math.PI;
        const takenHeading: number = heading(taken.normal);
        const swing: (t: number) => number = (t: number): number =>
          Math.abs(
            ((((heading(grip(context.start + t).normal) - takenHeading) % 360) +
              540) %
              360) -
              180,
          );
        const lost: number | undefined =
          walked === null
            ? lostStanding
            : readings.find(
                (t: number): boolean =>
                  !holds(
                    shown(t, undefined, validation, projector),
                    t,
                    validation,
                    projector,
                  ),
              );
        if (lost !== undefined) {
          const followed: number = swing(Math.max(TAKE, lost - 1 / 24));
          throw new AutoMovieMotionHumanRefusal({
            kind: "reach",
            axis: "handle",
            value: swing(lost),
            feasible: {
              kind: "range",
              minimum: 0,
              maximum: followed,
              unit: "degrees",
            },
            reason: `the hand loses the handle at ${lost.toFixed(2)} s, the door swung ${swing(lost).toFixed(1)} degrees, ${walked === null ? "where the leaf does not turn" : "faster or farther than the person can walk round with it"}; the largest swing followed is ${followed.toFixed(1)} degrees`,
            fix: `open the door at most ${followed.toFixed(1)} degrees, or swing it more slowly`,
          });
        }
        const closed: IAutoMovieMotionHumanPosture["joints"] =
          (door.prop.shapes ?? []).length === 0
            ? {}
            : HumanMountRider.closed(
                body,
                side,
                shown(TAKE, undefined, validation, projector),
                grip(context.start + TAKE),
                door.prop.shapes!,
                door.frame(context.start + TAKE),
              );
        const plants: IAutoMovieMotionHumanContactWindow[] =
          HumanTravelLeafPlants({ standing, walked, seconds });
        const contacts: IAutoMovieMotionHumanContactWindow[] = [
          ...plants,
          // The hand bears on the door, which the scene moves; a `grip` would make the door ride the hand instead.
          {
            part: `${side}Hand`,
            kind: "plant",
            from: TAKE / seconds,
            to: 1,
            support: { kind: "prop", subject: context.params.door },
          },
        ];
        const write: HumanTravelLeafWrite.Write = HumanTravelLeafWrite({
          context,
          body,
          side,
          grip,
          shown,
          closed,
        });
        const plan: IAutoMovieMotionHumanActionPlan = {
          ...standing,
          events: [{ name: "taken", share: TAKE / seconds }],
          contacts,
          posture: (
            t,
            channels,
            resolution,
            projection,
          ): IAutoMovieMotionHumanPosture =>
            write(
              Math.min(seconds, Math.max(0, t)),
              channels,
              resolution,
              projection,
            ),
        };
        // The hand's goal moves with the handle, so the arm is laid as one
        // course over it (`courseArmGoal`): the planner's reach to the handle
        // over `TAKE`, then the goal read at every second and fitted with
        // branch and swivel continuity while the leaf swings. Fitted afresh at
        // each second, two nearly tied arm solutions let one frame take the
        // other branch, a flip of the shoulder and forearm in one frame. The
        // hold checks above read the goal itself.
        return courseArmGoal({
          context,
          plan,
          side,
          span: { start: 0, ready: TAKE, relax: seconds, end: seconds },
        });
      },
    };
}

/*
 * The record of `IOpenDoorWalkedResult`'s site.
 */
type IOpenDoorWalkedResult = {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
};

/*
 * The alternatives of `OpenDoorAcross`'s site.
 */
type OpenDoorAcross = 1 | -1;

/*
 * The record of `IOpenDoorHandleMoved`'s site.
 */
type IOpenDoorHandleMoved = {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
};

/*
 * The record of `IOpenDoorRest`'s site.
 */
type IOpenDoorRest = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };
