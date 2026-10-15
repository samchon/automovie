import { Point } from "./Point";
import { rayIntersectsBounds } from "./rayIntersectsBounds";
import { rayTriangle } from "./rayTriangle";
import { Triangle } from "./Triangle";

/** Exterior cell test for a five-centimetre point, including narrow side escapes. */

export const reachesExterior = (point: Point, normal: Point, occluders: readonly Triangle[]): boolean => {
  const s = Math.SQRT1_2;
  const lateral = { x: -normal.z, y: 0, z: normal.x };
  const diagonal = (yaw: number, elevation: number): Point => ({
    x: (normal.x * Math.cos(yaw) + lateral.x * Math.sin(yaw)) * Math.cos(elevation),
    y: Math.sin(elevation),
    z: (normal.z * Math.cos(yaw) + lateral.z * Math.sin(yaw)) * Math.cos(elevation),
  });
  const directions: Point[] = [normal, { x: 0, y: 1, z: 0 },
    { x: normal.x * s, y: s, z: normal.z * s },
    { x: (normal.x + lateral.x) * s, y: 0, z: (normal.z + lateral.z) * s },
    { x: (normal.x - lateral.x) * s, y: 0, z: (normal.z - lateral.z) * s },
    { x: normal.x * 0.5, y: 0.866, z: normal.z * 0.5 },
    { x: normal.x * 0.9659, y: 0.2588, z: normal.z * 0.9659 },
    ...[15, 30].flatMap((degrees) => [10, 30].flatMap((height) => [diagonal(degrees * Math.PI / 180, height * Math.PI / 180),
    diagonal(-degrees * Math.PI / 180, height * Math.PI / 180)]))];
  return directions.some((direction) => !occluders.some((triangle) => rayIntersectsBounds(point, direction, triangle) && rayTriangle(point, direction, triangle) !== null));
};
