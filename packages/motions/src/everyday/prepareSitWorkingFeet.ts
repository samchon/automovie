import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { walk } from "../actions/walk";
import { walkFoot } from "../actions/walkFoot";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { unloadedFoot } from "../carrier/unloadedFoot";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { seated } from "./seated";
import { sitPlace } from "./sitPlace";

type Feet = Record<AutoMovieHumanSide, IAutoMovieVector3>;

/** Inclusive bounds of a sagittal ankle displacement in metres. */
type AutoMovieFootShift = readonly [number, number];

interface IWorkingFeet {
  feet: Feet;
  entry: IAutoMovieMotionHumanPosture;
  prefix: IAutoMovieMotionHumanActionPlan;
}

/**
 * A fixed work seat may need a short stance adjustment before lowering. Find
 * where the ankles' sagittal reach intervals overlap at the seat, then use two
 * flat-to-flat gait swings to move the feet to the closest admissible stance.
 * Ordinary seats keep their existing admission and planted feet.
 */
export function prepareSitWorkingFeet(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSit.IParams>,
  initial: Feet,
  goal: IAutoMovieVector3,
  pitch: number,
  joints: IAutoMovieMotionHumanPosture["joints"],
): IWorkingFeet | undefined {
  const {
    body,
    entry,
    params: { seat },
  } = context;
  if (seat.workingSeat !== true) return undefined;
  const angles = { yaw: seat.yaw, pitch, roll: 0 };
  const hips: Feet = hipJoints(
    body,
    seated.root(body, goal, angles),
    humanPostureHeading(angles),
  );
  const radians: number = (seat.yaw * Math.PI) / 180;
  const forward: IAutoMovieVector3 = {
    x: Math.sin(radians),
    y: 0,
    z: Math.cos(radians),
  };
  const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
  let intervals: AutoMovieFootShift[] = [[-Infinity, Infinity]];
  for (const side of sides) {
    const [shortest, longest] = sitPlace.band(body, side);
    const away: IAutoMovieVector3 = Vector3.subtract(initial[side], hips[side]);
    const ahead: number = Vector3.dot(away, forward);
    const lateral: IAutoMovieVector3 = Vector3.subtract(
      away,
      Vector3.scale(forward, ahead),
    );
    const outside: number = Vector3.dot(lateral, lateral);
    const farSquared: number = longest * longest - outside;
    if (farSquared < 0) return undefined;

    // The outer reach bounds the sagittal line. The inner reach can cut a
    // gap in it, leaving legal placements on either side of the hip.
    const far: number = Math.sqrt(farSquared);
    const nearSquared: number = shortest * shortest - outside;
    const near: number = Math.sqrt(Math.max(0, nearSquared));
    const reachable: readonly AutoMovieFootShift[] =
      nearSquared > 0
        ? [
            [-far - ahead, -near - ahead],
            [near - ahead, far - ahead],
          ]
        : [[-far - ahead, far - ahead]];
    intervals = intervals.flatMap(([lower, upper]) =>
      reachable.flatMap(([start, end]): AutoMovieFootShift[] => {
        const first: number = Math.max(lower, start);
        const last: number = Math.min(upper, end);
        return first <= last ? [[first, last]] : [];
      }),
    );
  }
  if (intervals.some(([lower, upper]) => lower <= 0 && upper >= 0))
    return undefined;

  const hipHeight: number = body.measure.hipHeight;
  const stepLimit: number = walk.longestStep() * hipHeight;
  let shift: number | undefined;
  for (const [lower, upper] of intervals) {
    if (lower > stepLimit || upper < -stepLimit) continue;

    // Keep the stance inside the reach band by the standing allowance,
    // reduced only when the interval or step limit leaves less room.
    const room: number = Math.min(stand.DROP, (upper - lower) / 2);
    const nearest: number =
      lower > 0
        ? Math.min(lower + room, stepLimit)
        : Math.max(upper - room, -stepLimit);
    if (shift === undefined || Math.abs(nearest) < Math.abs(shift))
      shift = nearest;
  }
  if (shift === undefined) return undefined;
  const displacement: IAutoMovieVector3 = Vector3.scale(forward, shift);
  const feet: Feet = {
    left: Vector3.add(initial.left, displacement),
    right: Vector3.add(initial.right, displacement),
  };
  const yaw: number = entry.posture.yaw;
  const legs: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
    body,
    yaw,
  );
  const fromRoot: IAutoMovieVector3 = stand.root(body, initial, yaw);
  const toRoot: IAutoMovieVector3 = stand.root(body, feet, yaw);
  const next: IAutoMovieMotionHumanPosture = {
    root: toRoot,
    yaw,
    pitch: 0,
    roll: 0,
    joints,
    limbs: legs(toRoot, feet),
  };
  const gait = walk.walking(walk.FROUDE.slow);
  const speed: number = Math.sqrt(
    gait.froude * AutoMovieGravity.STANDARD * hipHeight,
  );
  const step: number =
    Math.max(Math.abs(shift), gait.step(gait.froude) * hipHeight) / speed;
  const duration: number = sides.length * step;
  const earliest: AutoMovieHumanSide =
    Vector3.dot(Vector3.subtract(initial.right, initial.left), displacement) > 0
      ? "right"
      : "left";
  const order: readonly AutoMovieHumanSide[] =
    earliest === "left" ? sides : ["right", "left"];
  const before: IAutoMovieMotionHumanPosture["limbs"] = legs(fromRoot, initial);
  const swings: ReturnType<typeof walkFoot.prepareSwing>[] = order.map(
    (side: AutoMovieHumanSide) =>
      walkFoot.prepareSwing(body, side, {
        from: {
          ankle: initial[side],
          rotation: before[`${side}Leg`]!.rotation!,
          toes: 0,
        },
        to: {
          ankle: feet[side],
          rotation: next.limbs[`${side}Leg`]!.rotation!,
          toes: 0,
        },
        seconds: step,
        velocity: { x: 0, y: 0, z: 0 },
        lift: gait.lift,
      }),
  );
  const lower: ReturnType<typeof lowerHumanPosture.prepare> =
    lowerHumanPosture.prepare(body);
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    plant(order[1]!, 0, step / duration),
    plant(order[0]!, step / duration, 1),
  ];
  return {
    feet,
    entry: next,
    prefix: {
      duration,
      events: [],
      contacts,
      posture: (time, _channels, resolution): IAutoMovieMotionHumanPosture => {
        if (time <= 0) return entry.posture;
        if (time >= duration) return next;
        const index: number = Math.floor(time / step);
        const side: AutoMovieHumanSide = order[index]!;
        const swing = swings[index]!((time - index * step) / step);
        const ankles: Feet = {
          ...(index === 0 ? initial : feet),
          [side]: swing.placement.ankle,
        };
        // The pelvis progresses over the ankle midpoint. A lifted ankle
        // must not raise the pelvis above the stance ankle's floor.
        const root: IAutoMovieVector3 = {
          ...stand.root(body, ankles, yaw),
          y: fromRoot.y + ((toRoot.y - fromRoot.y) * time) / duration,
        };
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = legs(root, ankles);
        const leg: IAutoMovieHumanLimbGoal = limbs[`${side}Leg`]!;
        // The stepping foot bears nothing: its ankle stays within what a
        // weightless ankle reaches.
        const hip: IAutoMovieVector3 = hipJoints(
          body,
          root,
          humanPostureHeading({ yaw, pitch: 0, roll: 0 }),
          joints.hips,
        )[side];
        limbs[`${side}Leg`] = unloadedFoot(body, hip, {
          ...leg,
          rotation: swing.placement.rotation,
          planted: false,
          contact: undefined,
        });
        return lower({ ...next, root, limbs }, resolution);
      },
    },
  };

  function plant(
    side: AutoMovieHumanSide,
    from: number,
    to: number,
  ): IAutoMovieMotionHumanContactWindow {
    const part: IAutoMovieMotionHumanContactWindow["part"] = `${side}Foot`;
    return {
      part,
      kind: "plant",
      from,
      to,
      support: HumanSupportFrame.contact(context, part),
    };
  }
}

