import {
  AutoMovieEngineGeometry,
  AutoMovieEngineMaterial,
} from "@automovie/engine";
import type {
  IAutoMovieMaterialWear,
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieTessellation,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieRenderWearShading,
  AutoMovieRenderThreeKind,
  type IAutoMovieRenderMaterialShaderSource,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compileMaterialShaderSource } from "../../internal/compileMaterialShaderSource";
import { nclose } from "../../internal/nclose";
import { surfaceTriangleOf } from "../../internal/surfaceTriangleOf";

/**
 * A worn material's geometry and texture carry exactly the feature edges and
 * per-triangle lists the engine measures, so the fragment shader's distances
 * are the CPU reference's.
 *
 * Scenarios:
 *
 * 1. Wearing the 1 m box from `tessellate` returns a non-indexed geometry of 36
 *    vertices whose `wearList` gives all three vertices of each triangle one
 *    offset and count, and the texture holds that triangle's measured list at
 *    that offset.
 * 2. The texture's first texels hold each measured edge as `a.xyz, convex` and
 *    `b.xyz, 0`.
 * 3. Decoding the texture as the shader does, the distances at 200 surface points
 *    equal `autoMovieFeatureEdgeDistance` within 1e-12, and the edge weight
 *    `AutoMovieEngineMaterial.wearWeight` is zero at and beyond the layer width
 *    and positive on an edge.
 * 4. The compile hook on three's physical program reads the list and the bind-pose
 *    position in the vertex stage, mixes colour before the alpha map and
 *    roughness before the metalness map, and names its layers in the program
 *    key.
 *
 * GPU arithmetic is checked by a float-target capture under the
 * visual-debugging skill: at 1280 횞 720, the 24-vertex box and the box
 * subdivided 8 횞 8 per face each write their edge weight and their interpolated
 * bind-pose point, and every covered pixel's weight must equal the CPU weight
 * at that pixel's own point within 1e-3. Comparing the two boxes' weights pixel
 * by pixel is not a valid check: the rasterizer snaps each triangle's vertices
 * to its subpixel grid, so the two meshes of one surface put the same pixel at
 * points up to 0.5 mm apart on SwiftShader, and the weight's gradient turns
 * that into a difference of up to 0.014 that no shader could remove.
 */
