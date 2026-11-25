import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGuitarNote,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { guitarNoteEntry } from "./guitarNoteEntry";
import { resolveGuitarStringContact } from "./resolveGuitarStringContact";

/** A staged guitar note's inputs and entry state. */
type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuitarNote>;

/** Tolerance for a usable projected shoulder direction, metres. */
const COINCIDENCE: number = 1e-6;

/**
 * A left index stops one string while the right index crosses it on a
 * stationary guitar. The left stops at the chosen fret bar's crossing with the
 * string. The right crosses that same string at the soundboard centre's
 * projection, on the bridge side of the stop. The right fingertip crosses
 * during one continuous sweep and lifts clear as the left continues holding.
 *
 * ElKoura and Singh (2003),
 * [Handrix](https://www.dgp.toronto.edu/~gelkoura/handrix/paper.html), motivate
 * the fretting-hand contact. Pérez-Carrillo (2019), [Finger-String Interaction
 * Analysis in Guitar Playing With Optical Motion
 * Capture](https://doi.org/10.3389/fcomp.2019.00008), observes approach,
 * transverse contact and clearance in the right hand. The sweep and clearances
 * here are staging choices from the string spacing and hand size. The action
 * depicts contacts on rigid bars for a staged shot. The author places and
 * supports the guitar and sets the three contact times. Both hands must be free
 * and within reach of the guitar.
 */
export const guitarNote: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGuitarNote> =
  {
    name: "guitarNote",
    interrupts: {},
    plan,
  };

/**
 * Resolve the staged instrument and plan the synchronized contact paths.
 *
 * @param context The action's start, performer and authored note.
 * @returns The held base and two time-addressable fingertip motions.
 * @throws {HumanRefusal} For invalid times, an incompatible guitar or occupied
 *   hands, or a wrist beyond the arm's geometric reach.
 */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const {
    stopAt,
    pluckAt,
    releaseAt,
    duration,
  }: IAutoMovieMotionHumanGuitarNote = context.params;
  guitarNoteEntry.timing(context.params);
  guitarNoteEntry.hands(context.entry.holds);

  const reader: IAutoMovieMotionHumanPropReader = context.prop(
    context.params.prop,
  );
  guitarNoteEntry.instrument(context.params.prop, reader.prop);
  const sites: ReturnType<typeof resolveGuitarStringContact> =
    resolveGuitarStringContact(context.params, reader.prop.affordances ?? []);
  const frame: IAutoMovieRigidTransform = reader.frame(context.start);
  const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, point));
  const stop: IAutoMovieVector3 = world(sites.stop);
  const pluck: IAutoMovieVector3 = world(sites.pluck);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    sites.normal,
  );
  const sweep: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    sites.sweep,
  );
  const lift: IAutoMovieVector3 = Vector3.scale(
    normal,
    context.body.measure.hand / 8,
  );
  const rightBefore: IAutoMovieVector3 = Vector3.subtract(pluck, sweep);
  const rightAfter: IAutoMovieVector3 = Vector3.add(pluck, sweep);
  const halfSweep: number = Math.min(pluckAt - stopAt, releaseAt - pluckAt) / 2;
  const begins: number = pluckAt - halfSweep;
  const ends: number = pluckAt + halfSweep;
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const left: ReturnType<typeof handPath> = handPath(
    context,
    bones,
    "left",
    stop,
    normal,
  );
  const right: ReturnType<typeof handPath> = handPath(
    context,
    bones,
    "right",
    pluck,
    normal,
  );

  return {
    duration,
    contacts: base.contacts,
    hands: ["left", "right"],
    contact: pluckAt,
    events: [
      { name: "stop", share: stopAt / duration },
      { name: "pluck", share: pluckAt / duration },
      { name: "release", share: releaseAt / duration },
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const hold: IAutoMovieMotionHumanPosture = base.posture(seconds);
      if (seconds <= 0) return hold;
      const leftPrep: number = stopAt / 2;

      // Land on the fret first, then keep the tip still until release.
      const down: number = ease(seconds, leftPrep, stopAt);
      const up: number = ease(seconds, releaseAt, duration);
      const leftTip: IAutoMovieVector3 = Vector3.add(
        stop,
        Vector3.scale(lift, 1 - down + up),
      );

      // The centre of this continuous right-hand sweep is the decisive instant.
      const rightPrep: number = begins / 2;
      const rightDown: number = ease(seconds, rightPrep, begins);
      const rightUp: number = ease(seconds, ends, releaseAt);
      const crossing: IAutoMovieVector3 = Vector3.lerp(
        rightBefore,
        rightAfter,
        ease(seconds, begins, ends),
      );
      const rightTip: IAutoMovieVector3 = Vector3.add(
        crossing,
        Vector3.scale(lift, 1 - rightDown + rightUp),
      );
      return right(
        left(hold, leftTip, ease(seconds, 0, leftPrep)),
        rightTip,
        ease(seconds, 0, rightPrep),
      );
    },
  };
}

