import { p } from "./p";
import { Point } from "./Point";
import { ObjectMesh } from "./ObjectMesh";
import { dot } from "./dot";
import { sub } from "./sub";
import { cross } from "./cross";

const norm = (a: Point) => {
  const d = Math.hypot(a.x, a.y, a.z);
  if (!(d > 1e-12)) throw new Error("zero face basis");
  return p(a.x / d, a.y / d, a.z / d);
};
/** A quad/convex polygon with optional metric lengthwise U and V=n×U. */
export const modelFace = (builder: ObjectMesh, part: string, vertices: readonly Point[],
  grain?: { origin: Point; direction: Point; }): void => {
  if (grain === undefined) {
    builder.face(part, vertices);
    return;
  }
  const n = norm(
    cross(sub(vertices[1]!, vertices[0]!), sub(vertices[2]!, vertices[0]!))
  );
  const along = grain.direction;
  const projected = p(
    along.x - dot(along, n) * n.x,
    along.y - dot(along, n) * n.y,
    along.z - dot(along, n) * n.z
  );
  if (Math.hypot(projected.x, projected.y, projected.z) < 1e-10) {
    builder.face(part, vertices); // a cut end has the ordinary normal-based projection
    return;
  }
  const u = norm(projected), v = cross(n, u);
  builder.face(
    part,
    vertices,
    vertices.map((q) => {
      const offset = sub(q, grain.origin);
      return [dot(offset, u), dot(offset, v)] as const;
    })
  );
};
