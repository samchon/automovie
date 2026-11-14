import { createDrinkware } from "@automovie/archetypes";
import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
  type IHumanBody,
  type IHumanPosture,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person who picked a glass up drinks from it while walking: the drink,
 * performed over the walk, takes the holding hand over, the glass stays in
 * that hand through the whole film, and the other hand stays free.
 *
 * Scenarios, on the average man; a glass stands at waist height ahead, is
 * picked up with the right hand for its use (`pickUp` with `use`: the lip
 * at the mouth, the glass upright), as a person takes a glass to drink from
 * it and as the `test_human_motion_prop_held_attitude_*` specs take it, then the person
 * walks 2 m with a drink from that glass put over the walk. A glass taken by
 * a grip chosen for reach alone may leave no drinking arm at the lips; that
 * refusal is `test_human_motion_core_overlay_hold_refusal_drink`'s. One body is enough: the rule is the
 * grammar's (who carries the hand at each second), not a body's measure,
 * and each film of a drink over a walk costs a minute to place and read:
 * 1. The composition plans.
 * 2. Grip: from the end of the pick-up to the end of the film, read every
 *    sixth of a second, the glass's origin in the right hand's own frame
 *    stays within 1 mm of where it was when the pick-up ended (the
 *    campaign's bound on a grip's drift; a grip is a rigid relation, so no
 *    instant between two readings can hide a slide that returns).
 * 3. The glass is drunk from: at the end of the pick-up it is below the
 *    neck joint, and at some instant of the walk it is above it, where a
 *    mouth is.
 * 4. Continuity: from the film's start through the
 *    reach, the takeover and the 0.6 s after it, no joint centre jumps by
 *    more than the audit's 5 mm; and for 0.3 s either side of the drink's
 *    end, where it gives the hand back, the right wrist moves under 25 mm
 *    per 1/120 s (3 m/s, above any speed of a drinking hand, so only a step
 *    exceeds it).
 * 5. A wave of the free left hand over the same walk plans. That a wave of
 *    the holding hand is refused is
 *    `test_human_motion_core_overlay_hold_refusal_wave`'s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the chain through the public input and reads the displayed hand, the prop's displayed frame and the thrown refusal; a glass that slides in the hand, stays at the hip, a hand that steps at the takeover, or a free hand refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The 1 mm drift and the 5 mm step are the campaign's bounds; that a drink brings a glass above the neck is what drinking is; none is read from the overlay or the hold.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the hold before, under and after the overlay; the holding hand used for its prop and the free hand used beside it; the holding hand used for something else is `test_human_motion_core_overlay_hold_refusal_wave`'s. An overlay with empty hands is `test_human_motion_overlay_channels`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and one archetype and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, how the glass is taken and why, and the 5 scenarios with their bounds.
 */
