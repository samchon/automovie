import * as THREE from "three";

import { RASTER_STROKE_DEPTH_LEAD } from "../raster/RASTER_STROKE_DEPTH_LEAD.js";

/**
 * Make the points object inspection marks draw their places with: one screen-sized square per vertex, one colour per vertex, unlit and outside fog and tone mapping.
 *
 * A point is three stroke widths across, in the same pixels as a line's width, so a joint stays visible where the lines of its bones meet it. Its size does not shrink with distance. three.js draws it that many pixels times the renderer's pixel ratio, as it draws a line's width, and the CPU rasterizer draws it the same size.
 *
 * `positions` holds one xyz vertex per point and `colors` the matching linear rgb, kept by the geometry, not copied, so the caller rewrites `positions` in place to move the points. Depth follows `createAutoMovieInspectionStrokes`: ignored with `xray`, and otherwise led `RASTER_STROKE_DEPTH_LEAD` toward the camera.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the size rule and its reason, that size ignores distance, the pixel ratio both renderers apply, the buffer layout and sharing, and the depth behaviour.
 * @evidence contracts/development/implementation.md#principled-implementation three.js points are squares of a size in pixels when size attenuation is off, the screen-sized quad the rule asks for; the depth lead is the same view-space lead as the strokes, inserted after three.js's own projection chunk.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Geometry, material, then the object flags.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The factor of three is a stated convention tying a point to the stroke, not a size tuned to one picture, and mismatched buffers are refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms One draw call for every point of the object.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every mark builder draws its places through this one factory.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The geometry and material are created here and owned by the caller, who disposes both; nothing else is retained.
 */
export function createAutoMovieInspectionDots(
  positions: Float32Array,
  colors: Float32Array,
  options: { stroke: number; xray: boolean },
): THREE.Points {
  if (positions.length !== colors.length || positions.length % 3 !== 0)
    throw new Error(
      `Inspection dots need one xyz vertex and one rgb colour per point, not ${positions.length} and ${colors.length} components`,
    );

  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material: THREE.PointsMaterial = new THREE.PointsMaterial({
    size: options.stroke * 3,
    sizeAttenuation: false,
    vertexColors: true,
    depthTest: !options.xray,
    depthWrite: !options.xray,
    transparent: options.xray,
    toneMapped: false,
    fog: false,
  });
  if (!options.xray)
    material.onBeforeCompile = (
      shader: THREE.WebGLProgramParametersWithUniforms,
    ): void => {
      // Lead the view-space position toward the eye, then project it again.
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        [
          "#include <project_vertex>",
          `mvPosition.xyz -= ( isOrthographic ? vec3( 0.0, 0.0, -1.0 ) : normalize( mvPosition.xyz ) ) * ${RASTER_STROKE_DEPTH_LEAD.toFixed(6)};`,
          "gl_Position = projectionMatrix * mvPosition;",
        ].join("\n"),
      );
    };

  const dots: THREE.Points = new THREE.Points(geometry, material);
  dots.matrixAutoUpdate = false;
  dots.frustumCulled = false;
  if (options.xray) dots.renderOrder = Number.MAX_SAFE_INTEGER;
  return dots;
}
