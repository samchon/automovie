import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWorkoutLoad,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";

/*
 * The load of a workout.
 * Parameter context: The action's context.
 * Parameter load: The load's parameters.
 * Parameter midfoot: Whether a bar in both hands travels over the middle of the
 * feet.
 * Parameter turnover: Whether to preserve the keyed shoulder-to-bar direction
 * through turnover and the overhead receive.
 * Parameter ready: The share where the second hand first reaches the load in the
 * exercise.
 * Returns: What the plan needs of it.
 * When the hand does not hold the prop, either handle is
 * unavailable, or the two handles coincide.
 */
export function WorkoutLoad(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  load: IAutoMovieMotionHumanWorkoutLoad.IParams,
  midfoot: boolean = false,
  turnover: boolean = false,
  ready: number = 0,
): IAutoMovieMotionHumanWorkoutLoad.ILoad {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const side: AutoMovieHumanSide = load.hand ?? "right";
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";

  // The holding hand keeps the fingers it closed on the prop: a key
  // writes every joint, the fingers among them.
  const closed: IAutoMovieMotionHumanPosture["joints"] = Object.fromEntries(
    Object.entries(context.entry.posture.joints).filter(
      ([bone]: [string, unknown]): boolean =>
        bone.startsWith(side) && /(Thumb|Index|Middle|Ring|Little)/.test(bone),
    ),
  );
  if (load.other === undefined) {
    const held: ReturnType<typeof AutoMovieMotionHumanHeld> =
      AutoMovieMotionHumanHeld(context, side, load.prop);
    return {
      apply: (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        joints: { ...posture.joints, ...closed },
      }),
      contacts: [AutoMovieMotionHumanHeld.grip(held)],
      holds: [AutoMovieMotionHumanHeld.hold(context, held)],
      hands: [side],
    };
  }
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
    context,
    side,
    load.prop,
    {
      tip: load.other,
    },
  );
  const own: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
    context,
    side,
  );

  // The bar's line in the hand: from the handle the hand took to the
  // other one, both read in the hand's frame.
  const axis: IAutoMovieVector3 =
    load.handle === undefined
      ? tool.tip
      : Vector3.subtract(
          tool.tip,
          StrikingHeld(context, side, load.prop, { tip: load.handle }).tip,
        );
  const width: number = Vector3.length(axis);
  if (width <= 1e-9)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "load",
      value: load.other,
      reason: "the two load grips coincide",
      fix: "name distinct handles on the held prop",
    });
  const line: IAutoMovieVector3 = Vector3.scale(axis, 1 / width);
  const bare: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
    context,
    other,
  );
  const fist: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    other,
    "fist",
  );
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`,
      `${side}LowerArm`,
      `${side}Hand`,
    ]);
  const trunk: ReturnType<typeof StrikingBody.prepareTrunk> =
    StrikingBody.prepareTrunk(body, requested);

  // The middle of the feet the entry stands on, over which a lift's bar
  // travels.
  const balance: IAutoMovieVector3 | undefined = !midfoot
    ? undefined
    : Vector3.scale(
        (["left", "right"] as const).reduce(
          (
            sum: IAutoMovieVector3,
            foot: AutoMovieHumanSide,
          ): IAutoMovieVector3 =>
            Vector3.add(
              sum,
              Vector3.add(
                HumanFoot.point(body, foot, "heel", {
                  ankle: context.entry.feet[foot].ankle,
                  rotation: context.entry.feet[foot].rotation,
                }),
                HumanFoot.point(body, foot, "toe", {
                  ankle: context.entry.feet[foot].ankle,
                  rotation: context.entry.feet[foot].rotation,
                }),
              ),
            ),
          { x: 0, y: 0, z: 0 },
        ),
        0.25,
      );
  return {
    contacts: [
      ...StrikingHeld.grips(tool),
      {
        part: `${other}Hand`,
        kind: "grip",
        from: ready,
        to: 1,
        support: { kind: "prop", subject: load.prop, carries: false },
      },
    ],
    holds: StrikingHeld.holds(context, tool),
    admit: (posture: IAutoMovieMotionHumanPosture): void => {
      const fitted: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, posture),
      );
      const actual = fitted.get(`${side}Hand`)!;
      const support: IAutoMovieVector3 = HumanHand.frame(
        body,
        fitted,
        other,
        "grip",
        "fist",
      ).point;
      const goal: IAutoMovieVector3 = StrikingHeld.point(tool, {
        point: HumanHand.frame(body, fitted, side, "grip").point,
        rotation: actual.worldRotation,
      });
      const miss: number = Vector3.distance(support, goal);
      if (miss > StrikingRoll.MISS)
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "load",
          value: miss,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: StrikingRoll.MISS,
            unit: "m",
          },
          reason: `the ${other} grip misses the ${load.other} handle by ${(miss * 1000).toFixed(1)} mm at an authored lift phase`,
          fix: "use a reachable grip spacing and support posture",
        });
    },
    hands: [side, other],
    apply: (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = trunk(
        posture,
        read,
        projection,
      );
      // The bar runs level to the performer's other side from the hand,
      // and the hand is turned about it so the knuckles continue the
      // forearm: a straight wrist, the turn an arm holds. A turn taken
      // from the key's own hand left the bar 0.3 m out of level, the
      // wrist giving way.
      const level: WorkoutLoad.ILevel = WorkoutLoad.level(
        posture.yaw,
        side,
        Vector3.subtract(
          bones.get(`${side}Hand`)!.worldPosition,
          bones.get(`${side}LowerArm`)!.worldPosition,
        ),
      );
      const across: IAutoMovieVector3 = level.across;
      const turn: IAutoMovieQuaternion = HumanHand.align(
        // The tool's own axis is the other handle's approach, square to
        // the bar, so the bar's line is read from its two handles.
        { normal: line, forward: own.axis },
        { normal: across, forward: level.forward },
      );
      const keyed: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
        point: HumanHand.frame(body, bones, side, "grip").point,
        rotation: turn,
      };
      // Centre the bar across the body. A mid-foot lift also centres it
      // along the heading. The hand swings about its shoulder by what the key
      // leaves the bar's middle off the mid-foot, so a bar in both hands
      // hangs centred between them, each handle as far out of its own
      // shoulder. Held where the key put the holding hand across, the other
      // handle lay out of the other arm's reach at a deadlift's bottom (on
      // the small woman 504 mm from the shoulder against a 462 mm arm), so
      // the other hand fell short of it by the grasp's chance. The hand
      // keeps its distance from the shoulder: moved level instead, a
      // straight arm fell short of the handle and the other hand slid
      // 20.6 mm along the bar on the small woman.
      const ahead: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: 0, y: 0, z: 1 },
      );
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const reach: IAutoMovieVector3 = Vector3.subtract(keyed.point, shoulder);
      const off: IAutoMovieVector3 = Vector3.subtract(
        balance ?? posture.root,
        Vector3.lerp(keyed.point, StrikingHeld.point(tool, keyed, 0), 0.5),
      );
      const aside: number =
        Vector3.dot(reach, across) + Vector3.dot(off, across);
      const squaredReach: number = Vector3.dot(reach, reach);
      const remaining: number = squaredReach - aside * aside;
      if (remaining < 0) {
        // A flexed key does not measure the performer's full reach. The
        // triangle inequality does bound the distance between two grips.
        const partner: IAutoMovieVector3 = StrikingBody.trunk(
          body,
          posture,
          read,
          new Set<AutoMovieHumanoidBone>([`${other}UpperArm`]),
          projection,
        ).get(`${other}UpperArm`)!.worldPosition;
        let maximum: number = Vector3.distance(shoulder, partner);
        for (const arm of [side, other]) {
          const elbow: IAutoMovieVector3 = body.rest.get(`${arm}LowerArm`)!;
          maximum +=
            Vector3.distance(body.rest.get(`${arm}UpperArm`)!, elbow) +
            Vector3.distance(elbow, body.rest.get(`${arm}Hand`)!) +
            Vector3.length(
              HumanHand.offset(
                body,
                arm,
                "grip",
                arm === side ? "relaxed" : "fist",
              ).point,
            );
        }
        const span: number = Vector3.length(tool.tip);
        if (span > maximum)
          throw new AutoMovieMotionHumanRefusal({
            kind: "reach",
            axis: "load",
            value: span,
            feasible: { kind: "range", minimum: 0, maximum, unit: "m" },
            reason: `the support handle is ${span.toFixed(3)} m from the holding grip, beyond the two arms' full span of ${maximum.toFixed(3)} m`,
            fix: "use handles closer to shoulder width",
          });
      }
      // Beyond the keyed circle the shortest extension to the centred
      // handle is purely lateral. The native arm fit owns its articulation.
      const radius: number = remaining > 0 ? Math.sqrt(remaining) : 0;
      const keyedForth: number = Vector3.dot(reach, ahead);
      // Keep turnover on its continuous vertical/forward route when the
      // bar moves from below the shoulders into the rack and overhead.
      const radial: number = Math.hypot(keyedForth, reach.y);
      const fit: number = radial === 0 ? 0 : Math.min(1, radius / radial);
      const forth: number = turnover
        ? keyedForth * fit
        : Math.max(
            -radius,
            Math.min(
              radius,
              keyedForth +
                (balance === undefined ? 0 : Vector3.dot(off, ahead)),
            ),
          );
      const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
        ...keyed,
        point: Vector3.add(
          Vector3.add(shoulder, Vector3.scale(across, aside)),
          Vector3.add(Vector3.scale(ahead, forth), {
            x: 0,
            y: turnover
              ? reach.y * fit
              : (reach.y > 0 ? 1 : -1) *
                Math.sqrt(radius * radius - forth * forth),
            z: 0,
          }),
        ),
      };
      const first: IAutoMovieHumanLimbGoal = StrikingHeld.goal(
        context,
        tool,
        frame,
        0,
        { x: 0, y: 0, z: 0 },
      );
      const second: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "bend"> = {
        surface: "grip",
        shape: "fist",
        ...StrikingHeld.hand(
          bare,
          0,
          StrikingHeld.point(tool, frame, 0),
          Quaternion.rotateVector(frame.rotation, own.axis),
          Quaternion.rotateVector(frame.rotation, own.edge),
        ),
      };
      const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
        body,
        other,
        second.surface,
        second.point,
        second.rotation,
        second.shape,
      );
      const both: ReturnType<typeof AutoMovieMotionHumanBend.prepareBoth> =
        AutoMovieMotionHumanBend.prepareBoth({ body, posture }, read);
      const bend: (
        arm: AutoMovieHumanSide,
        goal: Pick<IAutoMovieHumanLimbGoal, OfBendGoal>,
      ) => IAutoMovieVector3 = (
        arm: AutoMovieHumanSide,
        goal: Pick<IAutoMovieHumanLimbGoal, OfBendGoal2>,
      ): IAutoMovieVector3 =>
        both(arm).solve({
          point: goal.point,
          ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
          fallback: "hang",
        });
      return {
        ...posture,
        joints: {
          ...posture.joints,
          ...closed,
          ...fist,
        },
        limbs: {
          ...posture.limbs,
          [`${side}Arm`]: { ...first, bend: bend(side, first) },
          [`${other}Arm`]: AutoMovieMotionHumanArmTarget.fromWrist(
            wrist,
            bend(other, wrist),
            HumanHand.offset(body, other, second.surface, second.shape).point,
          ),
        },
      };
    },
  };
}

