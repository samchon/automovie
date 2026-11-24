import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBikeTransfer,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seated } from "../everyday/seated";
import { sit } from "../everyday/sit";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanObject } from "../perform/HumanObject";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountOff } from "./HumanMountOff";

/** Contact tolerance in metres for the stage's floor. */
const FLOOR: number = 0.01;

/**
 * Frame comparison tolerance during the stopped transfer, in metres or
 * unit-vector length.
 */
const STILL: number = 1e-6;

/** Number of intervals over which the authored stationary segment is probed. */
const INTERVALS: number = 8;

/** The selected bicycle's pedal sides. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** Two independent axes exposed by the bicycle's rigid frame. */
const AXES: readonly IAutoMovieVector3[] = [
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
];

/**
 * Enter or leave the same stopped bicycle at a race boundary, using the
 * high-seat transfer and its displayed floor contacts. World Triathlon
 * Competition Rules §7.1(h,j) require a complete ground foot contact past the
 * mount line and short of the dismount line. This law checks the sole geometry
 * against a plane in the course frame and emits that event. See
 * https://www.triathlonmanitoba.ca/wp-content/uploads/World-Triathlon_Competition-Rules_20260429.pdf
 * .
 *
 * The scenic bicycle is authored independently while stopped or wheeled. Rack
 * and helmet choreography are separate equipment actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the legal line, floor contact and stopped bicycle assumptions.
 */
