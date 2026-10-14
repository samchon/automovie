import { type IAutoMovieMesh } from "@automovie/interface";
import type { Vec } from "./Vec";
import { sub } from "./sub";
import { dot } from "./dot";
import { cross } from "./cross";
import { metricUv } from "./metricUv";

/**
 * Mutable per-part vertex attributes and triangle indices for draft geometry recipes.
 *
 * Appends grow with emitted output without an independent size cap. finish exposes these same arrays without copying or clearing them; later writer mutations also affect an already returned mesh. Numerical, index and manifold validation remain with model-source-audit. No native handle, task or cross-writer cache is acquired.
 */
export class MeshWriter {
  /** Packed local X/Y/Z positions in metres; readonly protects the binding, not the array contents. */
  readonly positions: number[] = [];

  /** Packed X/Y/Z normals, one triple per vertex; producer finiteness and unit length are not checked. */
  readonly normals: number[] = [];

  /** Packed U/V pairs, with units selected by each recipe. */
  readonly uvs: number[] = [];

  /** Triangle vertex indices after the first vertex's normal determines winding. */
  readonly indices: number[] = [];

  /** Append one position, normal and UV pair in constant work and return its zero-based vertex index. Attributes are copied by component without range or finiteness checks. */
  vertex(p: Vec, n: Vec, uv: [number, number]): number {
    const index: number = this.positions.length / 3;
    this.positions.push(...p);
    this.normals.push(...n);
    this.uvs.push(...uv);
    return index;
  }

  /**
   * Append three indices after comparing their edge cross product with vertex a's normal. A nonnegative dot product keeps b/c order; negative or NaN swaps it. Indices and degenerate triangles are not validated. Fixed-triple arithmetic and temporary tuples take constant work.
   */
  triangle(a: number, b: number, c: number): void {
    const p: (i: number) => Vec = (i: number): Vec => [
      this.positions[i * 3],
      this.positions[i * 3 + 1],
      this.positions[i * 3 + 2],
    ];
    const n: Vec = [
      this.normals[a * 3],
      this.normals[a * 3 + 1],
      this.normals[a * 3 + 2],
    ];
    const outward: boolean = dot(cross(sub(p(b), p(a)), sub(p(c), p(a))), n) >= 0;
    this.indices.push(a, outward ? b : c, outward ? c : b);
  }

  /**
   * Append four vertices and two triangles using the supplied intended normal. uvReference defaults to these four points; metricUv projects coordinates and scans the reference twice for each vertex, so work and temporary storage are linear in reference count. No reference minima are retained across quads, and slope-length UVs or coplanarity are not established here.
   */
  quad(
    points: [Vec, Vec, Vec, Vec],
    normal: Vec,
    uvReference: Vec[] = points,
  ): void {
    const face: number[] = points.map((p: Vec) : number =>
      this.vertex(p, normal, metricUv(p, normal, uvReference)),
    );
    const ab: Vec = sub(points[1], points[0]);
    const ac: Vec = sub(points[2], points[0]);
    if (dot(cross(ab, ac), normal) > 0) {
      this.triangle(face[0], face[1], face[2]);
      this.triangle(face[0], face[2], face[3]);
    } else {
      this.triangle(face[0], face[2], face[1]);
      this.triangle(face[0], face[3], face[2]);
    }
  }

  /**
   * Return an unskinned mesh header referencing this writer's arrays. Empty indices or a UV/position count mismatch throw; index range, triangle count, normal alignment and numerical/manifold checks are outside this method. Header creation and length checks take constant work. The writer is still usable and the caller shares its mutable arrays.
   */
  finish(): IAutoMovieMesh {
    if (
      !this.indices.length ||
      this.uvs.length !== (this.positions.length / 3) * 2
    )
      throw new Error("empty or non-UV model part");
    return {
      positions: this.positions,
      normals: this.normals,
      uvs: this.uvs,
      indices: this.indices,
      skin: null,
    };
  }
}
