import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Explain selected raster silhouettes with actual indexed rays and axial
 * ownership.
 */
export namespace FamilyConicMpfbNailVeto {
  type Mesh = {
    positions: readonly number[];
    indices: readonly number[];
  } & Partial<
    Pick<IAutoMovieConstructionRealization.IMesh, "owners" | "coordinates">
  >;

  /** Inspect the exact contrasting pixel and nearby native occlusion. */
  export function observe(
    cap: Tips.ICap,
    camera: N.Camera,
    body: Mesh,
    kept: Mesh,
    stock: Mesh,
  ) {
    // Manual observation coordinates identify the marked fold and circle in
    // the original 600 px lateral captures. These pixels shape no surface.
    const samples: P2[] =
      camera.name !== "lateral"
        ? []
        : cap.family.name === "r.toe.middle"
          ? [
              [330, 510],
              [230, 450],
              [416, 550],
            ]
          : cap.family.name === "l.toe.ring"
            ? [
                [92, 409],
                [151, 398],
              ]
            : [];
    const tip: N.Point = Camera.project(Vec.scale(cap.pole, 1 / 1000), camera);
    if (cap.family.name.endsWith("toe.little")) {
      // Probe a small raster step inside the pointed cap at its actual pole.
      samples.push([Math.round(tip[0]), Math.round(tip[1]) + 5]);
    }
    return {
      polePixel: [tip[0], tip[1]],
      skin: { protected: cap.family.rootSectionMark, cap: [cap.from, cap.tip] },
      samples: [
        ...rays(body, camera, samples).map((r) => ({
          mesh: "raw parent",
          ...r,
        })),
        ...rays(kept, camera, samples).map((r) => ({
          mesh: "retained skin",
          ...r,
        })),
        ...rays(stock, camera, samples).map((r) => ({
          mesh: "owned source",
          ...r,
        })),
      ],
    };
  }

  /** Use the rasterizer's pixel-centre and nearest camera-depth rules. */
  function rays(mesh: Mesh, camera: N.Camera, points: P2[]) {
    const positions: N.Point[] = Array.from(
      { length: mesh.positions.length / 3 },
      (_, i): N.Point =>
        Camera.project(
          [
            mesh.positions[3 * i]!,
            mesh.positions[3 * i + 1]!,
            mesh.positions[3 * i + 2]!,
          ],
          camera,
        ),
    );
    type Hit = {
      triangle: number;
      z: number;
      depth: number;
      chart: P2 | null;
      owner: string | undefined;
    };
    return points.map((pixel) => {
      let unrestricted: Hit | null = null,
        shown: Hit | null = null;
      const [x, y] = pixel;
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const indices: P3 = [
          mesh.indices[i]!,
          mesh.indices[i + 1]!,
          mesh.indices[i + 2]!,
        ];
        const [a, b, c] = indices.map((k): N.Point => positions[k]!) as [
          N.Point,
          N.Point,
          N.Point,
        ];
        if (
          x + 0.5 < Math.min(a[0], b[0], c[0]) ||
          x + 0.5 > Math.max(a[0], b[0], c[0]) ||
          y + 0.5 < Math.min(a[1], b[1], c[1]) ||
          y + 0.5 > Math.max(a[1], b[1], c[1])
        )
          continue;
        const q = Vec.solve2(
          a[0] - c[0],
          b[0] - c[0],
          a[1] - c[1],
          b[1] - c[1],
          [x + 0.5 - c[0], y + 0.5 - c[1]],
        );
        if (q === null || q[0] < 0 || q[1] < 0 || q[0] + q[1] > 1) continue;
        const weights: P3 = [q[0], q[1], 1 - q[0] - q[1]];
        const z: number =
          weights[0] * a[2] + weights[1] * b[2] + weights[2] * c[2];
        const clip = camera.clipping;
        const depth: number = (clip?.distance ?? 0) - z;
        const owner: number | undefined = mesh.coordinates?.[3 * indices[0]];
        const homogenous: boolean =
          owner !== undefined &&
          indices.every((k): boolean => mesh.coordinates?.[3 * k] === owner);
        const chart: P2 | null = !homogenous
          ? null
          : ([1, 2].map((k): number =>
              indices.reduce(
                (sum, v, j): number =>
                  sum + weights[j]! * mesh.coordinates![3 * v + k]!,
                0,
              ),
            ) as P2);
        const hit: Hit = {
          triangle: i / 3,
          z,
          depth,
          chart,
          owner: owner === undefined ? undefined : mesh.owners?.[owner],
        };
        if (unrestricted === null || z > unrestricted.z) unrestricted = hit;
        if (
          (clip === undefined || (depth >= clip.near && depth <= clip.far)) &&
          (shown === null || z > shown.z)
        )
          shown = hit;
      }
      return { pixel, unrestricted, shown };
    });
  }
}