export function test_human_motion_core_overlay_hold(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  for (const name of ["m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    // At waist height, a sixth of the stature ahead: well inside the arm's
    // reach. At hip height and 0.23 of the stature, a straight arm's length
    // away, the average man's pick-up itself stepped 145 mm at 0.18 s
    // (rightLowerArm), which is the pick-up's reach near its limit and not
    // this test's subject.
    const table: IAutoMovieVector3 = {
      x: 0.15,
      y: 0.58 * body.measure.stature,
      z: 0.17 * body.measure.stature,
    };
    const perform = (chain: HumanChain): HumanPerformance =>
      new HumanPerformance({
        seed: "overlay-hold",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
            at: table,
            yaw: 0,
          }),
        ],
        composition: chain.node,
      });
    const taking = (): HumanChain =>
      HumanChain.subject("a")
        .pickUp({
          prop: "glass",
          handle: "body",
          hand: "right",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
        .walk({ to: { x: 0, y: 0, z: 2 } });

    // 1. The drink over the walk plans.
    let film: HumanPerformance;
    try {
      film = perform(
        taking().over((u) =>
          u.handToFace({ task: "drink", side: "right", prop: "glass" }),
        ),
      );
    } catch (error) {
      complaints.push(
        `${name}: a drink from the held glass over a walk: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    // 2. The glass in the hand's frame.
    const inHand = (seconds: number): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = film
        .bones("a", seconds)
        .get("rightHand")!;
      const glass: IHumanProp.IFrame = film.prop("glass", seconds);
      return Quaternion.rotateVector(Quaternion.inverse(hand.worldRotation), {
        x: glass.position.x - hand.worldPosition.x,
        y: glass.position.y - hand.worldPosition.y,
        z: glass.position.z - hand.worldPosition.z,
      });
    };
    const taken: number = film.segments("a")[0]!.end;
    const seated: IAutoMovieVector3 = inHand(taken);
    let drift: { value: number; seconds: number } = { value: 0, seconds: 0 };
    for (let t: number = taken; t <= film.duration + 1e-9; t += 1 / 6) {
      const now: IAutoMovieVector3 = inHand(t);
      const value: number = Math.hypot(
        now.x - seated.x,
        now.y - seated.y,
        now.z - seated.z,
      );
      if (value > drift.value) drift = { value, seconds: t };
    }
    if (drift.value > 0.001)
      complaints.push(
        `${name}: the glass drifts ${mm(drift.value)} mm in the right hand's frame (at ${drift.seconds.toFixed(2)} s), within 1 mm expected`,
      );

    // 3. The glass reaches where a mouth is.
    const shown: HumanSignature.IReader = HumanSignature.of(film, "a", body, 0);
    const start: number =
      film.prop("glass", taken).position.y -
      HumanSignature.joint(shown, taken, "neck").y;
    let raised: number = -Infinity;
    for (let t: number = taken; t <= film.duration + 1e-9; t += 1 / 6)
      raised = Math.max(
        raised,
        film.prop("glass", t).position.y -
          HumanSignature.joint(shown, t, "neck").y,
      );
    if (!(start < 0 && raised > 0))
      complaints.push(
        `${name}: the glass ends the pick-up ${mm(start)} mm above the neck joint and rises to ${mm(raised)} mm above it during the walk; below the neck, then above it expected`,
      );

    // 4. No step as the hand is taken over and given back.
    if (name === "m-average") {
      // The audit reads the film from its start through the reach, the
      // takeover and the drink's way in, where the hand changes owner.
      const jump: ReturnType<
        typeof AutoMovieMotionHumanAuditContinuity.measure
      >["jump"] = AutoMovieMotionHumanAuditContinuity.measure(
        {
          duration: Math.min(film.duration, taken + 0.6),
          bones: (subject: string, seconds: number) =>
            film.bones(subject, seconds),
          segments: (subject: string) => film.segments(subject),
        },
        "a",
      ).jump;
      if (jump.value > 0.005) {
        // The right arm's joint angles at the readings 1/120 s apart around
        // the jump, so the row says which joint changed and by how much.
        const arm = (seconds: number, of: HumanPerformance = film): string =>
          (["rightUpperArm", "rightLowerArm", "rightHand"] as const)
            .map((bone): string => {
              const joint = of
                .pose("a", Math.max(0, seconds))
                .joints.find((j): boolean => j.bone === bone);
              return `${(joint?.flexion ?? 0).toFixed(1)}/${(joint?.abduction ?? 0).toFixed(1)}/${(joint?.twist ?? 0).toFixed(1)}`;
            })
            .join(" ");
        // The same reading on two films that each leave one thing out, so a
        // failing row says which part the step belongs to: the walk with
        // the held glass and no drink, and the drink over standing still.
        const apart = (other: HumanPerformance): string => {
          const read: ReturnType<
            typeof AutoMovieMotionHumanAuditContinuity.measure
          >["jump"] = AutoMovieMotionHumanAuditContinuity.measure(
            {
              duration: Math.min(other.duration, taken + 0.6),
              bones: (subject: string, seconds: number) =>
                other.bones(subject, seconds),
              segments: (subject: string) => other.segments(subject),
            },
            "a",
          ).jump;
          return `${mm(read.value)} mm at ${read.seconds.toFixed(3)} s (${read.where}), the arm around it ${[
            -1, 0, 1, 2,
          ]
            .map(
              (k: number): string => `[${arm(read.seconds + k / 120, other)}]`,
            )
            .join(" ")}, and as its action writes it before display ${[
            -1, 0, 1, 2,
          ]
            .map((k: number): string => {
              const written: IHumanPosture = other.posture(
                "a",
                read.seconds + k / 120,
              );
              const upper = written.joints.rightUpperArm;
              return written.limbs.rightArm !== undefined
                ? "[a goal]"
                : `[joints ${upper === undefined ? "none" : upper.map((v: number): string => v.toFixed(1)).join("/")}]`;
            })
            .join(" ")}`;
        };
        const parts = (): string => {
          try {
            return `; without the drink the same reading is ${apart(perform(taking()))}; with the drink over standing still it is ${apart(
              perform(
                HumanChain.subject("a")
                  .pickUp({ prop: "glass", handle: "body", hand: "right" })
                  .stand({ seconds: 2 })
                  .over((u) =>
                    u.handToFace({
                      task: "drink",
                      side: "right",
                      prop: "glass",
                    }),
                  ),
              ),
            )}; with the drink as an action of its own after the pick-up it is ${apart(
              perform(
                HumanChain.subject("a")
                  .pickUp({ prop: "glass", handle: "body", hand: "right" })
                  .handToFace({ task: "drink", side: "right", prop: "glass" }),
              ),
            )}`;
          } catch (error) {
            return `; the two part films: ${error instanceof Error ? error.message : String(error)}`;
          }
        };
        complaints.push(
          `${name}: a jump of ${mm(jump.value)} mm at ${jump.seconds.toFixed(3)} s (${jump.where}), within 5 mm expected; the pick-up ends at ${taken.toFixed(3)} s; the right upper arm, forearm and hand 1/120 s apart around it: ${[
            -2, -1, 0, 1, 2,
          ]
            .map((k: number): string => `[${arm(jump.seconds + k / 120)}]`)
            .join(" ")}${parts()}`,
        );
      }

      // Where the drink gives the hand back to the carry, the wrist is read
      // every 1/120 s: a hand in a drink moves under 3 m/s, 25 mm a reading.
      const given: number | undefined = film.overlays("a")[0]?.end;
      if (given !== undefined) {
        let step: { value: number; seconds: number } = { value: 0, seconds: 0 };
        let before: IAutoMovieVector3 | undefined;
        for (
          let t: number = Math.max(taken, given - 0.3);
          t <= Math.min(film.duration, given + 0.3) + 1e-9;
          t += 1 / 120
        ) {
          const now: IAutoMovieVector3 = film
            .bones("a", t)
            .get("rightHand")!.worldPosition;
          if (before !== undefined) {
            const value: number = Math.hypot(
              now.x - before.x,
              now.y - before.y,
              now.z - before.z,
            );
            if (value > step.value) step = { value, seconds: t };
          }
          before = now;
        }
        if (step.value > 0.025)
          complaints.push(
            `${name}: the right wrist moves ${mm(step.value)} mm in 1/120 s at ${step.seconds.toFixed(3)} s, as the drink gives the hand back at ${given.toFixed(3)} s; within 25 mm expected; the right upper arm, forearm and hand 1/120 s apart around it: ${[
              -2, -1, 0, 1, 2,
            ]
              .map(
                (k: number): string =>
                  `[${(["rightUpperArm", "rightLowerArm", "rightHand"] as const)
                    .map((bone): string => {
                      const joint = film
                        .pose("a", step.seconds + k / 120)
                        .joints.find((j): boolean => j.bone === bone);
                      return `${(joint?.flexion ?? 0).toFixed(1)}/${(joint?.abduction ?? 0).toFixed(1)}/${(joint?.twist ?? 0).toFixed(1)}`;
                    })
                    .join(" ")}]`,
              )
              .join(" ")}`,
          );
      }
    }

    // 5. The free hand is free.
    try {
      perform(taking().over((u) => u.gesture({ kind: "wave", side: "left" })));
    } catch (error) {
      complaints.push(
        `${name}: a wave of the free hand over the walk: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("a held prop is drunk from over a walk", complaints, []);
}
