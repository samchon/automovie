import { AutoMovieEngineMaterial } from "@automovie/engine";
import type { IAutoMovieProceduralSurface } from "@automovie/interface";
import * as THREE from "three";

import type { IMaterialShaderSource } from "../../IMaterialShaderSource.js";
import { AutoMovieRenderMaterial } from "../../AutoMovieRenderMaterial.js";
import { AUTOMOVIE_PROCEDURAL_NOISE_GLSL } from "../AUTOMOVIE_PROCEDURAL_NOISE_GLSL.js";
import { proceduralPatternGlsl } from "./proceduralPatternGlsl.js";

/**
 * Shade a material from an admitted procedural surface, evaluating the engine's
 * `AutoMovieEngineMaterial.sampleProceduralSurface` per fragment through one
 * material shader patch.
 *
 * The vertex stage passes the sample point: the bind-pose object-space
 * `position` attribute, read before morphing and skinning so the pattern stays
 * on the same surface points as a skinned mesh bends; or, for a pattern piece,
 * the UV0 mapped by the occurrence transform into sheet turns, times the tile
 * lengths, with `dot(position, normal)` as the third coordinate and a `module`
 * piece's hashed offset added. The mapping is affine in the vertex attributes,
 * so interpolation across a triangle is exact.
 *
 * The fragment stage computes the kind's pattern value once and then replaces
 * the base colour after the colour map (vertex colours still multiply it), the
 * roughness after the roughness map, and perturbs the shading normal after the
 * normal maps by the height `value 횞 relief`: the screen-space derivatives of
 * the height and the view-space position give Blinn's bump (Blinn 1978,
 * "Simulation of wrinkled surfaces", SIGGRAPH) in Mikkelsen's surface-gradient
 * form, the same construction three uses for bump maps. Every uniform is set
 * once here from the surface; the program key names the kind and whether a
 * piece is sampled, so materials of one kind share a program.
 */
export const applyProceduralSurface: (
  material: THREE.MeshStandardMaterial,
  surface: IAutoMovieProceduralSurface,
) => void = (
  material: THREE.MeshStandardMaterial,
  surface: IAutoMovieProceduralSurface,
): void => {
  const frame: ReturnType<
    typeof AutoMovieEngineMaterial.proceduralFrame
  > | null =
    surface.axis === undefined
      ? null
      : AutoMovieEngineMaterial.proceduralFrame(surface.axis);
  const [low, high]: IAutoMovieProceduralSurface["colors"] = surface.colors;
  const uniforms: Record<string, THREE.IUniform> = {
    uProceduralSeed: { value: surface.seed },
    uProceduralScale: { value: surface.scale },
    uProceduralAlong: {
      value: new THREE.Vector3(...(frame?.along ?? [1, 0, 0])),
    },
    uProceduralAcross: {
      value: new THREE.Vector3(...(frame?.across ?? [0, 1, 0])),
    },
    uProceduralNormal: {
      value: new THREE.Vector3(...(frame?.normal ?? [0, 0, 1])),
    },
    uProceduralColor0: { value: new THREE.Vector3(low.r, low.g, low.b) },
    uProceduralColor1: { value: new THREE.Vector3(high.r, high.g, high.b) },
    uProceduralRoughness: {
      value: new THREE.Vector2(surface.roughness[0], surface.roughness[1]),
    },
    uProceduralRelief: { value: surface.relief },
  };
  const piece: IAutoMovieProceduralSurface.IPiece | undefined = surface.piece;
  if (piece !== undefined) {
    const {
      offset,
      scale,
      rotationDeg,
    }: IAutoMovieProceduralSurface.IPiece["transform"] = piece.transform;
    uniforms.uProceduralUvTransform = {
      value: new THREE.Matrix3().setUvTransform(
        offset.x,
        offset.y,
        scale.x,
        scale.y,
        (rotationDeg * Math.PI) / 180,
        0,
        0,
      ),
    };
    uniforms.uProceduralTile = {
      value: new THREE.Vector2(piece.tile.u, piece.tile.v),
    };
    uniforms.uProceduralPieceOffset = {
      value: new THREE.Vector3(
        ...(piece.sheet === "module"
          ? AutoMovieEngineMaterial.proceduralPieceOffset(
              surface.seed,
              piece.transform.id,
              surface.scale,
            )
          : [0, 0, 0]),
      ),
    };
  }
  material.userData.procedural = surface;
  AutoMovieRenderMaterial.addShaderPatch(material, {
    key: `automovie-procedural-${surface.kind}${piece === undefined ? "" : "-piece"}`,
    apply: (shader: IMaterialShaderSource): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            "varying vec3 vAutoMovieProceduralPoint;",
            ...(piece === undefined
              ? []
              : [
                  "uniform mat3 uProceduralUvTransform;",
                  "uniform vec2 uProceduralTile;",
                  "uniform vec3 uProceduralPieceOffset;",
                ]),
          ].join("\n"),
        )
        .replace(
          "#include <begin_vertex>",
          [
            "#include <begin_vertex>",
            piece === undefined
              ? "vAutoMovieProceduralPoint = position;"
              : "vAutoMovieProceduralPoint = vec3( ( uProceduralUvTransform * vec3( uv, 1.0 ) ).xy * uProceduralTile, dot( position, normal ) ) + uProceduralPieceOffset;",
          ].join("\n\t"),
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            AUTOMOVIE_PROCEDURAL_NOISE_GLSL,
            proceduralPatternGlsl(surface.kind),
            "varying vec3 vAutoMovieProceduralPoint;",
            "uniform vec3 uProceduralColor0;",
            "uniform vec3 uProceduralColor1;",
            "uniform vec2 uProceduralRoughness;",
            "uniform float uProceduralRelief;",
            // Mikkelsen's surface-gradient bump, as three's perturbNormalArb.
            "vec3 autoMovieProceduralBump( vec3 position, vec3 normal, vec2 dHdxy, float faceDirection ) {",
            "\tvec3 sigmaX = dFdx( position );",
            "\tvec3 sigmaY = dFdy( position );",
            "\tvec3 r1 = cross( sigmaY, normal );",
            "\tvec3 r2 = cross( normal, sigmaX );",
            "\tfloat det = dot( sigmaX, r1 ) * faceDirection;",
            "\tvec3 gradient = sign( det ) * ( dHdxy.x * r1 + dHdxy.y * r2 );",
            "\treturn normalize( abs( det ) * normal - gradient );",
            "}",
          ].join("\n"),
        )
        .replace(
          "#include <map_fragment>",
          [
            "#include <map_fragment>",
            "float autoMovieProceduralValue = autoMovieProceduralPattern( vAutoMovieProceduralPoint );",
            "diffuseColor.rgb = mix( uProceduralColor0, uProceduralColor1, autoMovieProceduralValue );",
          ].join("\n\t"),
        )
        .replace(
          "#include <roughnessmap_fragment>",
          [
            "#include <roughnessmap_fragment>",
            "roughnessFactor = mix( uProceduralRoughness.x, uProceduralRoughness.y, autoMovieProceduralValue );",
          ].join("\n\t"),
        )
        .replace(
          "#include <normal_fragment_maps>",
          [
            "#include <normal_fragment_maps>",
            "normal = autoMovieProceduralBump( - vViewPosition, normal, vec2( dFdx( autoMovieProceduralValue ), dFdy( autoMovieProceduralValue ) ) * uProceduralRelief, faceDirection );",
          ].join("\n\t"),
        );
    },
  });
};
