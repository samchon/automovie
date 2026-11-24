import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanEnsemble,
  HumanRefusal,
  humanQueueAdvance,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../../internal/compositionIntents";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `humanQueueAdvance` advances a single-file queue by one place: the head walks
 * to the exit on the release cue, and each follower walks to the mark vacated
 * ahead of it once the walk ahead has ended and the wait has passed; the marks
 * are admitted first (`humanQueueMarks`).
 *
 * The ensemble's members carry whole bodies (`humanFixtureBody`), the record
 * `HumanEnsemble` resolves them into.
 *
 * Scenarios, three average men at 0, -1.1 and -2.6 m along Z, an exit at 1.3 m
 * and a 0.25 s wait, released on `counter.release`:
 *
 * 1. Each member walks once, the head to the exit, the second to the head's mark
 *    and the third to the second's, each walk named for its member.
 * 2. The head's walk is synchronised to the release; each follower's to the end of
 *    the walk ahead, 0.25 s after it.
 * 3. An exit 1 cm ahead of the head crowds the second rank and is refused on
 *    `queue` for it.
 */
export async function test_unit_motions_ensemble_human_queue_advance(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const marks: readonly number[] = [0, -1.1, -2.6];
  const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble({
    id: "queue",
    count: 3,
    seed: "queue",
    bodies: [body],
    places: (i: number): IAutoMovieMotionHumanEnsemble.IPlace => ({
      at: { x: 0, y: 0, z: marks[i]! },
      yaw: 0,
    }),
  });
  const composition: IAutoMovieComposition = humanQueueAdvance(ensemble, {
    on: { of: "counter", event: "release" },
    exit: { x: 0, y: 0, z: 1.3 },
    wait: 0.25,
  });
  const intents: IAutoMovieIntent[] = compositionIntents(composition);
  const walks: IAutoMovieIntent[] = intents.filter(
    (i: IAutoMovieIntent): boolean => i.capability === "walk",
  );
  const to: (z: number) => { to: IAutoMovieVector3 } = (
    z: number,
  ): { to: IAutoMovieVector3 } => ({ to: { x: 0, y: 0, z } });
  TestValidator.equals(
    "the walks",
    walks.map((i: IAutoMovieIntent): unknown[] => [
      i.subject,
      i.anchor,
      i.parameters?.params,
    ]),
    [
      ["queue.0", "queue.0.queueAdvance", to(1.3)],
      ["queue.1", "queue.1.queueAdvance", to(0)],
      ["queue.2", "queue.2.queueAdvance", to(-1.1)],
    ],
  );
  const syncs: (node: IAutoMovieComposition) => unknown[] = (
    node: IAutoMovieComposition,
  ): unknown[] =>
    node.kind === "intent"
      ? []
      : node.kind === "at"
        ? [
            [
              compositionIntents(node.part)[0]?.subject,
              node.anchor,
              node.event,
              node.offset,
            ],
            ...syncs(node.part),
          ]
        : node.parts.flatMap(syncs);
  TestValidator.equals("the syncs", syncs(composition), [
    ["queue.0", "counter", "release", 0],
    ["queue.1", "queue.0.queueAdvance", "end", 0.25],
    ["queue.2", "queue.1.queueAdvance", "end", 0.25],
  ]);
  let refusal: HumanRefusal | undefined;
  try {
    humanQueueAdvance(ensemble, {
      on: { of: "counter", event: "release" },
      exit: { x: 0, y: 0, z: 0.01 },
    });
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) refusal = error;
  }
  TestValidator.predicate(
    "a crowding exit",
    refusal?.axis === "queue" && refusal.performer === "queue.1",
  );
}
