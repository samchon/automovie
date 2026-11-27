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

import { seated } from "../../everyday/internal/seated";
import { sit } from "../../everyday/internal/sit";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { AutoMovieMotionHumanObject } from "../../perform/AutoMovieMotionHumanObject";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountOff } from "./HumanMountOff";
import { humanBikeTransferLine } from "./humanBikeTransferLine";
import { HumanBikeTransferData } from "./HumanBikeTransferData";

/*
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

/*
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
function planHumanBikeTransfer(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBikeTransfer>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params, start }: typeof context = context;
  const { line, mode, on }: typeof params = params;
  const mount: boolean = mode === "mount";

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
    throw new AutoMovieMotionHumanRefusal({
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
  const seat: ReturnType<typeof AutoMovieMotionHumanObject.seat> = AutoMovieMotionHumanObject.seat(
    { affordances: bicycle.prop.affordances ?? [] },
    stopped,
    "saddle",
  );
  const pedals: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
  for (const side of HumanBikeTransferData.SIDES) {
    const point: IAutoMovieVector3 | undefined = bicycle.prop.point?.(
      `${side}Pedal`,
      start,
    )?.point;
    if (point !== undefined) pedals[side] = point;
  }
  if (pedals.left === undefined || pedals.right === undefined)
    throw new AutoMovieMotionHumanRefusal({
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

  for (let index: number = 1; index <= HumanBikeTransferData.INTERVALS; ++index) {
    const film: number = start + (plan.duration * index) / HumanBikeTransferData.INTERVALS;
    const frame: IAutoMovieRigidTransform = bicycle.frame(film);
    const now: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
    for (const side of HumanBikeTransferData.SIDES) {
      const point: IAutoMovieVector3 | undefined = bicycle.prop.point?.(
        `${side}Pedal`,
        film,
      )?.point;
      if (point !== undefined) now[side] = point;
    }
    if (
      humanBikeTransferLine.still(
        stopped,
        frame,
        { left: pedals.left, right: pedals.right },
        now,
      )
    )
      continue;
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "on",
      value: film,
      feasible: null,
      reason: "the bicycle or pedals move during the stopped transfer",
      fix: "hold the frame and crank at the boundary for the whole mount or dismount",
    });
  }

  const beyond: (sole: readonly IAutoMovieVector3[]) => boolean =
    humanBikeTransferLine(line, mount);
  /*
   * Whether an entire displayed sole is on the floor on the required side of
   * the line.
   */
  const qualifies = (
    side: AutoMovieHumanSide,
    bone: IAutoMovieResolvedBone,
  ): boolean =>
    beyond(
      HumanFoot.sole(body, side, {
        ankle: bone.worldPosition,
        rotation: bone.worldRotation,
      }),
    );
  const entryBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, entry.pose);
  const plants: number[] = [];
  for (const side of HumanBikeTransferData.SIDES) {
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
  if (plant === Infinity)
    throw new AutoMovieMotionHumanRefusal({
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
