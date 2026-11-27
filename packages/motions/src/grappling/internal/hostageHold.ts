import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHostageHold,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { touch } from "../../touch/internal/touch";
import { PairWalk } from "./PairWalk";

/*
 * A hostage hold from behind (`IAutoMovieMotionHumanHostageHold`). The free arm
 * lies across the hostage's chest or throat and the weapon hand brings the held
 * weapon's point to the authored region, both by one touch held for the hold
 * (`touch`, the weapon's point standing in for the hand). Once both are in
 * place the pair walks backward the authored distance: the holder's feet step
 * it, the root travels it on one minimum-jerk profile and both hands travel
 * with it, so they stay on the hostage, who performs `heldHostage` and steps
 * the same way.
 */
export namespace hostageHold {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "hostageHold";

  /*
   * Cancel table: the touch's own.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    touch.interrupts;

  /*
   * Plan a hostage hold.
   * Parameter context: The action's context.
   * Returns: The plan.
   * On `point` when a weapon comes without its point, on
   * `back` or `seconds` out of range, and whatever the touch refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHostageHold.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanHostageHold.IParams = context.params;
    const seconds: number = params.duration ?? 3;
    const back: number = params.back ?? 0;
    for (const [axis, value] of [
      ["duration", seconds],
      ["back", back],
    ] as const)
      if (
        !(value >= 0) ||
        (axis === "duration" && value === 0)
      )
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis,
          value,
          reason: `a hostage hold's ${axis} is a ${axis === "duration" ? "positive" : "non-negative"} finite value`,
          fix: `give ${axis} in ${axis === "duration" ? "seconds" : "metres"}`,
        });
    if ((params.prop === undefined) !== (params.point === undefined))
      throw new AutoMovieMotionHumanRefusal({
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
            hand: free,
            kind: "hold",
            count: 1,
            hold: seconds,
          }
        : {
            target: { kind: "person", subject: params.partner, region },
            other: { kind: "person", subject: params.partner, region: across },
            hand: weapon,
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
        AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, (t - placed) / seconds))),
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
