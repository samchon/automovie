import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { standingLegs } from "../actions/standingLegs";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { prepareGlideSlope } from "./prepareGlideSlope";

/** Fixed traversal order of the two independently fitted feet. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** Up and right of the tangent-plane frame before it is turned to the entry. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Right of the tangent-plane frame before it is turned to the entry. */
const RIGHT: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/** Forward of the tangent-plane frame before it is turned to the entry. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
/** The alternatives of `PlanPart`'s site. */
type PlanPart = "leftLeg" | "rightLeg";

/**
 * One continuous bilateral glide for ice and snow. An authored arc travels in a
 * level or inclined plane and the two ankles travel with that frame. The loaded
 * stance lowers and the trunk leans into the turn. The speed profile, crouch
 * and lean are provisional staging choices. Instrumented short-track curves
 * distinguish phase durations and blade loads, while ski turn measurements
 * distinguish load transfer and skidding. The current law represents only a
 * bilateral arc and longitudinal deceleration.
 * https://doi.org/10.1080/14763141.2018.1441898
 * https://doi.org/10.1371/journal.pone.0176975
 */
export namespace HumanSurfaceGlide {
  /**
   * Fraction of the action used to reach nominal speed from the entry
   * (provisional staging, as the speed profile is).
   */
  export const ACQUIRE: number = 0.2;

  /**
   * Fraction of the action used to decelerate when a stop is requested
   * (provisional staging, as the speed profile is).
   */
  export const BRAKE: number = 0.35;

  /** Authored duration and speed of the glide, with an optional stop. */
  export type IClockInput = Pick<
    IAutoMovieMotionHumanSurface.ISnowGlideParams,
    "duration" | "speed" | "stop"
  >;

  /** The admitted clock and its preparation for an entering speed. */
  export interface IClock {
    /** Action length, seconds. */
    seconds: number;

    /** Nominal speed, metres per second. */
    speed: number;

    /** Time used to acquire nominal speed, seconds. */
    acquire: number;

    /** Final braking span, seconds. Zero without a stop. */
    braking: number;

    /** Prepare the clock's integrated distance from the entering speed. */
    prepare(enteredSpeed: number): ICourse;
  }

  /** The phase-conditioned speed integral. */
  export interface ICourse {
    /** Total travel, metres, used to set the arc curvature. */
    travel: number;

    /** Current displacement and phase shares on the glide's duration. */
    sample(seconds: number): ISample;
  }

  /** Distance and shape weights at one action second. */
  export interface ISample {
    /** Integrated displacement, metres. */
    distance: number;

    /** Progress through the acquisition, held at its ends. */
    acquired: number;

    /** Progress through braking, held at its ends. */
    braked: number;
  }

  /** Admit and prepare the analytic clock before placing either foot. */
  export function clock(params: IClockInput): IClock {
    const seconds: number = HumanBound.above(
      "duration",
      params.duration,
      0,
      "s",
    );
    const speed: number = HumanBound.above("speed", params.speed, 0, "m/s");
    const acquire: number = seconds * ACQUIRE;
    const braking: number = params.stop === true ? seconds * BRAKE : 0;
    return {
      seconds,
      speed,
      acquire,
      braking,
      prepare: (enteredSpeed: number): ICourse => ({
        travel:
          speed * (seconds - braking / 2) +
          ((enteredSpeed - speed) * acquire) / 2,
        sample: (at: number): ISample => {
          const t: number = Math.min(seconds, Math.max(0, at));
          const acquired: number = Math.min(1, t / acquire);
          const braked: number =
            braking === 0
              ? 0
              : Math.min(1, Math.max(0, (t - (seconds - braking)) / braking));
          const distance: number =
            enteredSpeed * t +
            (speed - enteredSpeed) *
              (acquire * rampIntegral(acquired) + Math.max(0, t - acquire)) -
            speed * braking * rampIntegral(braked);
          return { distance, acquired, braked };
        },
      }),
    };
  }