function planHumanBikeTransfer(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBikeTransfer>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params, start }: typeof context = context;
  const { line, mode, on }: typeof params = params;
  const mount: boolean = mode === "mount";
  if (![line.x, line.z, line.heading].every(Number.isFinite))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "line",
      value: line,
      feasible: null,
      reason: "the transition line needs a finite location and heading",
      fix: "place the line in world metres and give its course heading in degrees",
    });

  const seatedOnBicycle: boolean = entry.supports.some(
    (support): boolean =>
      support.part === "seat" &&
      support.support.kind === "prop" &&
      support.support.subject === on,
  );
  if (
    mount
      ? entry.base.kind !== "standing"
      : entry.base.kind !== "seated" || !seatedOnBicycle
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entry.base.kind,
      feasible: {
        kind: "alternatives",
        values: [mount ? "standing" : "seated"],
      },
      reason: mount
        ? "the stop mount starts on the ground"
        : "the dismount starts seated on the named bicycle",
      fix: mount
        ? "stop beside the bicycle with a full floor plant"
        : "ride the same bicycle to a stop first",
    });

  const bicycle: ReturnType<typeof context.prop> = context.prop(on);
  const stopped: IAutoMovieRigidTransform = bicycle.frame(start);
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    { affordances: bicycle.prop.affordances ?? [] },
    stopped,
    "saddle",
  );
  const pedals: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
  for (const side of SIDES) {
    const point: IAutoMovieVector3 | undefined = bicycle.prop.point?.(
      `${side}Pedal`,
      start,
    )?.point;
    if (point !== undefined) pedals[side] = point;
  }
  if (pedals.left === undefined || pedals.right === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "on",
      value: on,
      feasible: null,
      reason: "the bicycle lacks both live pedal contacts",
      fix: "bind the saddle and both posed pedals of the same bicycle",
    });
  const socket: IAutoMovieVector3 = seated.socket(body, entry.posture);
  const plan: IAutoMovieMotionHumanActionPlan = mount
    ? sit.plan({
        ...context,
        params: { seat: { ...seat, footrests: pedals } },
      })
    : HumanMountOff.plan(
        { ...context, params: {} },
        socket,
        socket.y / seated.popliteal(body),
      );

  for (let index: number = 1; index <= INTERVALS; ++index) {
    const film: number = start + (plan.duration * index) / INTERVALS;
    const frame: IAutoMovieRigidTransform = bicycle.frame(film);
    if (
      Vector3.length(Vector3.subtract(frame.position, stopped.position)) <=
        STILL &&
      AXES.every(
        (axis: IAutoMovieVector3): boolean =>
          Vector3.length(
            Vector3.subtract(
              Quaternion.rotateVector(frame.rotation, axis),
              Quaternion.rotateVector(stopped.rotation, axis),
            ),
          ) <= STILL,
      ) &&
      SIDES.every((side: AutoMovieHumanSide): boolean => {
        const now: IAutoMovieVector3 | undefined = bicycle.prop.point?.(
          `${side}Pedal`,
          film,
        )?.point;
        return (
          now !== undefined &&
          Vector3.length(Vector3.subtract(now, pedals[side]!)) <= STILL
        );
      })
    )
      continue;
    throw new HumanRefusal({
      kind: "affordance",
      axis: "on",
      value: film,
      feasible: null,
      reason: "the bicycle or pedals move during the stopped transfer",
      fix: "hold the frame and crank at the boundary for the whole mount or dismount",
    });
  }

  const onward: IAutoMovieVector3 = Quaternion.rotateVector(
    HumanFrame.turn(line.heading),
    { x: 0, y: 0, z: 1 },
  );
  const origin: IAutoMovieVector3 = { x: line.x, y: 0, z: line.z };
  /**
   * Whether an entire displayed sole is on the floor on the required side
   * of the line.
   */
  const qualifies = (
    side: AutoMovieHumanSide,
    bone: IAutoMovieResolvedBone,
  ): boolean =>
    HumanFoot.sole(body, side, {
      ankle: bone.worldPosition,
      rotation: bone.worldRotation,
    }).every(
      (point: IAutoMovieVector3): boolean =>
        Math.abs(point.y) <= FLOOR &&
        (mount ? 1 : -1) *
          Vector3.dot(Vector3.subtract(point, origin), onward) >
          0,
    );
  const entryBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, entry.pose);
  const plants: number[] = [];
  for (const side of SIDES) {
    const part: `${typeof side}Foot` = `${side}Foot`;
    if (mount) {
      if (
        entry.feet[side].planted &&
        !entry.supports.some(
          (support): boolean =>
            support.part === part && support.support.kind !== "ground",
        ) &&
        qualifies(side, entryBones.get(part)!)
      )
        plants.push(0);
      continue;
    }

    const landing: IAutoMovieMotionHumanContactWindow | undefined =
      plan.contacts.find(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === part &&
          window.kind === "plant" &&
          window.support.kind === "ground" &&
          window.to === 1,
      );
    if (landing === undefined) continue;
    const achieved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture(body, plan.posture(landing.from * plan.duration)),
      );
    if (qualifies(side, achieved.get(part)!)) plants.push(landing.from);
  }
  const plant: number = Math.min(...plants);
  if (!Number.isFinite(plant))
    throw new HumanRefusal({
      kind: "rule",
      axis: "line",
      value: line,
      feasible: null,
      reason: mount
        ? "no full grounded sole is beyond the mount line"
        : "no full landing sole is before the dismount line",
      fix: "adjust the stopping point so a whole foot lands on the required side of the line",
    });

  return {
    ...plan,
    events: [
      ...plan.events,
      {
        name: mount ? "mountLinePlant" : "dismountLinePlant",
        share: plant,
      },
    ].sort((a, b): number => a.share - b.share),
    contacts: plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        window.part === "seat" ||
        ((window.part === "leftFoot" || window.part === "rightFoot") &&
          (mount ? window.to === 1 : window.from === 0))
          ? { ...window, support: { kind: "prop", subject: on } }
          : window,
    ),
  };
}

/**
 * Enter or leave the same stopped bicycle at a race boundary, using the
 * high-seat transfer and its displayed floor contacts. World Triathlon
 * Competition Rules §7.1(h,j) require a complete ground foot contact past the
 * mount line and short of the dismount line. This law checks the sole geometry
 * against a plane in the course frame and emits that event. See
 * https://www.triathlonmanitoba.ca/wp-content/uploads/World-Triathlon_Competition-Rules_20260429.pdf
 * .
 *
 * The scenic bicycle is authored independently while stopped or wheeled. Rack
 * and helmet choreography are separate equipment actions.
 */
export const HumanBikeTransfer: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBikeTransfer> =
  {
    name: "bikeTransfer",
    interrupts: {},
    yields: [],
    plan: planHumanBikeTransfer,
  };
