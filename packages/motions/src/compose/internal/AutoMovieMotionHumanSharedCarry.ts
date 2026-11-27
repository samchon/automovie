import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSharedCarry,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmPlayed } from "./AutoMovieMotionHumanArmPlayed";

/**
 * Prepare the steady shared carry in CORE4D (Liu et al. 2024, §3.4 and appendix
 * D.1, https://arxiv.org/abs/2406.19353). Two distinct hands keep their own
 * contacts during one authored rigid-object motion. The prop's path drives both
 * arms; stance, travel and the entry/exit poses are authored. A model may
 * explicitly declare rigid geometry even if its adapter exposes a pose reader.
 * Both grips cover the entire interval. Independent arm planning does not
 * certify clearance between performers or with the environment.
 *
 * @param input The prop, the carriers and their common film interval.
 * @returns The tracked prop and two prepared posture readers, in carrier order.
 * @throws {RangeError} For invalid times, conflicting prop ownership, missing
 *   or coincident sites, or a prop or hand starting outside its grip bounds.
 * @throws {HumanRefusal} If the existing arm planner cannot meet either
 *   carrier's grip.
 */
export function AutoMovieMotionHumanSharedCarry(
  input: IAutoMovieMotionHumanSharedCarry.IInput,
): IAutoMovieMotionHumanSharedCarry.IPrepared {
  const {
    prop,
    carriers: [first, second],
    from,
    to,
  }: IAutoMovieMotionHumanSharedCarry.IInput = input;
  const duration: number = to - from;
  if (
    !(from >= 0) ||
    !(duration > 0 && duration <= MAX_DURATION)
  )
    throw new RangeError(
      `Shared carry needs a film interval from 0 to ${MAX_DURATION} s in length, excluding zero.`,
    );
  if (
    prop.fixed === true ||
    prop.worn !== undefined ||
    prop.mounted !== undefined ||
    prop.motion !== undefined ||
    prop.point !== undefined ||
    prop.soft !== undefined ||
    (prop.hasArticulations ?? prop.articulate !== undefined) ||
    (prop.tracks?.length ?? 0) > 0
  )
    throw new RangeError(
      `Shared carry needs an available rigid prop: ${prop.subject}.`,
    );
  const firstPoint: IAutoMovieVector3 | undefined =
    prop.points[first.site]?.point;
  const secondPoint: IAutoMovieVector3 | undefined =
    prop.points[second.site]?.point;
  if (
    first.performer.subject === second.performer.subject ||
    firstPoint === undefined ||
    secondPoint === undefined ||
    !(Vector3.length(Vector3.subtract(firstPoint, secondPoint)) > 0)
  )
    throw new RangeError(
      "Shared carry needs distinct performers and distinct authored grip points.",
    );

  const path: IAutoMovieMotionHumanSharedCarry.IInput["path"] = input.path;
  const start: IAutoMovieRigidTransform = path(from);
  if (
    !(
      Vector3.length(Vector3.subtract(prop.frame.position, start.position)) <=
      1e-9
    ) ||
    !(Quaternion.angle(prop.frame.rotation, start.rotation) <= 1e-9)
  )
    throw new RangeError(
      `Shared carry must start at the authored frame of ${prop.subject}.`,
    );
  const end: IAutoMovieRigidTransform = path(to);
  const motion: NonNullable<IAutoMovieMotionHumanProp["motion"]> = (
    seconds: number,
  ): IAutoMovieRigidTransform =>
    seconds <= from ? start : seconds >= to ? end : path(seconds);
  return {
    prop: { ...prop, motion },
    postures: [
      prepareCarrier(first, firstPoint, from, to, motion),
      prepareCarrier(second, secondPoint, from, to, motion),
    ],
  };
}

/**
 * Prepare a single arm on the shared path, then write its solved joints over
 * the supplied base.
 */
