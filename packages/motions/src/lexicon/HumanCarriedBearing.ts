import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanCarried } from "./HumanCarried";
import { HumanCarriedBorne } from "./HumanCarriedBorne";
import { HumanCarriedCoupling } from "./HumanCarriedCoupling";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * The plan of holding a person in a named carry (`HumanCarried.bearing`):
 * the bearer's hands where the coupled carry lays the held regions (#3437),
 * for a first or a second helper.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned and for which law.
 * @evidence contracts/development/design.md#principled-representation The law's plan as a function of its context, kept beside the law record `HumanCarried` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record, the parameters and the rows stay `HumanCarried`'s.
 */
export namespace HumanCarriedBearing {
  /**
   * Plan the carrier's hold; `HumanCarried.bearing` states the law.
   *
   * @param context The carrier's context.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and where the law is documented.
   * @evidence contracts/development/implementation.md#principled-implementation With the carried person named, each holding wrist goes where the coupled carry lays the held region in this bearer's displayed hips frame (`HumanCarriedCouplingPose.holds`), a second helper's in its own; otherwise to the row's place from one of the carrier's own regions, in arm lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The role, the coupling, then one arm primitive per holding hand over the inherited base.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hands do not read the carried body's displayed bones; the rows' places are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution per holding arm per posture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export function plan(
    context: IHumanActionContext<HumanCarried.IBearing>,
  ): IHumanActionPlan {
    const seconds: number = HumanCarriedBorne.lasting(context.params.seconds ?? 2);
    const carry: HumanCarried.Carry = context.params.carry ?? "piggyback";
    const row: HumanCarried.IRow = HumanCarried.CARRIES[carry];
    const body: IHumanBody = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;

    // With the carried person named, each holding hand goes where the
    // coupled carry lays the held region, in the carrier's own hips frame
    // (#3437); the carried body is never read, only its rest body.
    const of: string | undefined = context.params.of;
    const beside: string | undefined = context.params.beside;

    // With two helpers, the one whose carry is the other side of a
    // paired carry is the second; the meeting's kind is the first's.
    const first: HumanCarried.Carry | undefined =
      beside === undefined
        ? undefined
        : (Object.keys(HumanCarriedCoupling.PAIRED) as HumanCarried.Carry[]).find(
            (c: HumanCarried.Carry): boolean => HumanCarriedCoupling.PAIRED[c] === carry,
          );
    const role: string =
      first === undefined
        ? HumanCarriedCoupling.BEARER
        : HumanCarriedCoupling.SECOND;
    const keyed: HumanCarried.Carry = first ?? carry;
    const coupling: AutoMovieMotionMeeting.ICoupling | undefined =
      of === undefined
        ? undefined
        : context.meeting(
            HumanCarriedCoupling.kind(
              keyed,
              HumanCarried.CARRIES,
              context.params.mass,
              beside !== undefined,
            ),
            role,
            [
              { role: HumanCarriedCoupling.BORNE, subject: of },
              ...(beside === undefined
                ? []
                : [
                    {
                      role:
                        role === HumanCarriedCoupling.SECOND
                          ? HumanCarriedCoupling.BEARER
                          : HumanCarriedCoupling.SECOND,
                      subject: beside,
                    },
                  ]),
            ],
          ).coupling;
    const coupled: readonly [
      IAutoMovieVector3 | null,
      IAutoMovieVector3 | null,
    ] =
      coupling === undefined || of === undefined
        ? [null, null]
        : HumanCarriedCouplingPose.holds(
            context.performer(of).body,
            coupling,
            HumanCarried.CARRIES[keyed],
            role,
          );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      seconds,
      [{ name: "held", seconds: Math.min(seconds, HumanCarried.TAKE) }],
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    (["left", "right"] as const).forEach(
      (side: "left" | "right", index: number): void => {
        const hold: HumanCarried.IHold | null = row.holds[index] ?? null;
        if (hold === null) return;
        primitives.push(
          AutoMovieMotionHumanArm.carried({
            body,
            side,
            from: 0,
            to: seconds,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
            goal: (posture: IHumanPosture): IHumanPosture.IGoal => {
              const local: IAutoMovieVector3 | null = coupled[index] ?? null;
              if (local !== null) {
                const hips: IAutoMovieResolvedBone = HumanTrunk.resolve(
                  body,
                  posture,
                ).get("hips")!;
                return {
                  point: Vector3.add(
                    hips.worldPosition,
                    Quaternion.rotateVector(hips.worldRotation, local),
                  ),
                  bend: AutoMovieMotionHumanBend.hang(body, posture, side),
                };
              }
              return {
              point: Vector3.add(
                HumanCarriedBorne.placed(
                  body,
                  HumanTrunk.resolve(body, posture),
                  hold.region,
                  "carry",
                ),
                HumanFrame.point(
                  { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                  {
                    x: (side === "left" ? 1 : -1) * hold.offset.out * arm,
                    y: hold.offset.up * arm,
                    z: hold.offset.forward * arm,
                  },
                ),
              ),
              bend: AutoMovieMotionHumanBend.hang(body, posture, side),
              };
            },
            weight: (at: number): number =>
              clock.progress(AutoMovieMotionClock.START, "held", at),
          }),
        );
      },
    );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, seconds),
      clock,
      primitives,
    });
  }
}