  /**
   * Plan a straight glide or one arc on the plane of the entered stance; a
   * descent bears its skis on the slope the scene names (`slope`).
   *
   * @param context The entered stance, body and authored speed and arc.
   * @returns The bearing windows, speed events and pure posture query.
   * @throws {HumanRefusal} For a non-standing entry, missing ground support, a
   *   grade with no slope named, infeasible arc radius or parameters outside
   *   the authored bounds.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISnowGlideParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params }: typeof context = context;
    const motionClock: IClock = clock(params);
    const { seconds, speed, braking } = motionClock;
    const turn: number = HumanBound.within(
      "turn",
      params.turn ?? 0,
      -180,
      180,
      "deg",
    );
    const grade: number = HumanBound.within(
      "grade",
      params.grade ?? 0,
      -20,
      20,
      "deg",
    );
    // A descent glides on the slope the scene declares: the skis bear on
    // its surface, and with no slope under them a grade would carry the
    // body below the level ground it stands on.
    const slope: string | undefined = params.slope;
    if (grade !== 0 && slope === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "slope",
        value: grade,
        feasible: null,
        reason: `a ${grade} degree descent glides on a slope, and no slope is named under the skis`,
        fix: "name the scene's slope the skis glide on, or glide on level snow",
      });
    if (
      entry.base.kind !== "standing" ||
      SIDES.some(
        (side: AutoMovieHumanSide): boolean =>
          !entry.supports.some(
            (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
              support.part === `${side}Foot` &&
              (support.support.kind === "ground" ||
                (slope !== undefined &&
                  support.support.kind === "prop" &&
                  support.support.subject === slope)) &&
              (support.kind === "plant" ||
                support.kind === "pivot" ||
                support.kind === "bear"),
          ),
      )
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: entry.base.kind,
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: "a bilateral glide begins on two surface-bearing feet",
        fix: "enter from standing on two feet or continue a bilateral glide",
      });

    const start: IAutoMovieMotionHumanPosture = entry.posture;
    const ankle: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: entry.feet.left.ankle,
      right: entry.feet.right.ankle,
    };
    const desired: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle(UP, start.yaw),
      Quaternion.fromAxisAngle(RIGHT, grade),
    );
    const deck: prepareGlideSlope.ISlope | undefined =
      slope === undefined
        ? undefined
        : prepareGlideSlope(context, slope, desired);
    const origin: IAutoMovieRigidTransform = {
      position: Vector3.lerp(ankle.left, ankle.right, 0.5),
      rotation: deck?.rotation ?? desired,
    };
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      origin.rotation,
      FORWARD,
    );
    const enteredSpeed: number = Math.max(
      0,
      Vector3.dot(entry.velocity.linear, forward),
    );
    const course: ICourse = motionClock.prepare(enteredSpeed);
    const curvature: number = (turn * Quaternion.DEG2RAD) / course.travel;
    const offsets: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {
      left: HumanFoot.offset(body, "left", "sole"),
      right: HumanFoot.offset(body, "right", "sole"),
    };
    const contact = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      deck === undefined
        ? ankle[side]
        : deck.enter(
            Vector3.add(
              ankle[side],
              Quaternion.rotateVector(entry.feet[side].rotation, offsets[side]),
            ),
          );
    const foot = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(contact(side), origin.position),
      );
    const local: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: foot("left"),
      right: foot("right"),
    };
    if (
      SIDES.some(
        (side: AutoMovieHumanSide): boolean =>
          1 - curvature * local[side].x <= 0,
      )
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "turn",
        value: turn,
        feasible: null,
        reason:
          "the glide arc must be finite and turn outside both skate or ski paths",
        fix: "use a gentler turn, a longer duration or a higher travel speed",
      });
    if (deck !== undefined)
      for (const side of SIDES)
        deck.travel(origin.position, local[side], course.travel, curvature);

    const tangent = (side: AutoMovieHumanSide): IAutoMovieQuaternion =>
      Quaternion.fromAxisAngle(
        UP,
        Math.atan2(curvature * local[side].z, 1 - curvature * local[side].x) /
          Quaternion.DEG2RAD,
      );
    const toe: Record<AutoMovieHumanSide, IAutoMovieQuaternion> = {
      left: tangent("left"),
      right: tangent("right"),
    };
    const knees: IAutoMovieMotionHumanPosture["limbs"] = standingLegs(
      body,
      start.root,
      start.yaw,
      ankle,
      0,
    );
    const contacts: IAutoMovieMotionHumanContactWindow[] = SIDES.map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`,
        kind: "bear",
        from: 0,
        to: 1,
        support:
          slope === undefined
            ? { kind: "ground" }
            : {
                kind: "prop",
                subject: slope,
                point: deck!.point,
                carries: false,
              },
      }),
    );
    if (braking > 0 && grade === 0)
      for (const contact of [...contacts])
        contacts.push({ ...contact, kind: "plant", from: 1 });
    return {
      duration: seconds,
      events: [
        { name: "glide", share: ACQUIRE },
        ...(braking === 0
          ? []
          : [
              { name: "brake", share: 1 - BRAKE },
              { name: "stop", share: 1 },
            ]),
      ],
      contacts,
      physicalWindow: null,
      posture: (at: number): IAutoMovieMotionHumanPosture => {
        const { distance, acquired, braked } = course.sample(at);
        const angle: number = distance * curvature;
        const half: number = angle / 2;
        const chord: number =
          half === 0 ? distance : (distance * Math.sin(half)) / half;
        const frame: IAutoMovieRigidTransform = {
          position: Vector3.add(
            origin.position,
            Quaternion.rotateVector(origin.rotation, {
              x: chord * Math.sin(half),
              y: 0,
              z: chord * Math.cos(half),
            }),
          ),
          rotation: Quaternion.multiply(
            origin.rotation,
            Quaternion.fromAxisAngle(UP, angle / Quaternion.DEG2RAD),
          ),
        };
        const set: number = minimumJerk.share(acquired);
        const finish: number = minimumJerk.share(braked);
        const turnLean: number = Math.min(
          7,
          Math.max(-7, speed * speed * curvature * 3),
        );
        const drop: number =
          0.09 * (body.measure.thigh + body.measure.shank) * set * (1 - finish);
        const carried: IAutoMovieMotionHumanPosture = carryHumanPosture(
          start,
          origin,
          {
            ...frame,
            position: Vector3.add(frame.position, { x: 0, y: -drop, z: 0 }),
          },
        );
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...carried.limbs,
        };
        const delta: IAutoMovieQuaternion = Quaternion.multiply(
          frame.rotation,
          inverse,
        );
        for (const side of SIDES) {
          const part: PlanPart = `${side}Leg`;
          const knee: IAutoMovieHumanLimbGoal = knees[part]!;
          const before: IAutoMovieQuaternion = Quaternion.multiply(
            delta,
            entry.feet[side].rotation,
          );
          const rotation: IAutoMovieQuaternion = Quaternion.slerp(
            before,
            Quaternion.multiply(frame.rotation, toe[side]),
            set,
          );
          const contact: IAutoMovieVector3 = Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, local[side]),
          );
          limbs[part] = {
            ...knee,
            point:
              deck === undefined
                ? contact
                : Vector3.subtract(
                    contact,
                    Quaternion.rotateVector(rotation, offsets[side]),
                  ),
            bend: Vector3.add(
              frame.position,
              Quaternion.rotateVector(
                delta,
                Vector3.subtract(knee.bend, origin.position),
              ),
            ),
            rotation,
          };
        }
        return {
          ...carried,
          pitch: carried.pitch + 7 * set * (1 - finish),
          roll: carried.roll - turnLean * set * (1 - finish),
          limbs,
        };
      },
    };
  }
}

/** Integral on [0, u] of the cubic speed ramp with zero endpoint slopes. */
function rampIntegral(u: number): number {
  return u * u * u * (1 - u / 2);
}
