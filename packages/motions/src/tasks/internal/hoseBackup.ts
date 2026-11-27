import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanGrasp } from "../../handling/internal/HumanGrasp";
import { HumanGraspRoll } from "../../handling/internal/HumanGraspRoll";
import { heldDigits } from "../../handling/internal/heldDigits";
import { writeWith } from "../../handling/internal/writeWith";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanAdaptiveKnots } from "../../posture/internal/prepareHumanAdaptiveKnots";
import type { prepareHumanKnotCourse } from "../../posture/internal/prepareHumanKnotCourse";

/** Both hands. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * The backup member of a hose team (`hoseLine`'s `backup` role): both hands on
 * the line's grip without carrying it, each a power grip rolled about the line
 * toward its shoulder (`HumanGraspRoll`), sharing the grip's length, the hand
 * reaching across the body ahead, following the grip where the operator's hold
 * puts the line.
 *
 * @param context The action's context.
 * @param p The hose-line parameters.
 * @param clock The action's clock.
 * @param base The leaning base plan.
 * @returns The backup's plan.
 * @throws {HumanRefusal} When the line declares no such grip, or a hand cannot
 *   reach it.
 */
export function hoseBackup(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IHoseLine>,
  p: IAutoMovieMotionHumanFirefight.IHoseLine,
  clock: IAutoMovieMotionClock,
  base: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const sites: readonly IAutoMovieAffordance[] =
    context.prop(p.prop).prop.affordances ?? [];
  const grip: IAutoMovieAffordance | undefined = sites.find(
    (a: IAutoMovieAffordance): boolean => a.id === p.grip,
  );
  if (grip === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "grip",
      value: p.grip,
      feasible: null,
      reason: `${p.prop} declares no grip called ${p.grip}`,
      fix: "name the line's grip for this member",
    });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  // Where the line's grip is at a second of this action, as its carrier
  // holds it, and how the run there is turned. Its place is solved at knots
  // AutoKnots places (Vitenti et al. 2024, arXiv:2412.13423;
  // `prepareHumanAdaptiveKnots`) to the arm plan's own millimetre
  // (`HumanArmTrajectoryTerms.TOLERANCE`) when the performance is placed
  // (`prepare`), since each read resolves the carrier's pose; a read before
  // reads the frame itself.
  let course: prepareHumanKnotCourse.ICourse | undefined;
  const solve = (seconds: number): IAutoMovieRigidTransform => {
    const at: number =
      context.start + Math.min(clock.duration, Math.max(0, seconds));
    const reader: IAutoMovieMotionHumanPropReader = context.prop(p.prop);
    const frame: IAutoMovieRigidTransform = reader.frame(at);
    // The grip where the line's bends put it: through each joint it rides,
    // the nearest first, each turning the grip's place and attitude.
    const state: Readonly<Record<string, number>> = reader.state?.(at) ?? {};
    let local: IAutoMovieVector3 = grip.frame.translation;
    let attitude: IAutoMovieQuaternion = grip.frame.rotation;
    let rides: string | undefined = grip.rides;
    while (rides !== undefined) {
      const joint: IAutoMovieAffordance = sites.find(
        (a: IAutoMovieAffordance): boolean => a.id === rides,
      )!;
      local = heldDigits.posed(
        joint,
        { ...grip, frame: { ...grip.frame, translation: local } },
        state[joint.id] ?? 0,
      );
      attitude = Quaternion.multiply(
        Quaternion.fromAxisAngle(
          Quaternion.rotateVector(joint.frame.rotation, { x: 0, y: 1, z: 0 }),
          state[joint.id] ?? 0,
        ),
        attitude,
      );
      rides = joint.rides;
    }
    return {
      position: Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(frame.rotation, attitude),
      ),
    };
  };
  const at = (seconds: number): IAutoMovieVector3 => {
    if (course === undefined) return solve(seconds).position;
    const [x, y, z]: number[] = course.position(
      Math.min(clock.duration, Math.max(0, seconds)),
    );
    return { x: x!, y: y!, z: z! };
  };
  // The grip as the stream opens: each hand wraps the line (its `+X`) as a
  // power grip takes any handle, from the grip's `-Y` and then rolled.
  const set: IAutoMovieRigidTransform = solve(ready);
  const approach: IAutoMovieVector3 = Quaternion.rotateVector(set.rotation, {
    x: 0,
    y: -1,
    z: 0,
  });
  const line: IAutoMovieVector3 = Quaternion.rotateVector(set.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(
      context.body,
      context.entry.pose,
      undefined,
      HumanBoneGroups.SHOULDERS,
    );
  // The hand whose shoulder lies farther from the grip reaches across the
  // body, so it takes the line ahead, where the trunk leaves it room.
  const far: AutoMovieHumanSide =
    Vector3.distance(bones.get("leftUpperArm")!.worldPosition, set.position) >
    Vector3.distance(bones.get("rightUpperArm")!.worldPosition, set.position)
      ? "left"
      : "right";
  const arms: IAutoMovieMotionHumanPrimitive[] = SIDES.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => {
      // The two hands share the grip's length, each at the middle of its half.
      const along: IAutoMovieVector3 = Vector3.scale(
        line,
        ((side === far ? 1 : -1) * (grip.length ?? 0)) / 4,
      );
      // Rolled about the line until the wrist lies nearest its shoulder.
      const wrist: IAutoMovieMotionHumanHand.IWrist = HumanGraspRoll(
        HumanGrasp.hand(context.body, side, {
          point: Vector3.add(set.position, along),
          approach,
          axis: line,
          width: grip.aperture ?? 0,
        }),
        Vector3.add(set.position, along),
        line,
        bones.get(`${side}UpperArm`)!.worldPosition,
      );
      const socket: IAutoMovieVector3 = HumanHand.offset(
        context.body,
        side,
        "grip",
        "flat",
      ).point;
      writeWith.reach(
        context,
        side,
        [
          Vector3.add(
            wrist.point,
            Quaternion.rotateVector(wrist.rotation, socket),
          ),
        ],
        Quaternion.rotateVector(wrist.rotation, socket),
      );
      return AutoMovieMotionHumanArm.carried({
        body: context.body,
        side,
        from: 0,
        to: clock.duration,
        span: { start: 0, ready, relax: done, end: clock.duration },
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        weight: (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        // The hand keeps that grip as the line carries it.
        goal: (
          _posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieHumanLimbGoal => ({
          point: Vector3.add(
            wrist.point,
            Vector3.subtract(at(seconds), set.position),
          ),
          rotation: wrist.rotation,
          contact: socket,
          bend: AutoMovieMotionHumanBend.hang(
            context.body,
            context.entry.posture,
            side,
          ),
        }),
      });
    },
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: arms,
      contact: "strokeStart",
    });
  return {
    ...composed,
    // The line's course first, so the arms' courses are solved on the line
    // as the display reads it.
    prepare: (): void => {
      course = prepareHumanAdaptiveKnots({
        from: 0,
        to: clock.duration,
        evaluate: (t: number): readonly number[] => {
          const p: IAutoMovieVector3 = solve(t).position;
          return [p.x, p.y, p.z];
        },
        tolerance: {
          kind: "absolute",
          absolute: HumanArmTrajectoryTerms.TOLERANCE / 1000,
        },
        maxKnots:
          Math.ceil(clock.duration / AutoMovieMotionHumanArmCourse.STEP) + 1,
      }).course;
      composed.prepare?.();
    },
    hands: ["left", "right"],
    contacts: [
      ...composed.contacts,
      ...SIDES.map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: side === "left" ? "leftHand" : "rightHand",
          kind: "grip",
          from: ready / clock.duration,
          to: done / clock.duration,
          support: { kind: "prop", subject: p.prop, carries: false },
        }),
      ),
    ],
  };
}
