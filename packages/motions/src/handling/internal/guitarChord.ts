import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGuitarChord,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { guitarChordTimes } from "./guitarChordTimes";
import { guitarFrettingSpan } from "./guitarFrettingSpan";
import { resolveGuitarStringContact } from "./resolveGuitarStringContact";

/*
 * Keep the left index and middle fingertips on two stopped strings while the
 * right index sweeps them on one continuous path over the soundboard. A
 * downstroke goes from the lower pitch to the higher pitch, as taught by
 * [Fender](https://www.fender.com/articles/techniques/how-to-strum-beginner-guitar-tips).
 * The [RITMO fourMs
 * archive](https://www.uio.no/ritmo/english/research/labs/fourms/research/Datasets/)
 * includes a synchronized jazz guitar pilot recording. The fixed voicing,
 * authored times and narrow travel of this draft are staging choices.
 *
 * Both hands must be free and the guitar must have a fixed frame. The two arm
 * wrist paths are refused outside their geometric reach bands. The fretting
 * span must also fit within the two digit chains and their knuckle spacing. The
 * first pitched contact is decisive. Each crossing event names the actual
 * string in either direction.
 */
export const guitarChord: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGuitarChord> =
  { name: "guitarChord", interrupts: {}, plan };

/*
 * Entry state and clock for one staged sweep.
 */
type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuitarChord>;

/*
 * World-space wrist path and the forearm hint retained from planning.
 */
interface IArm {
  /*
   * The wrist frame before guitar contact takes over.
   */
  entry: IAutoMovieResolvedBone;

  /*
   * One hand orientation for the engaged phase.
   */
  rotation: IAutoMovieQuaternion;

  /*
   * Side-specific direction for the elbow.
   */
  bend: IAutoMovieVector3;

  /*
   * Offsets for the selected hand's fingers in the engaged orientation.
   */
  offset: IAutoMovieVector3;

  /*
   * Clinical angles used to seed the digit fits.
   */
  shape: IAutoMovieMotionHumanPosture["joints"];

  /*
   * Joint names touched by this hand.
   */
  bones: AutoMovieHumanoidBone[];
}

