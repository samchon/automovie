import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Fixed shadow strikes retain their authored goals and absolute-time playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public readers, authored events and out-of-order seeks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the raw goals and displayed canonical pose at launch, full delivery and recovery, then seeks the same events in reverse.
 * @evidence contracts/development/testing.md#independent-expectations A shadow strike has no partner contact and its kicking foot is replanted at completion. Authoring retains its explicit wrist and ankle goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the chambered kick and the shortened fist feint on a small and average figure respectively.
 * @evidence contracts/development/testing.md#execution-ownership Builds two real-body performances through the public chain and reads their public authoring and playback methods.
 */
export function test_motion_strike_shadow_strike_events(): void {
  for (const name of ["f-small", "m-average"] as const) {
    const chain = HumanChain.subject("actor").guard({ duration: 0.8 });
    const kicking: boolean = name === "f-small";
    const composition = kicking
      ? chain
          .kick({ technique: "round", at: { kind: "none" } })
          .until({ share: 0.05 })
          .kick({ technique: "round", at: { kind: "none", line: "low" } })
      : chain.punch({
          technique: "straight",
          at: { kind: "none" },
          feint: 0.6,
        });
    const film = new HumanPerformance({
      seed: "shadow-events",
      performers: [
        {
          subject: "actor",
          body: motionHumanBody(name),
          at: { x: 1, y: 0, z: 2 },
          yaw: 27,
          proficiency: { level: "trained" },
        },
      ],
      composition: composition.node,
    });
    const segment: IAutoMovieMotionHumanSegment = film
      .segments("actor")
      .at(-1)!;
    const seconds: number[] = segment.plan.events.map(
      (event): number => segment.start + event.share * segment.plan.duration,
    );
    const shown = seconds.map((at: number) => film.pose("actor", at));
    const authored: IAutoMovieMotionHumanPosture[] = seconds.map(
      (at: number): IAutoMovieMotionHumanPosture => film.posture("actor", at),
    );
    const final: IAutoMovieMotionHumanPosture = authored.at(-1)!;
    if (kicking)
      TestValidator.predicate(
        "both feet return to planted goals",
        final.limbs.leftLeg?.planted === true &&
          final.limbs.rightLeg?.planted === true,
      );
    else
      TestValidator.predicate(
        "the feint keeps both authored glove goals",
        final.limbs.leftArm !== undefined && final.limbs.rightArm !== undefined,
      );
    TestValidator.equals(
      "shadow-strike playback is independent of seek order",
      [...seconds]
        .reverse()
        .map((at: number) => film.pose("actor", at))
        .reverse(),
      shown,
    );
    TestValidator.equals(
      "raw authoring remains independently seekable",
      [...seconds]
        .reverse()
        .map((at: number) => film.posture("actor", at))
        .reverse(),
      authored,
    );
  }
}
