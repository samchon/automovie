import { CutPoint } from "../geometry/CutPoint.ts";
import { Plane } from "../geometry/Plane.ts";
import { Polyline } from "../geometry/Polyline.ts";
import { Skin } from "../geometry/Skin.ts";
import { V2 } from "../geometry/V2.ts";
import { V3 } from "../geometry/V3.ts";
import { cross } from "../geometry/cross.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { signedArea } from "../geometry/signedArea.ts";
import { sub } from "../geometry/sub.ts";
import { to2 } from "../geometry/to2.ts";

/**
 * Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours.
 *
 * @evidence contracts/common.md#principled-implementation The cutting tangent and supporting oriented face normal recover material winding that CCW measurement order removes.
 * @evidence contracts/common.md#clear-and-simple-design A closed contour is required; signed source volume selects the global outward convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(triangles) preprocessing and local crossed-edge witness lookup per contour.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns its source and edge adjacency until its extraction operation ends; it is never globally cached.
 */
export function sourceOrientation(
  skin: Skin,
): (plane: Plane, polyline: Polyline) => number {
  const edges: Map<string, number[]> = new Map();
  const key = (a: number, b: number): string =>
    a < b ? `${a},${b}` : `${b},${a}`;
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
    }
  });
  const outward: number = Math.sign(volume);
  if (!outward) throw new Error("Source orientation has zero signed volume");
  return (plane: Plane, polyline: Polyline): number => {
    if (!polyline.closed)
      throw new Error("An open arc does not define a material winding");
    for (let i: number = 0; i < polyline.pts.length; i++) {
      const a: CutPoint = polyline.pts[i],
        b: CutPoint = polyline.pts[(i + 1) % polyline.pts.length];
      const other: number[] = edges.get(key(b.a, b.b)) ?? [];
      const triangle: number | undefined = (
        edges.get(key(a.a, a.b)) ?? []
      ).find((t: number): boolean => other.includes(t));
      if (triangle === undefined || dist(a.p, b.p) < 1e-12) continue;
      const t: [number, number, number] = skin.triangles[triangle];
      const normal: V3 = mul(
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
            signedArea(polyline.pts.map((p: CutPoint): V2 => to2(plane, p.p))),
          )
        );
    }
    throw new Error(
      "Closed source contour lacks a supporting-face orientation witness",
    );
  };
}