/*
 * Convert the authored phase clock into two static stops and a moving stroke.
 * Parameter context: The performer, displayed entry, action clock and staged
 * guitar.
 * Returns: The carried base, named crossings and three digit goals.
 * For invalid clocks, instruments, occupied hands or
 * unreachable wrist paths.
 */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const {
    duration,
    stopAt,
    sweepStartAt,
    sweepEndAt,
    releaseAt,
    direction,
  }: IAutoMovieMotionHumanGuitarChord = context.params;
  const { prep, firstAt, secondAt }: guitarChordTimes.ITimes = guitarChordTimes(
    context.params,
  );
  if (
    context.entry.holds.left !== undefined ||
    context.entry.holds.right !== undefined
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "channel",
      axis: "hands",
      value: context.entry.holds,
      reason: "the chord uses both hands",
      fix: "free both hands and support the guitar independently",
    });
  const reader: IAutoMovieMotionHumanPropReader = context.prop(
    context.params.prop,
  );
  if (
    reader.prop.fixed !== true ||
    reader.prop.motion !== undefined ||
    reader.prop.worn !== undefined ||
    reader.prop.mounted !== undefined
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: context.params.prop,
      reason: "the chord takes an independently supported, stationary guitar",
      fix: "stage the guitar in a fixed frame",
    });

  const index: ReturnType<typeof resolveGuitarStringContact> =
    resolveGuitarStringContact(
      { fret: "fret4", string: "string3" },
      reader.prop.affordances ?? [],
    );
  const middle: ReturnType<typeof resolveGuitarStringContact> =
    resolveGuitarStringContact(
      { fret: "fret5", string: "string2" },
      reader.prop.affordances ?? [],
    );
  const frame: IAutoMovieRigidTransform = reader.frame(context.start);
  /*
   * Rigidly carry a named affordance point by the staged instrument.
   */
  const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, point));
  const indexStop: IAutoMovieVector3 = world(index.stop);
  const middleStop: IAutoMovieVector3 = world(middle.stop);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    index.normal,
  );
  const lift: IAutoMovieVector3 = Vector3.scale(
    normal,
    context.body.measure.hand / 8,
  );
  const down: boolean = direction === "down";
  const first: IAutoMovieVector3 = world((down ? index : middle).pluck);
  const second: IAutoMovieVector3 = world((down ? middle : index).pluck);
  const pass: IAutoMovieVector3 = Vector3.subtract(second, first);

  // A symmetric extension makes one minimum-jerk stroke cross at both time thirds.
  const firstShare: number = AutoMovieEngineMotionSampling.minimumJerkShare(1 / 3);
  const extension: number = firstShare / (1 - 2 * firstShare);
  const overrun: IAutoMovieVector3 = Vector3.scale(pass, extension);
  if (
    !(
      0 < Vector3.length(overrun) &&
      Vector3.length(overrun) <
        Math.min(Vector3.length(index.sweep), Vector3.length(middle.sweep))
    )
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "strings",
      value: ["string3", "string2"],
      reason:
        "the two crossings need room to clear before the neighbouring strings",
      fix: "use the adjacent, separately spaced guitar strings",
    });
  const before: IAutoMovieVector3 = Vector3.subtract(first, overrun);
  const after: IAutoMovieVector3 = Vector3.add(second, overrun);
  const beforeLift: IAutoMovieVector3 = Vector3.add(before, lift);
  const afterLift: IAutoMovieVector3 = Vector3.add(after, lift);
  const leftCentre: IAutoMovieVector3 = Vector3.lerp(
    indexStop,
    middleStop,
    0.5,
  );
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const voicing: IAutoMovieVector3 = Vector3.subtract(middleStop, indexStop);
  if (!(Vector3.length(Vector3.cross(normal, voicing)) > 1e-9))
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "frettingSpan",
      value: voicing,
      reason: "the fretting stops must be distinct in the guitar plane",
      fix: "use rigid fret and string bars at separate stops",
    });
  const span: number = Vector3.length(voicing);
  const maximumSpan: number = guitarFrettingSpan(context.body, bones);
  if (!(span <= maximumSpan + 1e-6))
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "frettingSpan",
      value: span,
      feasible: { kind: "range", unit: "m", minimum: 0, maximum: maximumSpan },
      reason:
        "the two fret stops are farther apart than the fretting digits can span",
      fix: "use a guitar whose fret and string spacing fits the fretting hand",
    });
  const left: IArm = arm(
    context,
    bones,
    "left",
    normal,
    [Vector3.add(leftCentre, lift), leftCentre],
    voicing,
  );
  const right: IArm = arm(context, bones, "right", normal, [
    beforeLift,
    before,
    after,
    afterLift,
  ]);
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );

  return {
    duration,
    contacts: base.contacts,
    hands: ["left", "right"],
    contact: firstAt,
    events: [
      { name: "stop", share: stopAt / duration },
      { name: "sweepStart", share: sweepStartAt / duration },
      { name: down ? "string3" : "string2", share: firstAt / duration },
      { name: down ? "string2" : "string3", share: secondAt / duration },
      { name: "sweepEnd", share: sweepEndAt / duration },
      { name: "release", share: releaseAt / duration },
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const held: IAutoMovieMotionHumanPosture = base.posture(seconds);
      if (seconds <= 0) return held;
      const weight: number = ease(seconds, 0, prep);
      const liftLeft: IAutoMovieVector3 = Vector3.scale(
        lift,
        1 - ease(seconds, prep, stopAt) + ease(seconds, releaseAt, duration),
      );
      const rightTip: IAutoMovieVector3 = Vector3.add(
        Vector3.lerp(before, after, ease(seconds, sweepStartAt, sweepEndAt)),
        Vector3.scale(
          lift,
          1 -
            ease(seconds, stopAt, sweepStartAt) +
            ease(seconds, sweepEndAt, releaseAt),
        ),
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...held.joints };
      for (const forearm of [left, right])
        for (const bone of forearm.bones) {
          const staged: readonly [number, number, number] =
            forearm.shape[bone]!;
          joints[bone] = blendHumanJoint(
            context.body,
            bone,
            held.joints[bone] ?? staged,
            staged,
            weight,
          );
        }
      return {
        ...held,
        joints,
        limbs: {
          ...held.limbs,
          leftArm: wrist(left, Vector3.add(leftCentre, liftLeft), weight),
          rightArm: wrist(right, rightTip, weight),
        },
        digits: {
          ...held.digits,
          ...(weight < 1
            ? {}
            : {
                leftIndex: {
                  point: Vector3.add(indexStop, liftLeft),
                  surface: "tip",
                },
                leftMiddle: {
                  point: Vector3.add(middleStop, liftLeft),
                  surface: "tip",
                },
                rightIndex: { point: rightTip, surface: "tip" },
              }),
        },
      };
    },
  };
}

