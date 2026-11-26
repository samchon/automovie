import type {
  IAutoMovieMeasureModelContacts,
  IAutoMovieMesh,
  IAutoMovieMeshWinding,
  IAutoMovieModel,
  IAutoMovieModelContact,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { autoMovieModelPartMatrices } from "../autoMovieModelPartMatrices";
import { createAutoMovieMeshWindingQuery } from "./createAutoMovieMeshWindingQuery";
import { measureAutoMovieMeshGap } from "./internal/measureAutoMovieMeshGap";
import { AutoMovieEngineMeshCrossingQuery } from "./mesh-crossing/AutoMovieEngineMeshCrossingQuery";
import { placeAutoMovieModelPartMesh } from "./internal/placeAutoMovieModelPartMesh";
import { realizeAutoMovieGeometry } from "./internal/realizeAutoMovieGeometry";
import { triangleIndicesOf } from "./internal/triangleIndicesOf";

/**
 * Report how every pair of a model's parts meets: crossing, contained, touching
 * or apart, with the least gap between their surfaces and how much of each lies
 * inside the other.
 *
 * Every part is realized through `realizeAutoMovieGeometry`, primitives
 * included, and carried into the model frame by `placeAutoMovieModelPartMesh`
 * with its `autoMovieModelPartMatrices` entry, as
 * `measureAutoMovieModelCrossings` places its parts. One record follows for
 * every unordered pair, in model part order. A pair crosses when
 * `AutoMovieEngineMeshCrossingQuery.measure` finds a transverse or coplanar
 * crossing in either direction, which it can only where the two placed boxes
 * overlap. The gap is 0 for a crossing pair and otherwise the least distance
 * between the surfaces by `measureAutoMovieMeshGap`, for every pair however far
 * apart. Each share is the area of one part's triangles whose centroids the
 * other part's winding query, `createAutoMovieMeshWindingQuery`, finds
 * `inside`, divided by the part's whole area; one centroid stands for each
 * triangle, so a share resolves at the triangle size. A centroid too far from
 * the other part for its winding number to reach 0.5, by an exact solid-angle
 * bound, is decided without a query. The relation is the first that applies:
 * `crossing`; `contained` when either share is exactly 1; `touching` when the
 * gap is at most `options.contact`; `apart` otherwise.
 *
 * A gap below the contact distance keeps two faces from being coplanar, which
 * the strict crossing test may otherwise count as a coplanar crossing where the
 * faces are triangulated along different diagonals. The model is only read.
 * Throws on a missing, negative or non-finite contact distance, on a part whose
 * index buffer is malformed, whose positions are not finite or that has no
 * triangle, naming the part, and passes on the realization's and the crossing
 * measure's own refusals.
 *
 * @param model A built model, whatever composed it.
 * @param options The contact distance in metres.
 * @returns One record per unordered part pair, in model part order.
 */
export const measureAutoMovieModelContacts: (
  model: IAutoMovieModel,
  options: IAutoMovieMeasureModelContacts.IOptions,
) => IAutoMovieModelContact[] = (
  model: IAutoMovieModel,
  options: IAutoMovieMeasureModelContacts.IOptions,
): IAutoMovieModelContact[] => {
  const contact: number = options.contact;
  if (contact < 0)
    throw new Error(
      "Model contacts need a finite, nonnegative contact distance in metres.",
    );
  const matrices: Map<IAutoMovieModelPart, number[] | null> =
    autoMovieModelPartMatrices(model);
  const parts: IPlacedPart[] = model.parts.map(
    (part: IAutoMovieModelPart): IPlacedPart => {
      const label: string = `model contact part "${part.id}"`;
      return surveyed(
        part.id,
        label,
        placeAutoMovieModelPartMesh(
          realizeAutoMovieGeometry(part.geometry).mesh,
          matrices.get(part) ?? null,
          label,
        ),
      );
    },
  );
  const contacts: IAutoMovieModelContact[] = [];
  for (let first: number = 0; first < parts.length; ++first)
    for (let second: number = first + 1; second < parts.length; ++second) {
      const here: IPlacedPart = parts[first]!;
      const there: IPlacedPart = parts[second]!;
      const overlap: boolean = [0, 1, 2].every(
        (axis: number): boolean =>
          here.low[axis]! <= there.high[axis]! &&
          there.low[axis]! <= here.high[axis]!,
      );
      const crossing: boolean =
        overlap &&
        (AutoMovieEngineMeshCrossingQuery.measure(here.mesh, there.mesh)
          .length > 0 ||
          AutoMovieEngineMeshCrossingQuery.measure(there.mesh, here.mesh)
            .length > 0);
      const gap: number = crossing
        ? 0
        : measureAutoMovieMeshGap(here.surface, there.surface);
      const inside: number = share(here, there);
      const otherInside: number = share(there, here);
      contacts.push({
        part: here.id,
        other: there.id,
        gap,
        inside,
        otherInside,
        relation: crossing
          ? "crossing"
          : inside === 1 || otherInside === 1
            ? "contained"
            : gap <= contact
              ? "touching"
              : "apart",
      });
    }
  return contacts;
};

/**
 * One part in the model frame with what every pair reads of it: its box, its
 * triangle centroids and areas, its whole area, its surface prepared for the
 * gap, and its winding query, built on first use and kept for the part's other
 * pairs.
 */
interface IPlacedPart {
  /** The part's id. */
  id: string;

  /** The part's mesh in the model frame. */
  mesh: IAutoMovieMesh;

  /** The least corner of the part's box, metres in the model frame. */
  low: number[];

  /** The greatest corner of the part's box, metres in the model frame. */
  high: number[];

  /** Each triangle's centroid, in triangle order. */
  centroids: number[][];

  /** Each triangle's area, square metres, in triangle order. */
  areas: number[];

  /** The sum of `areas`, summed in triangle order. */
  area: number;

  /** The surface prepared for `measureAutoMovieMeshGap`. */
  surface: measureAutoMovieMeshGap.ISurface;

  /** The part's winding query, built on its first call and then reused. */
  winding: (point: readonly number[]) => IAutoMovieMeshWinding;
}

/** Survey one placed part, refusing it, by name, when it has no finite triangle. */
const surveyed: (
  id: string,
  label: string,
  mesh: IAutoMovieMesh,
) => IPlacedPart = (
  id: string,
  label: string,
  mesh: IAutoMovieMesh,
): IPlacedPart => {
  const indices: number[] = triangleIndicesOf(mesh, label);
  if (indices.length === 0) throw new Error(`${label} has no triangle`);
  const p: number[] = mesh.positions;
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (let at: number = 0; at < p.length; at += 3)
    for (let axis: number = 0; axis < 3; ++axis) {
      low[axis] = Math.min(low[axis]!, p[at + axis]!);
      high[axis] = Math.max(high[axis]!, p[at + axis]!);
    }
  const centroids: number[][] = [];
  const areas: number[] = [];
  let area: number = 0;
  for (let at: number = 0; at < indices.length; at += 3) {
    const a: number = indices[at]! * 3;
    const b: number = indices[at + 1]! * 3;
    const c: number = indices[at + 2]! * 3;
    centroids.push(
      [0, 1, 2].map(
        (axis: number): number =>
          (p[a + axis]! + p[b + axis]! + p[c + axis]!) / 3,
      ),
    );
    const ab: number[] = [0, 1, 2].map(
      (axis: number): number => p[b + axis]! - p[a + axis]!,
    );
    const ac: number[] = [0, 1, 2].map(
      (axis: number): number => p[c + axis]! - p[a + axis]!,
    );
    const size: number =
      Math.hypot(
        ab[1]! * ac[2]! - ab[2]! * ac[1]!,
        ab[2]! * ac[0]! - ab[0]! * ac[2]!,
        ab[0]! * ac[1]! - ab[1]! * ac[0]!,
      ) / 2;
    areas.push(size);
    area += size;
  }
  const query: (point: readonly number[]) => IAutoMovieMeshWinding =
    createAutoMovieMeshWindingQuery(mesh);
  return {
    id,
    mesh,
    low,
    high,
    centroids,
    areas,
    area,
    surface: measureAutoMovieMeshGap.surface(mesh, label),
    winding: query,
  };
};

/**
 * The share of `part`'s area whose triangle centroids `other` holds inside, in
 * [0, 1]. Inside and whole areas are summed in the same triangle order, so a
 * part every centroid of which is inside gives exactly 1. A part without area
 * has no share inside anything and gives 0.
 *
 * A centroid far from `other` is decided without its winding query by an exact
 * bound. A triangle of area `a` whose every point lies at least `d` from the
 * centroid subtends a solid angle of at most `a / d^2`, so a centroid at least
 * `D` from `other`'s box sees a winding number of at most `A / (4 pi D^2)`, `A`
 * being `other`'s whole area. Where that bound is below 0.5 the centroid cannot
 * be inside, which is the answer the query would give; the bound decides a
 * whole pair at once when it holds for the two boxes.
 */
const share: (part: IPlacedPart, other: IPlacedPart) => number = (
  part: IPlacedPart,
  other: IPlacedPart,
): number => {
  if (part.area === 0) return 0;

  // A winding number of 0.5 needs D^2 < A / (2 pi): beyond, no point is inside.
  const reach2: number = other.area / (2 * Math.PI);
  if (boxGap2(part.low, part.high, other.low, other.high) > reach2) return 0;
  let inside: number = 0;
  part.centroids.forEach((centroid: number[], triangle: number): void => {
    if (boxGap2(centroid, centroid, other.low, other.high) > reach2) return;
    if (other.winding(centroid).inside) inside += part.areas[triangle]!;
  });
  return inside / part.area;
};

/**
 * The squared distance between two boxes given by their least and greatest
 * corners.
 */
const boxGap2: (
  low: readonly number[],
  high: readonly number[],
  otherLow: readonly number[],
  otherHigh: readonly number[],
) => number = (
  low: readonly number[],
  high: readonly number[],
  otherLow: readonly number[],
  otherHigh: readonly number[],
): number => {
  let total: number = 0;
  for (let axis: number = 0; axis < 3; ++axis) {
    const apart: number = Math.max(
      0,
      low[axis]! - otherHigh[axis]!,
      otherLow[axis]! - high[axis]!,
    );
    total += apart * apart;
  }
  return total;
};
