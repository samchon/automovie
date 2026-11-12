import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person performs two actions at once on different parts of the body: the
 * overlaid action takes only the channels it claims, the carrier keeps the
 * rest untouched, and a combination no body could perform is refused with
 * both claims named.
 *
 * Reading something held up while walking is one person doing two things. The legs
 * and the pelvis walk exactly as they would without it; the reading
 * arm leaves its swing and comes up, the other arm keeps swinging; and the
 * arm comes in and goes out without a step in any joint's path.
 *
 * Scenarios, on the average man and the small woman, each walking 2 m with
 * and without the `read` task (a sheet or a screen held before the eyes) in
 * the right hand over the walk, held half a second:
 * 1. Unclaimed channels: at every twelfth of a second of the walk, the
 *    pelvis, hip, knee and ankle joint centres with the task are where
 *    they are without it, within a nanometre, and so is the free arm's
 *    hand.
 * 2. The claimed arm: once the hand is up (from the task's `ready` to its
 *    `relax`), the reading hand is above the elbow's height of quiet standing
 *    and ahead of the chest, where the swinging hand of the plain walk at
 *    the same instants hangs below the hip.
 * 3. The hand held with the trunk: over that span the reading hand's distance
 *    to the chest joint varies by less than 3 cm, though the body travels
 *    (texting walkers move the arm with the trunk, Schabrun, van den Hoorn,
 *    Moorcroft, Greenland and Hodges 2014; the 3 cm is provisional).
 * 4. Continuity, on the average man: no joint centre of the film with the
 *    task jumps by more than the audit's 5 mm, as the overlay comes in, runs
 *    and goes out.
 * 5. Refused, each as a `channel` refusal on `over` naming what clashes: a
 *    second task for the same hand while the first runs; an action that
 *    moves the whole body (`gesture`) put over a walk, listing the actions
 *    that can ride; a task put over an action that yields nothing (`sit`).
 * 6. The other hand at the same time is not a clash: a phone in the right
 *    hand and a drink in the left over one walk plan.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the compositions through the public chain and reads displayed joint centres and thrown refusals; an overlay that disturbs the legs, leaves the arm swinging, steps at its ends, or a clash that plans, fails.
 * @evidence contracts/development/testing.md#independent-expectations The unclaimed channels are compared with the same walk performed without the overlay, a metamorphic relation; where the phone hand is follows from what holding a phone up is; the refusals follow from one hand doing one thing.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; claimed against unclaimed channels; the overlay's start, span and end; three kinds of clash and one combination that is not a clash.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the 6 scenarios and the source and provisional bound of the trunk-held hand.
 */
