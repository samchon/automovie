import { AutoMovieThreeKind, buildModel } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../internal/nclose";
import { singleMaterial } from "../../internal/singleMaterial";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../../internal/vertexColourFixture";

/**
 * Exercises independent RGB-bearing and bare material/geometry variants of one
 * existing generated model.
 *
 * Scenarios:
 *
 * 1. Colored and bare neighboring parts retain exact CPU RGB/base-color inputs and
 *    independent attribute/vertexColors variants while sharing materials within
 *    each kind.
 * 2. Null/missing materials and primitive geometry retain their appropriate
 *    fallback variants, then actual local geometry/material owners are
 *    disposed.
 */
export function test_render_scene_build_model_vertex_colour(): void {
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
  const built: import("@automovie/render").IAutoMovieModelObject =
    buildModel(model);
  const parts: THREE.Mesh[] = [...built.parts.values()].filter(
    (part: THREE.Object3D): part is THREE.Mesh =>
      AutoMovieThreeKind.isMesh(part),
  );
  TestValidator.equals(
    "variant flags",
    parts.map(
      (p: THREE.Mesh): boolean => singleMaterial(p.material).vertexColors,
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
    [parts[0]!, parts[1]!].every((part: THREE.Mesh): boolean => {
      const material: THREE.Material = singleMaterial(part.material);
      return (
        AutoMovieThreeKind.isMeshStandardMaterial(material) &&
        nclose(material.color.r, baseColor.r, 0) &&
        nclose(material.color.g, baseColor.g, 0) &&
        nclose(material.color.b, baseColor.b, 0)
      );
    }),
  );
  for (const part of parts) part.geometry.dispose();
  for (const mat of new Set(
    parts.map((p: THREE.Mesh): THREE.Material => singleMaterial(p.material)),
  ))
    mat.dispose();
}
