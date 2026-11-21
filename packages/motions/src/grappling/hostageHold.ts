import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHostageHold,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { touch } from "../touch/touch";

/** A shared walk of a coupled pair: both feet step a displacement over a window. */
namespace PairWalk {
  /** One foot's step over the walk: which foot, when, from where to where. */
  export interface IStep {
    /** The stepping foot. */
    side: AutoMovieHumanSide;
    /** When it lifts, seconds since the action's start. */
    from: number;
    /** When it lands, seconds since the action's start. */
    to: number;
    /** Where it lifts from, world metres. */
    start: IAutoMovieVector3;
    /** Where it lands, world metres. */
    end: IAutoMovieVector3;
  }

  /** The longest step, metres: a short backward step (authored). */
  export const STEP: number = 0.3;

  /** How high a stepping foot lifts, metres: authored. */
  export const LIFT: number = 0.04;

  /**
   * The steps that carry both feet a displacement over a window, the feet
   * alternating, the last step closing the trailing foot.
   *
   * @param entry The entry state, its feet.
   * @param travel The displacement, world metres.
   * @param from The window's start, seconds.
   * @param to The window's end, seconds.
   * @returns The steps in order.
   */
  export function steps(
    entry: IAutoMovieMotionHumanEntryState,
    travel: IAutoMovieVector3,
    from: number,
    to: number,
  ): IStep[] {
    const length: number = Vector3.length(travel);
    if (!(length > 1e-6)) return [];
    const count: number = Math.max(1, Math.ceil(length / STEP));
    const span: number = (to - from) / (count + 1);
    const at: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: entry.feet.left.ankle,
      right: entry.feet.right.ankle,
    };
    const out: IStep[] = [];
    for (let j: number = 0; j <= count; ++j) {
      const side: AutoMovieHumanSide = j % 2 === 0 ? "left" : "right";
      const end: IAutoMovieVector3 = Vector3.add(
        side === "left" ? entry.feet.left.ankle : entry.feet.right.ankle,
        Vector3.scale(travel, Math.min(1, (j + 1) / count)),
      );
      out.push({
        side,
        from: from + j * span,
        to: from + (j + 1) * span,
        start: at[side],
        end,
      });
      at[side] = end;
    }
    return out;
  }

  /**
   * The feet's goals at a second.
   *
   * @param entry The entry state.
   * @param steps The walk's steps.
   * @param seconds Seconds since the action's start.
   * @param knee The knee's hint from an ankle.
   * @returns The two leg goals.
   */
  export function legs(
    entry: IAutoMovieMotionHumanEntryState,
    steps: readonly IStep[],
    seconds: number,
    knee: (ankle: IAutoMovieVector3) => IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const out: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const) {
      let point: IAutoMovieVector3 = entry.feet[side].ankle;
      let planted: boolean = true;
      for (const s of steps)
        if (s.side === side) {
          if (seconds >= s.to) point = s.end;
          else if (seconds > s.from) {
            const u: number = minimumJerk.share(
              (seconds - s.from) / (s.to - s.from),
            );
            point = Vector3.add(Vector3.lerp(s.start, s.end, u), {
              x: 0,
              y: Math.sin(Math.PI * u) * LIFT,
              z: 0,
            });
            planted = false;
          }
        }
      out[`${side}Leg`] = {
        point,
        rotation: entry.feet[side].rotation,
        bend: knee(point),
        planted,
      } satisfies IAutoMovieHumanLimbGoal;
    }
    return out;
  }

  /**
   * Each foot's plant windows outside its steps, as shares of a duration.
   *
   * @param steps The walk's steps.
   * @param duration The action's duration, seconds.
   * @returns The contact windows.
   */
  export function plants(
    steps: readonly IStep[],
    duration: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    const out: IAutoMovieMotionHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const) {
      let from: number = 0;
      for (const s of steps)
        if (s.side === side) {
          if (s.from > from)
            out.push({
              part: `${side}Foot`,
              kind: "plant",
              from: from / duration,
              to: s.from / duration,
              support: { kind: "ground" },
            });
          from = s.to;
        }
      out.push({
        part: `${side}Foot`,
        kind: "plant",
        from: from / duration,
        to: 1,
        support: { kind: "ground" },
      });
    }
    return out;
  }
}

/**
 * A hostage hold from behind (`IAutoMovieMotionHumanHostageHold`). The free
 * arm lies across the hostage's chest or throat and the weapon hand brings
 * the held weapon's point to the authored region, both by one touch held
 * for the hold (`touch`, the weapon's point standing in for the hand). Once
 * both are in place the pair walks backward the authored distance: the
 * holder's feet step it, the root travels it on one minimum-jerk profile and
 * both hands travel with it, so they stay on the hostage, who performs
 * `heldHostage` and steps the same way.
 */
export namespace hostageHold {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "hostageHold";

