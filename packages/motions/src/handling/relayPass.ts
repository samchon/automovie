import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { handGoals } from "../everyday/handGoals";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A relay baton pass, one role of it, performed over a run (`HumanChain.over`):
 * the outgoing runner's hand goes back, open, palm back, and the incoming
 * runner pushes the baton's end into it at a film second both roles state
 * alike (`at`), from where the baton passes to the outgoing hand.
 *
 * The outgoing hand is placed in the runner's own frame: behind and below
 * the shoulder by shares of the arm (the upsweep's hand, provisional), the
 * palm back and the fingers down. The incoming hand is placed each second so
 * the baton's end, read in the hand's frame where the baton is worn
 * (`IHumanProp.worn`), lies on the outgoing runner's displayed palm. Each arm
 * leaves the run's swing over `REACH` seconds before `at` and goes back to
 * it over `REACH` after `HOLD`. The outgoing role wears the baton on its
 * hand from `at` (`IHumanActionPlan.wears`), so it rides that hand from the
 * exchange on; without a baton the pass is mimed.
 *
 * With a `zone`, each role refuses a pass whose runner stands outside the
 * takeover zone's two lines at `at` (World Athletics TR24.19).
 * First pass: the free distance is the composition's (where the two runs put
 * the runners at `at`); the runners do not adjust their speed to meet, and
 * the fingers do not close on the baton.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both roles' hands, the shared instant, the timing, the baton's passing and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation An overlay of each runner's arm over its run, sharing one stated instant, with the baton passed by the worn-prop relation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the overlay flag, three constants, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The incoming hand is placed by the outgoing runner's displayed palm, never by a guess of where it will be.
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

  /** Seconds each arm takes to leave the run's swing for the pass, and to go back (provisional). */
  export const REACH: number = 0.4;

  /** Seconds the hands stay together after `at` (provisional). */
  export const HOLD: number = 0.25;

  /** The outgoing wrist's place from the shoulder, shares of the arm: down and behind (provisional, the upsweep). */
  export const BACK: Readonly<{ down: number; back: number }> = {
    down: 0.75,
    back: 0.5,
  };

  /**
   * Plan one role of a baton pass.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When `at` lies before this action can reach, a baton is named without its end, or the runner is outside the named takeover zone at `at`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives both hands and the timing.
   * @evidence contracts/development/implementation.md#principled-implementation The outgoing hand is a place of the runner's own frame, carried with the run; the incoming wrist is the outgoing palm less the baton's end as the hand holds it; both arms are carried from the run's own arm angles at each second by the pass's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The clock, the role's goal, the envelope, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An instant too early is refused with the earliest one; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Inactive pass windows return the carrier directly; partial blends retain their original solves, and full share skips the unused carrier-angle solve. Each active current posture shares one yaw transform across its original axes/point/bend. Incoming contact requests only partner hand output and point-only palm geometry, omitting two unused direction rotations. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Current-person FK/ROM loans pass through complete carrier, actual shoulder/baseline observations and arm carry. Exact unchanged partner-body identity permits one local palm reader; opaque partner lookup, film second and displayed bones remain current and use that other person's own pipeline.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns base/baton geometry and one last immutable partner-body point reader, replaced on body change. Optional current-person FK/ROM inputs are borrowed only during the call; no loan, current bones/point, pose/time history or handle enters the plan or outputs.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRelayPass.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanRelayPass.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const side: AutoMovieHumanSide = p.side ?? "right";
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
          ? minimumJerk.share((t - (at - REACH)) / REACH)
          : t <= relax
            ? 1
            : 1 - minimumJerk.share(Math.min(1, (t - relax) / REACH));

    // The hand's goal at a second, on the run's posture there.
    let palmReader:
      | {
          body: IAutoMovieMotionHumanActionContext["body"];
          read: ReturnType<typeof HumanHand.preparePoint>;
        }
      | undefined;
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
      if (palmReader === undefined || palmReader.body !== partner.body)
        palmReader = {
          body: partner.body,
          read: HumanHand.preparePoint(partner.body, side, "palm", "flat"),
        };
      const palm: IAutoMovieVector3 = palmReader.read(
        partner.bones(context.start + t, palmBones),
      );
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

    return {
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
        const run: IAutoMovieMotionHumanArmAngles.IAngles =
          AutoMovieMotionHumanArm.angles(
            resolveHumanPosture.seeded(
              body,
              posture,
              undefined,
              undefined,
              resolution,
              undefined,
              projection,
            ).pose,
            side,
          );
        return AutoMovieMotionHumanArm.carry(
          body,
          reaching,
          { [side]: run },
          w,
          undefined,
          resolution,
          projection,
        );
      },
    };
  }
}
