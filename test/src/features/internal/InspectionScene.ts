import type { IAutoMovieMark } from "@automovie/engine";
import type { IAutoMovieInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

import { nclose } from "./nclose";

/**
 * Scenes, requests and marks the inspection tests build, and the readings they take of what an inspection added to a scene: its line and point objects, their world-space vertices and their colours.
 */
export namespace InspectionScene {
  /** A named two-metre square in the XY plane centred at `x`, facing +Z. */
  export function quad(
    name: string,
    x: number = 0,
    size: number = 2,
  ): THREE.Mesh {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
    );
    mesh.name = name;
    mesh.position.x = x;
    return mesh;
  }

  /** A scene of the given objects with current world matrices. */
  export function scene(...objects: THREE.Object3D[]): THREE.Scene {
    const stage: THREE.Scene = new THREE.Scene();
    if (objects.length !== 0) stage.add(...objects);
    stage.updateMatrixWorld(true);
    return stage;
  }

  /** The request that asks for nothing, with the given members replaced. */
  export function ask(
    changes: Partial<IAutoMovieInspectionRequest>,
  ): IAutoMovieInspectionRequest {
    return {
      parts: [],
      hide: [],
      shade: "beauty",
      surface: true,
      marks: [],
      sliver: null,
      section: null,
      xray: false,
      stroke: 3,
      label: [],
      color: [],
      trail: [],
      reach: 1,
      ticks: 5,
      ...changes,
    };
  }

  /** An unflagged, unanchored mark of a kind whose label is the kind and whose colour is given. */
  export function mark(
    path: string,
    kind: string,
    color: number,
    shape: IAutoMovieMark.Shape,
    changes: Partial<IAutoMovieMark> = {},
  ): IAutoMovieMark {
    return {
      path,
      kind,
      label: kind,
      color,
      shape,
      flagged: false,
      anchor: null,
      ...changes,
    };
  }

  /** Every screen-space line object in a scene. */
  export function strokes(root: THREE.Object3D): LineSegments2[] {
    const found: LineSegments2[] = [];
    root.traverse((object: THREE.Object3D): void => {
      if ((object as { isLineSegments2?: boolean }).isLineSegments2 === true)
        found.push(object as LineSegments2);
    });
    return found;
  }

  /** Every points object in a scene. */
  export function dots(root: THREE.Object3D): THREE.Points[] {
    const found: THREE.Points[] = [];
    root.traverse((object: THREE.Object3D): void => {
      if (object instanceof THREE.Points) found.push(object);
    });
    return found;
  }

  /** The world-space ends of every segment of a line object, each as `[x0, y0, z0, x1, y1, z1]`. */
  export function segments(line: LineSegments2): number[][] {
    line.updateMatrixWorld(true);
    const start: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      line.geometry.getAttribute("instanceStart");
    const end: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      line.geometry.getAttribute("instanceEnd");
    const a: THREE.Vector3 = new THREE.Vector3();
    const b: THREE.Vector3 = new THREE.Vector3();
    return Array.from(
      { length: start.count },
      (_: unknown, i: number): number[] => {
        a.fromBufferAttribute(start, i).applyMatrix4(line.matrixWorld);
        b.fromBufferAttribute(end, i).applyMatrix4(line.matrixWorld);
        return [a.x, a.y, a.z, b.x, b.y, b.z];
      },
    );
  }

  /** The sRGB hex colour of every segment's start of a line object. */
  export function colors(line: LineSegments2): number[] {
    const start: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      line.geometry.getAttribute("instanceColorStart");
    return Array.from(
      { length: start.count },
      (_: unknown, i: number): number =>
        new THREE.Color(start.getX(i), start.getY(i), start.getZ(i)).getHex(),
    );
  }

  /** The world-space position and sRGB hex colour of every point of a points object. */
  export function points(
    dots: THREE.Points,
  ): { at: number[]; color: number }[] {
    dots.updateMatrixWorld(true);
    const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      dots.geometry.getAttribute("position");
    const color: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      dots.geometry.getAttribute("color");
    const at: THREE.Vector3 = new THREE.Vector3();
    return Array.from(
      { length: position.count },
      (_: unknown, i: number): { at: number[]; color: number } => {
        at.fromBufferAttribute(position, i).applyMatrix4(dots.matrixWorld);
        return {
          at: [at.x, at.y, at.z],
          color: new THREE.Color(
            color.getX(i),
            color.getY(i),
            color.getZ(i),
          ).getHex(),
        };
      },
    );
  }

  /** The line material of a line object. */
  export function material(line: LineSegments2): LineMaterial {
    return line.material as LineMaterial;
  }

  /** Assert that two number lists have one length and agree within a tolerance. */
  export function close(
    title: string,
    actual: readonly number[],
    expected: readonly number[],
    tolerance: number = 1e-6,
  ): void {
    TestValidator.predicate(
      `${title}: ${actual.join(",")} within ${tolerance} of ${expected.join(",")}`,
      actual.length === expected.length &&
        actual.every((value: number, i: number): boolean =>
          nclose(value, expected[i]!, tolerance),
        ),
    );
  }
}
