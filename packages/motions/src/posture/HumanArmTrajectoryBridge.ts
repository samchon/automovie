import { minimumJerk } from "@automovie/engine";

import { HumanArmRefine } from "./HumanArmRefine";
import type { HumanArmTrajectoryEffector } from "./HumanArmTrajectoryEffector";

/**
 * Lay each arm on its carrier-relative contact path. A gap outside its
 * articulated domain follows the playback Hermite interpolant between the
 * surrounding reachable configurations. The caller admits the entire path.
 *
 * @param times Increasing frame seconds from lift to arrival.
 * @param ends The unchanged joint coordinates at both ends, in arm order.
 * @param solvers The prepared two-bone reach for each arm.
 * @param reference The joint-space transport defining the bend preference.
 * @returns Frame coordinates per arm when each moving arm has a reachable
 *   interior frame.
 */
export function HumanArmTrajectoryBridge(
  times: readonly number[],
  ends: readonly (readonly [readonly number[], readonly number[]])[],
  solvers: readonly ReturnType<typeof HumanArmTrajectoryEffector>[],
  reference: (arm: number, progress: number) => number[],
): number[][][] | undefined {
  const result: number[][][] = [];
  const end: number = times.length - 1;
  const progress: number[] = times.map((t: number): number =>
    minimumJerk.share((t - times[0]!) / (times[end]! - times[0]!)),
  );
  for (let arm: number = 0; arm < ends.length; ++arm) {
    const seconds: number[] = [times[0]!];
    const poses: number[][] = [[...ends[arm]![0]]];
    const frames: (number[] | undefined)[] = [poses[0]];
    for (let k: number = 1; k < end; ++k) {
      const pose: number[] | undefined = solvers[arm]!(
        progress[k]!,
        reference(arm, progress[k]!),
      );
      frames.push(pose);
      if (pose === undefined) continue;
      seconds.push(times[k]!);
      poses.push(pose);
    }
    if (poses.length === 1) return undefined;
    seconds.push(times[end]!);
    poses.push([...ends[arm]![1]]);
    frames.push(poses[poses.length - 1]);
    const curve: ReturnType<typeof HumanArmRefine.prepareHermite> | undefined =
      poses.length < frames.length
        ? HumanArmRefine.prepareHermite(seconds, poses)
        : undefined;
    result.push(
      frames.map(
        (pose: number[] | undefined, k: number): number[] =>
          pose ?? curve!(times[k]!).coordinates,
      ),
    );
  }
  return result;
}