  /** Cancel table: the touch's own. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    touch.interrupts;

  /**
   * Plan a hostage hold.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `point` when a weapon comes without its point, on `back` or `seconds` out of range, and whatever the touch refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHostageHold.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanHostageHold.IParams = context.params;
    const seconds: number = params.seconds ?? 3;
    const back: number = params.back ?? 0;
    for (const [axis, value] of [
      ["seconds", seconds],
      ["back", back],
    ] as const)
      if (
        !(value >= 0 && Number.isFinite(value)) ||
        (axis === "seconds" && value === 0)
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value,
          reason: `a hostage hold's ${axis} is a ${axis === "seconds" ? "positive" : "non-negative"} finite value`,
          fix: `give ${axis} in ${axis === "seconds" ? "seconds" : "metres"}`,
        });
    if ((params.prop === undefined) !== (params.point === undefined))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "point",
        value: params.point ?? "none",
        reason:
          "a presented weapon needs the point brought to the region, and a point needs its weapon",
        fix: "give both the weapon and its point, or neither",
      });
    const weapon: AutoMovieHumanSide | undefined =
      params.prop === undefined
        ? undefined
        : context.entry.holds.right === params.prop
          ? "right"
          : context.entry.holds.left === params.prop
            ? "left"
            : undefined;
    const free: AutoMovieHumanSide = weapon === "right" ? "left" : "right";
    const across: AutoMovieHumanoidRegion =
      (params.arm ?? "chest") === "neck" ? "throat" : "sternum";
    const region: AutoMovieHumanoidRegion = params.region ?? "templeRight";
    const hold: IAutoMovieMotionHumanTouch.IParams =
      params.prop === undefined || weapon === undefined
        ? {
            target: { kind: "person", subject: params.partner, region: across },
            side: free,
            kind: "hold",
            count: 1,
            hold: seconds,
          }
        : {
            target: { kind: "person", subject: params.partner, region },
            other: { kind: "person", subject: params.partner, region: across },
            side: weapon,
            prop: params.prop,
            point: params.point!,
            kind: "hold",
            count: 1,
            hold: seconds,
          };
    const held: IAutoMovieMotionHumanActionPlan = touch.plan({
      ...context,
      params: hold,
    });
    const duration: number = held.duration;
    const placed: number = held.contact ?? duration / 3;
    if (back === 0)
      return {
        ...held,
        events: [...held.events, { name: "held", share: placed / duration }],
      };

    // The walk back: away from the hostage, over the hold.
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.entry.posture.yaw),
      { x: 0, y: 0, z: 1 },
    );
    const travel: IAutoMovieVector3 = Vector3.scale(facing, -back);
    const end: number = placed + seconds;
    const steps: PairWalk.IStep[] = PairWalk.steps(
      context.entry,
      travel,
      placed,
      end,
    );
    const moved: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      Vector3.scale(
        travel,
        minimumJerk.share(Math.min(1, Math.max(0, (t - placed) / seconds))),
      );
    const hip: number = context.body.measure.hipHeight;
    const knee: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (
      ankle: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        ankle,
        Vector3.add({ x: 0, y: 0.45 * hip, z: 0 }, Vector3.scale(facing, 0.3)),
      );
    const { base: _base, ...holding }: IAutoMovieMotionHumanActionPlan = held;
    return {
      ...holding,
      events: [
        ...held.events,
        { name: "held", share: placed / duration },
        { name: "backed", share: end / duration },
      ],
      contacts: [
        ...held.contacts.filter(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part !== "leftFoot" && c.part !== "rightFoot",
        ),
        ...PairWalk.plants(steps, duration),
      ],
      posture: (
        t: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const shown: IAutoMovieMotionHumanPosture = held.posture(
          t,
          channels,
          resolution,
          projection,
        );
        const offset: IAutoMovieVector3 = moved(t);
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...shown.limbs };
        for (const arm of ["leftArm", "rightArm"] as const) {
          const goal: IAutoMovieHumanLimbGoal | undefined = limbs[arm];
          if (goal !== undefined && goal.on === undefined)
            limbs[arm] = {
              ...goal,
              point: Vector3.add(goal.point, offset),
              bend: Vector3.add(goal.bend, offset),
            };
        }
        return {
          ...shown,
          root: Vector3.add(shown.root, offset),
          limbs: { ...limbs, ...PairWalk.legs(context.entry, steps, t, knee) },
        };
      },
    };
  }
}

/**
 * The hostage of a hold (`IAutoMovieMotionHumanHostageHold.IHeld`): the body
 * keeps the posture it entered with and walks backward with the holder for
 * `SECONDS`, its root following the holder's displayed root and its feet
 * stepping the same displacement, so the pair keeps its order. The holder
 * is composed before the hostage, so its root is placed to be read.
 */
export namespace heldHostage {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "heldHostage";

  /** Cancel table: none. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** How long the hostage is held, seconds: authored, the hold's default with its reach and the walk back. */
  export const SECONDS: number = 5;

  /**
   * Plan the hostage.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHostageHold.IHeld>,
  ): IAutoMovieMotionHumanActionPlan {
    const holder: ReturnType<typeof context.performer> = context.performer(
      context.params.partner,
    );
    const origin: IAutoMovieVector3 = holder.root(context.start).position;
    const duration: number = SECONDS;
    const moved: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      Vector3.subtract(holder.root(context.start + t).position, origin);
    const travel: IAutoMovieVector3 = moved(duration);
    const steps: PairWalk.IStep[] = PairWalk.steps(
      context.entry,
      travel,
      0,
      duration,
    );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const hip: number = context.body.measure.hipHeight;
    const knee: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (
      ankle: IAutoMovieVector3,
    ): IAutoMovieVector3 => Vector3.add(ankle, { x: 0, y: 0.45 * hip, z: 0 });
    const events: IAutoMovieMotionEvent[] = [{ name: "held", share: 0 }];
    return {
      duration,
      events,
      contacts: PairWalk.plants(steps, duration),
      posture: (t: number): IAutoMovieMotionHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        return {
          ...entry,
          root: Vector3.add(entry.root, { ...moved(s), y: 0 }),
          limbs: {
            ...entry.limbs,
            ...PairWalk.legs(context.entry, steps, s, knee),
          },
        };
      },
    };
  }
}
