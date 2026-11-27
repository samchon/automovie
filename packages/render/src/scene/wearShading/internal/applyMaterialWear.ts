import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMaterialWear,
  IAutoMovieMeasureFeatureEdges,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieRenderMaterial } from "../../AutoMovieRenderMaterial.js";
import type { IMaterialShaderSource } from "../../IMaterialShaderSource.js";
import { readAutoMovieBufferAttribute } from "../../internal/readAutoMovieBufferAttribute.js";
import { AUTOMOVIE_PROCEDURAL_NOISE_GLSL } from "../../AUTOMOVIE_PROCEDURAL_NOISE_GLSL.js";

/** Texels per row of the feature edge texture. */
const ROW: number = 1024;

/**
 * Wear one geometry and material pair: measure the geometry's feature edges at
 * bind pose, store them in a float data texture, and patch the material so each
 * fragment mixes its base colour and roughness toward the edge and grime layers
 * by its distance to the nearest convex and concave edge.
 *
 * `measureAutoMovieFeatureEdges` runs once on the `position` attribute, the
 * bind pose of a skinned mesh, with `reach` the largest layer width. The
 * returned geometry is the input drawn non-indexed (`toNonIndexed`), so each
 * triangle owns its three vertices, with a `wearList` attribute holding the
 * triangle's list offset and count in the texture; skin, morph and every other
 * attribute are carried over. The texture holds two RGBA texels per edge
 * (`a.xyz, convex` and `b.xyz, 0`) followed by every triangle's edge indices,
 * one per texel, 1024 texels a row, read with `texelFetch` so no filtering
 * touches the values.
 *
 * The fragment stage reads its triangle's list and computes, at the
 * interpolated bind-pose position, the distances `autoMovieFeatureEdgeDistance`
 * defines; the layer weights then follow `autoMovieWearWeight`, with the noise
 * of `AUTOMOVIE_PROCEDURAL_NOISE_GLSL`. Colour is mixed after the colour chunks
 * (and any overlay), edge first, and roughness after the roughness chunk and a
 * procedural surface's roughness. The patch is registered through
 * `AutoMovieRenderMaterial.addShaderPatch`, so the material must belong to this
 * geometry alone: its texture uniform is this geometry's.
 *
 * @returns The non-indexed worn geometry and the edge texture; the caller owns
 *   both and disposes them with the part.
 */
