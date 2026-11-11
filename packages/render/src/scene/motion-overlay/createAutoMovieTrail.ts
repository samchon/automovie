import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

/**
 * A polyline through world points, drawn over the scene: an effector's path,
 * a root's track or a planned target path for motion inspection.
 *
 * The line ignores depth so the path stays readable through the body that
 * makes it, and `renderOrder` keeps it above the surfaces. The caller owns the
 * returned line and disposes its geometry and material.
 *
 * @param points World points in order, metres; at least two.
 * @param color sRGB hex colour.
 * @returns The line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the line shows, its depth behaviour and ownership.
 * @evidence contracts/development/implementation.md#principled-implementation A `THREE.Line` over a position buffer, the standard three.js polyline.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One buffer, one material, one line.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fewer than two or non-finite points throw instead of drawing nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the point count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call draws a new path.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns and disposes the geometry and material.
 */
export function createAutoMovieTrail(
  points: readonly IAutoMovieVector3[],
  color: number,
): THREE.Line {
  if (points.length < 2) throw new Error("A trail needs at least two points");
  const buffer: Float32Array = new Float32Array(points.length * 3);
  points.forEach((p: IAutoMovieVector3, i: number): void => {
    if (![p.x, p.y, p.z].every(Number.isFinite))
      throw new Error(`Trail point ${i} is not finite`);
    buffer.set([p.x, p.y, p.z], i * 3);
  });
  const line: THREE.Line = new THREE.Line(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(buffer, 3),
    ),
    new THREE.LineBasicMaterial({ color, depthTest: false }),
  );
  line.renderOrder = 20;
  return line;
}
