/**
 * The review capture camera as a pure projection and ray model.
 *
 * `capture-articulation.mjs` renders through a three.js
 * `PerspectiveCamera(28, 1, ...)` placed at
 * `target + distance * (cos p sin y, sin p, cos p cos y)` and aimed at the
 * target with world +Y up, into a square `viewport` of pixels. The shape fit
 * (`fit-face-landmarks.ts`) and the landmark correspondence need the same
 * mapping without a browser: `faceShapeFitProject` takes a basis-frame point
 * (metres) to image pixels (+x right, +y down, pixel centres at half
 * integers), and `faceShapeFitRay` takes an image pixel back to the ray the
 * renderer shot through it. Both are pure and agree exactly: projecting any
 * point on a pixel's ray returns that pixel.
 */
import type { IFaceLikenessCamera } from "./faceLikenessFraming";

/** Orthonormal camera frame and projection constants. */
export interface IFaceShapeFitView {
  eye: [number, number, number];
  forward: [number, number, number];
  right: [number, number, number];
  up: [number, number, number];
  /** tan(fov / 2) of the vertical field. */
  halfTangent: number;
  viewport: number;
}

/** The frame of a capture camera. */
export function faceShapeFitView(
  camera: IFaceLikenessCamera,
  viewport = 900,
  fovDegrees = 28,
): IFaceShapeFitView {
  const yaw = (camera.yaw * Math.PI) / 180;
  const pitch = (camera.pitch * Math.PI) / 180;
  const eye: [number, number, number] = [
    camera.target[0] + camera.distance * Math.cos(pitch) * Math.sin(yaw),
    camera.target[1] + camera.distance * Math.sin(pitch),
    camera.target[2] + camera.distance * Math.cos(pitch) * Math.cos(yaw),
  ];
  const forward = unit([0, 1, 2].map((k) => camera.target[k]! - eye[k]!));
  // three.js lookAt with world +Y up: right = forward x up, up = right x forward.
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return {
    eye,
    forward,
    right,
    up,
    halfTangent: Math.tan((fovDegrees * Math.PI) / 360),
    viewport,
  };
}

/** Project a basis-frame point to image pixels; refuses a point behind the camera. */
export function faceShapeFitProject(
  view: IFaceShapeFitView,
  point: readonly number[],
): [number, number] {
  const offset = [0, 1, 2].map((k) => point[k]! - view.eye[k]!);
  const depth = dot(offset, view.forward);
  if (!(depth > 0))
    throw new Error("A projected point must lie in front of the camera.");
  const x = dot(offset, view.right) / (depth * view.halfTangent);
  const y = dot(offset, view.up) / (depth * view.halfTangent);
  return [((x + 1) / 2) * view.viewport, ((1 - y) / 2) * view.viewport];
}

/** The ray through an image pixel: origin at the eye, unit direction. */
export function faceShapeFitRay(
  view: IFaceShapeFitView,
  pixel: readonly [number, number],
): { origin: [number, number, number]; direction: [number, number, number] } {
  const x = (2 * pixel[0]) / view.viewport - 1;
  const y = 1 - (2 * pixel[1]) / view.viewport;
  return {
    origin: [...view.eye],
    direction: unit(
      [0, 1, 2].map(
        (k) =>
          view.forward[k]! +
          x * view.halfTangent * view.right[k]! +
          y * view.halfTangent * view.up[k]!,
      ),
    ),
  };
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(
  a: readonly number[],
  b: readonly number[],
): [number, number, number] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

function unit(a: readonly number[]): [number, number, number] {
  const length = Math.hypot(a[0]!, a[1]!, a[2]!);
  return [a[0]! / length, a[1]! / length, a[2]! / length];
}