/*
 * The bar's level frame a held load is turned to (`WorkoutLoad`).
 */
export namespace WorkoutLoad {
  /*
   * The bar's direction and the knuckles' along it.
   */
  export interface ILevel {
    /*
     * The bar's unit direction, level, toward the performer's other side.
     */
    across: IAutoMovieVector3;

    /*
     * The unit direction the knuckles continue: the forearm square to the bar,
     * straight down when the forearm runs along it.
     */
    forward: IAutoMovieVector3;
  }

  /*
   * The level frame of a bar held in one hand: it runs level from the hand to
   * the performer's other side, and the hand is turned about it so the knuckles
   * continue the forearm, a straight wrist.
   * Parameter yaw: The performer's heading, degrees.
   * Parameter side: The holding hand.
   * Parameter forearm: The forearm from the elbow to the wrist, world.
   * Returns: The bar's direction and the knuckles'.
   */
  export function level(
    yaw: number,
    side: AutoMovieHumanSide,
    forearm: IAutoMovieVector3,
  ): ILevel {
    const across: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: side === "right" ? 1 : -1, y: 0, z: 0 },
    );
    const square: IAutoMovieVector3 = Vector3.subtract(
      forearm,
      Vector3.scale(across, Vector3.dot(forearm, across)),
    );
    return {
      across,
      forward:
        Vector3.length(square) > 1e-6
          ? Vector3.normalize(square)
          : { x: 0, y: -1, z: 0 },
    };
  }
}

/*
 * The alternatives of `OfBendGoal2`'s site.
 */
type OfBendGoal2 = "point" | "rotation";

/*
 * The alternatives of `OfBendGoal`'s site.
 */
type OfBendGoal = "point" | "rotation";

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "body" | "entry" | "prop" | "subject";
