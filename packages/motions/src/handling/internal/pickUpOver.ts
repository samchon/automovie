import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { HumanPreshape } from "./HumanPreshape";
import { pickUpAlong } from "./pickUpAlong";
import { pickUpPosture } from "./pickUpPosture";
import { pickUpSearch } from "./pickUpSearch";

/*
 * A pick-up performed over a carrier (`pickUp` as an overlay): a seated rider
 * takes a revolver from its holster, a carbine from its boot or an arrow from
 * its quiver while the carrier action keeps the body. The grasp is the standing
 * pick-up's (`pickUpSearch` on the entry's body), but the body is never
 * lowered, turned or stepped for it: the carrier owns them, so a grip beyond
 * the arm is refused. The action claims only the reaching arm and its hand.
 * Where the prop rides the performer's own body (worn, or mounted on a carrier
 * worn there), the hand's path rides that bone, so it follows the prop as the
 * body moves under the rider; a prop in the world keeps a world path. The
 * phases are the standing pick-up's: the reach, the load, and the lift along
 * the body's up at the entry.
 */
export namespace pickUpOver {
  /*
   * The load phase between contact and lift-off, seconds: the standing
   * pick-up's.
   */
  export const LOAD: number = 0.15;

  /*
   * Plan a pick-up over a carrier.
   * Parameter context: The action's context, its carrier present.
   * Returns: The plan.
   * On `prop` when the grip lies beyond the arm from the
   * carried body, and on `lift` for a second hand asked to lift
   * independently.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const steadied: boolean =
      context.entry.holds[other] === context.params.prop;
    const lift: number = context.params.lift ?? (steadied ? 0 : 0.1);
    if (!(lift >= 0) || (steadied && lift > 0))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "lift",
        value: lift,
        reason: steadied
          ? `the other hand already holds ${context.params.prop}; a second grip steadies it and cannot lift it independently`
          : "a pick up lifts a non-negative height",
        fix: "take the second grip without lifting, or give a non-negative lift",
      });

    // The grasp, chosen on the body as it was entered: the carrier keeps it,
    // so the stance is the entry's, never lowered.
    const unmoved: pickUpPosture.IStance = {
      posture: context.entry.posture,
      at: (): IAutoMovieMotionHumanPosture => context.entry.posture,
      lower: (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => posture,
    };
    const authored: IAutoMovieMotionHumanGrasp.ITarget = pickUpAlong(
      context,
      HumanGrasp.target(
        context,
        context.params.prop,
        context.params.handle,
        context.start,
      ),
    );
    const { chosen, bend }: pickUpSearch.ISearched = pickUpSearch(
      context,
      side,
      lift,
      authored,
      unmoved,
    );
    pickUpPosture.reachable(context, side, chosen.wrist.point);
    const target: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.around(
      authored,
      chosen.turn,
    );

    // The frame the hand's path rides: the bone the prop rides on this body,
    // or the world.
    const frame: AutoMovieHumanoidBone | undefined = carrying(context);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        `${side}Hand`,
        ...(frame === undefined ? [] : [frame]),
      ]),
    );
    const at: IAutoMovieResolvedBone | undefined =
      frame === undefined ? undefined : bones.get(frame);
    const inverse: IAutoMovieQuaternion =
      at === undefined
        ? Quaternion.identity()
        : Quaternion.inverse(at.worldRotation);
    const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      at === undefined
        ? p
        : Quaternion.rotateVector(
            inverse,
            Vector3.subtract(p, at.worldPosition),
          );
    const turn: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
      q: IAutoMovieQuaternion,
    ): IAutoMovieQuaternion =>
      at === undefined
        ? q
        : Quaternion.normalize(Quaternion.multiply(inverse, q));

    // The timing: the reach, the load and the lift, as standing.
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const reach: number = HumanPrehension.duration(
      context.skill,
      context.random("reach"),
      Vector3.distance(chosen.wrist.point, hand.worldPosition),
      target.width,
    );
    const rise: number = lift > 0 ? HumanPrehension.nominal(lift, 0) : 0;
    const liftOff: number = reach + LOAD;
    const duration: number = liftOff + rise;
    const transport: IAutoMovieMotionHumanPrehension.ITransport =
      HumanPrehension.transport(
        hand.worldPosition,
        chosen.wrist.point,
        target.approach,
        HumanPrehension.aperture(target.width),
        { from: hand.worldRotation, to: chosen.wrist.rotation },
        reach,
      );
    const closed: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.close(
      context.body,
      side,
      target.grip,
      chosen.shown,
      target.colliders,
    ).joints;
    const shapeAt: ReturnType<typeof HumanPrehension.prepareShape> =
      HumanPrehension.prepareShape(
        {
          entry: HumanGrip.fingers(context.entry.pose, side),
          open: HumanPreshape.open(context.body, side, closed, target.width)
            .joints,
          closed,
        },
        HumanPrehension.peak(context.random("peak")),
      );
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const part: IAutoMovieMotionHumanContactWindow["part"] = `${side}Hand`;
    return {
      duration,
      events: [
        { name: "gripClosed", share: reach / duration },
        { name: "liftOff", share: liftOff / duration },
        { name: "lifted", share: 1 },
      ],
      contacts: [
        ...base.contacts,
        {
          part,
          kind: "grip",
          from: reach / duration,
          to: 1,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      holds: [
        {
          side,
          prop: context.params.prop,
          from: reach / duration,
          fingers: closed,
          ...(context.params.use === undefined
            ? {}
            : { use: context.params.use }),
        },
      ],
      channels: [`${side}Arm`, `${side}Hand`],
      contact: reach,
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IAutoMovieMotionHumanPosture = base.posture(
          t,
          channels,
          resolution,
          projection,
        );
        const wrist: IAutoMovieVector3 =
          t < reach
            ? transport.wrist(t)
            : Vector3.add(
                chosen.wrist.point,
                Vector3.scale(
                  up,
                  rise > 0
                    ? lift *
                        AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, (t - liftOff) / rise))
                    : 0,
                ),
              );
        const goal: IAutoMovieHumanLimbGoal = {
          point: local(wrist),
          rotation: turn(t < reach ? transport.turn(t) : chosen.shown.rotation),
          bend: local(bend),
          reference: chosen.reference,
          ...(t >= reach ? { planted: true } : {}),
          ...(frame === undefined ? {} : { on: frame }),
        };
        return {
          ...posture,
          joints: { ...posture.joints, ...shapeAt(t / reach) },
          limbs: { ...posture.limbs, [`${side}Arm`]: goal },
        };
      },
    };
  }

  /*
   * The bone of this performer the prop rides: worn on it, or mounted on a
   * carrier worn on it; none for a prop in the world.
   */
  function carrying(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
  ): AutoMovieHumanoidBone | undefined {
    const prop: IAutoMovieMotionHumanProp = context.prop(
      context.params.prop,
    ).prop;
    const worn: IAutoMovieMotionHumanProp["worn"] =
      prop.worn ??
      (prop.mounted === undefined
        ? undefined
        : context.prop(prop.mounted.prop).prop.worn);
    return worn !== undefined && worn.subject === context.subject
      ? worn.bone
      : undefined;
  }
}
