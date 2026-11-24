import * as THREE from "three";

import type { IMaterialShaderSource } from "../IMaterialShaderSource.js";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { AUTO_MOVIE_INSPECTION_DEPTH_LEAD } from "./AUTO_MOVIE_INSPECTION_DEPTH_LEAD.js";

/**
 * Make the points object inspection marks draw their places with: one
 * screen-sized square per vertex, one colour per vertex, unlit and outside fog
 * and tone mapping.
 *
 * A point is three stroke widths across, in the same pixels as a line's width,
 * so a joint stays visible where the lines of its bones meet it. Its size does
 * not shrink with distance. three.js draws it that many pixels times the
 * renderer's pixel ratio, as it draws a line's width.
 *
 * `positions` holds one xyz vertex per point and `colors` the matching linear
 * rgb, kept by the geometry, not copied, so the caller rewrites `positions` in
 * place to move the points. Depth follows `createAutoMovieInspectionStrokes`:
 * ignored with `xray`, and otherwise led `AUTO_MOVIE_INSPECTION_DEPTH_LEAD`
 * toward the camera.
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
    addMaterialShaderPatch(material, {
      key: "automovie-inspection-dot-lead",
      apply: (shader: IMaterialShaderSource): void => {
        // Lead the view-space position toward the eye, then project it again.
        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          [
            "#include <project_vertex>",
            `mvPosition.xyz -= ( isOrthographic ? vec3( 0.0, 0.0, -1.0 ) : normalize( mvPosition.xyz ) ) * ${AUTO_MOVIE_INSPECTION_DEPTH_LEAD.toFixed(6)};`,
            "gl_Position = projectionMatrix * mvPosition;",
          ].join("\n"),
        );
      },
    });

  const dots: THREE.Points = new THREE.Points(geometry, material);
  dots.matrixAutoUpdate = false;
  dots.frustumCulled = false;
  if (options.xray) dots.renderOrder = Number.MAX_SAFE_INTEGER;
  return dots;
}
