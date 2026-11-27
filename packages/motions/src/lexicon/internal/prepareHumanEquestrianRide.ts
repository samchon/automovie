import { Quaternion, Vector3, minimumJerk, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRide,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { humanEquestrianRhythm } from "./humanEquestrianRhythm";

/** The ride law's context after the seated entry has been admitted. */
type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>;

/** A jumping rider's four ordered landmarks on the ride's local clock. */
type Jump = humanEquestrianRhythm.Jump;

/** Kept in parent-to-child order to describe the same four joints in each pose. */
const BONES = ["spine", "chest", "neck", "head"] as const;
/** The alternatives of `LookDirection`'s site. */
type LookDirection = 1 | -1;

/** The centred over-shoulder film beat on the ride's clock. */
interface ILook {
  /** Local seconds of greatest turn. */
  peak: number;
  /** Half the turn's duration, seconds. */
  half: number;
  /** Left is positive about the rider's up axis. */
  direction: LookDirection;
}

/**
 * A support-relative response integrated before the ride fits its hands and
 * feet.
 */
interface IPrepared {
  /** Local seconds where the stirrups support the raised rider without the seat. */
  offSeat?: readonly [number, number];
  /**
   * Pose the pelvis and upper body relative to the saddle and keep the limb
   * demands for the ride to fit.
   */
  at(
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    carrier: IAutoMovieRigidTransform,
    seatDrift: IAutoMovieVector3,
    up: IAutoMovieVector3,
  ): void;
}

/**
 * Prepare opt-in riding articulation from the support's film cues. Collected
 * walk and trot show opposing saddle and pelvic pitch during early stance, with
 * the lumbar spine extending in early trot stance (Byström et al., PMID
 * 20525053 and 19469236). Uses that relative phase and small authored
 * amplitudes. Canter varies with lead, using authored timing and amplitude; the
 * gallop rocks and rolls as the canter does, at the canter's amplitudes
 * (provisional: no source read gives a rider's pelvis at the gallop). Jump
 * flight starts at last hind liftoff and ends at first fore landing (Clayton
 * 1989, doi:10.1016/S0737-0806(89)80073-5). The scene author supplies those
 * instants from a jumping support. The over-shoulder pose follows a single film
 * cue, with pelvis and horse direction independent of the turn.
 *
 * @param context The ride's context and its performance cue tracks.
 * @param origin The support frame when the ride begins.
 * @param saddle The support's seat, world metres at the ride's entry, resolved
 *   by the ride.
 * @returns The rider-only response for this ride, or undefined for ordinary
 *   riding.
 * @throws {HumanRefusal} For missing support, missing or ambiguous cues, or
 *   incompatible jumping support.
 */
export function prepareHumanEquestrianRide(
  context: Context,
  origin: IAutoMovieRigidTransform,
  saddle: IAutoMovieVector3 | undefined,
): IPrepared | undefined {
  const options: IAutoMovieMotionHumanRide.IParams["equestrian"] =
    context.params.equestrian;
  if (options === undefined) return undefined;
  if (saddle === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "seat",
      value: context.params.seat,
      feasible: null,
      reason: "equestrian riding needs the carried location of its saddle",
      fix: "name a saddle point on the current support",
    });
  if (
    options.stride === undefined &&
    options.jump === undefined &&
    options.lookBack === undefined
  )
    refuse(
      "equestrian",
      options,
      "no equestrian motion was selected",
      "choose stride, jump or lookBack",
    );

  const seconds: number = context.params.duration;
  const strides: readonly IStrideWindow[] = strideWindows(
    context,
    options.stride,
    seconds,
  );

  let jump: Jump | undefined;
  if (options.jump !== undefined) {
    const {
      approach,
      takeoff,
      landing,
      recovery,
    }: NonNullable<typeof options.jump> = options.jump;
    const feet: IAutoMovieMotionHumanRide.IParams["feet"] = context.params.feet;
    if (
      feet?.left === undefined ||
      feet.right === undefined ||
      feet.left === feet.right ||
      !context.entry.feet.left.planted ||
      !context.entry.feet.right.planted ||
      context.params.rising !== undefined
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "equestrian.jump",
        value: options.jump,
        feasible: null,
        reason:
          "the jump needs both feet on distinct stirrups and no rising trot",
        fix: "enter sitting on the saddle with both feet supported, and name both stirrup points",
      });
    jump = [
      instant(context, approach, "equestrian.jump.approach"),
      instant(context, takeoff, "equestrian.jump.takeoff"),
      instant(context, landing, "equestrian.jump.landing"),
      instant(context, recovery, "equestrian.jump.recovery"),
    ];
    if (!(jump[0] < jump[1] && jump[1] < jump[2] && jump[2] < jump[3]))
      refuse(
        "equestrian.jump",
        options.jump,
        "the jumping cues do not give a positive approach, flight and recovery",
        "place approach, takeoff, landing and recovery in that order",
      );
  }

  let look: ILook | undefined;
  if (options.lookBack !== undefined) {
    const peak: number = instant(
      context,
      options.lookBack.cue,
      "equestrian.lookBack.cue",
    );
    const length: number = options.lookBack.duration;
    HumanBound.above("equestrian.lookBack.duration", length, 0, "s");
    const half: number = length / 2;
    if (!(half > 0 && peak - half >= 0 && peak + half <= seconds))
      refuse(
        "equestrian.lookBack.duration",
        length,
        "the turn and return do not fit inside the ride about the film cue",
        "shorten the turn or place its cue within the ride",
      );
    look = { peak, half, direction: options.lookBack.side === "left" ? 1 : -1 };
  }

  const fade: number = Math.min(0.2, seconds / 2);
  const length: number = context.body.measure.thigh;
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(origin.rotation),
    Vector3.subtract(saddle, origin.position),
  );
  const ranges: ReadonlyMap<
    AutoMovieHumanoidBone,
    ReturnType<typeof AutoMovieEngineKinematics.getConstraint>
  > = new Map(
    BONES.map(
      (bone: (typeof BONES)[number]) =>
        [
          bone,
          AutoMovieEngineKinematics.getConstraint(
            bone,
            readHumanBone(context.body, bone)?.constraint ?? null,
          ),
        ] as const,
    ),
  );
  return {
    ...(jump === undefined ? {} : { offSeat: [jump[0], jump[3]] as const }),
    at: (
      at: number,
      posture: IAutoMovieMotionHumanPosture,
      carrier: IAutoMovieRigidTransform,
      seatDrift: IAutoMovieVector3,
      up: IAutoMovieVector3,
    ): void => {
      const stride: IStrideWindow | undefined = strideAt(strides, at);
      const gait: number =
        stride === undefined
          ? 0
          : humanEquestrianRhythm.phase(stride.times, at);
      const active: number =
        gait === 0 || fade === 0
          ? 0
          : minimumJerk.share(Math.min(1, at / fade)) *
            minimumJerk.share(Math.min(1, (seconds - at) / fade));
      const {
        pitch,
        roll,
        rise,
        airborne,
        turn,
      }: humanEquestrianRhythm.IResponse = humanEquestrianRhythm({
        at,
        active,
        ...(stride === undefined
          ? {}
          : {
              stride: {
                gait: stride.gait,
                ...(stride.lead === undefined ? {} : { lead: stride.lead }),
                phase: gait,
              },
            }),
        ...(jump === undefined ? {} : { jump }),
        ...(look === undefined ? {} : { look }),
      });
      if (gait === 0 && rise === 0 && turn === 0) return;
      if (pitch !== 0 || roll !== 0 || rise !== 0) {
        const original: IAutoMovieQuaternion = humanPostureHeading(posture);
        posture.pitch = (posture.pitch ?? 0) + pitch + 6 * rise;
        posture.roll = (posture.roll ?? 0) + roll;
        const tilt: IAutoMovieQuaternion = Quaternion.multiply(
          humanPostureHeading(posture),
          Quaternion.inverse(original),
        );
        const seat: IAutoMovieVector3 = Vector3.add(
          Vector3.add(carrier.position, seatDrift),
          Quaternion.rotateVector(carrier.rotation, offset),
        );
        posture.root = Vector3.add(
          Vector3.add(
            seat,
            Quaternion.rotateVector(tilt, Vector3.subtract(posture.root, seat)),
          ),
          Vector3.scale(up, 0.12 * length * rise),
        );
      }

      // Share the response across separately limited joints. For the film cue the shoulders and head turn to the same side.
      posture.joints = { ...posture.joints };
      const joints: readonly (readonly [
        AutoMovieHumanoidBone,
        number,
        number,
        number,
      ])[] = [
        ["spine", -0.65 * pitch + 11 * rise + 3 * airborne, -0.4 * roll, 0.45],
        ["chest", -0.23 * pitch + 8 * rise + 2 * airborne, -0.3 * roll, 0.45],
        ["neck", -0.1 * pitch - 8 * rise, -0.15 * roll, 0.85],
        ["head", -0.08 * pitch - 5 * rise, -0.15 * roll, 0.9],
      ];
      for (const [bone, flex, bend, share] of joints) {
        const limits: ReturnType<typeof AutoMovieEngineKinematics.getConstraint> | undefined =
          ranges.get(bone);
        const before: readonly [number, number, number] = posture.joints[
          bone
        ] ?? [0, 0, 0];
        const end: number | undefined =
          look?.direction === 1 ? limits?.twist?.max : limits?.twist?.min;
        posture.joints[bone] = [
          bounded(before[0], flex, limits?.flexion),
          bounded(before[1], bend, limits?.abduction),
          end === undefined
            ? before[2]
            : before[2] + share * turn * (end - before[2]),
        ];
      }
    },
  };
}
/** The record of `ITimesCue`'s site. */
type ITimesCue = { seconds: number };