/**
 * Build one arm and index goal from its displayed wrist and the soundboard's
 * normal.
 */
function handPath(
  context: Context,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
  contact: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): (
  hold: IAutoMovieMotionHumanPosture,
  tip: IAutoMovieVector3,
  weight: number,
) => IAutoMovieMotionHumanPosture {
  const entry: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const toward: IAutoMovieVector3 = Vector3.subtract(contact, shoulder);
  const along: IAutoMovieVector3 = reject(toward, normal);
  const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
    fingers:
      Vector3.length(along) > COINCIDENCE
        ? along
        : Vector3.normalize(
            Vector3.cross(
              normal,
              Math.abs(normal.x) < 0.9
                ? { x: 1, y: 0, z: 0 }
                : { x: 0, y: 0, z: 1 },
            ),
          ),
    palm: Vector3.scale(normal, -1),
  });
  const wristOffset: IAutoMovieVector3 = Quaternion.rotateVector(
    rotation,
    HumanHand.offset(context.body, side, "indexTip", "relaxed").point,
  );
  const reach: number = Vector3.length(Vector3.subtract(toward, wristOffset));
  const upper: number = context.body.measure.upperArm;
  const lower: number = context.body.measure.forearm;
  if (!(Math.abs(upper - lower) <= reach && reach <= upper + lower))
    throw new HumanRefusal({
      kind: "reach",
      axis: side === "left" ? "fret" : "string",
      value: reach,
      feasible: {
        kind: "range",
        unit: "m",
        minimum: Math.abs(upper - lower),
        maximum: upper + lower,
      },
      reason:
        "the stopped note requires a wrist outside the arm's geometric reach",
      fix: "reposition the staged guitar within both arms' reach",
    });
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    side,
    0.1,
  );
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "relaxed",
  );
  const closed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "fist",
  );
  const fingerBones: AutoMovieHumanoidBone[] = Object.keys(
    relaxed,
  ) as AutoMovieHumanoidBone[];
  return (
    hold: IAutoMovieMotionHumanPosture,
    tip: IAutoMovieVector3,
    weight: number,
  ): IAutoMovieMotionHumanPosture => {
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...hold.joints };
    for (const bone of fingerBones) {
      const neutral: readonly [number, number, number] = relaxed[bone]!;
      const shape: readonly [number, number, number] = bone.includes("Index")
        ? neutral
        : closed[bone]!;
      joints[bone] = blendHumanJoint(
        context.body,
        bone,
        hold.joints[bone] ?? neutral,
        shape,
        weight,
      );
    }
    return {
      ...hold,
      joints,
      limbs: {
        ...hold.limbs,
        [`${side}Arm`]: {
          point: Vector3.lerp(
            entry.worldPosition,
            Vector3.subtract(tip, wristOffset),
            weight,
          ),
          rotation: Quaternion.slerp(entry.worldRotation, rotation, weight),
          bend,
        },
      },
      digits: {
        ...hold.digits,
        ...(weight < 1
          ? {}
          : { [`${side}Index`]: { point: tip, surface: "tip" } }),
      },
    };
  };
}

/** The part of a vector crossing a unit normal. */
function reject(
  value: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.subtract(
    value,
    Vector3.scale(normal, Vector3.dot(value, normal)),
  );
}

/** Minimum-jerk progress between two ordered instants, clamped at the ends. */
function ease(seconds: number, from: number, to: number): number {
  return AutoMovieMotionInterval.progress(from, to, seconds);
}
