import { buildInstancedFormation } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  InstancedMesh,
  Matrix4,
  type Object3D,
  PerspectiveCamera,
} from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { nclose } from "../internal/predicates";

/**
 * Keep a sparse slot on the current lattice and draw batches whose changed positions enter the camera.
 *
 * Scenarios:
 * 1. A line re-forms toward a column while its middle slot steps laterally. Its two untouched neighbours keep the analytic blended positions.
 * 2. Separate short-range cameras see a re-formed neighbour and the distant sparse member. The original line is outside either camera.
 * 3. An out-of-order seek restores the current reform and sparse displacement without changing index ownership.
 * 4. A later cue reuses the same target at identical progress and starts from a different lattice.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the arrangement, sparse offset, camera conditions and reverse seek cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses compiled formation data, seeks the real rendering owner and inspects its instance matrices and actual selected mesh visibility.
 * @evidence contracts/development/testing.md#independent-expectations The halfway column puts the three depth positions at 0, 50 and 100 metres. The middle slot's independent offset reaches 150 metres laterally. Cameras frame those points from 10 metres away with a 20-metre far plane.
 * @evidence contracts/development/testing.md#distinguishing-cases A camera at the re-formed neighbour catches static chunk bounds. A camera on the displaced member also lies outside the re-formed base bounds. A same-target same-progress seek still distinguishes different starting arrangements.
 * @evidence contracts/development/testing.md#execution-ownership Owns one deterministic compact fixture and Three scene objects, disposes the runtime and runs without a browser or GPU. Asserts CPU batch admission and matrices, not rendered pixels.
 */
export function test_viewer_formation_reform_sparse_bounds(): void {
  const input: Parameters<typeof buildInstancedFormation>[0] =
    createFormationShadowInputs(3, false);
  input.motions = [
    {
      id: "column-reform",
      formation: input.formation.id,
      action: "hold",
      layout: {
        kind: "column",
        files: 1,
        ranks: 3,
        spacing: { lateral: 1, depth: 100 },
      },
      start: 0,
      end: 1,
      from: {
        translation: { x: 0, y: 0, z: 0 },
        facingOffsetDeg: 0,
        spacingScale: { lateral: 1, depth: 1 },
      },
      to: {
        translation: { x: 0, y: 0, z: 0 },
        facingOffsetDeg: 0,
        spacingScale: { lateral: 1, depth: 1 },
      },
      easing: "linear",
    },
  ];
  const first: NonNullable<typeof input.motions>[number] = input.motions[0]!;
  input.motions = [
    first,
    {
      ...first,
      id: "longer-column",
      start: 1,
      end: 2,
      layout: {
        kind: "column",
        files: 1,
        ranks: 3,
        spacing: { lateral: 1, depth: 200 },
      },
    },
    { ...first, id: "return-to-column", start: 2, end: 3 },
  ];
  input.slotMotions = [
    {
      id: "middle-steps-out",
      formation: input.formation.id,
      slots: [1],
      start: 0,
      end: 1,
      from: { present: true, offset: { x: 0, y: 0, z: 0 }, facingOffsetDeg: 0 },
      to: { present: true, offset: { x: 300, y: 0, z: 0 }, facingOffsetDeg: 0 },
      easing: "linear",
    },
  ];
  const runtime: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(input);
  const mesh: Object3D | undefined = runtime.object.children[0];
  if (!(mesh instanceof InstancedMesh)) throw new Error("Expected one batch");
  const camera: PerspectiveCamera = new PerspectiveCamera(40, 1, 0.1, 20);
  const matrix: Matrix4 = new Matrix4();
  const sample: (seconds: number, x: number, z: number) => void = (
    seconds: number,
    x: number,
    z: number,
  ): void => {
    camera.position.set(x, 0, z + 10);
    camera.lookAt(x, 0, z);
    runtime.update(camera, 720, seconds);
  };
  try {
    sample(0, 0, 100);
    TestValidator.equals(
      "original line lies outside the short frustum",
      mesh.visible,
      false,
    );
    sample(0.5, 0, 100);
    TestValidator.equals("column enters the short frustum", mesh.visible, true);
    for (const [index, x, z] of [
      [0, -0.005, 0],
      [1, 150, 50],
      [2, 0.005, 100],
    ] as const) {
      mesh.getMatrixAt(index, matrix);
      TestValidator.predicate(
        `halfway slot ${index} keeps its reform placement`,
        nclose(matrix.elements[12]!, x) && nclose(matrix.elements[14]!, z),
      );
    }
    sample(0.5, 150, 50);
    TestValidator.equals(
      "sparse offset alone reaches its camera",
      mesh.visible,
      true,
    );
    sample(1, 300, 100);
    sample(0.5, 150, 50);
    mesh.getMatrixAt(1, matrix);
    TestValidator.predicate(
      "reverse seek restores the sparse slot in the same index",
      mesh.visible &&
        nclose(matrix.elements[12]!, 150) &&
        nclose(matrix.elements[14]!, 50),
    );
    sample(2.5, 0, 300);
    mesh.getMatrixAt(2, matrix);
    TestValidator.predicate(
      "the same target and progress interpolate from the new starting column",
      mesh.visible && nclose(matrix.elements[14]!, 300),
    );
  } finally {
    runtime.dispose();
  }
}