export const applyMaterialWear: (
  geometry: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial,
  wear: IAutoMovieMaterialWear,
) => { geometry: THREE.BufferGeometry; texture: THREE.DataTexture } = (
  geometry: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial,
  wear: IAutoMovieMaterialWear,
): { geometry: THREE.BufferGeometry; texture: THREE.DataTexture } => {
  const position: THREE.BufferAttribute = readAutoMovieBufferAttribute(
    geometry,
    "position",
  );
  const indices: ArrayLike<number> =
    geometry.index?.array ??
    Array.from(
      { length: position.count },
      (_: unknown, k: number): number => k,
    );
  const reach: number = Math.max(wear.edge?.width ?? 0, wear.grime?.width ?? 0);
  const measured: IAutoMovieMeasureFeatureEdges.IResult =
    AutoMovieEngineGeometry.measureFeatureEdges({
      positions: position.array,
      indices,
      reach,
    });

  // Edges first, then each triangle's list.
  const lists: number = measured.triangles.reduce(
    (sum: number, list: number[]): number => sum + list.length,
    0,
  );
  const texels: number = Math.max(1, 2 * measured.edges.length + lists);
  const height: number = Math.ceil(texels / ROW);
  const data: Float32Array = new Float32Array(ROW * height * 4);
  measured.edges.forEach(
    (edge: IAutoMovieMeasureFeatureEdges.IEdge, index: number): void => {
      data.set([edge.a.x, edge.a.y, edge.a.z, edge.convex ? 1 : 0], 8 * index);
      data.set([edge.b.x, edge.b.y, edge.b.z, 0], 8 * index + 4);
    },
  );
  const worn: THREE.BufferGeometry =
    geometry.index === null ? geometry.clone() : geometry.toNonIndexed();
  const list: Float32Array = new Float32Array(
    worn.getAttribute("position").count * 2,
  );
  let cursor: number = 2 * measured.edges.length;
  measured.triangles.forEach((edges: number[], triangle: number): void => {
    for (let corner: number = 0; corner < 3; ++corner)
      list.set([cursor, edges.length], 2 * (3 * triangle + corner));
    for (const edge of edges) data[4 * cursor++] = edge;
  });
  worn.setAttribute("wearList", new THREE.BufferAttribute(list, 2));
  const texture: THREE.DataTexture = new THREE.DataTexture(
    data,
    ROW,
    height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const uniforms: Record<string, THREE.IUniform> = {
    uWearEdges: { value: texture },
    uWearSeed: { value: wear.seed },
    uWearReach: { value: reach },
  };
  const layers: ["edge" | "grime", IAutoMovieMaterialWear.ILayer][] = (
    ["edge", "grime"] as const
  ).flatMap(
    (
      name: "edge" | "grime",
    ): ["edge" | "grime", IAutoMovieMaterialWear.ILayer][] =>
      wear[name] === undefined ? [] : [[name, wear[name]!]],
  );
  for (const [name, layer] of layers) {
    const prefix: string = name === "edge" ? "uWearEdge" : "uWearGrime";
    uniforms[`${prefix}Color`] = {
      value: new THREE.Vector3(layer.color.r, layer.color.g, layer.color.b),
    };
    uniforms[`${prefix}Roughness`] = { value: layer.roughness };
    uniforms[`${prefix}Width`] = { value: layer.width };
    uniforms[`${prefix}Amount`] = { value: layer.amount };
  }
  const weight: (name: "edge" | "grime") => string = (
    name: "edge" | "grime",
  ): string => {
    const prefix: string = name === "edge" ? "uWearEdge" : "uWearGrime";
    const distance: string = name === "edge" ? "d.x" : "d.y";
    return wear[name] === undefined
      ? "0.0"
      : `smoothstep( 1.0 - ${prefix}Amount, 1.0, clamp( 1.0 - ${distance} / ${prefix}Width, 0.0, 1.0 ) ) * ( 0.5 + 0.5 * autoMovieProceduralFractal( uWearSeed, vWearPoint / ${prefix}Width ) )`;
  };
  material.userData.wear = wear;
  AutoMovieRenderMaterial.addShaderPatch(material, {
    key: `automovie-wear-${wear.edge === undefined ? "" : "e"}${wear.grime === undefined ? "" : "g"}`,
    apply: (shader: IMaterialShaderSource): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            "attribute vec2 wearList;",
            "flat varying vec2 vWearList;",
            "varying vec3 vWearPoint;",
          ].join("\n"),
        )
        .replace(
          "#include <begin_vertex>",
          [
            "#include <begin_vertex>",
            "vWearList = wearList;",
            "vWearPoint = position;",
          ].join("\n\t"),
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            AUTOMOVIE_PROCEDURAL_NOISE_GLSL,
            "uniform highp sampler2D uWearEdges;",
            "uniform uint uWearSeed;",
            "uniform float uWearReach;",
            ...layers.flatMap(
              ([name]: [
                "edge" | "grime",
                IAutoMovieMaterialWear.ILayer,
              ]): string[] => {
                const prefix: string =
                  name === "edge" ? "uWearEdge" : "uWearGrime";
                return [
                  `uniform vec3 ${prefix}Color;`,
                  `uniform float ${prefix}Roughness;`,
                  `uniform float ${prefix}Width;`,
                  `uniform float ${prefix}Amount;`,
                ];
              },
            ),
            "flat varying vec2 vWearList;",
            "varying vec3 vWearPoint;",
            "vec4 autoMovieWearTexel( int index ) {",
            `\treturn texelFetch( uWearEdges, ivec2( index % ${ROW}, index / ${ROW} ), 0 );`,
            "}",
            // Distances to the nearest convex (x) and concave (y) listed edge,
            // capped at the reach, as autoMovieFeatureEdgeDistance computes them.
            "vec2 autoMovieWearDistances() {",
            "\tint offset = int( vWearList.x + 0.5 );",
            "\tint count = int( vWearList.y + 0.5 );",
            "\tvec2 d = vec2( uWearReach );",
            "\tfor ( int k = 0; k < 16; ++ k ) {",
            "\t\tif ( k >= count ) break;",
            "\t\tint edge = int( autoMovieWearTexel( offset + k ).r + 0.5 );",
            "\t\tvec4 a = autoMovieWearTexel( 2 * edge );",
            "\t\tvec3 b = autoMovieWearTexel( 2 * edge + 1 ).xyz;",
            "\t\tvec3 ab = b - a.xyz;",
            "\t\tfloat t = clamp( dot( vWearPoint - a.xyz, ab ) / max( dot( ab, ab ), 1e-30 ), 0.0, 1.0 );",
            "\t\tfloat distance = length( vWearPoint - ( a.xyz + t * ab ) );",
            "\t\tif ( a.w > 0.5 ) d.x = min( d.x, distance );",
            "\t\telse d.y = min( d.y, distance );",
            "\t}",
            "\treturn d;",
            "}",
            "vec2 autoMovieWearWeights() {",
            "\tvec2 d = autoMovieWearDistances();",
            `\treturn vec2( ${weight("edge")}, ${weight("grime")} );`,
            "}",
          ].join("\n"),
        )
        .replace(
          "#include <alphamap_fragment>",
          [
            "vec2 autoMovieWear = autoMovieWearWeights();",
            ...(wear.edge === undefined
              ? []
              : [
                  "diffuseColor.rgb = mix( diffuseColor.rgb, uWearEdgeColor, autoMovieWear.x );",
                ]),
            ...(wear.grime === undefined
              ? []
              : [
                  "diffuseColor.rgb = mix( diffuseColor.rgb, uWearGrimeColor, autoMovieWear.y );",
                ]),
            "#include <alphamap_fragment>",
          ].join("\n\t"),
        )
        .replace(
          "#include <metalnessmap_fragment>",
          [
            ...(wear.edge === undefined
              ? []
              : [
                  "roughnessFactor = mix( roughnessFactor, uWearEdgeRoughness, autoMovieWear.x );",
                ]),
            ...(wear.grime === undefined
              ? []
              : [
                  "roughnessFactor = mix( roughnessFactor, uWearGrimeRoughness, autoMovieWear.y );",
                ]),
            "#include <metalnessmap_fragment>",
          ].join("\n\t"),
        );
    },
  });
  return { geometry: worn, texture };
};
