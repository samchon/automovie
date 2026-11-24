import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSpacecraftGlide,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/** Alignment tolerance for directions represented by unit quaternions. */
const ALIGNMENT: number = 1e-6;

/**
 * An opt-in law for one coast inside a stationary spacecraft. NASA-STD-3001
 * Volume 2 sections 8.5.2 and 8.5.5 describe handholds as starting and stopping
 * aids in microgravity
 * (https://www.nasa.gov/reference/8-0-architecture-vol-2/). The law stages one
 * hand delivering the departure impulse and the same hand absorbing the stop.
 * An author supplies the two contact durations and the grip's midpoint
 * clearance, with the body already staged by the first rail and a clear
 * corridor between the two. The kinematic staging assumes zero apparent gravity
 * and a stationary, upright entry. Full-body clearance, contact forces and
 * transitions into or out of the clip require separate staging.
 */
export const spacecraftGlide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSpacecraftGlide> =
  {
    name: "spacecraftGlide",
    interrupts: {},
    plan,
  };
/** The alternatives of `PlanPart`'s site. */
type PlanPart = "leftHand" | "rightHand";

/**
 * Resolve the handrails once, then evaluate an analytic root path and one grip
 * goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact premise, source, scene constraints and author controls.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSpacecraftGlide>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanSpacecraftGlide = context.params;
  const catchAt: number = p.ramp + p.coast;
  const duration: number = catchAt + p.ramp;
  if (
    !(
      p.ramp > 0 &&
      catchAt > p.ramp &&
      duration > catchAt &&
      Number.isFinite(duration)
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "clock",
      value: { ramp: p.ramp, coast: p.coast },
      reason: "the push, coast and brake require positive finite durations",
      fix: "give ramp and coast in positive seconds",
    });
  if (p.hand !== "left" && p.hand !== "right")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "hand",
      value: p.hand,
      reason:
        "one hand must release the departure bar and catch the arrival bar",
      fix: "name the left or right hand on the rail side of the cabin",
    });

  const craft: IAutoMovieMotionHumanPropReader = context.prop(p.spacecraft);
  if (
    craft.prop.fixed !== true ||
    craft.prop.motion !== undefined ||
    craft.prop.worn !== undefined ||
    craft.prop.mounted !== undefined
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "spacecraft",
      value: p.spacecraft,
      reason: "the straight transfer assumes stationary rails in a fixed cabin",
      fix: "stage the spacecraft as a fixed prop without a motion path or moving parent",
    });
  const frame: IAutoMovieRigidTransform = craft.frame(context.start);
  const departure: IAutoMovieAffordance = rail(craft, p.departure, "departure");
  const arrival: IAutoMovieAffordance = rail(craft, p.arrival, "arrival");
  const start: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, departure.frame.translation),
  );
  const delta: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    Vector3.subtract(arrival.frame.translation, departure.frame.translation),
  );
  const distance: number = Vector3.length(delta);
  const direction: IAutoMovieVector3 = Vector3.normalize(delta);
  const inward: IAutoMovieVector3 = axis(frame, departure, {
    x: 0,
    y: 1,
    z: 0,
  });
  const along: IAutoMovieVector3 = axis(frame, departure, { x: 1, y: 0, z: 0 });
  const arrivalInward: IAutoMovieVector3 = axis(frame, arrival, {
    x: 0,
    y: 1,
    z: 0,
  });
  const arrivalAlong: IAutoMovieVector3 = axis(frame, arrival, {
    x: 1,
    y: 0,
    z: 0,
  });
  if (
    !Number.isFinite(distance) ||
    distance <= ALIGNMENT ||
    Math.abs(direction.y) > ALIGNMENT ||
    Math.abs(Vector3.dot(direction, along)) < 1 - ALIGNMENT ||
    Vector3.dot(inward, arrivalInward) < 1 - ALIGNMENT ||
    Math.abs(Vector3.dot(arrivalAlong, along)) < 1 - ALIGNMENT
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "arrival",
      value: p.arrival,
      reason:
        "the two rail centres must be distinct and collinear along their horizontal runs, with matching outward normals",
      fix: "choose the two aligned interior rails on the same cabin wall",
    });

  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  if (
    entry.rotation !== undefined ||
    Math.abs(entry.pitch) > ALIGNMENT ||
    Math.abs(entry.roll) > ALIGNMENT ||
    Vector3.length(context.entry.velocity.linear) > ALIGNMENT ||
    Vector3.length(context.entry.velocity.angular) > ALIGNMENT
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "entry",
      value: context.entry.base.kind,
      reason:
        "the staged push starts upright and at rest with the hand at the departure rail",
      fix: "place the performer upright beside the departure rail before the start of this clip",
    });
  const speed: number = distance / catchAt;
  if (!Number.isFinite(speed))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "clock",
      value: { ramp: p.ramp, coast: p.coast },
      reason: "the rail spacing and clock must yield a finite glide speed",
      fix: "increase ramp or coast in seconds",
    });
  const rampDistance: number = 0.5 * speed * p.ramp;
  const surface: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    context.body,
    p.hand,
    "grip",
  );
  const turn: IAutoMovieQuaternion = HumanHand.align(surface, {
    normal: Vector3.scale(inward, -1),
    forward: along,
  });
  const gripOffset: IAutoMovieVector3 = Quaternion.rotateVector(
    turn,
    surface.point,
  );
  const shoulder: IAutoMovieVector3 = poseBones(
    context.body,
    context.entry.pose,
  ).get(`${p.hand}UpperArm`)!.worldPosition;
  const departureWrist: IAutoMovieVector3 = Vector3.subtract(
    Vector3.subtract(start, gripOffset),
    shoulder,
  );
  const rampShift: IAutoMovieVector3 = Vector3.scale(direction, rampDistance);
  const reach: number = Math.max(
    Vector3.length(departureWrist),
    Vector3.length(Vector3.subtract(departureWrist, rampShift)),
    Vector3.length(Vector3.add(departureWrist, rampShift)),
  );
  const armLength: number =
    context.body.measure.upperArm + context.body.measure.forearm;
  if (reach > armLength + ALIGNMENT)
    throw new HumanRefusal({
      kind: "reach",
      axis: "entry",
      value: reach,
      feasible: { kind: "range", minimum: 0, maximum: armLength, unit: "m" },
      reason:
        "a rail contact phase puts the wrist beyond the fully extended arm",
      fix: "stage the shoulder closer to the rails or reduce the distance covered during push and brake",
    });

  // At mid-coast the unshifted wrist has its departure offset from the
  // shoulder again. Intersect the inward line at that offset with the arm's
  // full-extension sphere to find the greatest inward clearance.
  const inwardOffset: number = Vector3.dot(departureWrist, inward);
  const perpendicular: IAutoMovieVector3 = Vector3.subtract(
    departureWrist,
    Vector3.scale(inward, inwardOffset),
  );
  const clearanceLimit: number = Math.max(
    0,
    Math.sqrt(
      Math.max(0, armLength ** 2 - Vector3.dot(perpendicular, perpendicular)),
    ) - inwardOffset,
  );
  const clearance: number = p.handClearance;
  if (
    !(
      Number.isFinite(clearance) &&
      clearance > 0 &&
      clearance <= clearanceLimit
    )
  )
    throw new HumanRefusal({
      kind: "reach",
      axis: "handClearance",
      value: clearance,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: clearanceLimit,
        unit: "m",
        open: "minimum",
      },
      reason:
        "the inward clearance must be positive and put the midpoint wrist within the fully extended arm",
      fix: "give a positive clearance within reach or adjust the starting shoulder position",
    });

  const origin: IAutoMovieVector3 =
    context.entry.pose.root?.translation ?? entry.root;
  const bendOffset: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(inward, -context.body.measure.shoulderHalfWidth),
    { x: 0, y: -context.body.measure.forearm, z: 0 },
  );
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    p.hand,
    "relaxed",
  );
  const closed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    p.hand,
    "fist",
  );
  const initialJoints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of context.entry.pose.joints)
    initialJoints[joint.bone] = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
  const digits: (keyof typeof closed)[] = Object.keys(
    closed,
  ) as (keyof typeof closed)[];
  const part: PlanPart = `${p.hand}Hand`;

  return {
    duration,
    events: [
      { name: "release", share: p.ramp / duration },
      { name: "catch", share: catchAt / duration },
      { name: "stop", share: 1 },
    ],
    contact: catchAt,
    contacts: [
      {
        part,
        kind: "grip",
        from: 0,
        to: p.ramp / duration,
        support: { kind: "prop", subject: p.spacecraft },
      },
      {
        part,
        kind: "grip",
        from: catchAt / duration,
        to: 1,
        support: { kind: "prop", subject: p.spacecraft },
      },
    ],
    base: { kind: "hanging" },
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      const u: number = Math.max(0, Math.min(1, (t - p.ramp) / p.coast));
      const travel: number =
        t <= p.ramp
          ? rampDistance * (t / p.ramp) ** 2
          : t >= catchAt
            ? distance - rampDistance * ((duration - t) / p.ramp) ** 2
            : rampDistance + speed * (t - p.ramp);
      const root: IAutoMovieVector3 = Vector3.add(
        origin,
        Vector3.scale(direction, travel),
      );

      // The hand leaves and approaches the rail at zero world velocity.
      const open: number = 16 * u ** 2 * (1 - u) ** 2;
      const grip: IAutoMovieVector3 = Vector3.add(
        Vector3.add(start, Vector3.scale(delta, minimumJerk.share(u))),
        Vector3.scale(inward, clearance * open),
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...initialJoints,
      };
      for (const bone of digits) {
        const from: readonly [number, number, number] = closed[bone]!;
        const to: readonly [number, number, number] = relaxed[bone]!;
        joints[bone] = [
          from[0] + (to[0] - from[0]) * open,
          from[1] + (to[1] - from[1]) * open,
          from[2] + (to[2] - from[2]) * open,
        ];
      }

      // Retain the entry's joint attitude and heading. No planted foot goal
      // follows the body into the cabin's zero-gravity interval.
      return {
        root,
        yaw: entry.yaw,
        pitch: entry.pitch,
        roll: entry.roll,
        joints,
        limbs: {
          [`${p.hand}Arm`]: {
            point: Vector3.subtract(grip, gripOffset),
            rotation: turn,
            contact: surface.point,
            bend: Vector3.add(grip, bendOffset),
            planted: t <= p.ramp || t >= catchAt,
          },
        },
      };
    },
  };
}
/** The alternatives of `RailField`'s site. */
type RailField = "departure" | "arrival";

/** Read a named fixed mobility aid from a prop's affordances. */
function rail(
  craft: IAutoMovieMotionHumanPropReader,
  id: string,
  field: RailField,
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = craft.prop.affordances?.find(
    (candidate: IAutoMovieAffordance): boolean => candidate.id === id,
  );
  if (
    found === undefined ||
    (found.kind !== "bar" && found.kind !== "handle") ||
    found.rides !== undefined
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: field,
      value: id,
      reason: "the named contact must be a rail fixed directly to the cabin",
      fix: "name a bar or handle that stays fixed in the spacecraft's frame",
    });
  return found;
}

/** Turn a rail-local axis into the placed spacecraft's world frame. */
function axis(
  spacecraft: IAutoMovieRigidTransform,
  rail: IAutoMovieAffordance,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    spacecraft.rotation,
    Quaternion.rotateVector(rail.frame.rotation, local),
  );
}
