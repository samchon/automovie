import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { handGoals } from "../everyday/handGoals";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
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
  export const name: HumanActionKey = "relayPass";

  /** Cancel table: either role may be left once its arm is back on the run. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
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
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The role, the partner, the baton and the shared instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The instant is stated, so both roles agree without reading each other's plan.
   */
  export interface IParams {
    /** Which runner: the one bringing the baton or the one taking it. */
    role: "incoming" | "outgoing";

    /** The other runner. */
    partner: string;

    /** The film second the baton reaches the outgoing hand; both roles give the same one. */
    at: number;

    /** The baton's subject id, worn on the incoming runner's passing hand; mimed when absent. */
    baton?: string;

    /** The baton's point that is pushed into the outgoing hand, one of its points; required with `baton`. */
    end?: string;

    /** The passing hand of both runners; `right` when absent. */
    side?: HumanHand.Side;
  }

  /**
   * Plan one role of a baton pass.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When `at` lies before this action can reach, or a baton is named without its end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives both hands and the timing.
   * @evidence contracts/development/implementation.md#principled-implementation The outgoing hand is a place of the runner's own frame, carried with the run; the incoming wrist is the outgoing palm less the baton's end as the hand holds it; both arms are carried from the run's own arm angles at each second by the pass's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The clock, the role's goal, the envelope, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An instant too early is refused with the earliest one; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two posture resolves and a trunk resolve per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the carrier, the hand goals, the arm carry and the worn prop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan and the baton's offset.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const side: HumanHand.Side = p.side ?? "right";
    const sign: number = side === "left" ? 1 : -1;
    const at: number = p.at - context.start;
    HumanBound.least("at", at, REACH, "s");
    const relax: number = at + HOLD;
    const duration: number = relax + REACH;
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";

    // The baton's end in the incoming hand's frame.
    let end: IAutoMovieVector3 | undefined;
    if (p.baton !== undefined && p.role === "incoming") {
      const read: IHumanActionContext.IProp = context.prop(p.baton);
      const point = p.end === undefined ? undefined : read.prop.points[p.end];
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
      const worn: IHumanProp.IFrame = read.prop.worn?.offset ?? {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      };
      end = Vector3.add(
        worn.position,
        Quaternion.rotateVector(worn.rotation, point.point),
      );
    }

    // The pass's weight at a second: in over `REACH` before `at`, out after.
    const weight = (t: number): number =>
      t < at - REACH
        ? 0
        : t < at
          ? minimumJerk((t - (at - REACH)) / REACH).s
          : t <= relax
            ? 1
            : 1 - minimumJerk(Math.min(1, (t - relax) / REACH)).s;

    // The hand's goal at a second, on the run's posture there.
    const goal = (
      posture: IHumanPosture,
      t: number,
    ): AutoMovieMotionHumanArm.ISided => {
      const frame: HumanFrame.IFrame = {
        origin: { x: 0, y: 0, z: 0 },
        yaw: posture.yaw,
      };
      const dir = (x: number, y: number, z: number): IAutoMovieVector3 =>
        Vector3.normalize(HumanFrame.point(frame, { x, y, z }));
      const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
        body,
        posture,
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
            HumanFrame.point(frame, {
              x: 0,
              y: -BACK.down * arm,
              z: -BACK.back * arm,
            }),
          ),
          rotation,
          bend: Vector3.add(
            shoulder,
            HumanFrame.point(frame, {
              x: sign * 0.3 * body.measure.upperArm,
              y: -0.5 * body.measure.upperArm,
              z: 0,
            }),
          ),
        };
      }
      // The incoming hand pushes the baton forward into the palm ahead.
      const partner = context.performer(p.partner);
      const palm: IAutoMovieVector3 = HumanHand.frame(
        partner.body,
        partner.bones(context.start + t),
        side,
        "palm",
        "flat",
      ).point;
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
          HumanFrame.point(frame, {
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
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t);
        const w: number = weight(t);
        if (w <= 0) return posture;
        const run: AutoMovieMotionHumanArm.IAngles =
          AutoMovieMotionHumanArm.angles(
            resolveHumanPosture(body, posture),
            side,
          );
        return AutoMovieMotionHumanArm.carry(
          body,
          handGoals(body, posture, [goal(posture, t)]),
          { [side]: run },
          w,
        );
      },
    };
  }
}
