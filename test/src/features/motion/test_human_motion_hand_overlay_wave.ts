import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A gesture, a rest place and a look are performed over a walk: the walk
 * keeps the pelvis and the legs, and the action over it takes only the
 * parts it moves (#3338, #3361).
 *
 * A person waves while walking past: the waving hand is up beside the head
 * and swings from side to side, and the gait under it is the gait it would
 * be without the wave.
 *
 * Scenarios, on the small woman and the average man, a 3 m walk:
 * 1. A right-hand wave over the walk plans and keeps the gesture's events
 *    (`prepare`, `strokeStart`, `strokeEnd`, `retract`) in order.
 * 2. Through the wave's stroke the right wrist is above the right shoulder
 *    joint, and it swings at least 30 mm from side to side in the body's
 *    own frame (provisional: a wave that reads as one moves the hand more
 *    than its own half breadth; no measured amplitude was read).
 * 3. The pelvis and both ankles are where the same walk without the wave
 *    has them, within a micrometre, at five instants of the stroke.
 * 4. A hand in the pocket and a look at a point ahead also plan over the
 *    walk, taking the right arm and hand, and the head.
 * 5. A bow over the walk is refused as a channel clash on `over`: it moves
 *    the root and the trunk, which a walk keeps.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the performances through the public chain and reads displayed joints; a gesture that cannot ride, a wave that does not show, a gait changed by the wave or a bow let through fails.
 * @evidence contracts/development/testing.md#independent-expectations A wave is a raised hand moving from side to side and a walk is carried by the legs, whatever the law; the 30 mm is provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases Three riding actions on different channels, the carrier compared with itself alone, and one action that must not ride.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds short walks; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_hand_overlay_wave(): void {
  const complaints: string[] = [];
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const perform = (composition: HumanChain): HumanPerformance =>
      new HumanPerformance({
        seed: "wave",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: composition.node,
      });
    const walk = (): HumanChain =>
      HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 3 } });

    // 1. The wave rides the walk and keeps its events.
    let waved: HumanPerformance;
    try {
      waved = perform(
        walk().over((u: HumanChain): HumanChain => u.gesture({ kind: "wave" })),
      );
    } catch (error) {
      complaints.push(
        `${name}: a wave over a walk: expected to plan, got ${(error as Error).message}`,
      );
      continue;
    }
    const over: HumanSegment.IOverlay = waved.overlays("a")[0]!;
    const instant = (event: string): number =>
      over.start +
      (over.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
        over.plan.duration;
    const order: number[] = [
      "prepare",
      "strokeStart",
      "strokeEnd",
      "retract",
    ].map(instant);
    if (
      !order.every(
        (seconds: number, i: number): boolean =>
          Number.isFinite(seconds) && (i === 0 || seconds >= order[i - 1]!),
      )
    )
      complaints.push(
        `${name}: the wave's events lie at ${order.map((s: number): string => s.toFixed(2)).join(", ")} s, four ordered instants expected`,
      );

    // 2. The stroke shows: the hand is up and swings.
    const reader: HumanSignature.IReader = HumanSignature.of(
      waved,
      "a",
      body,
      0,
    );
    const plain: HumanSignature.IReader = HumanSignature.of(
      perform(walk()),
      "a",
      body,
      0,
    );
    const from: number = instant("strokeStart");
    const to: number = instant("strokeEnd");
    let low: number = Infinity;
    let least: number = Infinity;
    let most: number = -Infinity;
    for (let i: number = 0; i <= 24; i++) {
      const seconds: number = from + ((to - from) * i) / 24;
      const wrist: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "rightHand",
      );
      const shoulder: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "rightUpperArm",
      );
      low = Math.min(low, wrist.y - shoulder.y);

      // The walk heads along +Z, so the body's side-to-side is the world's X.
      least = Math.min(least, wrist.x - shoulder.x);
      most = Math.max(most, wrist.x - shoulder.x);
    }
    if (!(low > 0))
      complaints.push(
        `${name}: the waving wrist is ${(low * 1000).toFixed(0)} mm above the shoulder at its lowest in the stroke, above it expected`,
      );
    if (!(most - least >= 0.03))
      complaints.push(
        `${name}: the waving wrist swings ${((most - least) * 1000).toFixed(0)} mm from side to side, at least 30 mm expected`,
      );

    // 3. The gait under the wave is the plain walk's.
    for (let i: number = 0; i < 5; i++) {
      const seconds: number = from + ((to - from) * i) / 4;
      for (const bone of ["hips", "leftFoot", "rightFoot"] as const) {
        const a: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          seconds,
          bone,
        );
        const b: IAutoMovieVector3 = HumanSignature.joint(plain, seconds, bone);
        const off: number = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        if (!(off <= 1e-6))
          complaints.push(
            `${name}: under the wave the ${bone} is ${(off * 1000).toFixed(4)} mm from the plain walk's at ${seconds.toFixed(2)} s, within 0.001 mm expected`,
          );
      }
    }

    // 4. A rest place and a look ride too.
    for (const [label, chain, channels] of [
      [
        "a hand in the pocket",
        walk().over(
          (u: HumanChain): HumanChain =>
            u.rest({ right: "pocket", seconds: 1 }),
        ),
        "rightHand,rightArm",
      ],
      [
        "a look ahead",
        walk().over(
          (u: HumanChain): HumanChain =>
            u.look({
              target: {
                kind: "point",
                at: { x: 0.3, y: 1.2, z: 6 },
                frame: "world",
              },
              with: "head",
            }),
        ),
        "head",
      ],
    ] as const)
      try {
        const taken: string = perform(chain).overlays("a")[0]!.channels.join();
        if (taken !== channels)
          complaints.push(
            `${name}: ${label} over a walk takes ${taken}, ${channels} expected`,
          );
      } catch (error) {
        complaints.push(
          `${name}: ${label} over a walk: expected to plan, got ${(error as Error).message}`,
        );
      }

    // 5. A bow does not ride a walk.
    let thrown: unknown = null;
    try {
      perform(
        walk().over((u: HumanChain): HumanChain => u.gesture({ kind: "bow" })),
      );
    } catch (error) {
      thrown = error;
    }
    if (
      !(thrown instanceof HumanRefusal) ||
      thrown.kind !== "channel" ||
      thrown.axis !== "over"
    )
      complaints.push(
        `${name}: a bow over a walk: expected a channel refusal on over, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("actions over a walk", complaints, []);
}
