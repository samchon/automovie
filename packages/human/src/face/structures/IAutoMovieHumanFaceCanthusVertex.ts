/**
 * A canthus registered as one fixed skin vertex, used only where no
 * extreme-type definition exists.
 *
 * @evidence contracts/common.md#principled-implementation The vertex discriminant identifies a fixed source sample whose current posed position the reader uses when no extreme definition exists.
 * @evidence contracts/common.md#clear-and-simple-design A kind/index pair supplies correspondence while containing margins supply host and anatomical corner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This source registration is not personal vertex editing or nearest-point fitting, and it does not pretend to follow a changing extreme rule.
 * @evidence contracts/common.md#meaningful-documentation The comment states the absent-extreme premise and members identify kind and margin-surface index domain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type performs no position reading or corner registration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fixed identity caches no changing posed coordinate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns one scalar index and no source buffer/task is acquired here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCanthusVertex {
  /** Discriminant of the fixed-vertex definition. */
  kind: "vertex";

  /** Skin vertex index of the canthus, on the margins' surface. */
  vertex: number;
}
