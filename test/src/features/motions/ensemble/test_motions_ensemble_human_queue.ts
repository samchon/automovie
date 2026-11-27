import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanEnsemble
} from "../../../../../packages/motions/src/ensemble/internal/HumanEnsemble";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  humanQueueAdvance
} from "../../../../../packages/motions/src/ensemble/internal/humanQueueAdvance";
import {
  humanQueueMarks
} from "../../../../../packages/motions/src/ensemble/internal/humanQueueMarks";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../internal/compositionIntents";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

namespace part_human_queue_advance {
  /**
   * `humanQueueAdvance` advances a single-file queue by one place: the head
   * walks to the exit on the release cue, and each follower walks to the mark
   * vacated ahead of it once the walk ahead has ended and the wait has passed;
   * the marks are admitted first (`humanQueueMarks`).
   *
   * The ensemble's members carry whole bodies (`humanFixtureBody`), the record
   * `HumanEnsemble` resolves them into.
   *
   * Scenarios, three average men at 0, -1.1 and -2.6 m along Z, an exit at 1.3
   * m and a 0.25 s wait, released on `counter.release`:
   *
   * 1. Each member walks once, the head to the exit, the second to the head's mark
   *    and the third to the second's, each walk named for its member.
   * 2. The head's walk is synchronised to the release; each follower's to the end
   *    of the walk ahead, 0.25 s after it.
   * 3. An exit 1 cm ahead of the head crowds the second rank and is refused on
   *    `queue` for it.
   */
  export async function verify(): Promise<void> {
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
      node.type === "intent"
        ? []
        : node.type === "at"
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
    let refusal: AutoMovieMotionHumanRefusal | undefined;
    try {
      humanQueueAdvance(ensemble, {
        on: { of: "counter", event: "release" },
        exit: { x: 0, y: 0, z: 0.01 },
      });
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) refusal = error;
    }
    TestValidator.predicate(
      "a crowding exit",
      refusal?.axis === "queue" && refusal.performer === "queue.1",
    );
  }
}

namespace part_human_queue_marks {
  /** A rank's shoulder half width and upper arm radius, metres. */
  const SHOULDER: number = 0.2;
  const ARM: number = 0.05;

  /**
   * `humanQueueMarks` admits a single-file queue's release: head first on one
   * level line toward the exit, every rank fully performed, a nonnegative wait,
   * and each pair of neighbours at least their summed shoulder radii apart
   * (`HumanCrowd.half`, here 0.25 m each, so 0.5 m a pair) both where they
   * stand and once each has taken the mark ahead, the head the exit. It returns
   * each rank's distance along the line.
   *
   * Scenarios, three ranks 0.6 m apart along -Z from the head at the origin and
   * an exit 0.6 m ahead along +Z:
   *
   * 1. The marks are 0, -0.6 and -1.2 m.
   * 2. An exit only 0.3 m ahead leaves the second rank 0.3 m behind the head after
   *    the release and is refused on `queue` for it.
   * 3. An exit on the head's own mark is refused on `exit`.
   * 4. A second rank 0.1 m off the line, a reversed second and third rank, and a
   *    population second rank are refused on `queue`, naming the rank.
   * 5. A negative wait is refused on `wait`, and an empty queue on `queue`.
   */
  export function verify(): void {
    const rank: (
      subject: string,
      at: IAutoMovieVector3,
      detail?: IAutoMovieMotionHumanEnsemble.Detail,
    ) => humanQueueMarks.IMember = (
      subject: string,
      at: IAutoMovieVector3,
      detail: IAutoMovieMotionHumanEnsemble.Detail = "full",
    ): humanQueueMarks.IMember => ({
      subject,
      place: { at, yaw: 0 },
      detail,
      body: { measure: { shoulderHalfWidth: SHOULDER, upperArmRadius: ARM } },
    });
    const a: humanQueueMarks.IMember = rank("a", { x: 0, y: 0, z: 0 });
    const b: humanQueueMarks.IMember = rank("b", { x: 0, y: 0, z: -0.6 });
    const c: humanQueueMarks.IMember = rank("c", { x: 0, y: 0, z: -1.2 });
    const exit: IAutoMovieVector3 = { x: 0, y: 0, z: 0.6 };
    TestValidator.equals(
      "the marks",
      humanQueueMarks([a, b, c], { exit }),
      [0, -0.6, -1.2],
    );
    const refused: (
      members: readonly humanQueueMarks.IMember[],
      to: IAutoMovieVector3,
      wait?: number,
    ) => string = (
      members: readonly humanQueueMarks.IMember[],
      to: IAutoMovieVector3,
      wait?: number,
    ): string => {
      try {
        humanQueueMarks(
          members,
          wait === undefined ? { exit: to } : { exit: to, wait },
        );
      } catch (error: unknown) {
        if (error instanceof AutoMovieMotionHumanRefusal)
          return `${error.axis}:${error.performer}`;
      }
      return "admitted";
    };
    TestValidator.equals(
      "refusals",
      [
        refused([a, b, c], { x: 0, y: 0, z: 0.3 }),
        refused([a, b, c], { x: 0, y: 0, z: 0 }),
        refused([a, rank("b", { x: 0.1, y: 0, z: -0.6 }), c], exit),
        refused([a, c, b], exit),
        refused([a, rank("b", { x: 0, y: 0, z: -0.6 }, "population"), c], exit),
        refused([a, b, c], exit, -1),
        refused([], exit),
      ],
      ["queue:b", "exit:a", "queue:b", "queue:b", "queue:b", "wait:", "queue:"],
    );
  }
}

/**
 * `HumanQueue`'s unit contract: its marks and advance.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `human_queue_advance`: `humanQueueAdvance` advances a single-file queue by
 *   one place:
 * - `human_queue_marks`: `humanQueueMarks` admits a single-file queue's release:
 */
export async function test_motions_ensemble_human_queue(): Promise<void> {
  await part_human_queue_advance.verify();
  part_human_queue_marks.verify();
}
