import * as fs from "node:fs";
import * as path from "node:path";

import { motionHumanPoseCorpus } from "../features/internal/motionHumanPoseCorpus";

/**
 * Records the pose regression corpus, `MOTION_HUMAN_POSE_CORPUS.json` in
 * `src/features/internal`: the poses `motionHumanPoseCorpus.read` gives on
 * the code as it stands, written as the compact JSON
 * `test_human_motion_core_pose_regression` compares against.
 *
 * A re-recording pins whatever the code now does, so it is run only once the
 * cause of every moved angle is a verified fix, and committed on its own
 * with that reason.
 *
 * Run with `pnpm --filter @automovie/test record:pose-corpus`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is written, where, in which form, when it may be run and how.
 * @evidence contracts/development/implementation.md#principled-implementation The recording is the spec's own reader's output, so the oracle and the reading cannot drift apart.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one write.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle is rounded, filtered or edited between the reader and the file.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the corpus once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The cases and the reading are `motionHumanPoseCorpus`'s.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A one-shot script.
 */
const main = (): void => {
  // The script runs from the test package (`pnpm --filter`), bundled into bin.
  const file: string = path.join(
    process.cwd(),
    "src",
    "features",
    "internal",
    "MOTION_HUMAN_POSE_CORPUS.json",
  );
  const poses: motionHumanPoseCorpus.IPose[] = motionHumanPoseCorpus.read();
  fs.writeFileSync(file, JSON.stringify(poses), "utf8");
  console.log(`recorded ${poses.length} poses into ${file}`);
};

main();
