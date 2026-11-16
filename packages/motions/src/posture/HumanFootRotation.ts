import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Construct a foot's heading, roll and toes-up pitch on its canonical axes.
 *
 * @param heading Degrees about world +Y.
 * @param pitch Degrees, positive lifting the toes about the foot's lateral axis.
 * @param roll Degrees about the foot's forward axis; zero when absent.
 * @returns The same fresh normalized yaw-times-roll-times-negative-pitch quaternion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States raw axes, angular conventions, roll default, order and fresh output; the prepare companion documents fixed heading/roll and its varying toes-up pitch reader.
 * @evidence contracts/development/implementation.md#principled-implementation Raw construction uses yaw-times-roll, negative pitch and final normalization. prepare retains exactly that unnormalized prefix, then applies each negative pitch and the same normalization; prepared-axis readers preserve the engine's exact degree/half-angle and component arithmetic.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation owner serves the raw API and HumanFoot.preparePivot's fixed-prefix reader; only that reader retains the prefix, while Quaternion owns all axis-angle and normalization formulas.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither path adds prefix normalization, changes the foot convention, or caches a completed quaternion. Every varying angle is evaluated in the original order without skipping, clamping, sampling or rounding it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three private canonical axes prepare direction/length once. Raw rotation stays constant work; prepare computes its fixed prefix once, then each pitch retains actual trigonometry, one product and normalization. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Private canonical axes remain unchanged and unexposed. Each prepare reader belongs to its fixed heading and roll and must be recreated when either changes; every pitch still returns a fresh normalized result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The module retains three constant-size axis readers for its lifetime, and each rocker retains one private prefix/closure until released. Neither scope retains a body, target, queried output quaternion or queried-angle history.
 */
export function HumanFootRotation(
  heading: number,
  pitch: number,
  roll: number = 0,
): IAutoMovieQuaternion {
  return Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.multiply(HEADING(heading), ROLL(roll)),
      PITCH(-pitch),
    ),
  );
}

/**
 * Fixed-prefix preparation used by HumanFoot.preparePivot's repeated rocker
 * trials. Its scalar pitch reader retains only the rigid yaw/roll prefix,
 * separate from the varying angle and normalized rotation. Raw and prepared
 * construction use the same canonical axes and foot convention.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The prepare member documents its fixed heading/roll, varying pitch, exact output and owning-rocker lifetime.
 * @evidence contracts/development/design.md#principled-representation A scalar pitch reader retains only the rigid yaw/roll prefix, separate from the varying angle and final normalized rotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepare member serves HumanFoot.preparePivot's actual repeated rocker trials.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Raw and prepared construction share the canonical axes and multiplication/normalization owners, with no alternative foot convention or cached queried pose.
 */
export namespace HumanFootRotation {
  /**
   * Prepare a fixed heading and roll for repeated pitch queries.
   *
   * @param heading Fixed degrees about +Y.
   * @param roll Fixed degrees about the foot's forward axis.
   * @returns A reader of toes-up pitch in degrees with the raw rotation's result.
   *
   * The prefix stays unnormalized until the varying negative pitch is
   * multiplied into it. Changing heading or roll requires a new reader;
   * each pitch evaluates its actual trigonometry, product and normalization
   * and returns a fresh quaternion. The owning rocker releases this private
   * prefix/closure without retaining queried angles or completed rotations.
   */
  export function prepare(
    heading: number,
    roll: number,
  ): (pitch: number) => IAutoMovieQuaternion {
    const prefix: IAutoMovieQuaternion = Quaternion.multiply(HEADING(heading), ROLL(roll));
    return (pitch: number): IAutoMovieQuaternion => Quaternion.normalize(
      Quaternion.multiply(prefix, PITCH(-pitch)),
    );
  }
}

/** Private unchanged yaw axis shared only as axis-angle scalar preparation. */
const HEADING: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });

/** Private unchanged forward roll axis. */
const ROLL: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 0, y: 0, z: 1 });

/** Private unchanged lateral pitch axis; callers supply the original negative pitch. */
const PITCH: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 1, y: 0, z: 0 });
