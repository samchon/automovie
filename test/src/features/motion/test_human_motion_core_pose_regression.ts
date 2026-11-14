import { TestValidator } from "@nestia/e2e";

import CORPUS from "../internal/MOTION_HUMAN_POSE_CORPUS.json";
import { motionHumanPoseCorpus } from "../internal/motionHumanPoseCorpus";

/**
 * The pose solver's cost work changes no pose: a small fixed corpus of
 * displayed poses (`motionHumanPoseCorpus`: a pick-up, a walk and a punch on
 * the average man and the small woman, each with the other as partner, read
 * at half and three quarters of the film) gives every joint's three clinical
 * angles exactly as the solver gave them before that work.
 *
 * Scenarios:
 * 1. The corpus holds the same poses under the same names, in order.
 * 2. Every angle of every joint is the recorded number, compared exactly
 *    (`===`: the same double, the two zeros alike since JSON keeps no sign
 *    of zero), and a joint the recording left unset is still unset.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws through the public performance and reads the displayed pose's joints; a solver change that moves any angle by any amount fails with the pose, the bone and both numbers.
 * @evidence contracts/development/testing.md#independent-expectations Limitation: the expected values are recorded from the code itself before the cost work (#3517), a regression oracle that pins behaviour, not a reference of what a pose should be; that is what a change meant to be behaviour-identical has to keep, and the corpus is kept small.
 * @evidence contracts/development/testing.md#distinguishing-cases A hand fitted to a requested rotation (the pick-up), planted legs (the walk) and a strike on a partner (the punch), each on two bodies of opposite build at two instants.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and reads twelve poses in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the corpus, the oracle's provenance and the 2 scenarios.
 */
export function test_human_motion_core_pose_regression(): void {
  const recorded: motionHumanPoseCorpus.IPose[] =
    // The recording is the reader's own output, written as JSON.
    CORPUS as unknown as motionHumanPoseCorpus.IPose[];
  const read: motionHumanPoseCorpus.IPose[] = motionHumanPoseCorpus.read();
  const complaints: string[] = [];

  // 1. The same poses.
  const names = (poses: motionHumanPoseCorpus.IPose[]): string =>
    poses.map((p: motionHumanPoseCorpus.IPose): string => p.name).join(" | ");
  if (names(read) !== names(recorded))
    complaints.push(
      `the corpus reads ${names(read)}, recorded ${names(recorded)}`,
    );

  // 2. Every angle, bit for bit.
  recorded.forEach((was: motionHumanPoseCorpus.IPose, i: number): void => {
    const now: motionHumanPoseCorpus.IPose | undefined = read[i];
    if (now === undefined) return;
    const bones: string[] = [
      ...new Set<string>([
        ...Object.keys(was.joints),
        ...Object.keys(now.joints),
      ]),
    ];
    for (const bone of bones)
      for (let k: number = 0; k < 3; k++) {
        const a: number | null | undefined = was.joints[bone]?.[k];
        const b: number | null | undefined = now.joints[bone]?.[k];
        // JSON keeps no sign of zero, so the two zeros are one value here;
        // every other double is compared exactly.
        if (a !== b)
          complaints.push(
            `${was.name} ${bone}[${k}]: ${String(b)}, recorded ${String(a)}`,
          );
      }
  });
  TestValidator.equals(
    "the corpus poses as recorded",
    complaints.slice(0, 40),
    [],
  );
}
