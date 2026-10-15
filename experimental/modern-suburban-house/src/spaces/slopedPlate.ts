import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMovieMesh } from "@automovie/interface";
import type { IPlanPoint } from "../types/IPlanPoint";
import { cross } from "./cross";
import { sub } from "./sub";

/**
 * One pitched roof part with a concave plan decomposed only on its weather
 * and underside faces. The caller supplies convex coplanar tiles and a free
 * outline predicate; shared tile seams receive no vertical face.
 */


export const slopedPlate = (props: {
  plans: readonly (readonly IPlanPoint[])[];
  top: (x: number, z: number) => number;
  thickness: number;
  freeEdge: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IAutoMovieMesh => {
  if (props.plans.length === 0 || !(props.thickness > 0)) throw new Error(
    "sloped plate needs tiles and positive thickness"
  );
  const faces: IAutoMovieVector3[][] = [];
  for (const plan of props.plans) {
    if (plan.length < 3) throw new Error(
      "sloped plate tile needs three corners"
    );
    const up = plan.map((p) => ({ x: p.x, y: props.top(p.x, p.z), z: p.z }));
    const normal = cross(sub(up[1]!, up[0]!), sub(up[2]!, up[0]!));
    const top = normal.y > 0 ? up : [...up].reverse();
    const bottom = top.map((p) => ({
      x: p.x,
      y: p.y - props.thickness,
      z: p.z,
    }));
    faces.push(top, [...bottom].reverse());
    for (let i = 0; i < top.length; i++) {
      const j = (i + 1) % top.length;
      if (props.freeEdge(top[i]!, top[j]!)) faces.push([top[i]!, bottom[i]!, bottom[j]!, top[j]!]);
    }
  }
  return buildAutoMoviePolyhedron(faces);
};
