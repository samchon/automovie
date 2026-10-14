import { buildModel, flattenInstancedObject } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * Exercises normalized/interleaved imported RGB(A) lowering while preserving source attribute storage.
 *
 * Scenarios:
 * 1. Normalized byte RGBA, interleaved RGB and bare parts lower to Float32 RGBA.
 * 2. Independently authored /255 fractions and white identity channels judge every decoded channel and missing alpha.
 * 3. Original attribute identity, three-channel RGB layout, source bytes and bare absence survive lowering; merged/source owners receive disposal requests.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model building and loaded-object flattening, checks output population/layout/numeric channels and original attribute identity/value state.
 * @evidence contracts/testing.md#independent-expectations Independently authored /255 channel fractions and white identity channels judge Float32 output with numeric tolerance, separately from output construction.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts normalized RGBA, interleaved RGB and bare parts; checks missing alpha, decoded storage and untouched original wrappers instead of a generic deep snapshot.
 * @evidence contracts/testing.md#execution-ownership The named entry reuses existing triangle inputs and real CPU attributes, disposes its owned merged/source geometry and borrowed-model materials, and observes no native shader/GPU output.
 */
export function test_viewer_vertex_colour_imported_instancing(): void {
  const colored: import("@automovie/interface").IAutoMovieMesh =
    vertexColourMesh();
  const {
    colors: _colors,
    ...bare
  }: import("@automovie/interface").IAutoMovieMesh = colored;
  const built: import("@automovie/viewer").IAutoMovieModelObject = buildModel(
    vertexColourModel([colored, colored, bare]),
  );
  const parts: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  >[] = [...built.parts.values()] as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial
  >[];
  const rgba: THREE.Uint8BufferAttribute = new THREE.Uint8BufferAttribute(
    [255, 0, 128, 64, 0, 255, 64, 128, 128, 64, 255, 255],
    4,
    true,
  );
  const rgb: THREE.InterleavedBufferAttribute =
    new THREE.InterleavedBufferAttribute(
      new THREE.InterleavedBuffer(
        new Uint8Array([7, 255, 128, 0, 7, 0, 255, 64, 7, 64, 0, 255]),
        4,
      ),
      3,
      1,
      true,
    );
  parts[0]!.geometry.setAttribute("color", rgba);
  parts[1]!.geometry.setAttribute("color", rgb);
  const flattened: ReturnType<typeof flattenInstancedObject> =
    flattenInstancedObject(built);
  const result:
    | THREE.BufferAttribute<THREE.BufferAttributeEventMap>
    | THREE.InterleavedBufferAttribute =
    flattened.geometry.getAttribute("color");
  const expected: number[] = [
    1,
    0,
    128 / 255,
    64 / 255,
    0,
    1,
    64 / 255,
    128 / 255,
    128 / 255,
    64 / 255,
    1,
    1,
    1,
    128 / 255,
    0,
    1,
    0,
    1,
    64 / 255,
    1,
    64 / 255,
    0,
    1,
    1,
    ...new Array<number>(12).fill(1),
  ];
  TestValidator.equals("RGBA layout", result.itemSize, 4);
  TestValidator.equals("complete output", result.array.length, expected.length);
  TestValidator.predicate(
    "decoded RGBA",
    Array.from(result.array).every((value: number, i: number): boolean =>
      nclose(value, expected[i]!),
    ),
  );
  TestValidator.predicate(
    "float storage",
    result.array instanceof Float32Array,
  );
  TestValidator.predicate(
    "source storage owned",
    parts[0]!.geometry.getAttribute("color") === rgba &&
      parts[1]!.geometry.getAttribute("color") === rgb,
  );
  TestValidator.equals("source RGB not promoted", rgb.itemSize, 3);
  TestValidator.equals("source byte not decoded in place", rgba.array[2], 128);
  TestValidator.equals(
    "source bare stays bare",
    parts[2]!.geometry.hasAttribute("color"),
    false,
  );
  flattened.geometry.dispose();
  for (const part of parts) part.geometry.dispose();
  for (const material of new Set(flattened.materials)) material.dispose();
}
