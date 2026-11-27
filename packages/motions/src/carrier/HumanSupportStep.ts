import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../gait/internal/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountPush } from "../lexicon/HumanMountPush";
import { hipJoints } from "../posture/internal/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { HumanSupportCarry } from "./HumanSupportCarry";
import { HumanSupportFrame } from "./HumanSupportFrame";
import { HumanSupportStepPlants } from "./HumanSupportStepPlants";

type Params = IAutoMovieMotionHumanSurface.ISupportStepParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;
type Window = IAutoMovieMotionHumanContactWindow;

/** The two feet. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** Goals carried by either the individual foot's support or by the body. */
const LIMBS: readonly AutoMovieHumanLimb[] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/** One plant of a foot and the support it bears on. */
type IPlant = HumanSupportStepPlants.IPlant;

/** A plant keyed by its planned window. */
type WindowPlant = [Window, IPlant];

/**
 * Seconds over which a foot's share of the body eases from its plant into its
 * swing (provisional staging).
 */
const EASE: number = 0.1;

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * A vertical translation of a plan.
 *
 * @param dy The rise, metres.
 * @returns The carry.
 */
function translate(dy: number): IAutoMovieMotionHumanSupportCarry.ICarry {
  return {
    point: (p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p, y: p.y + dy }),
    turn: { x: 0, y: 0, z: 0, w: 1 },
    yaw: 0,
  };
}

/**
 * Step from one support to another, either of which may move: from a fixed
 * landing onto an escalator tread or a walkway band, or off it onto the
 * landing. The walk (`walk`) is planned on the support left as it stood at the
 * step's start, at the height the entry's soles bear on and with the entry's
 * speed taken against that support's, and that support carries it. Each new
 * footprint bears on the support whose surface holds the foot where it lands,
 * and the entry's footprints on the support left; a new footprint is slid along
 * the surface, the least it takes, to lie wholly on the moving support that
 * bears it or wholly off the one beside it, so no foot straddles an edge, along
 * its own length where it crosses the edge head-on so it keeps its lane, and
 * one on a fixed landing bears at the height it stands at. A footprint on the
 * support arrived on is the point of it that the support brings to its aimed
 * place as the last foot lands: the foot meets it where it is at touchdown and
 * it carries the foot from then on, so the foot never slides on the moving
 * surface. A swinging foot moves on a minimum-jerk blend of the supports of the
 * plants it leaves and lands on, its toes turned down rather than its ankle
 * bent past a weightless ankle's reach (`HumanMountPush.tip`), and the pelvis
 * on the feet that bear it, easing between them; a support that turns about the
 * vertical turns the feet it bears and the body with them. The walk aims where
 * the arrival point will be when the last foot lands, so the rider compensates
 * for the supports' travel.
 *
 * @param context The standing entry, the arrival point and the two supports.
 * @returns The walk with each foot and the pelvis carried by its support.
 * @throws {HumanRefusal} When the walk refuses its path, or on `to` when the
 *   arrival lies a step above or below the floor the step leaves.
 */
