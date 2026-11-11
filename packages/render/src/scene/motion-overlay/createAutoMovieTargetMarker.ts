import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

/**
 * A three-axis cross and three great circles marking a world target point,
 * such as an aim point, a struck region or a landing spot.
 *
 * The marker ignores depth and draws above the scene, so a target inside a
 * body stays visible. Its radius is the target's tolerance or display size.
 * The caller owns the returned object's geometry and material.
 *
 * @param at The target, world metres.
 * @param radius Marker radius, metres; positive.
 * @param color sRGB hex colour.
 * @returns Line segments centred on the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the marker shows, its depth behaviour and ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Line segments of three axis crosses and three circles of 24 chords each.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One buffer filled in two loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive radius or non-finite point throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant size: 6 + 144 segment endpoints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call draws a new marker.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns and disposes the geometry and material.
 */
export function createAutoMovieTargetMarker(
  at: IAutoMovieVector3,
  radius: number,
  color: number,
): THREE.LineSegments {
  if (!(radius > 0) || ![at.x, at.y, at.z].every(Number.isFinite))
    throw new Error("A target marker needs a finite point and positive radius");
  const points: number[] = [];
  for (const axis of [0, 1, 2]) {
    const d: number[] = [0, 0, 0];
    d[axis] = radius;
    points.push(at.x - d[0]!, at.y - d[1]!, at.z - d[2]!);
    points.push(at.x + d[0]!, at.y + d[1]!, at.z + d[2]!);
  }
  const chords: number = 24;
  for (const plane of [
    [0, 1],
    [1, 2],
    [0, 2],
  ] as const)
    for (let i: number = 0; i < chords; i++)
      for (const k of [i, i + 1]) {
        const angle: number = (2 * Math.PI * k) / chords;
        const p: number[] = [at.x, at.y, at.z];
        p[plane[0]] += radius * Math.cos(angle);
        p[plane[1]] += radius * Math.sin(angle);
        points.push(p[0]!, p[1]!, p[2]!);
      }
  const marker: THREE.LineSegments = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(points), 3),
    ),
    new THREE.LineBasicMaterial({ color, depthTest: false }),
  );
  marker.renderOrder = 21;
  return marker;
}