/** The fixed work seat's foot preparation and its timing composition. */
export namespace prepareSitWorkingFeet {
  /**
   * Prepend the working feet's steps while preserving the descent's relative
   * times.
   *
   * @param prefix The two steps onto the final deck footprints.
   * @param lowering The original sit descent and its seat-contact windows.
   * @returns The two phases in one sit plan.
   * @evidence contracts/development/common.md#meaningful-documentation States the plans on each side of the join and the output.
   * @evidence contracts/development/implementation.md#principled-implementation Shifts the descent's clock to the end of the steps and applies that same shift to the actual contact windows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock offset and one reader choosing the current phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stance intervals or descent event shares are dropped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One preparation pass over events and contacts, then one phase read per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each phase keeps its own composed evaluator and the caller's FK loan passes only to the requested phase.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the two actual plans and their mapped windows remain.
   */
  export function prepend(
    prefix: IAutoMovieMotionHumanActionPlan,
    lowering: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan {
    const duration: number = prefix.duration + lowering.duration;
    const share = (at: number): number =>
      (prefix.duration + at * lowering.duration) / duration;
    return {
      ...lowering,
      duration,
      contact:
        lowering.contact === undefined
          ? undefined
          : lowering.contact + prefix.duration,
      events: lowering.events.map((event) => ({
        ...event,
        share: share(event.share),
      })),
      contacts: [
        ...prefix.contacts.map((contact) => ({
          ...contact,
          from: (contact.from * prefix.duration) / duration,
          to: (contact.to * prefix.duration) / duration,
        })),
        ...lowering.contacts.map((contact) => ({
          ...contact,
          from: share(contact.from),
          to: share(contact.to),
        })),
      ],
      posture: (second, ...loan) =>
        second < prefix.duration
          ? prefix.posture(second, ...loan)
          : lowering.posture(second - prefix.duration, ...loan),
    };
  }
}
