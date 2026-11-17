import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanParameters } from "../IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanFootSurface } from "../generation/IAutoMovieHumanFootSurface";
import type { IAutoMovieHumanNeckSurface } from "../generation/IAutoMovieHumanNeckSurface";

/** Type contracts exchanged by AutoMovieHumanSkeleton; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSkeleton {
  /** Stickman skeleton at its bind and under the requested pose.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Stickman skeleton at its bind and under the requested pose.
   * @evidence contracts/development/design.md#principled-representation `bones`: Bones at the bind, the achieved posture, in metres, parent before child. `posed`: World placement of every bone under `params.pose`, in the order of `bones`. `clamped`: Pose fields whose requested value lay outside the range and was clamped.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanCanonicalBody.display, AutoMovieHumanSkeleton.generate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `neckSurface`: Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. `footSurface`: Deeply frozen canonical foot courses shared by this fixed body's evaluations.
   */
  export interface IOutput {
    /** Bones at the bind, the achieved posture, in metres, parent before child. */
    bones: IBone[];

    /** World placement of every bone under `params.pose`, in the order of `bones`. */
    posed: IPlacement[];

    /** Pose fields whose requested value lay outside the range and was clamped. */
    clamped: IClamp[];

    /** Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. */
    readonly neckSurface?: Readonly<IAutoMovieHumanNeckSurface.IOutput>;

    /** Deeply frozen canonical foot courses shared by this fixed body's evaluations. */
    readonly footSurface?: Readonly<IAutoMovieHumanFootSurface.IOutput>;
  }

  /** One bone at rest.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One bone at rest.
   * @evidence contracts/development/design.md#principled-representation `bone`: Bone id. `parent`: Parent bone, or null for the root. `position`: Joint centre at the achieved bind, metres in Human registered coordinates (+X forward, +Y up, +Z anatomical left).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanCanonicalBody.bones, AutoMovieHumanSkeleton.rest.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `parent`, `position`, `tip`, `radius`; callers supply the complete record.
   */
  export interface IBone {
    /** Bone id. */
    bone: string;

    /** Parent bone, or null for the root. */
    parent: string | null;

    /** Joint centre at the achieved bind, metres in Human registered coordinates (+X forward, +Y up, +Z anatomical left). */
    position: AutoMovieVector3Tuple;

    /** End of a leaf bone's drawn segment in registered bind coordinates, metres; null when child joints terminate its drawn segments. */
    tip: AutoMovieVector3Tuple | null;

    /** Skin girth radius of the segment leaving the joint, metres. */
    radius: number;
  }

  /** One bone's world placement: geometry at the bind moves rigidly with it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One bone's world placement: geometry at the bind moves rigidly with it.
   * @evidence contracts/development/design.md#principled-representation `bone`: Bone id. `position`: Joint position in Human registered body coordinates, metres (+X forward, +Y up, +Z anatomical left); no authored scene transform is applied. `rotation`: Unit quaternion `[x, y, z, w]` rotating the achieved bind geometry into this placement in Human registered coordinates; identity leaves the bind orientation unchanged.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanCanonicalBody.posed, AutoMovieHumanPreparedKinematics.posed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `position`, `rotation`; callers supply the complete record.
   */
  export interface IPlacement {
    /** Bone id. */
    bone: string;

    /** Joint position in Human registered body coordinates, metres (+X forward, +Y up, +Z anatomical left); no authored scene transform is applied. */
    position: AutoMovieVector3Tuple;

    /** Unit quaternion `[x, y, z, w]` rotating the achieved bind geometry into this placement in Human registered coordinates; identity leaves the bind orientation unchanged. */
    rotation: AutoMovieQuaternionTuple;
  }

  /** A requested pose value replaced by its range limit.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A requested pose value replaced by its range limit.
   * @evidence contracts/development/design.md#principled-representation `path`: Field path with the side resolved, such as `legs.left.knee.flexion`. `requested`: Requested clinical channel value: degrees for angular channels, millimetres for jaw opening, protrusion and lateral excursion. `applied`: Value applied after the channel range clamp, in the same units as requested.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.readApplied. Also types AutoMovieHumanPreparedKinematics.clamped.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `path`, `requested`, `applied`; callers supply the complete record.
   */
  export interface IClamp {
    /** Field path with the side resolved, such as `legs.left.knee.flexion`. */
    path: string;

    /** Requested clinical channel value: degrees for angular channels, millimetres for jaw opening, protrusion and lateral excursion. */
    requested: number;

    /** Value applied after the channel range clamp, in the same units as requested. */
    applied: number;
  }

  /** Independent requested placements and every canonical clamp, without exterior/rest materialization.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Independent requested placements and every canonical clamp, without exterior/rest materialization.
   * @evidence contracts/development/design.md#principled-representation `posed`: Requested bones in canonical parent-before-child order; arrays and tuples are owned. `clamped`: All requested out-of-range clinical fields, including those outside the selected branches.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanSkeleton.output.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `posed`, `clamped`; callers supply the complete record.
   */
  export interface IProjection {
    /** Requested bones in canonical parent-before-child order; arrays and tuples are owned. */
    posed: IPlacement[];

    /** All requested out-of-range clinical fields, including those outside the selected branches. */
    clamped: IClamp[];
  }

  /** A fixed bone selection, with fresh results under every current input pose. Omitted pose means an empty clinical pose (neutral); omitted clamp is true.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A fixed bone selection, with fresh results under every current input pose.
   * @evidence contracts/development/design.md#principled-representation A fixed bone selection, with fresh results under every current input pose. The callable takes pose (optional), clamp (optional) and returns IProjection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSkeleton.ProjectionEvaluator is the canonical exchange used by AutoMovieHumanSkeleton.prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSkeleton.prepare for a fixed bone selection, with fresh results under every current input pose.
   */
  export type ProjectionEvaluator = (
    pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
    clamp?: boolean,
  ) => IProjection;

  /** One body's clinical evaluator; public full results always own fresh mutable snapshots.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One body's clinical evaluator; public full results always own fresh mutable snapshots.
   * @evidence contracts/development/design.md#principled-representation `project`: Compile exact existing output bones and their dependencies once.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSkeleton.prepare. Also types AutoMovieHumanSkeleton.evaluate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `project`: Compile exact existing output bones and their dependencies once.
   */
  export interface PoseEvaluator {
    /** Evaluate all bones, bind data, clamps and requested exterior snapshots. Omitted pose is neutral ({}); omitted clamp is true. */
    (
      pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
      clamp?: boolean,
    ): IOutput;

    /** Compile exact existing output bones and their dependencies once. Empty selections and absent bone names throw; custom evaluators may omit this capability. */
    project?: (bones: readonly string[]) => ProjectionEvaluator;
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
