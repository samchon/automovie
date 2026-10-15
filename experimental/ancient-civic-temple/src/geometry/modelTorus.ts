import type { IAutoMovieMesh } from "@automovie/interface";
import { p } from "./p";
import { Point } from "./Point";

/** Closed metric torus, with a seam at +X in XY and XZ or +Z in YZ. */

export const modelTorus = (center: Point, major: number, minor: number,
  plane: "xy" | "xz" | "yz", majorSegments: number, tubeSegments: number): IAutoMovieMesh => {
  if (!(major > minor && minor > 0 && majorSegments >= 3 && tubeSegments >= 3))
    throw new Error("torus: invalid reviewed radii or divisions");
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let i = 0; i <= majorSegments; i++) {
    const a = 2 * Math.PI * i / majorSegments, ca = Math.cos(a), sa = Math.sin(a);
    const radial = plane === "xy"
      ? p(ca, sa, 0)
      : plane === "xz"
        ? p(ca, 0, -sa)
        : p(0, sa, ca);
    const binormal = plane === "xy" ? p(0, 0, 1) : plane === "xz" ? p(0, 1, 0) : p(1, 0, 0);
    for (let j = 0; j <= tubeSegments; j++) {
      const b = 2 * Math.PI * j / tubeSegments, cb = Math.cos(b), sb = Math.sin(b);
      const n = p(
        radial.x * cb + binormal.x * sb,
        radial.y * cb + binormal.y * sb,
        radial.z * cb + binormal.z * sb
      );
      positions.push(
        center.x + major * radial.x + minor * n.x,
        center.y + major * radial.y + minor * n.y,
        center.z + major * radial.z + minor * n.z
      );
      normals.push(n.x, n.y, n.z);
      uvs.push(major * a, minor * b);
    }
    if (i === majorSegments) break;
    for (let j = 0; j < tubeSegments; j++) {
      const row = i * (tubeSegments + 1), next = row + tubeSegments + 1;
      // The orientation of the radial/binormal frame is plane-specific.
      if (plane === "yz") indices.push(
        row + j,
        row + j + 1,
        next + j,
        row + j + 1,
        next + j + 1,
        next + j
      );
      else indices.push(row + j, next + j, row + j + 1, row + j + 1, next + j, next + j + 1);
    }
  }
  return { positions, normals, uvs, indices, skin: null };
};
