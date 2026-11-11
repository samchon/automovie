import type * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

import { AUTO_MOVIE_INSPECTION_DEPTH_LEAD } from "./AUTO_MOVIE_INSPECTION_DEPTH_LEAD.js";

/** The line of three.js's line shader after which both ends are in view space. */
const VIEW_SPACE_ENDS: string =
  "vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );";

/**
 * Make the line object inspection marks are drawn with: segments taken in vertex pairs, one colour per vertex, `stroke` pixels wide in every renderer, unlit and outside fog and tone mapping, so a mark's colour on screen is the colour the legend gives.
 *
 * The object is three.js's `LineSegments2` with a `LineMaterial`, which draws each segment as a screen-space quad, because WebGL draws a plain line one pixel wide whatever its width says. The width is in pixels of the material's `resolution`: three.js sets it to the renderer's viewport before every draw, and the inspection handle's `resize` sets it for a reader that needs it before one.
 *
 * `positions` holds two xyz vertices per segment and `colors` the matching linear rgb. Both buffers are kept by the geometry, not copied, so the caller rewrites `positions` in place and marks it changed to move the marks. The object does not update its own matrix and is never frustum-culled, because its owner places it and its vertices move.
 *
 * With `xray` the marks ignore depth and draw after everything else. Without it they are depth-tested `AUTO_MOVIE_INSPECTION_DEPTH_LEAD` nearer the camera than they lie, through a patch to the line shader that leads both ends toward the eye, so a mark on a surface is not lost to that surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the object used and why, what the width is measured in and who sets the resolution, the buffer layout and sharing, why the matrix and culling are fixed, and both depth behaviours.
 * @evidence contracts/development/implementation.md#principled-implementation A mark on a surface has the surface's depth, so its ends are led toward the camera along their lines of sight in view space before the shader widens the segment, which keeps their pixels; an orthographic view has one line of sight for every point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Geometry, material, then the object flags; the depth lead is one inserted pair of shader lines.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The width is three.js's own screen-space line, not a widened mesh of our own, the lead is the inspection's one stated constant, and mismatched buffers are refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms One instanced draw call for every segment of the object, whatever the number of colours.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every mark builder draws its lines through this one factory.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The geometry and material are created here and owned by the caller, who disposes both; nothing else is retained.
 */
export function createAutoMovieInspectionStrokes(
  positions: Float32Array,
  colors: Float32Array,
  options: { stroke: number; xray: boolean },
): LineSegments2 {
  if (positions.length !== colors.length || positions.length % 6 !== 0)
    throw new Error(
      `Inspection strokes need two xyz vertices and two rgb colours per segment, not ${positions.length} and ${colors.length} components`,
    );

  const geometry: LineSegmentsGeometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  const material: LineMaterial = new LineMaterial({
    linewidth: options.stroke,
    vertexColors: true,
    worldUnits: false,
    depthTest: !options.xray,
    depthWrite: !options.xray,
    transparent: options.xray,
    toneMapped: false,
  });
  if (!options.xray)
    material.onBeforeCompile = (
      shader: THREE.WebGLProgramParametersWithUniforms,
    ): void => {
      // Lead both view-space ends toward the eye before the segment is widened.
      shader.vertexShader = shader.vertexShader.replace(
        VIEW_SPACE_ENDS,
        [
          VIEW_SPACE_ENDS,
          `start.xyz -= ( isOrthographic ? vec3( 0.0, 0.0, -1.0 ) : normalize( start.xyz ) ) * ${AUTO_MOVIE_INSPECTION_DEPTH_LEAD.toFixed(6)};`,
          `end.xyz -= ( isOrthographic ? vec3( 0.0, 0.0, -1.0 ) : normalize( end.xyz ) ) * ${AUTO_MOVIE_INSPECTION_DEPTH_LEAD.toFixed(6)};`,
        ].join("\n"),
      );
    };

  const strokes: LineSegments2 = new LineSegments2(geometry, material);
  strokes.matrixAutoUpdate = false;
  strokes.frustumCulled = false;
  if (options.xray) strokes.renderOrder = Number.MAX_SAFE_INTEGER;
  return strokes;
}
