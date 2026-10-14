import { buildModel } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * Exercises independent RGB-bearing and bare material/geometry variants of one existing generated model.
 *
 * Scenarios:
 * 1. Colored and bare neighboring parts retain exact CPU RGB/base-color inputs and independent attribute/vertexColors variants while sharing materials within each kind.
 * 2. Null/missing materials and primitive geometry retain their appropriate fallback variants, then actual local geometry/material owners are disposed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real model construction and reads CPU attribute values, vertexColors flags, material identity and unchanged base-color coefficients.
 * @evidence contracts/testing.md#independent-expectations Authored triangle RGB arrays and independently stated variant flags define expectations through numeric predicates and identity comparisons, not copied shader output.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts shared colored/bare variants, null/missing material fallback and primitive geometry; attribute presence and flags do not prove visible modulation or native allocation.
 * @evidence contracts/testing.md#execution-ownership The named entry uses existing portable triangle/model inputs and disposes its actual CPU geometries/materials without a renderer, import loader or new fixture.
 */
export function test_viewer_vertex_colour(): void {
  const colored: import("@automovie/interface").IAutoMovieMesh =
    vertexColourMesh();
  const {
    colors: _colors,
    ...bare
  }: import("@automovie/interface").IAutoMovieMesh = colored;
  const model: import("@automovie/interface").IAutoMovieModel =
    vertexColourModel([colored, bare, colored, bare, colored, bare]);
  model.parts[4]!.material = null;
  model.parts[5]!.material = "absent";
  model.parts.push({
    ...model.parts[0]!,
    id: "primitive",
    geometry: {
      type: "primitive",
      shape: { type: "box", width: 1, height: 1, depth: 1 },
    },
  });
  const built: import("@automovie/viewer").IAutoMovieModelObject =
    buildModel(model);
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
  TestValidator.equals(
    "variant flags",
    parts.map(
      (
        p: THREE.Mesh<
          THREE.BufferGeometry<
            THREE.NormalBufferAttributes,
            THREE.BufferGeometryEventMap
          >,
          THREE.MeshStandardMaterial,
          THREE.Object3DEventMap
        >,
      ): boolean => p.material.vertexColors,
    ),
    [true, false, true, false, true, false, false],
  );
  const uploaded: ArrayLike<number> =
    parts[0]!.geometry.getAttribute("color").array;
  TestValidator.predicate(
    "constructed linear RGB attribute values",
    uploaded.length === colored.colors!.length &&
      Array.from(uploaded).every((value: number, index: number): boolean =>
        nclose(value, colored.colors![index]!, 0),
      ),
  );
  TestValidator.predicate(
    "bare geometry has no colour attribute",
    !parts[1]!.geometry.hasAttribute("color"),
  );
  TestValidator.predicate(
    "variants share within their own kind",
    parts[0]!.material === parts[2]!.material &&
      parts[1]!.material === parts[3]!.material &&
      parts[0]!.material !== parts[1]!.material &&
      parts[6]!.material === parts[1]!.material,
  );
  const baseColor: import("@automovie/interface").IAutoMovieColor =
    model.materials[0]!.baseColor;
  TestValidator.predicate(
    "base colour is not pre-multiplied",
    [parts[0]!, parts[1]!].every(
      (part: (typeof parts)[number]): boolean =>
        nclose(part.material.color.r, baseColor.r, 0) &&
        nclose(part.material.color.g, baseColor.g, 0) &&
        nclose(part.material.color.b, baseColor.b, 0),
    ),
  );
  for (const part of parts) part.geometry.dispose();
  for (const mat of new Set(
    parts.map(
      (
        p: THREE.Mesh<
          THREE.BufferGeometry<
            THREE.NormalBufferAttributes,
            THREE.BufferGeometryEventMap
          >,
          THREE.MeshStandardMaterial,
          THREE.Object3DEventMap
        >,
      ): THREE.MeshStandardMaterial => p.material,
    ),
  ))
    mat.dispose();
}
