import { createAutoMovieClosedSphereGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";

/**
 * Full-sphere source closure preserves the original tessellation and UV channels.
 * Scenarios:
 * 1. Glove, eye and pupil segment populations keep every original triangle.
 * 2. Only the known final longitude's position/normal samples change.
 * 3. The exact original UV/index buffers and non-seam vertices remain intact.
 * 4. Fractional and minimum segment requests retain Three's normalization.
 * 5. Small and large representable radii retain their original channel bytes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public Viewer primitive and compares original channel bytes with Three's corresponding construction, admitting only the mathematically identical final longitude samples. It catches triangle deletion, UV welding, changed detail, radius or non-seam coordinates.
 * @evidence contracts/development/testing.md#independent-expectations A full latitude-longitude grid has (width+1)(height+1) source vertices and 6*width*(height-1) indices. Existing Three supplies unchanged source channel bytes; periodic parameter identity independently requires each final longitude to equal its first sample. Byte checks deliberately establish exact data retention rather than approximate geometric equality.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all three actual consumer resolutions, fractional radius, representable radii from 1e-30 to 1e30 and subminimum/fractional segment normalization. The separate public Engine test owns manifold admission after rigid transforms and invalid input refusal.
 * @evidence contracts/development/testing.md#execution-ownership The named discoverable unit executes portable Three buffers and public Viewer source without a process, browser, GPU, installation or renderer. Each allocated geometry is retired in finally; no cases are registered dynamically.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Glove, eye and pupil segment populations keep every original triangle.).
 */
export function test_viewer_closed_sphere_geometry_channels(): void {
  for (const [radius, sourceWidth, sourceHeight] of [
    [1, 16, 12],
    [1, 12, 8],
    [1, 10, 6],
    [0.7, 2.9, 1.9],
    [1, -4, -9],
    [1e-30, 16, 12],
    [1e30, 16, 12],
  ] as const) {
    const original: THREE.SphereGeometry = new THREE.SphereGeometry(
      radius,
      sourceWidth,
      sourceHeight,
    );
    const closed: THREE.SphereGeometry = createAutoMovieClosedSphereGeometry(
      radius,
      sourceWidth,
      sourceHeight,
    );
    try {
      const width: number = Math.max(3, Math.floor(sourceWidth));
      const height: number = Math.max(2, Math.floor(sourceHeight));
      TestValidator.equals(
        "original source vertex count",
        closed.getAttribute("position").count,
        (width + 1) * (height + 1),
      );
      TestValidator.equals(
        "original triangle/index population",
        closed.index!.count,
        6 * width * (height - 1),
      );
      sameBytes(
        "original index order",
        original.index!.array,
        closed.index!.array,
      );
      sameBytes(
        "original UV split",
        (original.getAttribute("uv") as THREE.BufferAttribute).array,
        (closed.getAttribute("uv") as THREE.BufferAttribute).array,
      );
      for (const name of ["position", "normal"] as const) {
        const source: Float32Array = (
          original.getAttribute(name) as THREE.BufferAttribute
        ).array as Float32Array;
        const expected: Float32Array = source.slice();
        for (let row: number = 0; row <= height; row++) {
          const first: number = row * (width + 1) * 3;
          const last: number = first + width * 3;
          expected.set(source.subarray(first, first + 3), last);
        }
        sameBytes(
          `only periodic ${name} endpoints`,
          expected,
          (closed.getAttribute(name) as THREE.BufferAttribute).array,
        );
      }
      TestValidator.predicate(
        "original constructor radius",
        nclose(closed.parameters.radius, radius, 0),
      );
    } finally {
      original.dispose();
      closed.dispose();
    }
  }
}

/** Exact buffer preservation is a byte-level contract, independent of float tolerances. */
function sameBytes(
  name: string,
  expected: THREE.TypedArray,
  actual: THREE.TypedArray,
): void {
  TestValidator.equals(
    name,
    Buffer.compare(
      Buffer.from(expected.buffer, expected.byteOffset, expected.byteLength),
      Buffer.from(actual.buffer, actual.byteOffset, actual.byteLength),
    ),
    0,
  );
}