export function test_human_overlay_channels(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const perform = (chain: HumanChain): HumanPerformance =>
      new HumanPerformance({
        seed: "overlay",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });
    const walk = (): HumanChain =>
      HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 2 } });
    const plain: HumanPerformance = perform(walk());
    const reading: HumanPerformance = perform(
      walk().over((u) =>
        u.handToFace({ task: "read", side: "right", seconds: 0.5 }),
      ),
    );
    const without: HumanSignature.IReader = HumanSignature.of(
      plain,
      "a",
      body,
      0,
    );
    const withTask: HumanSignature.IReader = HumanSignature.of(
      reading,
      "a",
      body,
      0,
    );
    const walking: number = plain.duration;

    // 1. The carrier's own channels, and the free arm, are untouched.
    const UNCLAIMED: readonly AutoMovieHumanoidBone[] = [
      "hips",
      "leftUpperLeg",
      "rightUpperLeg",
      "leftLowerLeg",
      "rightLowerLeg",
      "leftFoot",
      "rightFoot",
      "leftHand",
    ];
    let worst: { moved: number; where: string } = { moved: 0, where: "" };
    for (let t: number = 0; t <= walking; t += 1 / 12)
      for (const bone of UNCLAIMED) {
        const moved: number = gap(
          HumanSignature.joint(without, t, bone),
          HumanSignature.joint(withTask, t, bone),
        );
        if (moved > worst.moved)
          worst = { moved, where: `${bone} at ${t.toFixed(2)} s` };
      }
    if (worst.moved > 1e-9)
      complaints.push(
        `${name}: the task moves an unclaimed joint by ${mm(worst.moved)} mm (${worst.where}), nothing expected`,
      );

    // 2 and 3. The phone hand is up, ahead of the chest, and held with it.
    const task = reading.overlays("a")[0];
    if (task === undefined) {
      complaints.push(`${name}: the performance holds no overlay`);
      continue;
    }
    const instant = (event: string): number =>
      task.start +
      (task.plan.events.find((e): boolean => e.name === event)?.share ?? 0) *
        task.plan.duration;
    const from: number = instant("ready");
    const to: number = Math.min(walking, instant("relax"));
    const elbowAtRest: number = HumanSignature.joint(
      without,
      0,
      "rightLowerArm",
    ).y;
    const reaches: number[] = [];
    for (let t: number = from; t <= to; t += 1 / 12) {
      const hand: IAutoMovieVector3 = HumanSignature.joint(
        withTask,
        t,
        "rightHand",
      );
      const chest: IAutoMovieVector3 = HumanSignature.joint(
        withTask,
        t,
        "chest",
      );
      const swinging: IAutoMovieVector3 = HumanSignature.joint(
        without,
        t,
        "rightHand",
      );
      if (!(hand.y > elbowAtRest && hand.z > chest.z))
        complaints.push(
          `${name}: at ${t.toFixed(2)} s the reading hand is ${mm(hand.y - elbowAtRest)} mm above the resting elbow and ${mm(hand.z - chest.z)} mm ahead of the chest, both positive expected`,
        );
      if (!(swinging.y < HumanSignature.joint(without, t, "hips").y))
        complaints.push(
          `${name}: at ${t.toFixed(2)} s the plain walk's hand does not hang below the hip`,
        );
      reaches.push(gap(hand, chest));
    }
    if (reaches.length < 3)
      complaints.push(
        `${name}: the hand is up for ${reaches.length} samples of the walk, at least 3 expected`,
      );
    else if (Math.max(...reaches) - Math.min(...reaches) > 0.03)
      complaints.push(
        `${name}: the reading hand's distance to the chest varies by ${mm(Math.max(...reaches) - Math.min(...reaches))} mm while it is up, under 30 mm expected (Schabrun et al. 2014)`,
      );

    // 4. No step in any joint's path; read on one body, since the reading
    // resolves every departing interval and a second body repeats it.
    if (name === "m-average") {
      const jump = AutoMovieMotionHumanAuditContinuity.measure(
        reading,
        "a",
      ).jump;
      if (jump.value > 0.005)
        complaints.push(
          `${name}: a jump of ${mm(jump.value)} mm at ${jump.seconds.toFixed(2)} s (${jump.where}), within 5 mm expected`,
        );
    }

    // 5. What no body performs is refused with what clashes.
    const chair: seated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    for (const [label, chain, names] of [
      [
        "one hand for two tasks",
        walk()
          .over((u) => u.handToFace({ task: "phone", side: "right" }))
          .over((u) => u.handToFace({ task: "drink", side: "right" })),
        ["rightArm", "handToFace"],
      ],
      [
        "a whole-body action over a walk",
        walk().over((u) => u.gesture({ kind: "wave" })),
        ["gesture", "handToFace"],
      ],
      [
        "a task over an action that yields nothing",
        HumanChain.subject("a")
          .sit({ seat: chair })
          .over((u) => u.handToFace({ task: "phone" })),
        ["sit"],
      ],
    ] as const) {
      let thrown: unknown = null;
      try {
        perform(chain);
      } catch (error) {
        thrown = error;
      }
      if (
        !(thrown instanceof HumanRefusal) ||
        thrown.kind !== "channel" ||
        thrown.axis !== "over" ||
        !names.every((n: string): boolean =>
          (thrown as HumanRefusal).message.includes(n),
        )
      )
        complaints.push(
          `${name}: ${label}: expected a channel refusal on over naming ${names.join(" and ")}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
        );
    }

    // 6. Two hands, two tasks.
    try {
      perform(
        walk()
          .over((u) => u.handToFace({ task: "phone", side: "right" }))
          .over((u) => u.handToFace({ task: "drink", side: "left" })),
      );
    } catch (error) {
      complaints.push(
        `${name}: a phone in one hand and a drink in the other: expected to plan, got ${(error as Error).message}`,
      );
    }
  }
  TestValidator.equals("an overlay and its carrier", complaints, []);
}
