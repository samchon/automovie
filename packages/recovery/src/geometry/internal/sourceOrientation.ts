import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieMeshPlaneContour,
  IAutoMovieMeshPlaneIntersection,
  IAutoMovieMeshSectionOrientation,
  IAutoMoviePlaneFrame,
} from "@automovie/interface";

import { cross } from "../../internal/mesh-observations/cross";
import { dist } from "../../internal/mesh-observations/dist";
import { dot } from "../../internal/mesh-observations/dot";
import { mul } from "../../internal/mesh-observations/mul";
import { signedArea } from "../../internal/mesh-observations/signedArea";
import { sub } from "../../internal/mesh-observations/sub";
import { to2 } from "../../internal/mesh-observations/to2";

/**
 * Builds a private supporting-face orientation witness; its result
 * distinguishes outer from cavity contours. An explicit registered sign
 * bypasses global-volume inference and retains the supplied material-side
 * convention for open or independently oriented source shells.
 */
export function sourceOrientation(
  skin: Parameters<IAutoMovieMeshSectionOrientation.Operation>[0],
  orientation: Parameters<IAutoMovieMeshSectionOrientation.Operation>[1] = "signed-volume",
): ReturnType<IAutoMovieMeshSectionOrientation.Operation> {
  const edges: Map<string, number[]> = new Map();
  const key: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a},${b}` : `${b},${a}`);
  let volume: number = 0;
  skin.triangles.forEach((t: [number, number, number], i: number): void => {
    volume += dot(
      skin.vertices[t[0]],
      cross(
        sub(skin.vertices[t[1]], skin.vertices[t[0]]),
        sub(skin.vertices[t[2]], skin.vertices[t[0]]),
      ),
    );
    for (let k: number = 0; k < 3; k++) {
      const id: string = key(skin.canon[t[k]], skin.canon[t[(k + 1) % 3]]);
      if (!edges.has(id)) edges.set(id, []);
      edges.get(id)!.push(i);
      if (orientation !== "signed-volume") {
        const at: string = key(skin.canon[t[k]], skin.canon[t[k]]);
        if (!edges.has(at)) edges.set(at, []);
        edges.get(at)!.push(i);
      }
    }
  });
  const outward: number =
    orientation === "signed-volume" ? Math.sign(volume) : orientation;
  if (!outward) throw new Error("Source orientation has zero signed volume");
  return (
    plane: IAutoMoviePlaneFrame,
    polyline: IAutoMovieMeshPlaneContour,
  ): number => {
    if (!polyline.closed)
      throw new Error("An open arc does not define a material winding");
    for (let i: number = 0; i < polyline.pts.length; i++) {
      const a: IAutoMovieMeshPlaneIntersection = polyline.pts[i],
        b: IAutoMovieMeshPlaneIntersection =
          polyline.pts[(i + 1) % polyline.pts.length];
      const other: number[] = edges.get(key(b.a, b.b)) ?? [];
      const triangle: number | undefined = (
        edges.get(key(a.a, a.b)) ?? []
      ).find((t: number): boolean => other.includes(t));
      if (triangle === undefined || dist(a.p, b.p) < 1e-12) continue;
      const t: [number, number, number] = skin.triangles[triangle];
      const normal: AutoMovieVector3Tuple = mul(
        cross(
          sub(skin.vertices[t[1]], skin.vertices[t[0]]),
          sub(skin.vertices[t[2]], skin.vertices[t[0]]),
        ),
        outward,
      );
      const sense: number = Math.sign(
        dot(sub(b.p, a.p), cross(plane.n, normal)),
      );
      if (sense)
        return (
          sense *
          Math.sign(
            signedArea(
              polyline.pts.map(
                (p: IAutoMovieMeshPlaneIntersection): AutoMovieVector2Tuple =>
                  to2(plane, p.p),
              ),
            ),
          )
        );
    }
    throw new Error(
      "Closed source contour lacks a supporting-face orientation witness",
    );
  };
}
