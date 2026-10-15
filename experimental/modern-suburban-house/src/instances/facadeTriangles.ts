import type {
  IAutoMovieMesh,
} from "@automovie/interface";
import { Vec } from "./Vec";
import { Point } from "./Point";
import { Frame } from "./Frame";
import { dot } from "./dot";
import { local } from "./local";
import { minus } from "./minus";

/** Shared geometry and frame calculations for exterior repetition. */
export const facadeTriangles = (
  mesh: IAutoMovieMesh,
  frame: Frame,
): (readonly [Point, Point, Point])[] => {
  if (mesh.indices === null || mesh.normals === null)
    throw new Error("facade mesh needs indices and normals");
  const result: (readonly [Point, Point, Point])[] = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const at = (j: number): Vec => {
      const offset = mesh.indices![i + j]! * 3;
      return [
        mesh.positions[offset]!,
        mesh.positions[offset + 1]!,
        mesh.positions[offset + 2]!,
      ];
    };
    const first = mesh.indices[i]! * 3;
    const normal: Vec = [
      mesh.normals[first]!,
      mesh.normals[first + 1]!,
      mesh.normals[first + 2]!,
    ];
    if (
      dot(normal, frame.n) > 0.99 &&
      Math.abs(dot(minus(at(0), frame.origin), frame.n)) < 1e-6
    )
      result.push([
        local(frame, at(0)),
        local(frame, at(1)),
        local(frame, at(2)),
      ]);
  }
  return result;
};

