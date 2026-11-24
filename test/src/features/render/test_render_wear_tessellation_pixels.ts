import { autoMovieWearWeight, tessellate } from "@automovie/engine";
import type {
  IAutoMovieMaterialWear,
  IAutoMovieTessellation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { applyMaterialWear } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The worn material's edge weight is the same, pixel by pixel, on a 1 m box of
 * 24 vertices and on the same box with each face subdivided into an 8 × 8 grid
 * of quads, when both are read at the same surface point.
 *
 * Scenarios, through one camera at 1280 × 720 that sees three faces of the box:
 *
 * 1. For every pixel the box covers, the ray through the pixel centre meets the
 *    box at one surface point, on the same face of both meshes. Each mesh's
 *    triangle holding that point is found, its edge list is decoded from the
 *    data texture `applyMaterialWear` built, as the fragment shader reads it,
 *    and the edge weight `autoMovieWearWeight` computes at the decoded distance
 *    agrees between the two meshes within 1e-3 at every such pixel.
 * 2. The comparison is not vacuous: over a tenth of the covered pixels lie within
 *    the 0.03 m layer width of an edge, where 1 − 0.94² = 11.6 % of each face's
 *    area lies, and some of them inside a subdivided triangle that touches no
 *    box edge with a side. Elsewhere both weights are exactly zero, since the
 *    band term is zero at and beyond the width.
 *
 * The rasterizer's own interpolation is left out on purpose. A GPU snaps each
 * triangle's vertices to its subpixel grid, so the two meshes put one pixel at
 * bind-pose points up to 0.5 mm apart on SwiftShader, which the weight's
 * gradient turns into differences of up to 0.014 that no shader could remove; a
 * capture checks each mesh against the CPU weight at its own interpolated point
 * instead, as test_render_wear_shader states. Here both meshes are read at the
 * exact point, so what is compared is what tessellation can change: the edge
 * lists and their packing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the boxes, the camera, the per-pixel comparison and its coverage, and why the GPU's interpolation is left out.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both boxes' worn geometry and data texture with the public applyMaterialWear and decodes each pixel's list as the shader does; a subdivided triangle whose list misses an edge within reach, or a list packed at the wrong offset, changes that pixel's weight and fails.
 * @evidence contracts/development/testing.md#independent-expectations Issue #4083's acceptance that the two boxes give the same weights within 1e-3 per pixel; the surface point comes from the ray's exact intersection with the box's planes, computed here.
 * @evidence contracts/development/testing.md#distinguishing-cases Every covered pixel at 1280 × 720 over three faces, edge bands and face interiors, coarse and fine triangles alike; the distances at chosen points belong to test_geometry_feature_edges_tessellation and the program's splices to test_render_wear_shader. The GPU's own arithmetic is a capture's to read.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over in-memory geometry; no GPU starts.
 */
export function test_render_wear_tessellation_pixels(): void {
  const wear: IAutoMovieMaterialWear = {
    seed: 3,
    edge: {
      color: { r: 0.4, g: 0.3, b: 0.2, a: 1, hex: null },
      roughness: 0.8,
      width: 0.03,
      amount: 0.7,
    },
  };
  const coarse: IAutoMovieTessellation = tessellate({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  const fine: { positions: number[]; indices: number[] } = gridBox(8);
  const worn: IWorn[] = [
    wornOf(coarse.positions, coarse.indices, wear),
    wornOf(fine.positions, fine.indices, wear),
  ];

  const width: number = 1280;
  const height: number = 720;
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    30,
    width / height,
    0.1,
    20,
  );
  camera.position.set(1.7, 1.3, 2.1);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const raycaster: THREE.Raycaster = new THREE.Raycaster();
  const box: THREE.Box3 = new THREE.Box3(
    new THREE.Vector3(-0.5, -0.5, -0.5),
    new THREE.Vector3(0.5, 0.5, 0.5),
  );
  const hit: THREE.Vector3 = new THREE.Vector3();

  let covered: number = 0;
  let banded: number = 0;
  let inner: number = 0;
  let worst: number = 0;
  const ndc: THREE.Vector2 = new THREE.Vector2();
  for (let y: number = 0; y < height; ++y)
    for (let x: number = 0; x < width; ++x) {
      raycaster.setFromCamera(
        ndc.set(((x + 0.5) / width) * 2 - 1, 1 - ((y + 0.5) / height) * 2),
        camera,
      );
      if (raycaster.ray.intersectBox(box, hit) === null) continue;
      covered += 1;
      const point: IAutoMovieVector3 = { x: hit.x, y: hit.y, z: hit.z };
      const [da, db]: number[] = worn.map((mesh: IWorn): number =>
        mesh.distance(point),
      );

      // At and beyond the width the weight is exactly zero for any noise.
      if (da! >= wear.edge!.width && db! >= wear.edge!.width) continue;
      const a: number = autoMovieWearWeight(wear.edge!, da!, wear.seed, point);
      const b: number = autoMovieWearWeight(wear.edge!, db!, wear.seed, point);
      worst = Math.max(worst, Math.abs(a - b));
      banded += 1;
      if (!worn[1]!.sidesOnEdge(point)) inner += 1;
    }

  // 1. Per-pixel agreement.
  TestValidator.predicate(
    `the two boxes' edge weights agree at every covered pixel (worst ${worst.toExponential(2)})`,
    covered > 0 && worst <= 1e-3,
  );

  // 2. Coverage of the edge bands.
  TestValidator.predicate(
    `edge bands are covered (${banded} of ${covered} pixels, ${inner} in triangles off the edges)`,
    banded > covered / 10 && inner > 0,
  );
}

/** A worn mesh as the fragment shader reads it. */
interface IWorn {
  /**
   * The convex distance at a surface point, decoded from the list of the
   * triangle holding it.
   */
  distance: (point: IAutoMovieVector3) => number;

  /** Whether the triangle holding a point has a side on a box edge. */
  sidesOnEdge: (point: IAutoMovieVector3) => boolean;
}

/**
 * Wear an indexed mesh with `applyMaterialWear` and return its decoder: the
 * triangle holding a point is found among those of the point's face, and its
 * list, read from the per-vertex offset and count, is decoded from the data
 * texture as the fragment shader decodes it, capped at the layer width.
 */
function wornOf(
  positions: readonly number[],
  indices: readonly number[],
  wear: IAutoMovieMaterialWear,
): IWorn {
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex([...indices]);
  geometry.computeVertexNormals();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const result: { geometry: THREE.BufferGeometry; texture: THREE.DataTexture } =
    applyMaterialWear(geometry, material, wear);
  const data: Float32Array = result.texture.image.data as Float32Array;
  const list: THREE.BufferAttribute = result.geometry.getAttribute(
    "wearList",
  ) as THREE.BufferAttribute;
  const reach: number = wear.edge!.width;

  // Each triangle's corners, grouped by the face its plane lies on.
  const triangles: { corners: number[][]; face: string }[] = [];
  for (let t: number = 0; t < indices.length / 3; ++t) {
    const corners: number[][] = [0, 1, 2].map((k: number): number[] => {
      const v: number = indices[3 * t + k]!;
      return [positions[3 * v]!, positions[3 * v + 1]!, positions[3 * v + 2]!];
    });
    triangles.push({ corners, face: faceOf(corners) });
  }
  const byFace: Map<string, number[]> = new Map();
  triangles.forEach((triangle: { face: string }, t: number): void => {
    byFace.set(triangle.face, [...(byFace.get(triangle.face) ?? []), t]);
  });
  const holding: (point: IAutoMovieVector3) => number = (
    point: IAutoMovieVector3,
  ): number => {
    const p: number[] = [point.x, point.y, point.z];
    for (const t of byFace.get(faceOf([p])) ?? [])
      if (contains(triangles[t]!.corners, p)) return t;
    throw new Error("the point lies on no triangle");
  };
  return {
    distance: (point: IAutoMovieVector3): number => {
      const t: number = holding(point);
      const offset: number = list.getX(3 * t);
      const count: number = list.getY(3 * t);
      let d: number = reach;
      for (let k: number = 0; k < count; ++k) {
        // Edge texels: `a.xyz, convex` then `b.xyz, 0`.
        const e: number = 8 * data[4 * (offset + k)]!;
        if (data[e + 3]! < 0.5) continue;
        d = Math.min(
          d,
          segmentDistance(
            [data[e]!, data[e + 1]!, data[e + 2]!],
            [data[e + 4]!, data[e + 5]!, data[e + 6]!],
            point,
          ),
        );
      }
      return d;
    },
    sidesOnEdge: (point: IAutoMovieVector3): boolean => {
      const corners: number[][] = triangles[holding(point)]!.corners;
      return [0, 1, 2].some((k: number): boolean => {
        const p: number[] = corners[k]!;
        const q: number[] = corners[(k + 1) % 3]!;
        // A side on a box edge has two coordinates at ±0.5 at both ends.
        return (
          [0, 1, 2].filter(
            (axis: number): boolean =>
              Math.abs(p[axis]!) === 0.5 &&
              Math.abs(q[axis]!) === 0.5 &&
              p[axis] === q[axis],
          ).length >= 2
        );
      });
    },
  };
}

/**
 * The face of the unit box a set of points lies on: the axis and sign of the
 * coordinate all of them share at ±0.5, the first such axis for a point on an
 * edge.
 */
function faceOf(points: number[][]): string {
  for (let axis: number = 0; axis < 3; ++axis)
    for (const sign of [0.5, -0.5])
      if (
        points.every((p: number[]): boolean => Math.abs(p[axis]! - sign) < 1e-9)
      )
        return `${axis}${sign}`;
  return "none";
}

/**
 * Whether a point on a triangle's plane lies inside it, by barycentric
 * coordinates within 1e-12.
 */
function contains(corners: number[][], p: number[]): boolean {
  const [a, b, c]: number[][] = corners;
  const ab: number[] = [b![0]! - a![0]!, b![1]! - a![1]!, b![2]! - a![2]!];
  const ac: number[] = [c![0]! - a![0]!, c![1]! - a![1]!, c![2]! - a![2]!];
  const ap: number[] = [p[0]! - a![0]!, p[1]! - a![1]!, p[2]! - a![2]!];
  const n: number[] = cross(ab, ac);
  const nn: number = dot(n, n);
  if (nn === 0) return false;
  const beta: number = dot(cross(ap, ac), n) / nn;
  const gamma: number = dot(cross(ab, ap), n) / nn;
  return beta >= -1e-12 && gamma >= -1e-12 && beta + gamma <= 1 + 1e-12;
}

/** Distance from a point to the segment from `a` to `b`. */
function segmentDistance(
  a: number[],
  b: number[],
  point: IAutoMovieVector3,
): number {
  const ab: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
  const ap: number[] = [point.x - a[0]!, point.y - a[1]!, point.z - a[2]!];
  const t: number = Math.max(0, Math.min(1, dot(ap, ab) / dot(ab, ab)));
  return Math.hypot(
    ap[0]! - t * ab[0]!,
    ap[1]! - t * ab[1]!,
    ap[2]! - t * ab[2]!,
  );
}

/** `u × v`. */
function cross(u: number[], v: number[]): number[] {
  return [
    u[1]! * v[2]! - u[2]! * v[1]!,
    u[2]! * v[0]! - u[0]! * v[2]!,
    u[0]! * v[1]! - u[1]! * v[0]!,
  ];
}

/** `u · v`. */
function dot(u: number[], v: number[]): number {
  return u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!;
}

/**
 * A unit box centred on the origin, each face an n × n grid of quads wound
 * counter-clockwise from outside.
 */
function gridBox(n: number): { positions: number[]; indices: number[] } {
  const positions: number[] = [];
  const indices: number[] = [];
  // Each face: its normal axis and sign, and two in-face axes whose cross product is the outward normal.
  const faces: [number, number, number, number][] = [
    [0, 1, 1, 2],
    [0, -1, 2, 1],
    [1, 1, 2, 0],
    [1, -1, 0, 2],
    [2, 1, 0, 1],
    [2, -1, 1, 0],
  ];
  for (const [axis, sign, u, v] of faces) {
    const base: number = positions.length / 3;
    for (let j: number = 0; j <= n; ++j)
      for (let i: number = 0; i <= n; ++i) {
        const p: number[] = [0, 0, 0];
        p[axis] = sign * 0.5;
        p[u] = -0.5 + i / n;
        p[v] = -0.5 + j / n;
        positions.push(...p);
      }
    for (let j: number = 0; j < n; ++j)
      for (let i: number = 0; i < n; ++i) {
        const a: number = base + j * (n + 1) + i;
        indices.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1);
      }
  }
  return { positions, indices };
}