function prepareCarrier(
  carrier: IAutoMovieMotionHumanSharedCarry.ICarrier,
  point: IAutoMovieVector3,
  from: number,
  to: number,
  motion: NonNullable<IAutoMovieMotionHumanProp["motion"]>,
): IAutoMovieMotionHumanSharedCarry.ICarrier["posture"] {
  const {
    side,
    performer: { body },
    posture,
    rotation,
  }: IAutoMovieMotionHumanSharedCarry.ICarrier = carrier;
  const duration: number = to - from;
  const filmSecond = (seconds: number): number =>
    seconds <= 0
      ? from
      : seconds >= duration
        ? to
        : Math.min(to, from + seconds);
  const bounds: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: 0,
    relax: duration,
    end: duration,
  };
  const initialRoot: IAutoMovieMotionHumanPosture = posture(from);
  const initial: IAutoMoviePose = resolveHumanPosture(body, initialRoot);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    initial,
  );
  const rest: IAutoMovieMotionHumanArmAngles.IAngles =
    AutoMovieMotionHumanArmAngles.angles(initial, side);
  const elbow: IAutoMovieVector3 = Vector3.subtract(
    bones.get(`${side}LowerArm`)!.worldPosition,
    initialRoot.root,
  );
  const socket: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
    body,
    side,
    "grip",
  );
  const contact: IAutoMovieVector3 = socket.point;
  const tolerance: number = AutoMovieMotionHumanAuditSkin.BUILT;

  // The socket and two off-socket probes bound both translation and hand turn.
  const probes: readonly IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    Vector3.add(
      contact,
      Vector3.scale(socket.forward, Vector3.length(contact)),
    ),
  ];
  const limits: IAutoMovieHumanEffectorPointLimit[] = probes.map(
    (probe: IAutoMovieVector3): IAutoMovieHumanEffectorPointLimit => ({
      contact: probe,
      bound: tolerance,
    }),
  );
  const goal = (
    base: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieHumanLimbGoal => {
    const frame: IAutoMovieRigidTransform = motion(filmSecond(seconds));
    const hand: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      rotation,
    );
    const site: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, point),
    );
    return {
      bend: Vector3.add(base.root, elbow),
      point: Vector3.subtract(site, Quaternion.rotateVector(hand, contact)),
      rotation: hand,
      contact,
      limits,
    };
  };

  // The arm planner fixes its first configuration to the supplied entry.
  const entry: IAutoMovieHumanLimbGoal = goal(initialRoot, 0);
  const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  for (const probe of [contact, ...probes]) {
    const observed: IAutoMovieVector3 = Vector3.add(
      wrist.worldPosition,
      Quaternion.rotateVector(wrist.worldRotation, probe),
    );
    const expected: IAutoMovieVector3 = Vector3.add(
      entry.point,
      Quaternion.rotateVector(entry.rotation!, probe),
    );
    if (!(Vector3.length(Vector3.subtract(observed, expected)) <= tolerance))
      throw new RangeError(
        `${carrier.performer.subject} must already grip ${carrier.site} at the shared carry's start.`,
      );
  }

  const arm: IAutoMovieMotionHumanArmTrajectory.Played =
    AutoMovieMotionHumanArmPlanned.planned(
      body,
      bounds,
      [
        {
          side,
          rest,
          weight: (): number => 1,
          goal,
          disc: tolerance,
        },
      ],
      (seconds: number): IAutoMovieMotionHumanPosture =>
        posture(filmSecond(seconds)),
    ).get(side)!;

  return (seconds: number): IAutoMovieMotionHumanPosture => {
    if (!(seconds >= from && seconds <= to))
      throw new RangeError(
        `Shared carry posture is only available from ${from} to ${to} s.`,
      );
    // The planned arm, its hand's fingers as the plan plays them
    // (`AutoMovieMotionHumanArmPlayed.written`).
    const on: IAutoMovieMotionHumanArmTrajectory.IPlayed = arm(seconds - from);
    return AutoMovieMotionHumanArmPlayed.written(
      posture(seconds),
      side,
      on,
      on.digits,
    );
  };
}

/**
 * Draft planning budget, in seconds, limiting each arm to five seconds of
 * trajectory refinement.
 */
const MAX_DURATION: number = 5;