/*
 * Fit the wrist offsets and arm reach once, using the extrema of each straight
 * path segment.
 */
function arm(
  context: Context,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
  normal: IAutoMovieVector3,
  path: readonly IAutoMovieVector3[],
  voicing?: IAutoMovieVector3,
): IArm {
  const entry: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const centre: IAutoMovieVector3 = Vector3.lerp(path[0]!, path.at(-1)!, 0.5);
  const toward: IAutoMovieVector3 = Vector3.subtract(centre, shoulder);
  const planar: IAutoMovieVector3 = Vector3.subtract(
    toward,
    Vector3.scale(normal, Vector3.dot(toward, normal)),
  );
  const index: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    "indexTip",
  ).point;
  const middle: IAutoMovieVector3 =
    voicing === undefined
      ? index
      : HumanHand.offset(context.body, side, "middleTip").point;
  const palm: IAutoMovieVector3 = Vector3.scale(normal, -1);

  // Turn the left hand's relaxed digit pair toward the fret span before fitting each digit.
  const rotation: IAutoMovieQuaternion =
    voicing === undefined
      ? HumanHand.rotation(side, {
          fingers:
            Vector3.length(planar) > 1e-6
              ? planar
              : Vector3.cross(
                  normal,
                  Math.abs(normal.x) < 0.9
                    ? { x: 1, y: 0, z: 0 }
                    : { x: 0, y: 0, z: 1 },
                ),
          palm,
        })
      : HumanHand.align(
          {
            normal: { x: 0, y: -1, z: 0 },
            forward: Vector3.subtract(middle, index),
          },
          { normal: palm, forward: voicing },
        );
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    rotation,
    Vector3.lerp(index, middle, 0.5),
  );
  const upper: number = context.body.measure.upperArm;
  const lower: number = context.body.measure.forearm;
  const minimum: number = Math.abs(upper - lower);
  const maximum: number = upper + lower;
  let previous: IAutoMovieVector3 = Vector3.subtract(
    entry.worldPosition,
    shoulder,
  );
  for (const waypoint of path) {
    const next: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(waypoint, offset),
      shoulder,
    );
    const delta: IAutoMovieVector3 = Vector3.subtract(next, previous);
    const sq: number = Vector3.dot(delta, delta);
    const closest: number =
      sq === 0
        ? 0
        : Math.max(0, Math.min(1, -Vector3.dot(previous, delta) / sq));
    const near: number = Vector3.length(Vector3.lerp(previous, next, closest));
    const far: number = Vector3.length(next);
    if (!(minimum - 1e-6 <= near && far <= maximum + 1e-6))
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: `${side}Arm`,
        value: near < minimum - 1e-6 ? near : far,
        feasible: { kind: "range", unit: "m", minimum, maximum },
        reason: "the guitar places a wrist outside its arm's geometric reach",
        fix: "move the staged instrument within reach of both hands",
      });
    previous = next;
  }
  const shape: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "relaxed",
  );
  const closed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "fist",
  );
  const fingers: AutoMovieHumanoidBone[] = Object.keys(
    shape,
  ) as AutoMovieHumanoidBone[];
  for (const bone of fingers)
    if (
      !bone.includes("Index") &&
      !(side === "left" && bone.includes("Middle"))
    )
      shape[bone] = closed[bone]!;
  return {
    entry,
    rotation,
    offset,
    shape,
    bones: fingers,
    bend: AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      side,
      0.1,
    ),
  };
}

/*
 * Transport one wrist from the displayed entry to the engaged hand frame.
 */
function wrist(
  arm: IArm,
  target: IAutoMovieVector3,
  weight: number,
): NonNullable<IAutoMovieMotionHumanPosture["limbs"]["leftArm"]> {
  return {
    point: Vector3.lerp(
      arm.entry.worldPosition,
      Vector3.subtract(target, arm.offset),
      weight,
    ),
    rotation: Quaternion.slerp(arm.entry.worldRotation, arm.rotation, weight),
    bend: arm.bend,
  };
}

/*
 * Minimum-jerk progress between ordered instants.
 */
function ease(seconds: number, start: number, end: number): number {
  return AutoMovieMotionInterval.progress(start, end, seconds);
}
