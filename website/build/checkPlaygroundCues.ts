import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";

/** The film second the ridden horse sets off. */
const DEPART: number = 1;

/**
 * Verify that the playground passes a composition's named cue tracks to the
 * performance and publishes each ridden animal's own gait changes as its
 * `<subject>:gaits` track.
 *
 * Scenarios:
 * 1. An authored track's instant resolves at its authored second.
 * 2. A ridden horse's walk-to-trot change, from its course's walking and
 *    trotting speeds, resolves on its own gaits track after the horse sets
 *    off. The ride's gait instants themselves are pinned by the archetype
 *    ride specs.
 * 3. A track the composition never names refuses.
 */
export function checkPlaygroundCues(): void {
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
            { kind: "straight", length: 8 },
            { kind: "straight", length: 12 },
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
  const built: PlaygroundPerformance.IBuilt =
    PlaygroundPerformance.build(composition);
  assert.equal(
    built.performance.instant({ of: "stage", event: "charge" }),
    6,
    "an authored track's instant resolves at its second",
  );
  assert.ok(
    built.performance.instant({ of: "h0:gaits", event: "gait:walk-trot" }) >
      DEPART,
    "the ridden horse's own gait change resolves on its gaits track after it sets off",
  );
  assert.throws(
    (): number => built.performance.instant({ of: "missing", event: "charge" }),
    (error: unknown): boolean => error instanceof AutoMovieMotionHumanRefusal,
    "an unnamed track refuses",
  );
}
