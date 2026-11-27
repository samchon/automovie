import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEnvironmentRecovery,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { support } from "../../actions/internal/support";
import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { getUp } from "../../floor/internal/getUp";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";

/**
 * Seconds to close the hand on the rail while the lost foot hangs
 * (provisional).
 */
const CATCH: number = 0.38;

/** Seconds to set the lost foot down while the hand holds (provisional). */
const RECOVER: number = 0.45;

/** Seconds to let go of the rail and stand (provisional). */
const LET_GO: number = 0.38;

/**
 * How far ahead along the trip the lost foot recovers, foot lengths
 * (provisional: a short capture step).
 */
const STEP: number = 0.48;

/** The rail's share of the body weight while the hand braces (provisional). */
const LOAD: number = 0.15;

/**
 * Reach slack beyond the straight arm, metres (provisional: the shoulder's
 * protraction).
 */
const REACH: number = 0.03;

/**
 * Brace a hand on a named rail after a lost foot: the hand closes on the bar's
 * nearest point to the shoulder while the remaining foot bears, the lost foot
 * comes down `STEP` foot lengths along the trip, and the hand lets go into an
 * upright stance. The shared support law (`support.plan`) fits the three
 * stances and their windows, the grip bearing `LOAD`.
 *
 * @param context The response's context, its entry with the lost foot released.
 * @param rail The rail and the bracing hand.
 * @param lost The foot that lost its support.
 * @param direction The trip's or slide's horizontal unit direction.
 * @returns The braced recovery, ending standing.
 * @throws {HumanRefusal} If the rail moves, is not a finite bar or is beyond
 *   the hand's reach.
 */
export function environmentRailCatch(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEnvironmentRecovery.IParams>,
  rail: IAutoMovieMotionHumanEnvironmentRecovery.IRail,
  lost: AutoMovieHumanSide,
  direction: IAutoMovieVector3,
): IAutoMovieMotionHumanActionPlan {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(rail.prop);
  const bar: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (item: IAutoMovieAffordance): boolean =>
      item.kind === "bar" && item.id === rail.point,
  );
  if (
    reader.prop.fixed !== true ||
    reader.prop.motion !== undefined ||
    reader.prop.hasArticulations === true ||
    bar?.length === undefined
  )
    throw refuse(rail.point, "the authored rail must be a fixed finite bar");
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(world.rotation, bar.frame.rotation),
    { x: 1, y: 0, z: 0 },
  );
  const middle: IAutoMovieVector3 = Vector3.add(
    world.position,
    Quaternion.rotateVector(world.rotation, bar.frame.translation),
  );
  const body: IAutoMovieMotionHumanBody = context.body;
  const posed: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const shoulder: IAutoMovieVector3 = posed.get(
    `${rail.hand}UpperArm`,
  )!.worldPosition;

  // The grip's nearest point on the bar's grippable span to the shoulder.
  const half: number = (bar.length - (bar.aperture ?? 0)) / 2;
  const axial: number = Vector3.dot(Vector3.subtract(shoulder, middle), axis);
  const goal: IAutoMovieVector3 = Vector3.add(
    middle,
    Vector3.scale(axis, Math.max(-half, Math.min(half, axial))),
  );
  if (
    half <= 0 ||
    Vector3.distance(shoulder, goal) >
      body.measure.upperArm + body.measure.forearm + REACH
  )
    throw refuse(rail.point, "the bar is outside the entering hand's reach");

  const mark: IAutoMovieMotionHumanSupport.IContact = {
    part: `${rail.hand}Hand`,
    kind: "grip",
    target: { kind: "prop", subject: rail.prop, point: rail.point },
  };
  const settled: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    {
      ...Vector3.add(
        context.entry.posture.root,
        Vector3.scale(direction, body.measure.footLength * STEP),
      ),
      y: HumanSupportFrame.floor(body, context.entry),
    },
    context.entry.posture.yaw,
  );
  const bearing = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanSupport.IContact => {
    let at: IAutoMovieVector3;
    if (side === lost) {
      const limb: IAutoMovieHumanLimbGoal = settled.limbs[`${side}Leg`]!;
      at = HumanFoot.point(body, side, "mtp", {
        ankle: limb.point,
        rotation: limb.rotation!,
      });
    } else at = posed.get(`${side}Toes`)!.worldPosition;
    return {
      part: `${side}Foot`,
      kind: "bear",
      target: {
        kind: "point",
        at,
        frame: "world",
        normal: { x: 0, y: 1, z: 0 },
      },
    };
  };
  const anchor: IAutoMovieMotionHumanSupport.IContact = bearing(
    lost === "left" ? "right" : "left",
  );
  const recovered: IAutoMovieMotionHumanSupport.IContact = bearing(lost);
  const plan: IAutoMovieMotionHumanActionPlan = support.plan({
    ...context,
    params: {
      stances: [
        { contacts: [anchor, mark], seconds: CATCH, event: "railCaught" },
        {
          contacts: [anchor, recovered, mark],
          seconds: RECOVER,
          event: "footRecovered",
        },
        {
          contacts: [anchor, recovered],
          seconds: LET_GO,
          event: "railReleased",
          prefer: getUp.POSES.stood,
        },
      ],
    },
    aim: (target: IAutoMovieMotionTarget, seconds: number) =>
      target.kind === "prop" &&
      target.subject === rail.prop &&
      target.point === rail.point
        ? { point: goal, normal: { x: 0, y: 1, z: 0 } }
        : context.aim(target, seconds),
  });
  return {
    ...plan,
    contacts: plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        window.kind === "grip" ? { ...window, load: LOAD } : window,
    ),
    base: { kind: "standing" },
  };
}

/** The rail catch's affordance refusal. */
function refuse(value: string, reason: string): HumanRefusal {
  return new HumanRefusal({
    kind: "parameter",
    axis: "rail.point",
    value,
    reason,
    fix: "stage a fixed bar within the bracing hand's reach",
  });
}
