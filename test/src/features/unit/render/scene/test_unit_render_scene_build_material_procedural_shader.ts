import {
  autoMovieProceduralFrame,
  autoMovieProceduralPattern,
  sampleAutoMovieProceduralSurface,
} from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieMaterial,
  IAutoMovieProceduralSurface,
} from "@automovie/interface";
import { buildMaterial } from "@automovie/render";
import type { IMaterialShaderSource } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compileMaterialShaderSource } from "../../../internal/compileMaterialShaderSource";
import { nclose } from "../../../internal/nclose";

/**
 * A material with a procedural surface compiles one shader patch whose uniforms
 * put each fragment at the sample point of the engine's CPU reference, and
 * whose program key separates kinds and sheet sampling.
 *
 * Scenarios:
 *
 * 1. Building a material with a wood `module` piece and running its compile hook
 *    on three's own physical program splices the sample point into the vertex
 *    stage and the pattern, colour, roughness and bump into the fragment stage,
 *    after the chunks they extend.
 * 2. The sample point the uniforms give, `(uvTransform · (u, v, 1)).xy × tile +
 *    pieceOffset` with the normal offset as third coordinate, yields through
 *    `autoMovieProceduralPattern` the same value as
 *    `sampleAutoMovieProceduralSurface` at 64 UV points, within 1e-12.
 * 3. The axis frame uniforms equal `autoMovieProceduralFrame`, and the colour,
 *    roughness and relief uniforms equal the surface's.
 * 4. Two stone materials with different seeds share a program key, a stone and a
 *    wood material do not, and a piece material's key differs from an
 *    object-space one.
 *
 * The compiled program's pixels are not observed here: a float-target capture
 * on a real GPU, under the visual-debugging skill, compares the shader's base
 * colour with the CPU samples.
 */
export function test_unit_render_scene_build_material_procedural_shader(): void {
  const piece: IAutoMovieProceduralSurface = {
    ...surface("wood", 31),
    axis: { x: 1, y: 0.2, z: 0 },
    piece: {
      sheet: "module",
      tile: { u: 1.2, v: 0.8 },
      transform: {
        id: "floor/b-3-1",
        offset: { x: 0.35, y: -0.1 },
        scale: { x: -0.8, y: 0.25 },
        rotationDeg: 30,
      },
    },
  };
  const material: THREE.MeshPhysicalMaterial = buildMaterial(record(piece));
  const shader: IMaterialShaderSource = compile(material);

  // 1. Splices after the chunks they extend.
  TestValidator.predicate(
    "the vertex stage passes the sample point after begin_vertex",
    /#include <begin_vertex>\s*vAutoMovieProceduralPoint = vec3\(/.test(
      shader.vertexShader,
    ),
  );
  TestValidator.predicate(
    "the fragment stage sets colour, roughness and normal after their chunks",
    /#include <map_fragment>\s*float autoMovieProceduralValue/.test(
      shader.fragmentShader,
    ) &&
      /#include <roughnessmap_fragment>\s*roughnessFactor = mix/.test(
        shader.fragmentShader,
      ) &&
      /#include <normal_fragment_maps>\s*normal = autoMovieProceduralBump/.test(
        shader.fragmentShader,
      ),
  );

  // 2. The uniforms reproduce the CPU sample point.
  const uniforms: Record<string, THREE.IUniform> = shader.uniforms;
  const transform: THREE.Matrix3 = uniforms.uProceduralUvTransform!
    .value;
  const tile: THREE.Vector2 = uniforms.uProceduralTile!.value;
  const shift: THREE.Vector3 = uniforms.uProceduralPieceOffset!
    .value;
  let agree: boolean = true;
  for (let index: number = 0; index < 64; ++index) {
    const u: number = (index % 8) / 7;
    const v: number = Math.floor(index / 8) / 7;
    const sheet: THREE.Vector3 = new THREE.Vector3(u, v, 1).applyMatrix3(
      transform,
    );
    const value: number = autoMovieProceduralPattern(piece, [
      sheet.x * tile.x + shift.x,
      sheet.y * tile.y + shift.y,
      0.004 + shift.z,
    ]);
    agree &&= nclose(
      value,
      sampleAutoMovieProceduralSurface({
        surface: piece,
        uv: { u, v },
        offset: 0.004,
      }).value,
      1e-12,
    );
  }
  TestValidator.predicate(
    "the uniforms place fragments at the CPU sample point",
    agree,
  );

  // 3. Frame and the interpolated pairs.
  const frame: ReturnType<typeof autoMovieProceduralFrame> =
    autoMovieProceduralFrame(piece.axis!);
  const vector: (name: string) => number[] = (name: string): number[] =>
    (uniforms[name]!.value).toArray();
  TestValidator.predicate(
    "frame, colours, roughness and relief uniforms",
    [
      [vector("uProceduralAlong"), frame.along],
      [vector("uProceduralAcross"), frame.across],
      [vector("uProceduralNormal"), frame.normal],
      [vector("uProceduralColor1"), [0.6, 0.42, 0.24]],
    ].every(([a, b]) =>
      a!.every((value: number, k: number): boolean =>
        nclose(value, b![k]!, 1e-12),
      ),
    ) &&
      (uniforms.uProceduralRoughness!.value).equals(
        new THREE.Vector2(0.45, 0.85),
      ) &&
      uniforms.uProceduralRelief!.value === 0.001 &&
      uniforms.uProceduralSeed!.value === 31,
  );

  // 4. Program keys.
  const key: (one: IAutoMovieProceduralSurface) => string = (
    one: IAutoMovieProceduralSurface,
  ): string => buildMaterial(record(one)).customProgramCacheKey();
  TestValidator.predicate(
    "kinds and sheet sampling separate programs, seeds do not",
    key(surface("stone", 1)) === key(surface("stone", 2)) &&
      key(surface("stone", 1)) !==
        key({ ...surface("wood", 1), axis: { x: 0, y: 1, z: 0 } }) &&
      key({ ...surface("wood", 1), axis: { x: 0, y: 1, z: 0 } }) !==
        key({ ...piece, seed: 1 }),
  );
  material.dispose();
}

/** Run a material's compile hook on three's physical program. */
function compile(material: THREE.Material): IMaterialShaderSource {
  const shader: IMaterialShaderSource = compileMaterialShaderSource(material);
  return shader;
}

/** A surface of a kind and seed. */
function surface(
  kind: IAutoMovieProceduralSurface["kind"],
  seed: number,
): IAutoMovieProceduralSurface {
  const color: (value: number) => IAutoMovieColor = (
    value: number,
  ): IAutoMovieColor => ({
    r: value,
    g: value * 0.7,
    b: value * 0.4,
    a: 1,
    hex: null,
  });
  return {
    kind,
    seed,
    scale: 0.02,
    colors: [color(0.2), color(0.6)],
    roughness: [0.45, 0.85],
    relief: 0.001,
  };
}

/** A material record carrying a surface. */
function record(procedural: IAutoMovieProceduralSurface): IAutoMovieMaterial {
  return {
    id: "finish",
    name: null,
    baseColor: { r: 0.5, g: 0.5, b: 0.5, a: 1, hex: null },
    metallic: 0,
    roughness: 0.5,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
    procedural,
  };
}
