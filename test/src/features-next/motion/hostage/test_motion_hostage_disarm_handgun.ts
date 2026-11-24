import { createHandgun, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanDisarm,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The pair's separation, metres: inside a forearm grab. */
const APART: number = 0.75;
/** A carried prop rides its hand rigidly within this, metres: the worn-prop bound. */
const RIGID: number = 0.002;
/** One disarm case: the defender's body, the armed partner's body and the weapon. */
type ICase = readonly [
  defender: Cast,
  armed: Cast,
  kind: IAutoMovieMotionHumanDisarm.Kind,
];

/** A canonical polygon man. */
type Cast = Parameters<typeof motionHumanBody>[0];

/** The handgun, on the smaller defender; the knife spec covers the other pair. */
const CASES: readonly ICase[] = [["f-small", "m-average", "handgun"]];

/** Samples per custody span. */
const SAMPLES: number = 6;

/**
 * A handgun taken from a resisting partner, on the smaller defender.
 *
 * Scenarios:
 * 1. Before the take the weapon rides the partner's hand rigidly; from the
 *    take it rides the defender's hand rigidly, so it has exactly one owner
 *    at every sampled instant and never jumps at the change.
 * 2. The partner's `disarmed` opens its hand at the defender's `taken`.
 * 3. A partner who holds no weapon is refused.
 * 4. The take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the transfers and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered disarm and disarmed rows through HumanPerformance and reads the weapon against both hands and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The separation is authored; the rigid bound is the worn-prop bound.
 * @evidence contracts/development/testing.md#distinguishing-cases A knife and a handgun, two body pairs, a refused unarmed partner.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_hostage_disarm_handgun(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [defenderLabel, armedLabel, kind] of CASES) {
    const label: string = `${defenderLabel} takes a ${kind}`;
    const defender: IAutoMovieMotionHumanBody = motionHumanBody(defenderLabel);
    const armed: IAutoMovieMotionHumanBody = motionHumanBody(armedLabel);
    try {
      const film: HumanPerformance = perform(defender, armed, kind, true);
      const take: IAutoMovieMotionHumanSegment = film
        .segments("d")
        .find((s: IAutoMovieMotionHumanSegment): boolean => s.id === "take")!;
      const taken: number =
        take.start +
        take.plan.duration *
          take.plan.events.find((e): boolean => e.name === "taken")!.share;
      const inHand: (subject: string, t: number) => IAutoMovieRigidTransform = (
        subject: string,
        t: number,
      ): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(
          HumanPropFrame.bone(film.bones(subject, t).get("rightHand")!),
          film.prop("weapon", t),
        );
      const before: IAutoMovieRigidTransform = inHand("a", take.start);
      const after: IAutoMovieRigidTransform = inHand("d", taken + 0.01);
      for (let i: number = 0; i < SAMPLES; ++i) {
        const t: number =
          take.start + ((taken - 0.01 - take.start) * i) / (SAMPLES - 1);
        checks.check(
          `${label}: the partner owns the weapon at ${t.toFixed(2)}`,
          Vector3.distance(inHand("a", t).position, before.position) <= RIGID,
        );
        const u: number =
          taken + 0.01 + ((film.duration - taken - 0.01) * i) / (SAMPLES - 1);
        checks.check(
          `${label}: the defender owns the weapon at ${u.toFixed(2)}`,
          Vector3.distance(inHand("d", u).position, after.position) <= RIGID,
        );
      }
      const released: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "disarmed",
        )!;
      const opens: number =
        released.start +
        released.plan.duration *
          released.plan.events.find((e): boolean => e.name === "released")!
            .share;
      checks.check(
        `${label}: the partner's hand opens at the take (${(opens - taken).toFixed(3)} s)`,
        Math.abs(opens - taken) <= 1e-6,
      );
      assertTakeClean(label, film);
    } catch (error: unknown) {
      checks.check(`${label} refused: ${String(error)}`, false);
    }
    let refusal: unknown = undefined;
    try {
      perform(defender, armed, kind, false);
    } catch (error: unknown) {
      refusal = error;
    }
    checks.check(
      `${label}: an unarmed partner is refused: ${String(refusal)}`,
      refusal instanceof HumanRefusal,
    );
  }
  checks.assert("disarm");
}

/** A defender facing a partner who picks the weapon up (or not), then the disarm. */
function perform(
  defender: IAutoMovieMotionHumanBody,
  armed: IAutoMovieMotionHumanBody,
  kind: IAutoMovieMotionHumanDisarm.Kind,
  arm: boolean,
): HumanPerformance {
  const model:
    | ReturnType<typeof createSword>
    | ReturnType<typeof createHandgun> =
    kind === "knife"
      ? createSword({ kind: "knife" })
      : createHandgun({ frame: "compact" });
  const grip: IAutoMovieVector3 = model.affordance("grip").frame.translation;
  const weapon: IAutoMovieMotionHumanProp = HumanObject.prop("weapon", model, {
    // Beside the armed partner's right hip: the partner faces -Z (yaw 180),
    // so its right lies toward +X.
    position: {
      x: 0.2 * armed.measure.stature,
      y: 0.55 * armed.measure.stature,
      z: APART - 0.3 - grip.y,
    },
    rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
  });
  const partner: IAutoMovieMotionHumanChain = arm
    ? HumanChain.subject("a")
        .pickUp({ prop: "weapon", handle: "grip", hand: "right" })
        .stand({ hold: 0.4, sway: 0 })
        .registered("disarmed", { partner: "d", of: "take" })
    : HumanChain.subject("a").stand({ hold: 3, sway: 0 });
  return new HumanPerformance({
    seed: "disarm-" + kind,
    laws: Object.values(HUMAN_LEXICON).flat(),
    props: [weapon],
    performers: [
      {
        subject: "d",
        body: defender,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "a",
        body: armed,
        at: { x: 0, y: 0, z: APART },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("d")
      .stand({ hold: 2.5, sway: 0 })
      .registered("disarm", { partner: "a", prop: "weapon", kind }, "take")
      .with(partner).node,
  });
}