export function test_render_scene_apply_material_wear(): void {
  const box: IAutoMovieTessellation = AutoMovieEngineGeometry.tessellate({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(box.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(box.normals, 3),
  );
  geometry.setIndex(box.indices);
  const wear: IAutoMovieMaterialWear = {
    seed: 3,
    edge: {
      color: { r: 0.4, g: 0.3, b: 0.2, a: 1, hex: null },
      roughness: 0.8,
      width: 0.03,
      amount: 0.7,
    },
  };
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const worn: { geometry: THREE.BufferGeometry; texture: THREE.DataTexture } =
    AutoMovieRenderWearShading.apply(geometry, material, wear);
  const measured: IAutoMovieMeasureFeatureEdges.IResult =
    AutoMovieEngineGeometry.measureFeatureEdges({
      positions: geometry.getAttribute("position").array,
      indices: box.indices,
      reach: 0.03,
    });
  const data: THREE.TypedArray | null = worn.texture.image.data;
  if (data === null || !AutoMovieRenderThreeKind.isFloat32Array(data))
    throw new Error("Expected a float wear texture");
  const list: THREE.BufferAttribute = worn.geometry.getAttribute(
    "wearList",
  ) as THREE.BufferAttribute;

  // 1. Non-indexed with per-triangle lists.
  let lists: boolean = worn.geometry.index === null && list.count === 36;
  measured.triangles.forEach((edges: number[], t: number): void => {
    const offset: number = list.getX(3 * t);
    lists &&=
      [1, 2].every(
        (k: number): boolean =>
          list.getX(3 * t + k) === offset &&
          list.getY(3 * t + k) === edges.length,
      ) &&
      edges.every(
        (edge: number, k: number): boolean => data[4 * (offset + k)] === edge,
      );
  });
  TestValidator.predicate("each triangle carries its measured list", lists);

  // 2. Edge texels.
  TestValidator.predicate(
    "edge texels hold the measured segments and signs",
    measured.edges.every(
      (edge: IAutoMovieMeasureFeatureEdges.IEdge, e: number): boolean =>
        data[8 * e] === Math.fround(edge.a.x) &&
        data[8 * e + 2] === Math.fround(edge.a.z) &&
        data[8 * e + 3] === (edge.convex ? 1 : 0) &&
        data[8 * e + 5] === Math.fround(edge.b.y),
    ),
  );

  // 3. Shader-order decoding against the CPU reference.
  let agree: boolean = true;
  for (let index: number = 0; index < 200; ++index) {
    const point: IAutoMovieVector3 = {
      x: 0.5,
      y: ((index * 0.6180339887) % 1) - 0.5,
      z: ((index * 0.7548776662) % 1) - 0.5,
    };
    const t: number = surfaceTriangleOf(box.positions, box.indices, point);
    agree &&= nclose(
      decode(data, list.getX(3 * t), list.getY(3 * t), point, 0.03),
      AutoMovieEngineGeometry.featureEdgeDistance({
        edges: measured,
        triangle: t,
        point,
      }).convex,
      1e-6,
    );
  }
  TestValidator.predicate("decoded distances equal the CPU reference", agree);
  const onEdge: IAutoMovieVector3 = { x: 0.5, y: 0.5, z: 0.1 };
  TestValidator.predicate(
    "the edge weight is positive on the edge and zero at its width",
    AutoMovieEngineMaterial.wearWeight(wear.edge!, 0, 3, onEdge) > 0 &&
      AutoMovieEngineMaterial.wearWeight(wear.edge!, 0.03, 3, onEdge) === 0 &&
      AutoMovieEngineMaterial.wearWeight(wear.edge!, 0.2, 3, onEdge) === 0,
  );

  // 4. Splices and key.
  const shader: IAutoMovieRenderMaterialShaderSource = compileMaterialShaderSource(material);
  TestValidator.predicate(
    "the patch reads the list and bind pose, then mixes colour and roughness in order",
    /#include <begin_vertex>\s*vWearList = wearList;\s*vWearPoint = position;/.test(
      shader.vertexShader,
    ) &&
      /autoMovieWear\.x \);\s*#include <alphamap_fragment>/.test(
        shader.fragmentShader,
      ) &&
      /uWearEdgeRoughness, autoMovieWear\.x \);\s*#include <metalnessmap_fragment>/.test(
        shader.fragmentShader,
      ) &&
      material.customProgramCacheKey() === "automovie-wear-e" &&
      shader.uniforms.uWearReach!.value === 0.03,
  );
  worn.geometry.dispose();
  worn.texture.dispose();
  material.dispose();
}

/**
 * The convex distance the fragment shader computes from the packed texture,
 * capped at the reach.
 */
function decode(
  data: Float32Array,
  offset: number,
  count: number,
  p: IAutoMovieVector3,
  reach: number,
): number {
  let d: number = reach;
  for (let k: number = 0; k < count; ++k) {
    const edge: number = data[4 * (offset + k)]!;
    const a: number[] = Array.from(data.subarray(8 * edge, 8 * edge + 4));
    const b: number[] = Array.from(data.subarray(8 * edge + 4, 8 * edge + 7));
    if (a[3]! < 0.5) continue;
    const ab: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
    const ap: number[] = [p.x - a[0]!, p.y - a[1]!, p.z - a[2]!];
    const t: number = Math.max(
      0,
      Math.min(
        1,
        (ap[0]! * ab[0]! + ap[1]! * ab[1]! + ap[2]! * ab[2]!) /
          (ab[0]! ** 2 + ab[1]! ** 2 + ab[2]! ** 2),
      ),
    );
    d = Math.min(
      d,
      Math.hypot(ap[0]! - t * ab[0]!, ap[1]! - t * ab[1]!, ap[2]! - t * ab[2]!),
    );
  }
  return d;
}
