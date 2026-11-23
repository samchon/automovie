import * as THREE from "three";

/**
 * Clip a surface graphic's flat geometry to its surface's outline, so no
 * triangle paints where the face has no surface.
 *
 * The geometry lies in the face frame's XZ plane, as every graphic mesh does.
 * The outline, a simple polygon in the same plane, is cut into triangles by
 * `THREE.ShapeUtils.triangulateShape`; each of the geometry's triangles is
 * clipped against each outline triangle by Sutherland–Hodgman (Sutherland and
 * Hodgman 1974, "Reentrant Polygon Clipping", Communications of the ACM 17(1)),
 * and the convex piece left is fanned back into triangles. Every attribute,
 * position, normal and texture coordinate alike, is interpolated linearly along
 * the clipped edges, which is exact for the attributes of a flat triangle, and
 * each piece keeps its triangle's winding. The result is unindexed; the input
 * is disposed.
 *
 * @param geometry A graphic mesh's geometry in the face frame, `y` ignored.
 * @param outline The surface's outline in the face frame's XZ plane, metres.
 * @returns A new geometry with the same attributes, covering exactly the part
 *   of the input inside the outline.
 */
export function clipAutoMovieSurfaceGraphicGeometry(
  geometry: THREE.BufferGeometry,
  outline: readonly { x: number; z: number }[],
): THREE.BufferGeometry {
  const contour: THREE.Vector2[] = outline.map(
    (point: { x: number; z: number }): THREE.Vector2 =>
      new THREE.Vector2(point.x, point.z),
  );
  const cells: { a: THREE.Vector2; b: THREE.Vector2; c: THREE.Vector2 }[] =
    THREE.ShapeUtils.triangulateShape(contour, []).map(
      ([i, j, k]: number[]): {
        a: THREE.Vector2;
        b: THREE.Vector2;
        c: THREE.Vector2;
      } => {
        // Each clip triangle counter-clockwise in XZ, so inside is the left.
        const [a, b, c] = [contour[i!]!, contour[j!]!, contour[k!]!];
        return cross(a, b, c) >= 0 ? { a, b, c } : { a, b: c, c: b };
      },
    );
  const names: string[] = Object.keys(geometry.attributes);
  const sizes: number[] = names.map(
    (name: string): number => geometry.getAttribute(name).itemSize,
  );
  const position: number = names.indexOf("position");
  const offset: number = sizes
    .slice(0, position)
    .reduce((sum: number, n: number) => sum + n, 0);

  // One vertex is all its attributes in a row, position's x and z found at
  // their offsets.
  const vertex = (index: number): number[] =>
    names.flatMap((name: string): number[] => {
      const attribute:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute = geometry.getAttribute(name);
      return Array.from(
        { length: attribute.itemSize },
        (_: unknown, k: number): number => attribute.getComponent(index, k),
      );
    });
  const x = (v: number[]): number => v[offset]!;
  const z = (v: number[]): number => v[offset + 2]!;
  const out: number[][] = names.map((): number[] => []);
  const emit = (v: number[]): void => {
    let at: number = 0;
    sizes.forEach((size: number, slot: number): void => {
      for (let k: number = 0; k < size; ++k) out[slot]!.push(v[at + k]!);
      at += size;
    });
  };

  const index: ArrayLike<number> | null = geometry.getIndex()?.array ?? null;
  const count: number =
    index === null ? geometry.getAttribute("position").count : index.length;
  for (let t: number = 0; t + 2 < count; t += 3) {
    const triangle: number[][] = [0, 1, 2].map((k: number): number[] =>
      vertex(index === null ? t + k : index[t + k]!),
    );
    for (const cell of cells) {
      let polygon: number[][] = triangle;
      for (const [p, q] of [
        [cell.a, cell.b],
        [cell.b, cell.c],
        [cell.c, cell.a],
      ] as const) {
        if (polygon.length === 0) break;
        // Signed distance to the left of the clip edge pq.
        const side = (v: number[]): number =>
          (q.x - p.x) * (z(v) - p.y) - (q.y - p.y) * (x(v) - p.x);
        const next: number[][] = [];
        polygon.forEach((current: number[], i: number): void => {
          const following: number[] = polygon[(i + 1) % polygon.length]!;
          const s: number = side(current);
          const e: number = side(following);
          if (s >= 0) next.push(current);
          if (s >= 0 !== e >= 0) {
            const f: number = s / (s - e);
            next.push(
              current.map(
                (value: number, k: number): number =>
                  value + (following[k]! - value) * f,
              ),
            );
          }
        });
        polygon = next;
      }
      for (let k: number = 1; k + 1 < polygon.length; ++k) {
        emit(polygon[0]!);
        emit(polygon[k]!);
        emit(polygon[k + 1]!);
      }
    }
  }

  const clipped: THREE.BufferGeometry = new THREE.BufferGeometry();
  names.forEach((name: string, slot: number): void => {
    clipped.setAttribute(
      name,
      new THREE.Float32BufferAttribute(out[slot]!, sizes[slot]!),
    );
  });
  geometry.dispose();
  return clipped;
}

/** Twice the signed area of the XZ triangle `abc`, positive counter-clockwise. */
function cross(a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
