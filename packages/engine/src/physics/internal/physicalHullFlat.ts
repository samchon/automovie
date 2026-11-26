import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A hull's planes and edges as flat arrays: per face its normal and offset; per
 * edge, in its face's loop order, its start, its vector, its squared length,
 * its inward direction in the face (normal cross edge) and that direction's
 * product with the start; `starts` bounds each face's edges.
 *
 * @param hull The hull whose faces are flattened.
 * @returns The flat form, built from the faces alone.
 */
export function physicalHullFlat(
  hull: Pick<IAutoMoviePhysicalHullFaces.IHull, "faces">,
): IAutoMoviePhysicalHullFaces.IFlat {
  const planes: number[] = new Array<number>(4 * hull.faces.length).fill(0);
  const starts: number[] = new Array<number>(hull.faces.length + 1).fill(0);
  const total: number = hull.faces.reduce(
    (sum: number, face: IAutoMoviePhysicalHullFaces.IFace): number =>
      sum + face.loop.length,
    0,
  );
  const edges: number[] = new Array<number>(physicalHullFlat.EDGE * total).fill(
    0,
  );
  let e: number = 0;
  hull.faces.forEach(
    (face: IAutoMoviePhysicalHullFaces.IFace, f: number): void => {
      const n: IAutoMovieVector3 = face.normal;
      planes[4 * f] = n.x;
      planes[4 * f + 1] = n.y;
      planes[4 * f + 2] = n.z;
      planes[4 * f + 3] = face.offset;
      starts[f] = e;
      face.loop.forEach((from: IAutoMovieVector3, i: number): void => {
        const to: IAutoMovieVector3 = face.loop[(i + 1) % face.loop.length]!;
        const ex: number = to.x - from.x;
        const ey: number = to.y - from.y;
        const ez: number = to.z - from.z;
        const mx: number = n.y * ez - n.z * ey;
        const my: number = n.z * ex - n.x * ez;
        const mz: number = n.x * ey - n.y * ex;
        const row: number[] = [
          from.x,
          from.y,
          from.z,
          ex,
          ey,
          ez,
          ex * ex + ey * ey + ez * ez,
          mx,
          my,
          mz,
          mx * from.x + my * from.y + mz * from.z,
        ];
        for (let k: number = 0; k < row.length; k++)
          edges[physicalHullFlat.EDGE * e + k] = row[k]!;
        e++;
      });
    },
  );
  starts[hull.faces.length] = e;
  return { planes, starts, edges };
}

/** Companion constants of {@link physicalHullFlat}. */
export namespace physicalHullFlat {
  /** The numbers stored per edge. */
  export const EDGE: number = 11;
}
