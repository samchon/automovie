import type { IAutoMovieMark } from "@automovie/engine";
import * as THREE from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

import type { IAutoMovieInspectionMarkSet } from "./IAutoMovieInspectionMarkSet.js";
import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
import { createAutoMovieInspectionDots } from "./createAutoMovieInspectionDots.js";
import { createAutoMovieInspectionStrokes } from "./createAutoMovieInspectionStrokes.js";
import { followAutoMovieInspectionSource } from "./followAutoMovieInspectionSource.js";

/**
 * Build marks into drawable lines and points, one line object and one points object per anchor, that follow their anchors.
 *
 * Each shape is drawn as the mark type defines it: a polyline joins its places in order and closes back to its first when closed, segments are taken in pairs, an arrow is a shaft from its origin to its tip with a head of four short lines, and points are dots. Every vertex takes its mark's colour. An anchored set takes its anchor's world matrix, through the first instance when the anchor is an instanced mesh; a set without an anchor stays in world space wherever its object is attached.
 *
 * Vertices are written from the marks' own coordinate arrays on build and on every `update`, so an owner that rewrites a mark's coordinates in place moves its drawing. The number of vertices a mark has may not change after the build.
 *
 * It throws, naming the mark's path, for coordinates that are not whole finite xyz triples, a polyline of fewer than two places, segments that do not pair up, arrows whose origins and vectors differ in number, and a mark without coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each shape is drawn, the colour and placement rules, when coordinates are reread and the one thing that may not change, and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Coordinates are in the anchor's local frame, so the drawn object takes the anchor's world matrix and the coordinates themselves are never transformed. An arrow head is drawn as four lines from the tip back a quarter of the arrow's length and out half of that on two perpendicular axes, a drawing convention that reads as a direction from any view.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and counting per set, one fill of colours, one fill of positions shared by build and update, then the overlay record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A malformed mark is refused instead of drawn short, and no kind or path changes how a mark is drawn.
 * @evidence contracts/development/implementation.md#efficient-algorithms Building and each update are linear in the drawn vertices; every set is at most two draw calls whatever the number of marks and colours.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The line and point objects come from the shared factories and placement from `followAutoMovieInspectionSource`; the buffers built once are rewritten in place on every update.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The overlay owns its group, geometries and materials and releases them in `dispose`; it borrows the anchors and the marks' coordinate arrays.
 */
export function buildAutoMovieInspectionMarks(
  sets: readonly IAutoMovieInspectionMarkSet[],
  options: { stroke: number; xray: boolean },
): IAutoMovieInspectionOverlay {
  const group: THREE.Group = new THREE.Group();
  const built: IBuilt[] = [];
  const color: THREE.Color = new THREE.Color();
  for (const set of sets) {
    // Admit every mark and count its vertices before allocating.
    let segments: number = 0;
    let points: number = 0;
    for (const { mark } of set.marks) {
      const count: { segments: number; points: number } = admit(mark);
      segments += count.segments;
      points += count.points;
    }

    // Colours are fixed for the build; positions are filled by `place`.
    const lines: Float32Array = new Float32Array(segments * 6);
    const lineColors: Float32Array = new Float32Array(segments * 6);
    const dots: Float32Array = new Float32Array(points * 3);
    const dotColors: Float32Array = new Float32Array(points * 3);
    let line: number = 0;
    let dot: number = 0;
    for (const { mark, color: hex } of set.marks) {
      color.setHex(hex);
      const count: { segments: number; points: number } = admit(mark);
      for (let v: number = 0; v < count.segments * 2; v++, line++)
        lineColors.set([color.r, color.g, color.b], line * 3);
      for (let v: number = 0; v < count.points; v++, dot++)
        dotColors.set([color.r, color.g, color.b], dot * 3);
    }

    const entry: IBuilt = {
      anchor: set.anchor,
      marks: set.marks.map(
        (pair: { mark: IAutoMovieMark }): IAutoMovieMark => pair.mark,
      ),
      lines,
      dots,
      strokes:
        segments === 0
          ? null
          : createAutoMovieInspectionStrokes(lines, lineColors, options),
      points:
        points === 0
          ? null
          : createAutoMovieInspectionDots(dots, dotColors, options),
    };
    write(entry);
    if (entry.strokes !== null) group.add(entry.strokes);
    if (entry.points !== null) group.add(entry.points);
    built.push(entry);
  }

  const instance: THREE.Matrix4 = new THREE.Matrix4();
  return {
    object: group,
    update: (): void => {
      for (const entry of built) {
        write(entry);
        for (const object of [entry.strokes, entry.points])
          if (object !== null) place(object, entry.anchor, instance);
      }
    },
    resize: (width: number, height: number): void => {
      for (const entry of built)
        if (entry.strokes !== null)
          (entry.strokes.material as LineMaterial).resolution.set(
            width,
            height,
          );
    },
    dispose: (): void => {
      group.removeFromParent();
      for (const entry of built)
        for (const object of [entry.strokes, entry.points])
          if (object !== null) {
            object.geometry.dispose();
            (object.material as THREE.Material).dispose();
          }
    },
  };
}

/** One anchor's built marks: the marks, their vertex buffers and the objects drawing them. */
interface IBuilt {
  /** The anchor, or null for world space. */
  anchor: THREE.Object3D | null;

  /** The marks, in build order. */
  marks: IAutoMovieMark[];

  /** Two xyz vertices per line segment, shared with the line geometry. */
  lines: Float32Array;

  /** One xyz vertex per dot, shared with the points geometry. */
  dots: Float32Array;

  /** The line object, absent when no mark draws a line. */
  strokes: LineSegments2 | null;

  /** The points object, absent when no mark draws a dot. */
  points: THREE.Points | null;
}

