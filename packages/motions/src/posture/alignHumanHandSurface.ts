import {
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Align the surface's normal exactly and its forward across that normal.
 * World-frame admission precedes rest-frame admission, as in HumanHand.align.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines direction frames, unit-free quaternion, parallel-forward failure order and prepare's copied fixed-rest directions, lazy admission and fresh world-query outputs.
 * @evidence contracts/development/implementation.md#principled-implementation Gram-Schmidt projects forward across normalized normal and composes world basis times inverse rest basis before original normalization. prepare shares only the fixed rest inverse, first demanded after a successful current world basis, preserving cold world-first admission.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared basis and composition owner serves cold and fixed-rest prepared alignment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps world-first evaluation, original 1e-9 parallel threshold, original error text and quaternion multiplication/normalization order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cold alignment builds two bases and one inverse/composition; across Q prepared calls the fixed rest basis/inverse runs once, while every actual world basis and product/normalization still executes. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both entry points use identical basis/composition owners. Copied fixed rest directions establish inverse equivalence and isolate edits; failed admission, world frames and aligned answers are never retained, and changed fixed directions need another producer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold alignment retains no state. A prepared action owns two fixed direction vectors and at most one successful inverse until release, returning fresh quaternions and retaining no body, world input, time history or external handle.
 */
export function alignHumanHandSurface(
  rest: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward">,
  world: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward">,
): IAutoMovieQuaternion {
  return composed(basis(world), Quaternion.inverse(basis(rest)));
}

/**
 * Fixed-rest alignment for repeated actual world direction pairs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents copied fixed directions, lazy world-first admission and fresh output per actual world frame.
 * @evidence contracts/development/design.md#principled-representation The unchanged rest direction frame determines one inverse basis while each world frame remains an actual independent input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared companion serves repeated grasp orientations without adding a pose, target or solver representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No world input, aligned result or numeric search history is stored.
 */
export namespace alignHumanHandSurface {
  /**
   * Prepare one copied rest frame while preserving world-first admission.
   *
   * The fixed frame is snapshotted; its basis is first demanded after a successful actual world basis, and failed rest admission is not cached.
   * Rest-basis inversion depends only on fixed normal/forward values, so one completed inverse is shared; every world basis and final original composition remains current.
   * One lazy inverse and the same basis/composition owners preserve the cold algorithm's failure and arithmetic order.
   * No failed admission, world basis, aligned answer, threshold change or alternate twist is retained or substituted.
   * Across Q reads the fixed rest basis/inverse runs once instead of Q times; every world basis and final quaternion product/normalization still executes, without a measured speedup claim.
   * Copied rest directions establish equivalence and isolate caller edits; changed fixed directions require a new producer, and world inputs are never compared or cached.
   * The owning action retains two fixed direction vectors and at most one completed inverse until release; no body, time history, world input or external handle is retained.
   */
  export function prepare(
    rest: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward">,
  ): (
    world: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward">,
  ) => IAutoMovieQuaternion {
    const fixed: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward"> =
      {
        normal: { ...rest.normal },
        forward: { ...rest.forward },
      };
    let inverse: IAutoMovieQuaternion | undefined;
    return (
      world: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward">,
    ): IAutoMovieQuaternion => {
      const into: IAutoMovieQuaternion = basis(world);
      return composed(into, (inverse ??= Quaternion.inverse(basis(fixed))));
    };
  }
}

/** Complete the original projected normal/forward basis, retaining its parallel refusal. */
function basis(
  frame: Pick<IAutoMovieMotionHumanHand.IFrame, "normal" | "forward">,
): IAutoMovieQuaternion {
  const n: IAutoMovieVector3 = Vector3.normalize(frame.normal);
  const across: IAutoMovieVector3 = Vector3.subtract(
    frame.forward,
    Vector3.scale(n, Vector3.dot(frame.forward, n)),
  );
  if (Vector3.length(across) < 1e-9)
    throw new Error("A forward direction must not be parallel to its normal");
  const f: IAutoMovieVector3 = Vector3.normalize(across);
  return quaternionFromAutoMovieBasis(n, f, Vector3.cross(n, f));
}

/** Keep normalization outside the same ordered world-times-inverse-rest product. */
function composed(
  world: IAutoMovieQuaternion,
  inverse: IAutoMovieQuaternion,
): IAutoMovieQuaternion {
  return Quaternion.normalize(Quaternion.multiply(world, inverse));
}
