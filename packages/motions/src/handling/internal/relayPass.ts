import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRelayPass,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmJointCourse } from "../../compose/internal/AutoMovieMotionHumanArmJointCourse";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { handGoals } from "../../everyday/internal/handGoals";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * A relay baton pass, one role of it, performed over a run (`HumanChain.over`):
 * the outgoing runner's hand goes back, open, palm back, and the incoming
 * runner pushes the baton's end into it at a film second both roles state alike
 * (`at`), from where the baton passes to the outgoing hand.
 *
 * The outgoing hand is placed in the runner's own frame: behind and below the
 * shoulder by shares of the arm (the upsweep's hand, provisional), the palm
 * back and the fingers down. The incoming hand is placed each second so the
 * baton's end, read in the hand's frame where the baton is worn
 * (`IHumanProp.worn`), lies on the outgoing runner's displayed palm. Each arm
 * leaves the run's swing over `REACH` seconds before `at` and goes back to it
 * over `REACH` after `HOLD`. The outgoing role wears the baton on its hand from
 * `at` (`IHumanActionPlan.wears`), so it rides that hand from the exchange on;
 * without a baton the pass is mimed.
 *
 * With a `zone`, each role refuses a pass whose runner stands outside the
 * takeover zone's two lines at `at` (World Athletics TR24.19). First pass: the
 * free distance is the composition's (where the two runs put the runners at
 * `at`); the runners do not adjust their speed to meet, and the fingers do not
 * close on the baton.
 */
export namespace relayPass {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "relayPass";

  /** Cancel table: either role may be left once its arm is back on the run. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** A pass is performed over a run: it claims one arm and its hand. */
  export const overlay: boolean = true;

  /**
   * Seconds each arm takes to leave the run's swing for the pass, and to go
   * back (provisional).
   */
  export const REACH: number = 0.4;

  /** Seconds the hands stay together after `at` (provisional). */
  export const HOLD: number = 0.25;

  /**
   * The outgoing wrist's place from the shoulder, shares of the arm: down and
   * behind (provisional, the upsweep).
   */
  export const BACK: Readonly<IBACKItem> = {
    down: 0.75,
    back: 0.5,
  };