/** The line segments and dots a mark draws, after refusing a malformed mark. */
function admit(mark: IAutoMovieMark): { segments: number; points: number } {
  const refuse: (problem: string) => never = (problem: string): never => {
    throw new Error(`Mark "${mark.path}" of kind ${mark.kind} ${problem}`);
  };
  const triples: (values: readonly number[], name: string) => number = (
    values: readonly number[],
    name: string,
  ): number => {
    if (values.length % 3 !== 0)
      refuse(`holds ${values.length} ${name} components, not xyz triples`);
    if (!values.every(Number.isFinite)) refuse(`holds a non-finite ${name}`);
    return values.length / 3;
  };
  const shape: IAutoMovieMark.Shape = mark.shape;
  if (shape.type === "points") {
    const n: number = triples(shape.points, "point");
    if (n === 0) refuse("has no point");
    return { segments: 0, points: n };
  }
  if (shape.type === "polyline") {
    const n: number = triples(shape.points, "point");
    if (n < 2) refuse(`is a polyline of ${n} places, not two or more`);
    return { segments: n - 1 + (shape.closed ? 1 : 0), points: 0 };
  }
  if (shape.type === "segments") {
    const n: number = triples(shape.points, "point");
    if (n === 0 || n % 2 !== 0)
      refuse(`holds ${n} segment ends, not a positive even number`);
    return { segments: n / 2, points: 0 };
  }
  const n: number = triples(shape.origins, "origin");
  if (triples(shape.vectors, "vector") !== n)
    refuse("has a different number of origins and vectors");
  if (n === 0) refuse("has no arrow");
  return { segments: n * 5, points: 0 };
}

/** Rewrite one anchor's vertex buffers from its marks' current coordinates. */
function write(entry: IBuilt): void {
  let line: number = 0;
  let dot: number = 0;
  const segment: (values: readonly number[], a: number, b: number) => void = (
    values: readonly number[],
    a: number,
    b: number,
  ): void => {
    entry.lines.set(
      [
        values[a * 3]!,
        values[a * 3 + 1]!,
        values[a * 3 + 2]!,
        values[b * 3]!,
        values[b * 3 + 1]!,
        values[b * 3 + 2]!,
      ],
      line * 6,
    );
    line++;
  };
  for (const mark of entry.marks) {
    const shape: IAutoMovieMark.Shape = mark.shape;
    if (shape.type === "points") {
      entry.dots.set(shape.points, dot * 3);
      dot += shape.points.length / 3;
    } else if (shape.type === "polyline") {
      const n: number = shape.points.length / 3;
      for (let i: number = 0; i + 1 < n; i++) segment(shape.points, i, i + 1);
      if (shape.closed) segment(shape.points, n - 1, 0);
    } else if (shape.type === "segments")
      for (let i: number = 0; i < shape.points.length / 3; i += 2)
        segment(shape.points, i, i + 1);
    else
      for (let i: number = 0; i < shape.origins.length / 3; i++) {
        const arrow: number[] = arrowLines(shape.origins, shape.vectors, i);
        for (let s: number = 0; s < 5; s++) segment(arrow, s * 2, s * 2 + 1);
      }
  }

  for (const object of [entry.strokes, entry.points])
    if (object !== null) markChanged(object.geometry);
}

/** The shaft and four head lines of one arrow, as ten xyz points taken in pairs. */
function arrowLines(
  origins: readonly number[],
  vectors: readonly number[],
  i: number,
): number[] {
  const origin: THREE.Vector3 = new THREE.Vector3().fromArray(origins, i * 3);
  const vector: THREE.Vector3 = new THREE.Vector3().fromArray(vectors, i * 3);
  const tip: THREE.Vector3 = origin.clone().add(vector);
  const length: number = vector.length();
  const out: number[] = [...origin.toArray(), ...tip.toArray()];

  // A zero vector has no direction, so its head collapses onto its tip.
  if (length === 0) {
    for (let s: number = 0; s < 4; s++)
      out.push(...tip.toArray(), ...tip.toArray());
    return out;
  }
  const along: THREE.Vector3 = vector.clone().divideScalar(length);
  const helper: THREE.Vector3 =
    Math.abs(along.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
  const side: THREE.Vector3 = new THREE.Vector3()
    .crossVectors(along, helper)
    .normalize();
  const other: THREE.Vector3 = new THREE.Vector3().crossVectors(along, side);
  const back: THREE.Vector3 = tip.clone().addScaledVector(along, -length / 4);
  for (const direction of [side, other])
    for (const sign of [1, -1])
      out.push(
        ...tip.toArray(),
        ...back
          .clone()
          .addScaledVector(direction, (sign * length) / 8)
          .toArray(),
      );
  return out;
}

/** Tell three.js that a geometry's positions were rewritten in place. */
function markChanged(geometry: THREE.BufferGeometry): void {
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute(
      geometry.hasAttribute("instanceStart") ? "instanceStart" : "position",
    );
  if (attribute instanceof THREE.InterleavedBufferAttribute)
    attribute.data.needsUpdate = true;
  else attribute.needsUpdate = true;
}

/** Give a drawn object its anchor's world placement, or world space when it has none. */
function place(
  object: THREE.Object3D,
  anchor: THREE.Object3D | null,
  instance: THREE.Matrix4,
): void {
  if (anchor === null) {
    object.matrix.identity();
    if (object.parent !== null)
      object.matrix.copy(object.parent.matrixWorld).invert();
    object.updateMatrixWorld(true);
  } else if (anchor instanceof THREE.InstancedMesh && anchor.count > 0) {
    anchor.getMatrixAt(0, instance);
    followAutoMovieInspectionSource(object, anchor, instance);
  } else followAutoMovieInspectionSource(object, anchor);
}
