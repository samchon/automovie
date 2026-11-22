import { HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundPerformance } from "../../../../website/src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../../../../website/src/playground/structures/IPlaygroundComposition";

/** The film second the ridden horse sets off. */
const DEPART: number = 1;

/**
 * The playground passes a composition's named cue tracks to the performance and publishes each ridden animal's own gait changes as its `<subject>:gaits` track.
 *
 * Scenarios:
 *
 * 1. An authored track's instant resolves at its authored second.
 * 2. A ridden horse's walk-to-trot change resolves on its own gaits track after the horse sets off.
 * 3. A track the composition never names refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the composition, the two tracks and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the performance through the playground's public `PlaygroundPerformance.build` and resolves instants through the performance's own `instant`.
 * @evidence contracts/development/testing.md#independent-expectations The authored second is given; a horse cannot change gait before its course begins.
 * @evidence contracts/development/testing.md#distinguishing-cases An authored track, a published track and a missing one. The ride's gait instants themselves are pinned by the archetype ride specs.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only spec over the website's playground adapter.
 */
export function test_website_playground_cues(): void {
  const composition: IPlaygroundComposition = {
    version: 2,
    seed: "cues",
    performers: [
      {
        subject: "watcher",
        body: "m1",
        x: -3,
        z: 0,
        yaw: 0,
        proficiency: "trained",
        actions: [{ name: "stand", params: { seconds: 8 } }],
      } as IPlaygroundComposition.IPerformer,
    ],
    mutuals: [],
    objects: [
      {
        subject: "h0",
        producer: "createHorse",
        x: 0,
        z: 0,
        yaw: 0,
        course: {
          at: DEPART,
          legs: [
            { kind: "straight", length: 8, gait: "walk" },
            { kind: "straight", length: 12, gait: "trot" },
          ],
          cruise: 3.4,
          speeds: [1.6, 3.4],
          acceleration: 1.2,
          deceleration: 1.2,
          startFromStanding: true,
        },
      } as IPlaygroundComposition.IObject,
    ],
    cues: { stage: [{ name: "charge", seconds: 6 }] },
  };
  const built: ReturnType<typeof PlaygroundPerformance.build> =
    PlaygroundPerformance.build(composition);
  TestValidator.equals(
    "an authored track's instant resolves at its second",
    built.performance.instant({ of: "stage", event: "charge" }),
    6,
  );
  TestValidator.predicate(
    "the ridden horse's own gait change resolves on its gaits track after it sets off",
    built.performance.instant({ of: "h0:gaits", event: "gait:walk-trot" }) >
      DEPART,
  );
  let refusal: unknown;
  try {
    built.performance.instant({ of: "missing", event: "charge" });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an unnamed track refuses",
    refusal instanceof HumanRefusal,
  );
}