export function HumanSupportStep(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const { to, from, onto }: Params = context.params;

  /** Resolve the current displayed material frame when the plant named one. */
  const frame = (
    prop: string,
    at: number,
    site?: string,
  ): IAutoMovieRigidTransform => {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(prop);
    const seconds: number = context.start + at;
    return (
      (site === undefined ? undefined : reader.site?.(site, seconds)) ??
      reader.frame(seconds)
    );
  };

  // A point moved by a support's motion between two seconds of the step;
  // the ground keeps it.
  const moved = (
    prop: string | undefined,
    begin: number,
    end: number,
    point: IAutoMovieVector3,
    site?: string,
  ): IAutoMovieVector3 => {
    if (prop === undefined || begin === end) return point;
    const a: IAutoMovieRigidTransform = frame(prop, begin, site);
    const b: IAutoMovieRigidTransform = frame(prop, end, site);
    return Vector3.add(
      b.position,
      Quaternion.rotateVector(
        b.rotation,
        Quaternion.rotateVector(
          Quaternion.inverse(a.rotation),
          Vector3.subtract(point, a.position),
        ),
      ),
    );
  };

  // The floor gait is planned at the height the entry stands at, lowered
  // to the floor and raised back. Off the ground that is an ankle's height
  // under the entry's standing ankles, where the walk's own stance puts
  // its floor; on the ground it is the ground's declared height, its 0 when
  // none is declared.
  const standing: number =
    (context.entry.feet.left.ankle.y + context.entry.feet.right.ankle.y) / 2 -
    context.body.measure.ankleHeight;
  const ground: IAutoMovieMotionHumanContactWindow.Support =
    HumanSupportFrame.contact(context, "leftFoot");
  const level: number =
    ground.kind === "ground" &&
    Math.abs(standing - (ground.height ?? 0)) < context.body.measure.ankleHeight
      ? (ground.height ?? 0)
      : standing;
  // A support step is level: an arrival above or below the floor the walk
  // leaves by more than a tread's thickness is a step up or down, the
  // swing clearing the edge and landing at the surface's height, which a
  // one-tread climb plans (`climbStairs`).
  HumanSupportStep.admitRise(to.y - level, onto);
  const lower: IAutoMovieMotionHumanSupportCarry.ICarry = translate(-level);
  const raise: IAutoMovieMotionHumanSupportCarry.ICarry = translate(level);
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  // The walk is planned on the support left, so the entry's speed is read
  // against it: a rider standing on a moving tread is at rest on it, and a
  // walk handed the tread's own speed would start as if already walking,
  // its first swing sweeping the toe along the tread.
  const carried: IAutoMovieVector3 =
    from === undefined
      ? { x: 0, y: 0, z: 0 }
      : HumanSupportFrame.at(context, context.start, {
          kind: "prop",
          subject: from,
        }).velocity;
  const lowered: IAutoMovieMotionHumanEntryState = {
    ...entry,
    velocity: {
      ...entry.velocity,
      linear: Vector3.subtract(entry.velocity.linear, carried),
    },
    posture: HumanSupportCarry.posture(lower, entry.posture),
    pose:
      entry.pose.root === undefined || entry.pose.root === null
        ? entry.pose
        : {
            ...entry.pose,
            root: {
              ...entry.pose.root,
              translation: lower.point(entry.pose.root.translation),
            },
          },
    feet: {
      left: { ...entry.feet.left, ankle: lower.point(entry.feet.left.ankle) },
      right: {
        ...entry.feet.right,
        ankle: lower.point(entry.feet.right.ankle),
      },
    },
  };
  const planned = (target: IAutoMovieVector3): Plan => {
    const floor: Plan = walk.plan({
      ...context,
      params: { to: lower.point(target) },
      entry: lowered,
    });
    return {
      ...floor,
      posture: (...args: Parameters<Plan["posture"]>): Posture =>
        HumanSupportCarry.posture(raise, floor.posture(...args)),
    };
  };
  const touchdowns = (plan: Plan): number =>
    Math.max(
      0,
      ...plan.contacts
        .filter((window: Window): boolean => window.kind === "plant")
        .map((window: Window): number => window.from * plan.duration),
    );

  // How far the entry's soles sit from the declared surface they stand on,
  // which the feet keep when they arrive on a fixed landing.
  const feet: IAutoMovieVector3 = Vector3.lerp(
    context.entry.feet.left.ankle,
    context.entry.feet.right.ankle,
    0.5,
  );
  const settled: number =
    from === undefined
      ? 0
      : level -
        (HumanSupportStepPlants.surfaces(context, from, 0).find(
          (s: HumanSupportStepPlants.ISurface): boolean =>
            HumanSupportStepPlants.holds(s, { ...feet, y: level }),
        )?.origin.y ?? level);
  // Each foot's plants and the support each bears on
  // (`HumanSupportStepPlants.assign`).
  const step: HumanSupportStepPlants.IStep = {
    context,
    moved,
    level,
    settled,
  };
  const assign = (
    walked: Plan,
    land: number,
    leave: number,
  ): Record<AutoMovieHumanSide, IPlant[]> =>
    HumanSupportStepPlants.assign(step, walked, land, leave);
  // The first touchdown on the support arrived on: from then the feet that
  // follow are placed in the world as the support left stood at that
  // second, so the strides off it keep their planned lengths.
  const arriving = (
    plants: Record<AutoMovieHumanSide, IPlant[]>,
    land: number,
  ): number =>
    Math.min(
      land,
      ...SIDES.flatMap((side: AutoMovieHumanSide): number[] =>
        plants[side]
          .filter((plant: IPlant): boolean => plant.arrived)
          .map((plant: IPlant): number => plant.down),
      ),
    );

  // Aim where the arrival point will be when the last foot lands, in the
  // frame of the support left as it stood when the first foot left it.
  let walked: Plan = planned(to);
  let land: number = touchdowns(walked);
  let leave: number = land;
  let plants: Record<AutoMovieHumanSide, IPlant[]> = assign(
    walked,
    land,
    leave,
  );
  for (let pass: number = 0; pass < 2; ++pass) {
    leave = arriving(plants, land);
    walked = planned(moved(from, leave, 0, moved(onto, 0, land, to)));
    land = touchdowns(walked);
    plants = assign(walked, land, leave);
  }
  const duration: number = walked.duration;
  // Where a planned point is at a second while a plant bears it: on the
  // support left, carried by it from the start; on the support arrived on,
  // its place as the support left stood when the first foot left it, the
  // point the support arrived on brings there as the last foot lands:
  // where it is at touchdown until then, carried by it after.
  const borne = (
    plant: IPlant,
    at: number,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const shifted: IAutoMovieVector3 = Vector3.add(point, plant.shift);
    if (plant.site !== undefined) {
      // Meet the deck at touchdown, then travel in that material frame.
      const touchdown: IAutoMovieVector3 = plant.arrived
        ? moved(onto, land, plant.down, moved(from, 0, leave, shifted))
        : moved(from, 0, plant.down, shifted);
      return moved(
        plant.arrived ? onto : from,
        plant.down,
        plant.arrived ? Math.max(at, plant.down) : at,
        touchdown,
        plant.site,
      );
    }
    return plant.arrived
      ? moved(
          onto,
          land,
          Math.max(at, plant.down),
          moved(from, 0, leave, shifted),
        )
      : moved(from, 0, at, shifted);
  };

  // One foot's carry at a second: its plant's, or between two plants a
  // minimum-jerk blend from the one it leaves to the one it lands on.
  const carry = (
    side: AutoMovieHumanSide,
    at: number,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const list: IPlant[] = plants[side];
    if (list.length === 0) return moved(from, 0, at, point);
    const share: number = at / duration;
    for (let k: number = 0; k < list.length; ++k) {
      const plant: IPlant = list[k]!;
      if (share < plant.window.from) {
        if (k === 0) return borne(plant, at, point);
        const before: IPlant = list[k - 1]!;
        const weight: number = AutoMovieEngineMotionSampling.minimumJerkShare(
          (share - before.window.to) / (plant.window.from - before.window.to),
        );
        return Vector3.lerp(
          borne(before, at, point),
          borne(plant, at, point),
          weight,
        );
      }
      if (share <= plant.window.to) return borne(plant, at, point);
    }
    return borne(list[list.length - 1]!, at, point);
  };
  // How much a foot bears at a second: fully in a plant, easing to nothing
  // over `EASE` seconds from its plant's edges as it swings.
  const bearing = (side: AutoMovieHumanSide, at: number): number => {
    let nearest: number = Infinity;
    for (const plant of plants[side]) {
      const from: number = plant.window.from * duration;
      const to: number = plant.window.to * duration;
      if (at >= from && at <= to) return 1;
      nearest = Math.min(nearest, Math.abs(at - from), Math.abs(at - to));
    }
    return Math.max(0, 1 - nearest / EASE);
  };
  // The body goes with the feet that bear it: the stance foot's support in
  // single support, both shares in double support, so a stance leg is never
  // stretched by the other foot's support moving.
  const body = (at: number, point: IAutoMovieVector3): IAutoMovieVector3 => {
    const left: number = bearing("left", at);
    const right: number = bearing("right", at);
    return Vector3.lerp(
      carry("left", at, point),
      carry("right", at, point),
      left + right === 0 ? 0.5 : right / (left + right),
    );
  };

  // How far a support turns about the vertical between two seconds of the
  // step, degrees; the ground does not turn.
  const turnOf = (
    prop: string | undefined,
    begin: number,
    end: number,
    site?: string,
  ): number => {
    if (prop === undefined || begin === end) return 0;
    const delta: IAutoMovieQuaternion = Quaternion.multiply(
      frame(prop, end, site).rotation,
      Quaternion.inverse(frame(prop, begin, site).rotation),
    );
    return (2 * Math.atan2(delta.y, delta.w)) / Quaternion.DEG2RAD;
  };

  // How far a plant's support has turned the foot by a second, and one
  // foot's turn blended between its plants as its carry is.
  const turnedBy = (plant: IPlant, at: number): number => {
    const end: number = plant.arrived ? Math.max(at, plant.down) : at;
    if (plant.site === undefined)
      return plant.arrived
        ? turnOf(onto, land, end) + turnOf(from, 0, leave)
        : turnOf(from, 0, end);
    const beforeTouchdown: number = plant.arrived
      ? turnOf(onto, land, plant.down) + turnOf(from, 0, leave)
      : turnOf(from, 0, plant.down);
    return (
      beforeTouchdown +
      turnOf(plant.arrived ? onto : from, plant.down, end, plant.site)
    );
  };
  const spin = (side: AutoMovieHumanSide, at: number): number => {
    const list: IPlant[] = plants[side];
    if (list.length === 0) return turnOf(from, 0, at);
    const share: number = at / duration;
    for (let k: number = 0; k < list.length; ++k) {
      const plant: IPlant = list[k]!;
      if (share < plant.window.from) {
        if (k === 0) return turnedBy(plant, at);
        const before: IPlant = list[k - 1]!;
        const weight: number = AutoMovieEngineMotionSampling.minimumJerkShare(
          (share - before.window.to) / (plant.window.from - before.window.to),
        );
        return (
          turnedBy(before, at) +
          (turnedBy(plant, at) - turnedBy(before, at)) * weight
        );
      }
      if (share <= plant.window.to) return turnedBy(plant, at);
    }
    return turnedBy(list[list.length - 1]!, at);
  };

  // A ground plant bears at the height it stands at: a landing need not be
  // the scene's floor.
  const supportOf = (
    plant: IPlant,
  ): IAutoMovieMotionHumanContactWindow.Support => {
    const prop: string | undefined = plant.arrived ? onto : from;
    return prop === undefined
      ? { kind: "ground", height: plant.floor }
      : {
          kind: "prop",
          subject: prop,
          ...(plant.site === undefined ? {} : { point: plant.site }),
        };
  };
  const byWindow: Map<Window, IPlant> = new Map(
    SIDES.flatMap((side: AutoMovieHumanSide): WindowPlant[] =>
      plants[side].map((plant: IPlant): WindowPlant => [plant.window, plant]),
    ),
  );
  return {
    ...walked,
    contacts: walked.contacts.map((window: Window): Window => {
      const plant: IPlant | undefined = byWindow.get(window);
      return plant === undefined
        ? window
        : { ...window, support: supportOf(plant) };
    }),
    posture: (at: number): Posture => {
      const posture: Posture = walked.posture(at);
      const limbs: Posture["limbs"] = {};
      for (const name of LIMBS) {
        const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[name];
        if (goal === undefined) continue;
        const side: AutoMovieHumanSide | undefined =
          name === "leftLeg"
            ? "left"
            : name === "rightLeg"
              ? "right"
              : undefined;
        const moves = (point: IAutoMovieVector3): IAutoMovieVector3 =>
          side === undefined ? body(at, point) : carry(side, at, point);
        limbs[name] = {
          ...goal,
          point: moves(goal.point),
          bend: moves(goal.bend),
          ...(side === undefined || goal.rotation === undefined
            ? {}
            : {
                rotation: Quaternion.multiply(
                  Quaternion.fromAxisAngle(UP, spin(side, at)),
                  goal.rotation,
                ),
              }),
        };
      }
      // A turning support turns the feet it bears and the body with them.
      const out: Posture = {
        ...posture,
        root: body(at, posture.root),
        yaw: posture.yaw + (spin("left", at) + spin("right", at)) / 2,
        limbs,
      };
      // A swinging foot, carried onto a support at another height or slid
      // along it, turns its toes down rather than bend its ankle past what
      // a weightless ankle reaches, easing in and out with its plants.
      const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
        context.body,
        out.root,
        humanPostureHeading(out),
        out.joints.hips,
      );
      for (const side of SIDES) {
        const leg: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
        const free: number = 1 - bearing(side, at);
        if (leg !== undefined && free > 0)
          limbs[`${side}Leg`] = HumanMountPush.tip(
            context.body,
            side,
            hips[side],
            leg,
            free,
          );
      }
      return out;
    },
  };
}

/** Admission of the height between two nominally level supports. */
export namespace HumanSupportStep {
  /** Require a rise within the walked step's bearing interval. */
  export function admitRise(rise: number, onto: string | undefined): void {
    if (Math.abs(rise) > HumanSupportStepPlants.BEARING)
      throw new HumanRefusal({
        kind: "base",
        axis: "to",
        value: rise,
        feasible: {
          kind: "range",
          minimum: -HumanSupportStepPlants.BEARING,
          maximum: HumanSupportStepPlants.BEARING,
          unit: "m",
        },
        reason: `the arrival lies ${rise.toFixed(3)} m ${rise > 0 ? "above" : "below"} the floor the step leaves: a step ${rise > 0 ? "up" : "down"}, not a level step`,
        fix: `walk to the support's edge, then climb onto it with climbStairs: count 1, riser ${Math.abs(rise).toFixed(3)}, direction ${rise > 0 ? "up" : "down"}${onto === undefined ? "" : `, on ${onto}`}`,
      });
  }
}
