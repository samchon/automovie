import {
  createAutoMovieMeshDepthSampler,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import { weldLatticeSeamNormals } from "../../mesh/weldLatticeSeamNormals";
import { IPortraitEarShape } from "../ear/IPortraitEarShape";
import { portraitEarShape } from "../ear/portraitEarShape";
import { pinnaHelixRimWeight } from "../ear/pinnaHelixRimWeight";
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
 * the head; there is no floating decorative loop masquerading as an ear.
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
  const sampling = resolvePortraitEarSampling(shape);
  const surfaceDepth = createAutoMovieMeshDepthSampler(skin, "x");
  // The asymmetric outline narrows from a broad upper helix into the forward
  // lobule. The helix and forked antihelix follow independent paths so the
  // inner folds retain their own placement within the outer pinna envelope.
  const outlinePoints = [
    [22, -12],
    [18, -17],
    [10, -18],
    [1, -14],
    [-9, -7],
    [-18, 4],
    [-21, 11],
    [-18, 20],
    [-9, 22],
    [-3, 22],
    [7, 20],
    [17, 17],
    [23, 3],
  ].map(([y, z]) => p(0, y, z));
  const closed = [
    outlinePoints[outlinePoints.length - 1],
    ...outlinePoints,
    outlinePoints[0],
    outlinePoints[1],
  ];
  const outline = (u: number) =>
    catmullRomPoint(
      closed,
      (1 + u * outlinePoints.length) / (outlinePoints.length + 2),
    );
  const helix = Array.from({ length: 49 }, (_, i) => {
    const point = outline(i / 48);
    return p(0, point.y * 0.86, point.z * 0.86);
  });
  const stroke = (points: number[][]) =>
    Array.from({ length: 25 }, (_, i) =>
      catmullRomPoint(
        points.map(([y, z]) => p(0, y, z)),
        i / 24,
      ),
    );
  const antihelix = stroke([
    [-12, 7],
    [-6, 2],
    [3, -5],
    [10, -8],
    [16, -8],
  ]);
  const fork = stroke([
    [3, -5],
    [8, 0],
    [13, 7],
  ]);
  // Nearest point of a sampled path to (y, z): squared distance and the path
  // parameter in [0, 1] of that point, so a ridge can vary along its length.
  const nearest = (
    y: number,
    z: number,
    path: ReturnType<typeof stroke>,
  ): { squared: number; along: number } => {
    let result = { squared: Infinity, along: 0 };
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i],
        b = path[i + 1],
        dy = b.y - a.y,
        dz = b.z - a.z;
      const t = Math.max(
        0,
        Math.min(1, ((y - a.y) * dy + (z - a.z) * dz) / (dy * dy + dz * dz)),
      );
      const squared = (y - a.y - t * dy) ** 2 + (z - a.z - t * dz) ** 2;
      if (squared < result.squared)
        result = { squared, along: (i + t) / (path.length - 1) };
    }
    return result;
  };
  const distanceSquared = (
    y: number,
    z: number,
    path: ReturnType<typeof stroke>,
  ): number => nearest(y, z, path).squared;
  // The helix is the cartilage rim; it ends at the lobule, which is soft
  // tissue without cartilage and carries no rim. The ridge therefore fades
  // out over one outline segment before the first lobule point and back in
  // after the last, both named by outline index. The rim's arc parameter is
  // the outline's, because the helix samples the outline uniformly.
  const lobule = { from: 5, to: 7 };
  const bump = (
    y: number,
    z: number,
    cy: number,
    cz: number,
    wy: number,
    wz: number,
  ): number => Math.exp(-(((y - cy) / wy) ** 2 + ((z - cz) / wz) ** 2));
  const relief = (y: number, z: number): number =>
    2.8 *
      pinnaHelixRimWeight(
        nearest(y, z, helix).along,
        outlinePoints.length,
        lobule,
      ) *
      Math.exp(-distanceSquared(y, z, helix) / 1.35 ** 2) +
    1.7 *
      Math.exp(
        -Math.min(
          distanceSquared(y, z, antihelix),
          distanceSquared(y, z, fork),
        ) /
          1.15 ** 2,
      ) -
    1.7 * bump(y, z, -1, 4, 6, 6) +
    2.2 * bump(y, z, -5, 11, 3, 2.2) +
    1.0 * bump(y, z, -17, 11, 5, 6);
  // Both anatomical sides read their actual refined temporal surface. The old
  // fixed X taper left the lower pinna buried after the cranial base widened.
  // The anterior root is embedded and the posterior edge projects outwards;
  // the pinna remains a separate shell, not a claim of welded skin topology.
  const frontZ = Math.max(...outlinePoints.map((point) => point.z));
  const depthSpan = frontZ - Math.min(...outlinePoints.map((point) => point.z));
  const parts: ReturnType<typeof createMetricMeshPart>[] = [];
  for (const side of selectedSide === undefined
    ? [-1, 1]
    : [selectedSide === "left" ? 1 : -1]) {
    const attachmentX = (y: number, z: number): number => {
      const depth = surfaceDepth(
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
    const front = weldLatticeSeamNormals(triangulateSurfaceLattice(
      (u, v) => {
        const edge = outline(u),
          r = 0.0001 + 0.9999 * v,
          y = edge.y * r,
          z = edge.z * r;
        return p(
          attachmentX(y, z) - 1.3 * (1 - r * r) + relief(y, z),
          shape.centerY + y * shape.heightScale,
          shape.centerZ + z * shape.depthScale,
        );
      },
      sampling.columns,
      sampling.frontRows,
    ), sampling.columns, sampling.frontRows);
    const back = weldLatticeSeamNormals(triangulateSurfaceLattice(
      (u, v) => {
        const edge = outline(1 - u),
          r = 0.0001 + 0.9999 * v,
          y = edge.y * r,
          z = edge.z * r;
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
    ), sampling.columns, sampling.backRows);
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
