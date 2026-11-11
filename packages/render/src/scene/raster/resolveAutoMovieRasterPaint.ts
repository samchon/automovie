import * as THREE from "three";

import type { IAutoMovieRasterFrame } from "./IAutoMovieRasterFrame.js";
import type { IAutoMovieRasterPaint } from "./IAutoMovieRasterPaint.js";

/**
 * Decide how one material colours its triangles in this frame.
 *
 * | Material | Colour |
 * | --- | --- |
 * | Shader with a `depthRange` uniform, the depth pass | Grey `1 - depth / range` per pixel, camera-space metres, clamped |
 * | Shader with an `edgeWidth` uniform, the outline shell | White, vertices pushed out along their normals by that width |
 * | Shader with `frontColor` and `backColor` uniforms, the facing shade | One of the two by the face seen |
 * | `MeshNormalMaterial`, the normal pass | The flat view-space normal packed as `n * 0.5 + 0.5` |
 * | `MeshBasicMaterial` | Its colour, unlit |
 * | Any other shader | Grey clay, unlit, reported as approximated |
 * | Anything else | Lambert from the scene's lights, plus emission |
 *
 * The depth, normal and outline values are data: their bytes equal the
 * shader's output, so they are stored through the inverse sRGB transfer and
 * come back unchanged when the frame is encoded. The normal is one value per
 * triangle, where a GPU interpolates vertex normals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every material branch with its unit and clamp, and states which values are data and how the flat normal differs from a GPU's.
 * @evidence contracts/development/implementation.md#principled-implementation Depth is recovered from device depth through the frame's own projection matrix, so one formula serves perspective and orthographic cameras; lit surfaces use three.js's Lambert convention of irradiance times albedo over pi with metalness removing the diffuse term.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered chain of material tests, each returning a complete paint; the per-triangle closures read only values hoisted here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pass shader is recognized by the uniform its own builder declares, not by a name or a registry, and a shader that declares none of them is drawn as clay and counted instead of guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per material; each triangle then costs one closure call, and only lit materials evaluate the lights.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The material's colour, emission, metalness and projection terms are read once and shared by all of its triangles.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The paint borrows the frame and the material for the frame's duration and allocates one scratch vector at most; nothing outlives the caller's reference.
 */
export function resolveAutoMovieRasterPaint(
  frame: IAutoMovieRasterFrame,
  material: THREE.Material,
): IAutoMovieRasterPaint {
  const uniforms: Record<string, THREE.IUniform> | null =
    material instanceof THREE.ShaderMaterial ? material.uniforms : null;

  // Depth pass: grey from each pixel's camera-space depth.
  const range: unknown = uniforms?.depthRange?.value;
  if (typeof range === "number") {
    const e: number[] = frame.projection.elements;
    return {
      approximated: false,
      extrude: 0,
      ramp: (depth: number): number => {
        // Invert `ndc = (e10 z + e14) / (e11 z + e15)` for the view-space z.
        const z: number = (e[14]! - depth * e[15]!) / (depth * e[11]! - e[10]!);
        return decode(Math.min(1, Math.max(0, 1 + z / range)));
      },
      shade: (): [number, number, number] => [0, 0, 0],
    };
  }

  // Outline shell: white back faces displaced along the normal.
  const width: unknown = uniforms?.edgeWidth?.value;
  if (typeof width === "number")
    return {
      approximated: false,
      extrude: width,
      ramp: null,
      shade: (): [number, number, number] => [1, 1, 1],
    };

  // Facing shade: one colour per side of the surface.
  const frontColor: unknown = uniforms?.frontColor?.value;
  const backColor: unknown = uniforms?.backColor?.value;
  if (frontColor instanceof THREE.Color && backColor instanceof THREE.Color)
    return {
      approximated: false,
      extrude: 0,
      ramp: null,
      shade: (
        _tint: readonly [number, number, number],
        _point: THREE.Vector3,
        _normal: THREE.Vector3,
        front: boolean,
      ): [number, number, number] =>
        front
          ? [frontColor.r, frontColor.g, frontColor.b]
          : [backColor.r, backColor.g, backColor.b],
    };

  // Normal pass: the view-space normal as data.
  if (material instanceof THREE.MeshNormalMaterial) {
    const viewed: THREE.Vector3 = new THREE.Vector3();
    return {
      approximated: false,
      extrude: 0,
      ramp: null,
      shade: (
        _tint: readonly [number, number, number],
        _point: THREE.Vector3,
        normal: THREE.Vector3,
      ): [number, number, number] => {
        viewed.copy(normal).transformDirection(frame.view);
        return [
          decode(viewed.x * 0.5 + 0.5),
          decode(viewed.y * 0.5 + 0.5),
          decode(viewed.z * 0.5 + 0.5),
        ];
      },
    };
  }

  const color: unknown = (material as { color?: unknown }).color;
  const base: [number, number, number] =
    uniforms === null && color instanceof THREE.Color
      ? [color.r, color.g, color.b]
      : [0.6, 0.6, 0.6];
  const emissive: unknown = (material as { emissive?: unknown }).emissive;
  const intensity: number =
    (material as { emissiveIntensity?: number }).emissiveIntensity ?? 1;
  const emission: [number, number, number] =
    emissive instanceof THREE.Color
      ? [emissive.r * intensity, emissive.g * intensity, emissive.b * intensity]
      : [0, 0, 0];

  // Unlit materials: their colour as it is.
  if (uniforms !== null || material instanceof THREE.MeshBasicMaterial)
    return {
      approximated: uniforms !== null,
      extrude: 0,
      ramp: null,
      shade: (
        tint: readonly [number, number, number],
      ): [number, number, number] => [
        base[0] * tint[0] + emission[0],
        base[1] * tint[1] + emission[1],
        base[2] * tint[2] + emission[2],
      ],
    };

  // Lit materials: Lambert, the diffuse term removed by metalness.
  const diffuse: number =
    (1 - ((material as { metalness?: number }).metalness ?? 0)) / Math.PI;
  return {
    approximated: false,
    extrude: 0,
    ramp: null,
    shade: (
      tint: readonly [number, number, number],
      point: THREE.Vector3,
      normal: THREE.Vector3,
    ): [number, number, number] => {
      const irradiance: [number, number, number] = frame.lighting.irradiance(
        point,
        normal,
      );
      return [
        base[0] * tint[0] * irradiance[0] * diffuse + emission[0],
        base[1] * tint[1] * irradiance[1] * diffuse + emission[1],
        base[2] * tint[2] * irradiance[2] * diffuse + emission[2],
      ];
    },
  };
}

/** Inverse sRGB transfer, so a data value survives the frame's sRGB encoding. */
function decode(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}
