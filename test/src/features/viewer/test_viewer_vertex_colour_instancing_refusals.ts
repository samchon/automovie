import { buildModel, flattenInstancedObject } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { throwsError } from "../internal/predicates";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * Exercises alignment refusal before loaded-object color lowering and adjacent aligned recovery.
 *
 * Scenarios:
 * 1. The existing part's two-channel or incomplete RGB/RGBA populations refuse before loaded-object flattening.
 * 2. Replacing only the owned malformed attribute with the existing aligned RGB triangle admits three output vertices and preserves local disposal ownership.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual building/flattening on the existing part with malformed owned color attributes, checking refusal diagnostic and valid output vertex count.
 * @evidence contracts/testing.md#independent-expectations Authored two/three/four-channel population mismatches and a separately supplied aligned triangle determine expected refusal and count.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts unsupported item size and incomplete RGB/RGBA arrays, replacing only that owned attribute with aligned RGB before the next call.
 * @evidence contracts/testing.md#execution-ownership The named entry uses existing CPU triangle geometry/attributes and disposes returned/source resources, replacing no foreign method and adding no renderer or new fixture.
 */
export function test_viewer_vertex_colour_instancing_refusals(): void {
  const built: import("@automovie/viewer").IAutoMovieModelObject =
    buildModel(vertexColourModel([vertexColourMesh()]));
  const part: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > = [...built.parts.values()][0] as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial
  >;
  for (const [size, count] of [
    [2, 3],
    [3, 2],
    [4, 2],
  ]) {
    part.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        new Array<number>(size! * count!).fill(1),
        size!,
      ),
    );
    TestValidator.predicate(
      "malformed colour refused",
      throwsError(
        (): ReturnType<typeof flattenInstancedObject> =>
          flattenInstancedObject(built),
        "one RGB or RGBA colour per vertex",
      ),
    );
    part.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Array<number>(9).fill(1), 3),
    );
    const valid: ReturnType<typeof flattenInstancedObject> =
      flattenInstancedObject(built);
    TestValidator.equals(
      "adjacent aligned input",
      valid.geometry.getAttribute("color").count,
      3,
    );
    valid.geometry.dispose();
  }
  part.geometry.dispose();
  part.material.dispose();
}
