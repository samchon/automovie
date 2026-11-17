import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanFootSurface } from "../generation/IAutoMovieHumanFootSurface";
import type { IAutoMovieHumanNeckSurface } from "../generation/IAutoMovieHumanNeckSurface";
import type { IAutoMovieHumanBindBone } from "./IAutoMovieHumanBindBone";
import type { IAutoMovieHumanBonePlacement } from "./IAutoMovieHumanBonePlacement";
import type { IAutoMovieHumanPoseClamp } from "./IAutoMovieHumanPoseClamp";

/**
 * Registered-body bind/posed skeleton snapshots, clinical clamps and reusable projection evaluators.
 *
 * The interface package owns these declarations; AutoMovieHumanSkeleton in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Registered-body bind/posed skeleton snapshots, clinical clamps and reusable projection evaluators. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOutput, IPrepareOptions declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOutput, IPrepareOptions separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanSkeleton exchanges the named IOutput, IPrepareOptions contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanSkeleton {
  /** Stickman skeleton at its bind and under the requested pose.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Stickman skeleton at its bind and under the requested pose.
   * @evidence contracts/development/design.md#principled-representation `bones`: Bones at the bind, the achieved posture, in metres, parent before child. `posed`: Registered-body placement of every bone under `params.pose`, in the order of `bones`; no scene transform is applied. `clamped`: Pose fields whose requested value lay outside the range and was clamped.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanCanonicalBody.display, AutoMovieHumanSkeleton.generate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `neckSurface`: Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. `footSurface`: Deeply frozen canonical foot courses shared by this fixed body's evaluations.
   */
  export interface IOutput {
    /** Bones at the bind, the achieved posture, in metres, parent before child. */
    bones: IAutoMovieHumanBindBone[];

    /** Registered-body placement of every bone under `params.pose`, in the order of `bones`; no scene transform is applied. */
    posed: IAutoMovieHumanBonePlacement[];

    /** Pose fields whose requested value lay outside the range and was clamped. */
    clamped: IAutoMovieHumanPoseClamp[];

    /** Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. */
    readonly neckSurface?: Readonly<IAutoMovieHumanNeckSurface.IOutput>;

    /** Deeply frozen canonical foot courses shared by this fixed body's evaluations. */
    readonly footSurface?: Readonly<IAutoMovieHumanFootSurface.IOutput>;
  }

  /** The options argument of AutoMovieHumanSkeleton.prepare. Prepare one fixed body's joints, clinical axes and mm-to-metre scales once.
  The returned evaluator reuses the existing channel/clamp/FK code and owns
  joint arrays/maps, compiled canonical readers and one private local/world
  placement cache, optional exterior neck data and scales. Its optional project
  capability compiles requested bones and their ancestors for numerical trials,
  retaining all channel clamps while omitting rest/exterior snapshot copies. Each evaluation
  reads all current scalar values; identical applied local controls and parent
  placement reuse exact branch arithmetic. Public tuples/arrays are copied,
  so caller mutation and later evaluations cannot change earlier snapshots.
  The calibration and input are not retained. Recreate when the body changes.
  Exterior admission runs only when requested; ordinary skeleton generation does not depend on it. Foot courses are deeply frozen once and shared, rather than copied during every numerical FK evaluation.
  @param params Fixed body input; each evaluation supplies its own public pose.
  @param options Explicit exterior-display admission; omitted by one-shot generation.
  @returns Reusable clinical evaluator with independent output arrays and optional neck snapshots.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare one fixed body's joints, clinical axes and mm-to-metre scales once.
 * @evidence contracts/development/design.md#principled-representation `neckSurface`: Include the independent exterior-display descriptor; omitted or false skips its admission and materialization. `footSurface`: Include frozen canonical foot courses and actual source landmark addresses; omitted or false skips their materialization. `calibration`: The body already calibrated from these same `params`; omission recalibrates, while a supplied value must describe the same body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSkeleton.IPrepareOptions is the canonical exchange used by AutoMovieHumanSkeleton.prepare.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `neckSurface`: Include the independent exterior-display descriptor; omitted or false skips its admission and materialization. `footSurface`: Include frozen canonical foot courses and actual source landmark addresses; omitted or false skips their materialization. `calibration`: The body already calibrated from these same `params`; omission recalibrates, while a supplied value must describe the same body.
 */
  export type IPrepareOptions = {
    /** Include the independent exterior-display descriptor; omitted or false skips its admission and materialization. */ neckSurface?: boolean;
    /** Include frozen canonical foot courses and actual source landmark addresses; omitted or false skips their materialization. */ footSurface?: boolean;
    /** The body already calibrated from these same `params`; omission recalibrates, while a supplied value must describe the same body. */ calibration?: IAutoMovieHumanBodyCalibration;
  };
}
