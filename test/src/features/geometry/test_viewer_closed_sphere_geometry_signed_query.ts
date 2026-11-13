import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { createAutoMovieClosedSphereGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";

/**
 * The complete original sphere supports native signed surface queries after WORLD transforms.
 * Scenarios:
 * 1. Every actual resolution is admitted as a closed oriented manifold.
 * 2. Translated, rotated and anisotropically scaled vertices preserve closure.
 * 3. Interior and exterior signs retain their geometric meaning.
 * 4. Defaults and malformed constructor domains remain explicit.
 * 5. Finite radii whose actual stored output overflows or collapses refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Passes every original vertex and triangle from the public Viewer primitive through the public Engine signed query. Independent inside/outside points test its orientation after an actual rigid matrix and positive scale; no topology guard or foreign method is replaced. Unrepresentable radii must throw before any unusable geometry reaches a consumer.
 * @evidence contracts/development/testing.md#independent-expectations The sphere origin is interior and twice its radius along negative X is exterior. Every tested even latitude grid contains the longitude-zero negative-X radius vertex. Positive scale and a rigid transform preserve inside/outside relations; the unscaled unit-radius exterior distance is one within 1e-10. Float32 cannot retain radii above its maximum or below its minimum positive value; a radius of one minimum subnormal cannot retain a 16-longitude ring without coincident indexed vertices. This is numeric source verification rather than observed film contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the three consumer resolutions, identity and oblique WORLD matrices, default dimensions, nonpositive/nonfinite radius, finite overflow/underflow, Float32 subnormal triangle collapse and nonfinite segment counts. The channels unit owns accepted 1e-30 and 1e30 radius preservation. Current actor support, articulated contact and moving Viewer quality remain their real-consumer checks.
 * @evidence contracts/development/testing.md#execution-ownership The named discoverable unit uses CPU-only Three transforms and Engine queries without starting a browser, GPU, process or native build. Geometry ownership ends in finally and no live query or scene escapes. The root dynamic test runner and its unchanged test_*.ts selector discover this separate export.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Every actual resolution is admitted as a closed oriented manifold.).
 */
export function test_viewer_closed_sphere_geometry_signed_query(): void {
  for (const [width, height] of [
    [16, 12],
    [12, 8],
    [10, 6],
    [3, 2],
    [32, 16],
  ] as const) {
    const geometry: THREE.SphereGeometry = createAutoMovieClosedSphereGeometry(
      1,
      width,
      height,
    );
    try {
      const matrices: THREE.Matrix4[] = [
        new THREE.Matrix4(),
        new THREE.Matrix4().compose(
          new THREE.Vector3(0.02, 1.5934276504, 0.02),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.6, -0.3)),
          new THREE.Vector3(0.105, 0.095, 0.095),
        ),
      ];
      for (const [index, matrix] of matrices.entries()) {
        const query: ReturnType<typeof createAutoMovieSignedMeshQuery> =
          createAutoMovieSignedMeshQuery(worldMesh(geometry, matrix));
        const inside: THREE.Vector3 = new THREE.Vector3().applyMatrix4(matrix);
        const outside: THREE.Vector3 = new THREE.Vector3(-2, 0, 0).applyMatrix4(
          matrix,
        );
        TestValidator.predicate(
          "transformed origin remains interior",
          query(inside.toArray()).signedDistance < 0,
        );
        TestValidator.predicate(
          "transformed exterior remains outside",
          query(outside.toArray()).signedDistance > 0,
        );
        if (index === 0)
          TestValidator.predicate(
            "unit-sphere exterior metric",
            nclose(query(outside.toArray()).distance, 1, 1e-10),
          );
      }
    } finally {
      geometry.dispose();
    }
  }
  const defaults: THREE.SphereGeometry = createAutoMovieClosedSphereGeometry();
  try {
    TestValidator.equals(
      "default vertex population",
      defaults.getAttribute("position").count,
      33 * 17,
    );
  } finally {
    defaults.dispose();
  }
  for (const radius of [0, -1, NaN, Infinity])
    TestValidator.error("nonpositive or nonfinite radius refuses", (): void => {
      createAutoMovieClosedSphereGeometry(radius).dispose();
    });
  for (const radius of [1e200, 1e39, 1e-200, Number.MIN_VALUE, 2 ** -149])
    TestValidator.error(
      "unrepresentable or degenerate stored sphere refuses",
      (): void => {
        createAutoMovieClosedSphereGeometry(radius, 16, 12).dispose();
      },
    );
  for (const value of [NaN, Infinity, -Infinity]) {
    TestValidator.error("nonfinite longitude count refuses", (): void => {
      createAutoMovieClosedSphereGeometry(1, value, 12).dispose();
    });
    TestValidator.error("nonfinite latitude count refuses", (): void => {
      createAutoMovieClosedSphereGeometry(1, 16, value).dispose();
    });
  }
}

/** Keep every source vertex/index while applying the same public matrix operation as display. */
function worldMesh(
  geometry: THREE.SphereGeometry,
  matrix: THREE.Matrix4,
): IAutoMovieMesh {
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const positions: number[] = [];
  for (let index: number = 0; index < attribute.count; index++)
    positions.push(
      ...new THREE.Vector3()
        .fromBufferAttribute(attribute, index)
        .applyMatrix4(matrix)
        .toArray(),
    );
  return {
    positions,
    indices: Array.from(geometry.index!.array),
    normals: null,
    uvs: null,
    skin: null,
  };
}
