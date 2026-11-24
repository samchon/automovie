import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { Matrix4, Object3D } from "three";

import { AUTOMOVIE_PLACED_FRAME_TOLERANCE } from "./AUTOMOVIE_PLACED_FRAME_TOLERANCE.js";
import { autoMovieInspectionEntityPathOf } from "./autoMovieInspectionEntityPathOf.js";
import { isAutoMovieAffineMatrix } from "./isAutoMovieAffineMatrix.js";

type IFinding = IAutoMovieInspectionDiagnostics.IFinding;

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
 * @param camera The delivery camera, inspected once whether or not it is in the
 *   scene.
 * @param findings Receives one finding per failed field.
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

/** Append the findings of one node's failed placement fields. */
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
    if (
      !(
        Math.abs(object.quaternion.length() - 1) <=
        AUTOMOVIE_PLACED_FRAME_TOLERANCE
      )
    )
      fields.push("quaternion");
    const scale: IAutoMovieVector3 = object.scale;
    if (isCamera && (scale.x === 0 || scale.y === 0 || scale.z === 0))
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
 * Whether a matrix can be drawn: affine and finite, and invertible for a
 * camera.
 */
function drawable(matrix: Matrix4, isCamera: boolean): boolean {
  const determinant: number = isCamera ? matrix.determinant() : 1;
  return isAutoMovieAffineMatrix(matrix) && determinant !== 0;
}
