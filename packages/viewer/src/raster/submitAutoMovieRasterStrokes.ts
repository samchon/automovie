import * as THREE from "three";

import type { IAutoMovieRasterFrame } from "./IAutoMovieRasterFrame.js";
import { RASTER_STROKE_DEPTH_LEAD } from "./RASTER_STROKE_DEPTH_LEAD.js";
import { projectAutoMovieRasterPath } from "./projectAutoMovieRasterPath.js";

/**
 * Draw one line object's segments or one points object's vertices into a
 * frame, unlit, in the material's colour.
 *
 * `Line` joins consecutive vertices, `LineLoop` also closes the run and
 * `LineSegments` takes vertices in pairs, through the geometry's index when it
 * has one. With `vertexColors` on, a segment takes the mean of its two vertex
 * colours and a point its own. The material's clipping planes and the near
 * plane cut segments and drop points, and `depthTest` off draws over
 * surfaces. A depth-tested stroke is drawn `RASTER_STROKE_DEPTH_LEAD` nearer
 * the camera than it lies, so a mark on a surface is not lost to that surface.
 * A point is a square of its `PointsMaterial` size in output pixels,
 * attenuated by distance as three.js does when `sizeAttenuation` is on.
 *
 * A stroke is `linewidth` output pixels wide. WebGL draws every line one
 * pixel wide whatever `linewidth` says; this rasterizer honours the value so
 * a construction curve stays readable in a reduced contact-sheet cell.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each object kind joins its vertices, the colour source, what clips and what the depth test does, the point size rule and the one place the stroke differs from WebGL and why.
 * @evidence contracts/development/implementation.md#principled-implementation Every vertex goes through the object's world matrix and the frame's view-projection once, and segments are clipped in world and clip space before the perspective division, so a stroke crossing the camera plane never wraps.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared preparation of colour, planes and placed vertices, then one loop per object kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A shader material's unknown colour is drawn as neutral grey rather than guessed, and a missing position attribute or invisible material draws nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the vertex count plus the drawn pixel length.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Placed vertices are shared by the two segments that meet at them, and clipping and projection reuse the mesh path's function.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates seven numbers per vertex for the call; nothing is retained.
 */
export function submitAutoMovieRasterStrokes(
  frame: IAutoMovieRasterFrame,
  object: THREE.Line | THREE.Points,
): void {
  const geometry: THREE.BufferGeometry = object.geometry;
  const position:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = geometry.getAttribute("position");
  const material: THREE.Material | undefined = Array.isArray(object.material)
    ? object.material[0]
    : object.material;
  if (position === undefined || material === undefined || !material.visible)
    return;

  // Unlit base colour; a shader's colour is unknown.
  const color: unknown = (material as { color?: unknown }).color;
  const base: [number, number, number] =
    color instanceof THREE.Color && !(material instanceof THREE.ShaderMaterial)
      ? [color.r, color.g, color.b]
      : [0.6, 0.6, 0.6];
  const colors:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = material.vertexColors
    ? geometry.getAttribute("color")
    : undefined;
  const tone: (i: number, j: number) => [number, number, number] = (
    i: number,
    j: number,
  ): [number, number, number] =>
    colors === undefined
      ? base
      : [
          (base[0] * (colors.getX(i) + colors.getX(j))) / 2,
          (base[1] * (colors.getY(i) + colors.getY(j))) / 2,
          (base[2] * (colors.getZ(i) + colors.getZ(j))) / 2,
        ];
  const planes: readonly THREE.Plane[] = material.clippingPlanes ?? [];

  // World metres and clip coordinates of every vertex. A depth-tested vertex is projected from a point led toward the camera along its line of sight, which keeps its pixel and puts it in front of a surface it lies on.
  const vertices: number[][] = [];
  const world: THREE.Vector3 = new THREE.Vector3();
  const led: THREE.Vector3 = new THREE.Vector3();
  const clip: THREE.Vector4 = new THREE.Vector4();
  for (let i: number = 0; i < position.count; i++) {
    world.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
    led.copy(world);
    if (material.depthTest && frame.orthographic)
      led.addScaledVector(frame.forward, -RASTER_STROKE_DEPTH_LEAD);
    else if (material.depthTest) {
      const distance: number = world.distanceTo(frame.eye);
      if (distance > RASTER_STROKE_DEPTH_LEAD)
        led.lerp(frame.eye, RASTER_STROKE_DEPTH_LEAD / distance);
    }
    clip.set(led.x, led.y, led.z, 1).applyMatrix4(frame.viewProjection);
    vertices.push([world.x, world.y, world.z, clip.x, clip.y, clip.z, clip.w]);
  }

  if (object instanceof THREE.Points) {
    // three.js draws a point `size` drawing-buffer pixels wide, times half the
    // buffer height over view depth when attenuated in perspective.
    const size: number =
      material instanceof THREE.PointsMaterial ? material.size : 1;
    const attenuate: boolean =
      material instanceof THREE.PointsMaterial &&
      material.sizeAttenuation &&
      !frame.orthographic;
    for (const [k, vertex] of vertices.entries()) {
      const placed: number[][] = projectAutoMovieRasterPath(
        frame,
        [vertex, vertex],
        planes,
      );
      if (placed.length !== 2 || vertex[6]! <= 0) continue;
      const width: number =
        size *
        frame.factor *
        (attenuate ? frame.target.height / (2 * frame.factor) / vertex[6]! : 1);
      frame.target.point(
        placed[0]![0]!,
        placed[0]![1]!,
        placed[0]![2]!,
        Math.max(0, Math.round((width - 1) / 2)),
        tone(k, k),
        material.depthTest,
      );
      frame.statistics.points++;
    }
    return;
  }

  // Segments: pairs for LineSegments, a run otherwise, closed for LineLoop.
  const index: THREE.BufferAttribute | null = geometry.getIndex();
  const count: number = index === null ? position.count : index.count;
  const at: (k: number) => number = (k: number): number =>
    index === null ? k : index.getX(k);
  const stride: number = object instanceof THREE.LineSegments ? 2 : 1;
  const closing: number = object instanceof THREE.LineLoop ? 1 : 0;
  const width: number =
    Math.max(1, (material as { linewidth?: number }).linewidth ?? 1) *
    frame.factor;
  for (let k: number = 0; k + 1 < count + closing; k += stride) {
    const i: number = at(k);
    const j: number = at((k + 1) % count);
    const placed: number[][] = projectAutoMovieRasterPath(
      frame,
      [vertices[i]!, vertices[j]!],
      planes,
    );
    if (placed.length !== 2) continue;
    frame.target.line(
      placed[0]![0]!,
      placed[0]![1]!,
      placed[0]![2]!,
      placed[1]![0]!,
      placed[1]![1]!,
      placed[1]![2]!,
      tone(i, j),
      material.depthTest,
      width,
    );
    frame.statistics.lines++;
  }
}
