import * as THREE from "three";

import { RASTER_STROKE_DEPTH_LEAD } from "../raster/RASTER_STROKE_DEPTH_LEAD.js";

/**
 * Make the line object inspection marks are drawn with: segments taken in vertex pairs, one colour per vertex, unlit and outside fog and tone mapping, so a mark's colour on screen is the colour the legend gives.
 *
 * `positions` holds two xyz vertices per segment and `colors` the matching linear rgb. Both buffers are kept by the geometry, not copied, so the caller rewrites `positions` in place to move the marks. The object does not update its own matrix and is never frustum-culled, because its owner places it and its vertices move.
 *
 * With `xray` the marks ignore depth and draw after everything else. Without it they are depth-tested `RASTER_STROKE_DEPTH_LEAD` nearer the camera than they lie, in WebGL through a patch to the vertex stage and in the CPU rasterizer by its own stroke rule, so a mark on a surface is not lost to that surface in either.
 *
 * `stroke` is the width in output pixels. The CPU rasterizer draws it; WebGL draws every line one pixel wide.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the buffer layout and colour encoding, that the buffers are shared, why the matrix and culling are fixed, both depth behaviours and where the stroke width applies.
 * @evidence contracts/development/implementation.md#principled-implementation A mark on a surface has the surface's depth, so it is led toward the camera along its line of sight, which keeps its pixel; an orthographic view has one line of sight for every point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Geometry, material, then the three object flags; the depth lead is one replaced shader line.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lead is the rasterizer's own constant, not a second number, and mismatched buffers are refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms One draw call for every mark of a source, whatever the number of colours.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The curve and defect builders both draw through this one object factory.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The geometry and material are created here and owned by the caller, who disposes both; nothing else is retained.
 */
export function createAutoMovieInspectionSegments(
  positions: Float32Array,
  colors: Float32Array,
  options: { stroke: number; xray: boolean },
): THREE.LineSegments {
  if (positions.length !== colors.length || positions.length % 6 !== 0)
    throw new Error(
      `Inspection segments need two xyz vertices and two rgb colours per segment, not ${positions.length} and ${colors.length} components`,
    );

  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    linewidth: options.stroke,
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

  const segments: THREE.LineSegments = new THREE.LineSegments(
    geometry,
    material,
  );
  segments.matrixAutoUpdate = false;
  segments.frustumCulled = false;
  if (options.xray) segments.renderOrder = Number.MAX_SAFE_INTEGER;
  return segments;
}
