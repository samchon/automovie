import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import type { AutoMovieHumanPolygonFoot } from "./AutoMovieHumanPolygonFoot.js";
import type { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";

/**
 * Admit and copy the source foot courses for the existing rigid module emitter.
 * An absent optional descriptor preserves the original procedural modules.
 *
 * @evidence contracts/common.md#principled-implementation Validates finite registered points, positive full extents, consistent course counts, existing side-specific bone ownership, exact shared Midfoot seam and bounded landmark addresses before copying source points. Only full-to-half extent conversion adapts the existing emitter's metadata; coordinates and topology remain source-owned.
 * @evidence contracts/common.md#clear-and-simple-design One optional adapter feeds the same Subtalar/Midfoot module assembler and leaves anatomical curve generation with Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source point is fitted, lowered, resampled or omitted; a broken seam or mislabeled source landmark refuses rather than receiving a geometric correction.
 * @evidence contracts/common.md#meaningful-documentation States optional legacy behavior, finite source admission, exact shared seam, module binding and unchanged registered coordinate authority.
 * @evidence contracts/performance.md#efficient-algorithms Bone membership and source course/vertex scans cost O(B+V); copying creates one vector per source vertex plus constant metadata per course. No dense skin or second calibration runs.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable source descriptors are read without mutation; admitted copies are reused by the single existing assembly pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only owned vectors/course records and acquires no native resource, material, renderer or generator lifetime.
 */
export function prepareHumanPolygonFootSurface(input: AutoMovieHumanPolygon.IInput): ReadonlyMap<AutoMovieHumanPolygonFoot.Bone, {
  /** Unchanged source direction used by the existing winding decision. */
  axis: THREE.Vector3;
  /** Source points copied into the existing module section representation. */
  courses: buildHumanPolygonModule.ISection[];
}> | undefined {
  const source: Readonly<AutoMovieHumanPolygonFoot.IInput> | undefined = input.footSurface;
  if (source === undefined) return undefined;
  if (source.units !== "metres") throw new Error("Polygon foot source must use registered metres.");
  const bones: Set<string> = new Set(input.bones.map((bone: AutoMovieHumanPolygon.IBone): string => bone.bone));
  const output: Map<AutoMovieHumanPolygonFoot.Bone, { axis: THREE.Vector3; courses: buildHumanPolygonModule.ISection[] }> = new Map();
  for (const side of ["left", "right"] as const) {
    const foot: AutoMovieHumanPolygonFoot.ISide = source[side];
    let minimum: number = Infinity;
    for (const name of ["hindfoot", "forefoot"] as const) {
      const module: AutoMovieHumanPolygonFoot.IModule = foot[name];
      const expected: AutoMovieHumanPolygonFoot.Bone = name === "hindfoot" ? `${side}Subtalar` : `${side}Midfoot`;
      if (module.bone !== expected || !bones.has(module.bone) || module.courses.length < 2 || module.axis.length !== 3 || !module.axis.every(Number.isFinite) || !Number.isFinite(Math.hypot(...module.axis)) || !(Math.hypot(...module.axis) > 0))
        throw new Error(`Invalid polygon foot module: ${side}.${name}`);
      const count: number = module.courses[0]!.points.length;
      if (count < 3) throw new Error("Polygon foot courses require at least three source points.");
      const courses: buildHumanPolygonModule.ISection[] = [];
      for (const course of module.courses) {
        if (course.centre.length !== 3 || !course.centre.every(Number.isFinite) || !(course.depth > 0) || !(course.breadth > 0) || !Number.isFinite(course.depth + course.breadth + course.stationMm) || course.points.length !== count || course.sourcePhases.length !== count || course.displayCoordinates.length !== count || !course.sourcePhases.every(Number.isFinite) || !course.displayCoordinates.every(Number.isFinite) || ![`foot.${side}`, `forefoot.${side}.1`, `forefoot.${side}.2`].includes(course.chain))
          throw new Error(`Invalid polygon foot source course: ${side}.${name}`);
        for (const point of course.points) {
          if (point.length !== 3 || !point.every(Number.isFinite)) throw new Error("Polygon foot source point must be finite registered metres.");
          minimum = Math.min(minimum, point[1]);
        }
        courses.push({ centre: new THREE.Vector3(...course.centre), depth: course.depth / 2, breadth: course.breadth / 2, points: course.points.map((point: [number, number, number]): THREE.Vector3 => new THREE.Vector3(...point)), displayCoordinates: [...course.displayCoordinates] });
      }
      output.set(module.bone, { axis: new THREE.Vector3(...module.axis), courses });
    }
    const lower: AutoMovieHumanPolygonFoot.ICourse = foot.hindfoot.courses.at(-1)!;
    const upper: AutoMovieHumanPolygonFoot.ICourse = foot.forefoot.courses[0]!;
    if (lower.chain !== upper.chain || lower.stationMm !== upper.stationMm || lower.depth !== upper.depth || lower.breadth !== upper.breadth || !equal(lower.centre, upper.centre) || !equal(lower.sourcePhases, upper.sourcePhases) || !equal(lower.displayCoordinates, upper.displayCoordinates) || lower.points.length !== upper.points.length || lower.points.some((point: [number, number, number], index: number): boolean => !equal(point, upper.points[index]!)))
      throw new Error(`Polygon ${side} foot modules must retain their exact shared source seam.`);
    if (foot.support.minimumHeight !== minimum) throw new Error("Polygon foot source minimum differs from its retained course points.");
    for (const name of ["plantarHeel", "medialBall", "lateralBall"] as const) {
      const address: AutoMovieHumanPolygonFoot.ISourceLandmark = foot.landmarks[name];
      if ((address.module !== "hindfoot" && address.module !== "forefoot") || !Number.isSafeInteger(address.course) || !Number.isSafeInteger(address.point) || address.course < 0 || address.point < 0)
        throw new Error(`Invalid polygon foot landmark address: ${side}.${name}`);
      const course: AutoMovieHumanPolygonFoot.ICourse | undefined = foot[address.module].courses[address.course];
      const point: [number, number, number] | undefined = course?.points[address.point];
      if (point === undefined || foot.support.landmarkHeights[name] !== point[1]) throw new Error(`Polygon foot landmark must identify its actual source vertex: ${side}.${name}`);
    }
  }
  return output;
}

/** Compare copied source seam scalars exactly, without fitting or tolerance. */
function equal(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value: number, index: number): boolean => value === right[index]);
}
