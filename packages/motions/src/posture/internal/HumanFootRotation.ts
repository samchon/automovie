import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

/*
 * Construct a foot's heading, roll and toes-up pitch on its canonical axes.
 * Parameter heading: Degrees about world +Y.
 * Parameter pitch: Degrees, positive lifting the toes about the foot's lateral
 * axis.
 * Parameter roll: Degrees about the foot's forward axis; zero when absent.
 * Returns: The same fresh normalized yaw-times-roll-times-negative-pitch
 * quaternion.
 */
export function HumanFootRotation(
  heading: number,
  pitch: number,
  roll: number = 0,
): IAutoMovieQuaternion {
  return AutoMovieEngineQuaternion.normalize(
    AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.multiply(HEADING(heading), ROLL(roll)),
      PITCH(-pitch),
    ),
  );
}

/*
 * Fixed-prefix preparation used by HumanFoot.preparePivot's rocker trials and a
 * stance's toe-pad turn. Its scalar pitch reader retains only the rigid
 * yaw/roll prefix, separate from the varying angle and normalized rotation. Raw
 * and prepared construction use the same canonical axes and foot convention.
 */
export namespace HumanFootRotation {
  /*
   * Prepare a fixed heading and roll for repeated pitch queries.
   * Parameter heading: Fixed degrees about +Y.
   * Parameter roll: Fixed degrees about the foot's forward axis.
   * Returns: A reader of toes-up pitch in degrees with the raw rotation's
   * result.
   *
   * The prefix stays unnormalized until the varying negative pitch is
   * multiplied into it. Changing heading or roll requires a new reader; each
   * pitch evaluates its actual trigonometry, product and normalization and
   * returns a fresh quaternion. The owning rocker releases this private
   * prefix/closure without retaining queried angles or completed rotations.
   */
  export function prepare(
    heading: number,
    roll: number,
  ): (pitch: number) => IAutoMovieQuaternion {
    const prefix: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      HEADING(heading),
      ROLL(roll),
    );
    return (pitch: number): IAutoMovieQuaternion =>
      AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(prefix, PITCH(-pitch)));
  }
}

/*
 * Private unchanged yaw axis shared only as axis-angle scalar preparation.
 */
const HEADING: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
  AutoMovieEngineQuaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });

/*
 * Private unchanged forward roll axis.
 */
const ROLL: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
  AutoMovieEngineQuaternion.prepareAxisAngle({ x: 0, y: 0, z: 1 });

/*
 * Private unchanged lateral pitch axis; callers supply the original negative
 * pitch.
 */
const PITCH: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
  AutoMovieEngineQuaternion.prepareAxisAngle({ x: 1, y: 0, z: 0 });
