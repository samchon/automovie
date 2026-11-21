import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { Matrix4, Object3D } from "three";

import { autoMovieInspectionEntityPathOf } from "./autoMovieInspectionEntityPathOf.js";

type IFinding = IAutoMovieInspectionDiagnostics.IFinding;

/** Largest admitted deviation of a unit quaternion's length from 1. */
export const AUTOMOVIE_PLACED_FRAME_TOLERANCE: number = 1e-6;

/** Check name of the native placement findings. */
const NATIVE_CHECK: string = "placed-transform";

/** Shared message of a matrix authority that cannot be drawn. */
const MATRIX_ISSUE: string =
  "active matrix must be finite and affine, and invertible for a camera";

/** Message of each native placement field that can fail. */
const NATIVE_ISSUES: Readonly<
  Record<"matrix" | "matrixWorld" | "position" | "quaternion" | "scale", string>
> = {
  matrix: MATRIX_ISSUE,
  matrixWorld: MATRIX_ISSUE,
  position: "position components must be finite",
  quaternion: "rotation must be a finite unit quaternion",
  scale: "scale components must be finite and nonzero for a camera",
};

/** A native placement field that can fail. */
type INativeField = keyof typeof NATIVE_ISSUES;

/**
 * Report every visible displayed node and the delivery camera whose active
 * placement cannot be drawn.
 *
 * A node's active authority is its `matrixWorld` when that is not updated
 * automatically, else its `matrix` when that is not, else its position,
 * quaternion and scale. When the authority is valid, the displayed
 * `matrixWorld` the host settled is checked on its own, since a corrupt
 * ancestor can break it. Each finding names the node by
 * `autoMovieInspectionEntityPathOf`, so two same-named nodes never share an
 * identity, and the camera as `camera`.
 *
 * @param scene The settled scene; its visible nodes are inspected.
 * @param camera The delivery camera, inspected once whether or not it is in the scene.
 * @param findings Receives one finding per failed field.
 * @evidence contracts/development/common.md#meaningful-documentation States the authority order, the displayed-matrix check, the identity of each finding and the camera's own rules.
 * @evidence contracts/development/implementation.md#principled-implementation Validates exactly the values Three draws from: the manual matrix that overrides stale components, or the components, then the composed world matrix.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal over visible nodes plus the camera, one field list per node and one finding per field.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No matrix is recomposed, and a world matrix broken only by an invalid local field is reported once, at that field.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per visible node, plus the identity walk for each failing node only.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the world matrices the host settled and the shared entity identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Appends plain findings and keeps no reference to the scene.
 */
export function inspectAutoMovieNativePlacement(
  scene: Object3D,
  camera: Object3D,
  findings: IFinding[],
): void {
  scene.traverseVisible((object: Object3D): void => {
    if (object !== camera) inspectNode(scene, object, false, findings);
  });
  inspectNode(scene, camera, true, findings);
}

/**
 * Whether a matrix is finite and affine, with bottom row (0, 0, 0, 1).
 *
 * @param matrix The matrix to check.
 * @returns True when every element is finite and the bottom row is affine.
 * @evidence contracts/development/common.md#meaningful-documentation States the finiteness and bottom-row conditions.
 * @evidence contracts/development/implementation.md#principled-implementation Three stores matrices column-major, so elements 3, 7, 11 and 15 form the bottom row.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One finiteness scan and four comparisons.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance hides a projective row.
 * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen element reads.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by native placement and native contact frames.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and keeps nothing.
 */
export function isAutoMovieAffineMatrix(matrix: Matrix4): boolean {
  const elements: number[] = matrix.elements;
  return (
    elements.every(Number.isFinite) &&
    elements[3] === 0 &&
    elements[7] === 0 &&
    elements[11] === 0 &&
    elements[15] === 1
  );
}

/**
 * Whether all three components of a vector are finite.
 *
 * @param point The vector to check.
 * @returns True when x, y and z are finite.
 * @evidence contracts/development/common.md#meaningful-documentation States the condition.
 * @evidence contracts/development/implementation.md#principled-implementation Uses Number.isFinite, which refuses NaN and both infinities.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No component is coerced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by native placement and witness points.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and keeps nothing.
 */
export function isAutoMovieFiniteVector(point: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

/**
 * Append the findings of one node's failed placement fields.
 */
function inspectNode(
  scene: Object3D,
  object: Object3D,
  isCamera: boolean,
  findings: IFinding[],
): void {
  const authority: "matrixWorld" | "matrix" | undefined =
    !object.matrixWorldAutoUpdate
      ? "matrixWorld"
      : !object.matrixAutoUpdate
        ? "matrix"
        : undefined;
  const fields: INativeField[] = [];
  if (authority !== undefined) {
    if (!drawable(object[authority], isCamera)) fields.push(authority);
  } else {
    if (!isAutoMovieFiniteVector(object.position)) fields.push("position");
    if (
      !(
        Math.abs(object.quaternion.length() - 1) <=
        AUTOMOVIE_PLACED_FRAME_TOLERANCE
      )
    )
      fields.push("quaternion");
    const scale: IAutoMovieVector3 = object.scale;
    if (
      !isAutoMovieFiniteVector(scale) ||
      (isCamera && (scale.x === 0 || scale.y === 0 || scale.z === 0))
    )
      fields.push("scale");
  }
  // Valid local authority can still compose a corrupt displayed matrix through
  // an ancestor, so the drawn world matrix is checked on its own.
  if (
    fields.length === 0 &&
    authority !== "matrixWorld" &&
    !drawable(object.matrixWorld, isCamera)
  )
    fields.push("matrixWorld");
  if (fields.length === 0) return;
  const path: string = isCamera
    ? "camera"
    : autoMovieInspectionEntityPathOf(scene, object);
  for (const field of fields)
    findings.push({
      check: NATIVE_CHECK,
      key: "scene",
      code: "invalid-native-transform",
      paths: [`${path}.${field}`],
      category: "error",
      confidence: "confirmed",
      message: NATIVE_ISSUES[field],
      witness: {},
    });
}

/**
 * Whether a matrix can be drawn: affine and finite, and invertible for a camera.
 */
function drawable(matrix: Matrix4, isCamera: boolean): boolean {
  const determinant: number = isCamera ? matrix.determinant() : 1;
  return (
    isAutoMovieAffineMatrix(matrix) &&
    Number.isFinite(determinant) &&
    determinant !== 0
  );
}
