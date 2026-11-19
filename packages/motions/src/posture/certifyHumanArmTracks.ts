import type { IAutoMovieMotionHumanArmTrajectory } from "@automovie/interface";

import { HumanArmGeometry } from "./HumanArmGeometry";
import { HumanArmTrajectoryModel } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";

/**
 * Read independently prepared arms as one trajectory on its original frame grid.
 *
 * @param context The complete coupled context, including its pace and swept pairs.
 * @param tracks Each candidate arm's clinical-angle reader, in context order.
 * @returns The coupled interpolant when it meets the full model, or undefined.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the complete coupled model, track order and admission result.
 * @evidence contracts/development/implementation.md#principled-implementation Encodes and projects the candidate onto the original hard ranges at the original grid, preserving the exact fixed endpoints. The site, pace, collision and sweep model then admits the coordinates used by playback.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build coupled coordinates, apply the existing model's verdict, and produce the original playback readers only on success.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses nonfinite coordinates. The original coupled pair and swept checks, fixed endpoints and tolerance remain authoritative. See Schulman et al. (2014), section IV-C, https://rll.berkeley.edu/~sachin/papers/Schulman-IJRR2014.pdf.
 * @evidence contracts/development/implementation.md#efficient-algorithms For A arms and T grid instants, evaluates O(A*T) input track samples, one unchanged coupled model evaluation and, on success, one playback construction per arm.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the original fine context, including bases, sites, ranges, collision topology and pace. No independent verdict replaces any coupled check.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate coordinates and the evaluation are local. Successful readers hold their own playback coordinates and setup; failed candidates retain nothing.
 */
export function certifyHumanArmTracks(
  context: HumanArmTrajectoryModel.IContext,
  tracks: readonly IAutoMovieMotionHumanArmTrajectory.Trajectory[],
): IAutoMovieMotionHumanArmTrajectory.Trajectory[] | undefined {
  const coordinates: number[][][] = tracks.map(
    (
      track: IAutoMovieMotionHumanArmTrajectory.Trajectory,
      arm: number,
    ): number[][] =>
      context.times.map((seconds: number, index: number): number[] =>
        index === 0
          ? [...context.rest[arm]!]
          : index === context.n - 1 && !context.open
            ? [...context.back[arm]!]
            : HumanArmTrajectoryModel.ranged(
                context,
                arm,
                HumanArmGeometry.encode(context.setups[arm]!, track(seconds)),
              ),
      ),
  );
  if (
    !coordinates.every((arm: number[][]): boolean =>
      arm.every((point: number[]): boolean => point.every(Number.isFinite)),
    ) ||
    !(
      HumanArmTrajectoryModel.evaluate(context, coordinates).worst.value <=
      HumanArmTrajectoryModel.TOLERANCE
    )
  )
    return undefined;
  return tracks.map(
    (
      _: IAutoMovieMotionHumanArmTrajectory.Trajectory,
      arm: number,
    ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
      HumanArmTrajectoryPlayback(
        context.setups,
        context.times,
        coordinates,
        arm,
      ),
  );
}
