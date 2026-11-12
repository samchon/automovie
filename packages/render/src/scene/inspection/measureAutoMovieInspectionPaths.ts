import type { IAutoMovieMark } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionBounds } from "./measureAutoMovieInspectionBounds.js";

/**
 * Measure the world-space box of every chosen path of an inspected scene: of the drawn objects at that path and of the marks at that path, together.
 *
 * An object's box is what `measureAutoMovieInspectionBounds` measures of it as drawn now, its posed vertices and those of the objects beneath it that are drawn, so an isolated object contributes nothing. A mark's box holds its coordinates carried by its anchor's world matrix, through the anchor's first instance when it is an instanced mesh, and an arrow's tips as well as its origins. Paths come in the order the objects, then the marks, first give them; a chosen path with nothing drawn is left out.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each box holds for objects and for marks, what is left out, and the order.
 * @evidence contracts/development/implementation.md#principled-implementation An object is measured as the renderer draws it, and a mark's coordinates are in its anchor's frame, so its world points are those coordinates under the anchor's world matrix.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map from path to box, filled from the objects and then from the marks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is measured by name, and a path with nothing drawn has no box instead of a box at the origin.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the chosen objects' drawn vertices and the chosen marks' coordinates.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The pose changes between calls, so no earlier box is reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; the objects, marks and anchors are read.
 */
export function measureAutoMovieInspectionPaths(props: {
  /** Drawn objects with their paths. */
  objects: readonly IAutoMovieInspectionPath[];

  /** Drawn marks with the object their frame belongs to, `null` for world space. */
  marks: readonly { mark: IAutoMovieMark; anchor: THREE.Object3D | null }[];

  /** Whether a path is measured. */
  choose: (path: string) => boolean;
}): { path: string; min: IAutoMovieVector3; max: IAutoMovieVector3 }[] {
  const boxes: Map<string, THREE.Box3> = new Map<string, THREE.Box3>();
  const box: (path: string) => THREE.Box3 = (path: string): THREE.Box3 => {
    let found: THREE.Box3 | undefined = boxes.get(path);
    if (found === undefined) {
      found = new THREE.Box3();
      boxes.set(path, found);
    }
    return found;
  };

  for (const { path, object } of props.objects) {
    if (!props.choose(path)) continue;
    const measured: { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null =
      measureAutoMovieInspectionBounds(object);
    if (measured !== null)
      box(path)
        .expandByPoint(vector(measured.min))
        .expandByPoint(vector(measured.max));
  }

  const point: THREE.Vector3 = new THREE.Vector3();
  const placement: THREE.Matrix4 = new THREE.Matrix4();
  for (const { mark, anchor } of props.marks) {
    if (!props.choose(mark.path)) continue;
    placement.identity();
    if (anchor !== null) {
      anchor.updateWorldMatrix(true, false);
      placement.copy(anchor.matrixWorld);
      if (anchor instanceof THREE.InstancedMesh && anchor.count > 0) {
        const instance: THREE.Matrix4 = new THREE.Matrix4();
        anchor.getMatrixAt(0, instance);
        placement.multiply(instance);
      }
    }
    const target: THREE.Box3 = box(mark.path);
    const shape: IAutoMovieMark.Shape = mark.shape;
    const lists: number[][] =
      shape.type === "arrows"
        ? [
            shape.origins,
            shape.origins.map(
              (value: number, i: number): number => value + shape.vectors[i]!,
            ),
          ]
        : [shape.points];
    for (const list of lists)
      for (let i: number = 0; i + 2 < list.length; i += 3)
        target.expandByPoint(
          point
            .set(list[i]!, list[i + 1]!, list[i + 2]!)
            .applyMatrix4(placement),
        );
  }

  return [...boxes]
    .filter(([, found]: [string, THREE.Box3]): boolean => !found.isEmpty())
    .map(
      ([path, found]: [string, THREE.Box3]): {
        path: string;
        min: IAutoMovieVector3;
        max: IAutoMovieVector3;
      } => ({
        path,
        min: { x: found.min.x, y: found.min.y, z: found.min.z },
        max: { x: found.max.x, y: found.max.y, z: found.max.z },
      }),
    );
}

/** A three.js vector from a plain one. */
function vector(value: IAutoMovieVector3): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}
