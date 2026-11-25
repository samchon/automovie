import type { IAutoMovieMotionHumanArmTrajectory } from "@automovie/interface";

import { HumanArmGeometry } from "./HumanArmGeometry";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";

/**
 * Read independently prepared arms as one trajectory on its original frame
 * grid.
 *
 * @param context The complete coupled context, including its pace and swept
 *   pairs.
 * @param tracks Each candidate arm's clinical-angle reader, in context order.
 * @returns The coupled interpolant when it meets the full model, or undefined.
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
    !(
      HumanArmTrajectoryModel.evaluate(context, coordinates).worst.value <=
      HumanArmTrajectoryModel.TOLERANCE
    )
  )
    return undefined;
  const rates: Knots.IRates = Knots.bounded(context, coordinates);
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
        rates,
      ),
  );
}
