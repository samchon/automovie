import {
  createAutoMovieMeshDepthSampler,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import { weldLatticeSeamNormals } from "../../mesh/weldLatticeSeamNormals";
import { IPortraitEarShape } from "../ear/IPortraitEarShape";
import { pinnaHelixRimWeight } from "../ear/pinnaHelixRimWeight";
import { portraitEarShape } from "../ear/portraitEarShape";
import { resolvePortraitEarSampling } from "../ear/resolvePortraitEarSampling";

/**
 * Pinnae for a portrait's inferred side anatomy. The visible folds are a
 * single surface: outer helix, intervening groove, antihelix and conchal bowl.
 * The lower outline rounds into the lobule. The caller owns dimensions and
 * placement; the default profile does not recover an individual's hidden ear.
 *
 * Coordinates are millimetres. Positive X is the anatomical left ear. The
 * engine mirrors the other ear, including winding and normals. The back
 * surface meets the front at the same rim, and the inner attachment lies inside
 * the supplied head by its authored embedding. It remains a separate shell,
 * not welded head-skin topology or a certified contact result.
 *
 * @evidence contracts/common.md#principled-implementation One authored relief surface forms helix/antihelix/concha/lobule and a corresponding back shell, attached through each side's actual temporal depth samples.
 * @evidence contracts/common.md#clear-and-simple-design Shared sampling admission, lattice construction, seam normals, reflection and metric packing retain their own owners while this function supplies the pinna profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The positive dimension guard is not a living-pinna range and the separate shell is not welded skin topology; defaults do not recover an individual's hidden ear.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetres, anatomical side/reflection, source-owned placement and coincident front/back outer rim.
 * @evidence contracts/performance.md#efficient-algorithms Host depth-index construction includes the supplied skin triangles; each of one or two selected ears emits O(C*(F+B)) lattice samples, with fixed 49/25-point relief paths and accelerated temporal-depth queries per sample.
 * @evidence contracts/performance.md#reuse-equivalent-work One temporal depth acceleration structure and authored outline/ridge samples serve both side shells; changed skin or profile requires a fresh build.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned metric parts own their geometry; fixed guide samples, depth query and intermediate lattices are call-local and no host cache or live resource survives.
 */
export function buildPortraitEars(
  skin: IAutoMovieMesh,
  shape: IPortraitEarShape = portraitEarShape,
  selectedSide?: "right" | "left",
): ReturnType<typeof createMetricMeshPart>[] {
  if (
    selectedSide !== undefined &&
    selectedSide !== "right" &&
    selectedSide !== "left"
  )
    throw new Error(
      "A selected pinna must have an anatomical right or left owner.",
    );
  const sampling: { columns: number; frontRows: number; backRows: number } =
    resolvePortraitEarSampling(shape);
  const surfaceDepth: (
    u: number,
    v: number,
  ) => { minimum: number; maximum: number } | null =
    createAutoMovieMeshDepthSampler(skin, "x");
  // The asymmetric outline narrows from a broad upper helix into the forward
  // lobule. The helix and forked antihelix follow independent paths so the
  // inner folds retain their own placement within the outer pinna envelope.
  const outlinePoints: IAutoMovieVector3[] = [
    [22, -12],
    [18, -17],
    [10, -18],
    [1, -14],
    [-9, -7],
    [-18, 3],
    [-22, 9],
    [-21, 16],
    [-14, 21],
    [-5, 22],
    [7, 20],
    [17, 17],
    [23, 3],
  ].map(([y, z]: number[]): IAutoMovieVector3 => p(0, y, z));
  const closed: IAutoMovieVector3[] = [
    outlinePoints[outlinePoints.length - 1],
    ...outlinePoints,
    outlinePoints[0],
    outlinePoints[1],
  ];
  const outline: (u: number) => IAutoMovieVector3 = (
    u: number,
  ): IAutoMovieVector3 =>
    catmullRomPoint(
      closed,
      (1 + u * outlinePoints.length) / (outlinePoints.length + 2),
    );
  const helix: IAutoMovieVector3[] = Array.from(
    { length: 49 },
    (_: unknown, i: number): IAutoMovieVector3 => {
      const point: IAutoMovieVector3 = outline(i / 48);
      return p(0, point.y * 0.86, point.z * 0.86);
    },
  );
  const stroke: (points: number[][]) => IAutoMovieVector3[] = (
    points: number[][],
  ): IAutoMovieVector3[] =>
    Array.from(
      { length: 25 },
      (_: unknown, i: number): IAutoMovieVector3 =>
        catmullRomPoint(
          points.map(([y, z]: number[]): IAutoMovieVector3 => p(0, y, z)),
          i / 24,
        ),
    );
  // The antihelix is a curved ridge that forks into a superior and an inferior
  // crus; both crura arc away from the fork instead of running straight.
  const antihelix: IAutoMovieVector3[] = stroke([
    [-12, 7],
    [-7, 3],
    [0, -3],
    [8, -7],
    [15, -9],
    [19, -8],
  ]);
  const fork: IAutoMovieVector3[] = stroke([
    [0, -3],
    [5, -2],
    [10, 2],
    [14, 8],
  ]);
  // Nearest point of a sampled path to (y, z): squared distance and the path
  // parameter in [0, 1] of that point, so a ridge can vary along its length.
  const nearest: (
    y: number,
    z: number,
    path: ReturnType<(points: number[][]) => IAutoMovieVector3[]>,
  ) => { squared: number; along: number } = (
    y: number,
    z: number,
    path: ReturnType<typeof stroke>,
  ): { squared: number; along: number } => {
    let result: { squared: number; along: number } = {
      squared: Infinity,
      along: 0,
    };
    for (let i: number = 0; i < path.length - 1; i++) {
      const a: IAutoMovieVector3 = path[i],
        b: IAutoMovieVector3 = path[i + 1],
        dy: number = b.y - a.y,
        dz: number = b.z - a.z;
      const t: number = Math.max(
        0,
        Math.min(1, ((y - a.y) * dy + (z - a.z) * dz) / (dy * dy + dz * dz)),
      );
      const squared: number = (y - a.y - t * dy) ** 2 + (z - a.z - t * dz) ** 2;
      if (squared < result.squared)
        result = { squared, along: (i + t) / (path.length - 1) };
    }
    return result;
  };
  const distanceSquared: (
    y: number,
    z: number,
    path: ReturnType<(points: number[][]) => IAutoMovieVector3[]>,
  ) => number = (
    y: number,
    z: number,
    path: ReturnType<typeof stroke>,
  ): number => nearest(y, z, path).squared;
  // The helix is the cartilage rim; it ends at the lobule, which is soft
  // tissue without cartilage and carries no rim. The ridge therefore fades
  // out over one outline segment before the first lobule point and back in
  // after the last, both named by outline index. The rim's arc parameter is
  // the outline's, because the helix samples the outline uniformly.
  const lobule: { from: number; to: number } = { from: 5, to: 8 };
  const bump: (
    y: number,
    z: number,
    cy: number,
    cz: number,
    wy: number,
    wz: number,
  ) => number = (
    y: number,
    z: number,
    cy: number,
    cz: number,
    wy: number,
    wz: number,
  ): number => Math.exp(-(((y - cy) / wy) ** 2 + ((z - cz) / wz) ** 2));
  const relief: (y: number, z: number) => number = (
    y: number,
    z: number,
  ): number => {
    const rim: { squared: number; along: number } = nearest(y, z, helix);
    return (
      2.8 *
        pinnaHelixRimWeight(rim.along, outlinePoints.length, lobule) *
        Math.exp(-rim.squared / 1.35 ** 2) +
      2.2 *
        Math.exp(
          -Math.min(
            distanceSquared(y, z, antihelix),
            distanceSquared(y, z, fork),
          ) /
            1.7 ** 2,
        ) -
      2 * bump(y, z, -1, 4, 6.5, 6.5) +
      2.2 * bump(y, z, -5, 11, 3, 2.2) +
      1.8 * bump(y, z, -12, 6, 3, 2.6) +
      1.0 * bump(y, z, -17, 11, 5, 6)
    );
  };
  // Both anatomical sides read their actual refined temporal surface. The old
  // fixed X taper left the lower pinna buried after the cranial base widened.
  // The anterior root is embedded and the posterior edge projects outwards;
  // the pinna remains a separate shell, not a claim of welded skin topology.
  const frontZ: number = Math.max(
    ...outlinePoints.map((point: IAutoMovieVector3): number => point.z),
  );
  const depthSpan: number =
    frontZ -
    Math.min(
      ...outlinePoints.map((point: IAutoMovieVector3): number => point.z),
    );
  const parts: ReturnType<typeof createMetricMeshPart>[] = [];
  for (const side of selectedSide === undefined
    ? [-1, 1]
    : [selectedSide === "left" ? 1 : -1]) {
    const attachmentX: (y: number, z: number) => number = (
      y: number,
      z: number,
    ): number => {
      const depth: { minimum: number; maximum: number } | null = surfaceDepth(
        (shape.centerY + y * shape.heightScale) / 1000,
        (shape.centerZ + z * shape.depthScale) / 1000,
      );
      if (depth === null)
        throw new Error(
          "The pinna attachment must lie on the supplied temporal surface.",
        );
      return (
        side * (side === 1 ? depth.maximum : depth.minimum) * 1000 +
        shape.projection * ((frontZ - z) / depthSpan) -
        shape.embedding
      );
    };
    const front: IAutoMovieMesh = weldLatticeSeamNormals(
      triangulateSurfaceLattice(
        (u: number, v: number): IAutoMovieVector3 => {
          const edge: IAutoMovieVector3 = outline(u),
            r: number = 0.0001 + 0.9999 * v,
            y: number = edge.y * r,
            z: number = edge.z * r;
          return p(
            attachmentX(y, z) - 1.3 * (1 - r * r) + relief(y, z),
            shape.centerY + y * shape.heightScale,
            shape.centerZ + z * shape.depthScale,
          );
        },
        sampling.columns,
        sampling.frontRows,
      ),
      sampling.columns,
      sampling.frontRows,
    );
    const back: IAutoMovieMesh = weldLatticeSeamNormals(
      triangulateSurfaceLattice(
        (u: number, v: number): IAutoMovieVector3 => {
          const edge: IAutoMovieVector3 = outline(1 - u),
            r: number = 0.0001 + 0.9999 * v,
            y: number = edge.y * r,
            z: number = edge.z * r;
          return p(
            attachmentX(y, z) -
              4.5 * (1 - r * r) +
              r * r * relief(edge.y, edge.z),
            shape.centerY + y * shape.heightScale,
            shape.centerZ + z * shape.depthScale,
          );
        },
        sampling.columns,
        sampling.backRows,
      ),
      sampling.columns,
      sampling.backRows,
    );
    for (const [name, mesh] of [
      ["pinna", front],
      ["ear-back", back],
    ] as const)
      parts.push(
        createMetricMeshPart(
          `${side === 1 ? "left" : "right"}-${name}`,
          transformAutoMovieMesh(mesh, { scale: p(side, 1, 1) }),
          "skin",
        ),
      );
  }
  return parts;
}