  /**
   * Plan one role of a baton pass.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When `at` lies before this action can reach, a baton
   *   is named without its end, or the runner is outside the named takeover
   *   zone at `at`.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRelayPass.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanRelayPass.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const side: AutoMovieHumanSide = p.hand ?? "right";
    const sign: number = side === "left" ? 1 : -1;
    const at: number = p.at - context.start;
    HumanBound.least("at", at, REACH, "s");
    const relax: number = at + HOLD;
    const duration: number = relax + REACH;
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    // The pass must fall inside the takeover zone (World Athletics
    // TR24.19): the runner's root at `at`, projected on the zone's line.
    if (p.zone !== undefined) {
      const line: IAutoMovieVector3 = Vector3.subtract(p.zone.to, p.zone.from);
      const length: number = Math.hypot(line.x, line.z);
      const root: IAutoMovieVector3 = base.posture(at).root;
      const along: number =
        ((root.x - p.zone.from.x) * line.x +
          (root.z - p.zone.from.z) * line.z) /
        length;
      if (!(along >= 0 && along <= length))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "zone",
          value: along,
          feasible: { kind: "range", minimum: 0, maximum: length, unit: "m" },
          reason: `at ${p.at.toFixed(2)} s the ${p.role} runner is ${along.toFixed(2)} m along the takeover zone, outside its ${length.toFixed(2)} m`,
          fix: "pass at an instant both runners are inside the takeover zone",
        });
    }
    const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
    const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]);
    const palmBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]);

    // The baton's end in the incoming hand's frame.
    let end: IAutoMovieVector3 | undefined;
    if (p.baton !== undefined && p.role === "incoming") {
      const read: IAutoMovieMotionHumanPropReader = context.prop(p.baton);
      const point: IAutoMovieMotionHumanProp["points"][string] | undefined =
        p.end === undefined ? undefined : read.prop.points[p.end];
      if (point === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "end",
          value: p.end ?? "absent",
          feasible: {
            kind: "alternatives",
            values: Object.keys(read.prop.points),
          },
          reason: `the baton ${p.baton} has no point named ${p.end ?? "(none given)"} to push into the outgoing hand`,
          fix: "name one of the baton's points as `end`",
        });
      const worn: IAutoMovieRigidTransform = read.prop.worn?.offset ?? {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      };
      end = Vector3.add(
        worn.position,
        Quaternion.rotateVector(worn.rotation, point.point),
      );
    }

    // The pass's weight at a second: in over `REACH` before `at`, out after.
    const weight: (t: number) => number = (t: number): number =>
      t < at - REACH
        ? 0
        : t < at
          ? AutoMovieEngineMotionSampling.minimumJerkShare((t - (at - REACH)) / REACH)
          : t <= relax
            ? 1
            : 1 - AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, (t - relax) / REACH));

    // The run's own arm over each blend, solved at knots AutoKnots places
    // over the blend (Vitenti et al. 2024, arXiv:2412.13423) to the arm
    // solver's angular resolution (`ROM_TOLERANCE`) and read from their
    // course (`prepareHumanSampledCourse`), so a read resolves no posture.
    const runArm = (t: number): number[] => {
      const angles: IAutoMovieMotionHumanArmAngles.IAngles =
        AutoMovieMotionHumanArm.angles(
          resolveHumanPosture.seeded(body, base.posture(t)).pose,
          side,
        );
      return [...angles.upper, ...angles.lower, ...angles.hand];
    };
    const blend: (from: number, to: number) => (t: number) => number[] = (
      from: number,
      to: number,
    ): ((t: number) => number[]) =>
      prepareHumanSampledCourse({
        from,
        to,
        sample: runArm,
        tolerance: { kind: "absolute", absolute: ROM_TOLERANCE },
        step: AutoMovieMotionHumanArmCourse.STEP,
      });
    const into: (t: number) => number[] = blend(Math.max(0, at - REACH), at);
    const out: (t: number) => number[] = blend(relax, duration);

    // The hand's goal at a second, on the run's posture there.
    const goal: (
      posture: IAutoMovieMotionHumanPosture,
      t: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => IAutoMovieMotionHumanArmTarget.ISided = (
      posture: IAutoMovieMotionHumanPosture,
      t: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieMotionHumanArmTarget.ISided => {
      const frame: HumanFrame.IPrepared = HumanFrame.prepare({
        origin: { x: 0, y: 0, z: 0 },
        yaw: posture.yaw,
      });
      const dir: (x: number, y: number, z: number) => IAutoMovieVector3 = (
        x: number,
        y: number,
        z: number,
      ): IAutoMovieVector3 => Vector3.normalize(frame.direction({ x, y, z }));
      const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
        body,
        posture,
        undefined,
        resolution,
        shoulderBones,
      ).get(`${side}UpperArm`)!.worldPosition;
      const arm: number = body.measure.upperArm + body.measure.forearm;
      if (p.role === "outgoing") {
        const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
          fingers: dir(0, -0.96, -0.29),
          palm: dir(0, 0.29, -0.96),
        });
        return {
          side,
          surface: "wrist",
          shape: "flat",
          point: Vector3.add(
            shoulder,
            frame.direction({
              x: 0,
              y: -BACK.down * arm,
              z: -BACK.back * arm,
            }),
          ),
          rotation,
          bend: Vector3.add(
            shoulder,
            frame.direction({
              x: sign * 0.3 * body.measure.upperArm,
              y: -0.5 * body.measure.upperArm,
              z: 0,
            }),
          ),
        };
      }
      // The incoming hand pushes the baton forward into the palm ahead.
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        p.partner,
      );
      const palm: IAutoMovieVector3 = HumanHand.preparePoint(
        partner.body,
        side,
        "palm",
        "flat",
      )(partner.bones(context.start + t, palmBones));
      const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: dir(0, 0, 1),
        palm: dir(-sign, 0, 0),
      });
      return {
        side,
        surface: "wrist",
        shape: "fist",
        point:
          end === undefined
            ? palm
            : Vector3.subtract(palm, Quaternion.rotateVector(rotation, end)),
        rotation,
        bend: Vector3.add(
          shoulder,
          frame.direction({
            x: sign * 0.3 * body.measure.upperArm,
            y: -0.6 * body.measure.upperArm,
            z: 0,
          }),
        ),
      };
    };

    // The pass's joint-space carry, solved at its branch points once the
    // performance is prepared.
    const carrier: AutoMovieMotionHumanArmJointCourse.ICarrier =
      AutoMovieMotionHumanArmJointCourse.carrier(body);
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "ready", share: Math.max(0, at - REACH) / duration },
        { name: "pass", share: at / duration },
        { name: "relax", share: relax / duration },
      ],
      contacts: base.contacts,
      hands: [side],
      ...(context.carrier === undefined
        ? {}
        : { channels: [limb, `${side}Hand` as const] }),
      ...(p.baton !== undefined && p.role === "outgoing"
        ? {
            wears: [
              {
                prop: p.baton,
                bone: `${side}Hand` as const,
                from: at / duration,
              },
            ],
          }
        : {}),
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IAutoMovieMotionHumanPosture = base.posture(
          t,
          undefined,
          resolution,
          projection,
        );
        const w: number = weight(t);
        if (w <= 0) return posture;
        const reaching: IAutoMovieMotionHumanPosture = handGoals(
          body,
          posture,
          [goal(posture, t, resolution)],
        );
        if (w >= 1) return reaching;
        const a: number[] = (t < at ? into : out)(t);
        const run: IAutoMovieMotionHumanArmAngles.IAngles = {
          upper: [a[0]!, a[1]!, a[2]!],
          lower: [a[3]!, a[4]!, a[5]!],
          hand: [a[6]!, a[7]!, a[8]!],
        };
        return carrier.carry(
          t,
          { posture: reaching, sides: [side], held: { [side]: run }, share: w },
          resolution,
          projection,
        );
      },
    };
    plan.prepare = (): void => {
      base.prepare?.();
      // The pass's two blends, the stretches the arm is carried on.
      carrier.prepare(
        [
          [Math.max(0, at - REACH), at],
          [relax, Math.min(duration, relax + REACH)],
        ],
        plan.posture,
      );
    };
    return plan;
  }
}

/** The record of `IBACKItem`'s site. */
type IBACKItem = { down: number; back: number };