/** Read unique, finite local seconds once from an authored cue track. */
function times(context: Context, id: string): readonly number[] {
  return [
    ...new Set(
      context
        .cue(id)
        .map((cue: ITimesCue): number => cue.seconds - context.start),
    ),
  ].sort((a: number, b: number): number => a - b);
}

/** The single cue event inside this ride. */
function instant(context: Context, id: string, axis: string): number {
  const active: readonly number[] = times(context, id).filter(
    (at: number): boolean => at >= 0 && at <= context.params.duration,
  );
  if (active.length !== 1)
    refuse(
      axis,
      id,
      `the track has ${active.length} distinct instants in this ride`,
      "provide one instant in the ride",
    );
  return active[0]!;
}

/** One response and its independently sampled actual hoof clock. */
interface IStrideWindow extends IAutoMovieMotionHumanRide.IEquestrianStride {
  /** The track's distinct touchdowns, ride-local seconds in increasing order. */
  times: readonly number[];
}

/** Admit ordered stride windows that can share one endpoint without overlap. */
function strideWindows(
  context: Context,
  input: IAutoMovieMotionHumanRide.EquestrianStrides | undefined,
  seconds: number,
): readonly IStrideWindow[] {
  if (input === undefined) return [];
  const entries: readonly IAutoMovieMotionHumanRide.IEquestrianStride[] =
    "cue" in input ? [input] : input;
  if (entries.length === 0)
    refuse(
      "equestrian.stride",
      input,
      "the stride sequence is empty",
      "supply at least one actual touchdown track",
    );
  const result: IStrideWindow[] = entries
    .map(
      (entry: IAutoMovieMotionHumanRide.IEquestrianStride): IStrideWindow => {
        const track: readonly number[] = times(context, entry.cue);
        if (
          !(
            track.length >= 2 &&
            track[0]! < seconds &&
            track[track.length - 1]! > 0
          )
        )
          refuse(
            "equestrian.stride.cue",
            entry.cue,
            "no consecutive touchdowns enclose any part of the ride",
            "provide successive touchdowns from the same hoof or diagonal",
          );
        return { ...entry, times: track };
      },
    )
    .sort(
      (left: IStrideWindow, right: IStrideWindow): number =>
        left.times[0]! - right.times[0]!,
    );
  for (let index: number = 1; index < result.length; index++) {
    const previous: IStrideWindow = result[index - 1]!;
    const current: IStrideWindow = result[index]!;
    if (current.times[0]! < previous.times[previous.times.length - 1]!)
      refuse(
        "equestrian.stride",
        current.cue,
        "actual touchdown windows overlap",
        "end the first hoof track before starting the next gait or lead track",
      );
  }
  return result;
}

/**
 * Locate the last begun cue track. Its phase reader owns the endpoint and gap
 * semantics.
 */
function strideAt(
  strides: readonly IStrideWindow[],
  at: number,
): IStrideWindow | undefined {
  let low: number = 0;
  let high: number = strides.length;
  while (low < high) {
    const middle: number = low + Math.floor((high - low) / 2);
    if (strides[middle]!.times[0]! <= at) low = middle + 1;
    else high = middle;
  }
  return strides[low - 1];
}

/** The record of `IBoundedLimits`'s site. */
type IBoundedLimits = { min: number; max: number };

/**
 * Add a joint offset within the body's angle range. A missing degree of freedom
 * stays untouched.
 */
function bounded(
  start: number,
  delta: number,
  limits: IBoundedLimits | null | undefined,
): number {
  return limits === null || limits === undefined || delta === 0
    ? start
    : Math.max(limits.min, Math.min(limits.max, start + delta));
}

/** Report a timeline that cannot be sampled as authored. */
function refuse(
  axis: string,
  value: unknown,
  reason: string,
  fix: string,
): never {
  throw new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    feasible: null,
    reason,
    fix,
  });
}
