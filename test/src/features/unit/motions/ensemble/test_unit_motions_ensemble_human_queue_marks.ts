import type {
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, humanQueueMarks } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A rank's shoulder half width and upper arm radius, metres. */
const SHOULDER: number = 0.2;
const ARM: number = 0.05;

/**
 * `humanQueueMarks` admits a single-file queue's release: head first on one
 * level line toward the exit, every rank fully performed, a nonnegative wait,
 * and each pair of neighbours at least their summed shoulder radii apart
 * (`HumanCrowd.half`, here 0.25 m each, so 0.5 m a pair) both where they stand
 * and once each has taken the mark ahead, the head the exit. It returns each
 * rank's distance along the line.
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
export function test_unit_motions_ensemble_human_queue_marks(): void {
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
      if (error instanceof HumanRefusal)
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
