import { intersectAutoMovieConvexPolygons } from "@automovie/engine";
import {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHumanSkinDomain } from "../junction/IAutoMovieHumanSkinDomain";
import { AutoMovieHumanSkinFeatureField } from "./AutoMovieHumanSkinFeatureField";

/**
 * Integrate the actual incident rest triangles over each skin texel.
 *
 * Eight-pixel UV buckets restrict queries to nearby triangles. Every candidate is intersected with the texel square before its affine physical map is used. Adjacent triangles contribute by UV area; partial nonlocal UV overlaps are checked on their actual polygon intersection and become unsupported. A coarse-face semantic role follows the exact emitter triangle order, not a vertex's ambiguous chart or a final atlas rectangle.
 *
 * Only padding pixels without any interior piece use the previous two-texel clamped-edge extension. This extension is not physical footprint integration or full mip/seam certification. Averaged world slopes encoded later in one incident frame remain approximate on curved/smooth-shaded triangles. The call owns its triangles, buckets and lazy field preparations until it ends; it retains no model or image globally. Storage scales with triangle count, triangle-to-bucket incidences and prepared sites; the marks field retains at most 512 sites per prepared triangle, not a global 512-site bound. Large stretched UV triangles can occupy many buckets; no measured runtime or fixed memory bound for a complete Human is claimed here.
 */
export class AutoMovieHumanSkinTextureAtlas {
  private readonly bins_: AutoMovieHumanSkinTextureAtlas.ITriangle[][];
  private readonly columns_: number;

  /** Actual omitted geometry, area ownership and bounded-integration observations. */
  public readonly stats: {
    degenerateUvTriangles: number;
    unsupportedTexels: number;
    excludedTexels: number;
    paddingTexels: number;
  } = {
    degenerateUvTriangles: 0,
    unsupportedTexels: 0,
    excludedTexels: 0,
    paddingTexels: 0,
  };

  /** Borrow one field and immutable rest inputs; prepare no field at unrelated atlas pixels. */
  public constructor(
    private readonly props_: {
      parts: readonly IAutoMovieModelPart[];
      size: number;
      field: AutoMovieHumanSkinTextureAtlas.IField;
      domains?: ReadonlyMap<string, IAutoMovieHumanSkinDomain>;
    },
  ) {
    this.columns_ = Math.ceil(props_.size / 8);
    this.bins_ = Array.from(
      { length: this.columns_ * this.columns_ },
      (): AutoMovieHumanSkinTextureAtlas.ITriangle[] => [],
    );
    for (const part of props_.parts) {
      if (!part.id.startsWith("skin") || part.geometry.type !== "mesh")
        continue;
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      if (mesh.uvs === null)
        throw new Error(`Skin features require actual UV0 on ${part.id}`);
      const count: number = mesh.indices?.length ?? mesh.positions.length / 3;
      const domain: IAutoMovieHumanSkinDomain | undefined = props_.domains?.get(
        part.id,
      );
      if (
        domain !== undefined &&
        ("triangles" in domain
          ? domain.triangles.length * 3
          : domain.faces.length * domain.trianglesPerFace * 3) !== count
      )
        throw new Error(
          `Skin source roles do not match actual triangle order on ${part.id}`,
        );
      for (let at: number = 0; at < count; at += 3) {
        const ids: number[] = [0, 1, 2].map(
          (i: number): number => mesh.indices?.[at + i] ?? at + i,
        );
        const uv: [number, number][] = ids.map(
          (i: number): [number, number] => [
            mesh.uvs![2 * i]! * props_.size - 0.5,
            mesh.uvs![2 * i + 1]! * props_.size - 0.5,
          ],
        );
        const p: number[][] = ids.map((i: number): number[] =>
          mesh.positions
            .slice(3 * i, 3 * i + 3)
            .map((v: number): number => v * 1000),
        );
        const det: number = cross(uv[0]!, uv[1]!, uv[2]!);
        if (Math.abs(det) < 1e-12) {
          ++this.stats.degenerateUvTriangles;
          continue;
        }
        const triangle: AutoMovieHumanSkinTextureAtlas.ITriangle = {
          uv,
          p,
          det,
          filter: undefined,
          eligible:
            domain === undefined ||
            ("triangles" in domain
              ? domain.triangles[at / 3]
              : domain.faces[Math.floor(at / 3 / domain.trianglesPerFace)]) ===
              "ordinary",
        };
        const loX: number = Math.max(
          0,
          Math.floor(
            (Math.min(...uv.map((v: [number, number]): number => v[0])) - 2) /
              8,
          ),
        );
        const hiX: number = Math.min(
          this.columns_ - 1,
          Math.floor(
            (Math.max(...uv.map((v: [number, number]): number => v[0])) + 2) /
              8,
          ),
        );
        const loY: number = Math.max(
          0,
          Math.floor(
            (Math.min(...uv.map((v: [number, number]): number => v[1])) - 2) /
              8,
          ),
        );
        const hiY: number = Math.min(
          this.columns_ - 1,
          Math.floor(
            (Math.max(...uv.map((v: [number, number]): number => v[1])) + 2) /
              8,
          ),
        );
        for (let y: number = loY; y <= hiY; ++y)
          for (let x: number = loX; x <= hiX; ++x)
            this.bins_[y * this.columns_ + x]!.push(triangle);
      }
    }
  }

  /** Read one texel's actual clipped pieces; null means no surface, ambiguity, or explicit work-budget refusal. */
  public sample(
    x: number,
    y: number,
  ): AutoMovieHumanSkinTextureAtlas.IOutput | null {
    const candidates: AutoMovieHumanSkinTextureAtlas.ITriangle[] =
      this.bins_[Math.floor(y / 8) * this.columns_ + Math.floor(x / 8)]!;
    const square: [number, number][] = [
      [x - 0.5, y - 0.5],
      [x + 0.5, y - 0.5],
      [x + 0.5, y + 0.5],
      [x - 0.5, y + 0.5],
    ];
    const pieces: {
      triangle: AutoMovieHumanSkinTextureAtlas.ITriangle;
      polygon: [number, number][];
      area: number;
    }[] = [];
    let padding: AutoMovieHumanSkinTextureAtlas.ITriangle | undefined;
    let best: number = -Infinity;
    for (const triangle of candidates) {
      const weights: number[] = barycentric(triangle, x, y);
      const score: number = Math.min(...weights);
      if (score > best && outsideDistance(triangle, weights) <= 2) {
        padding = triangle;
        best = score;
      }
      const polygon: [number, number][] = intersectAutoMovieConvexPolygons(
        square,
        triangle.uv,
      );
      const area: number = polygonArea(polygon);
      if (area <= 1e-14) continue;
      for (const previous of pieces) {
        const overlap: [number, number][] = intersectAutoMovieConvexPolygons(
          polygon,
          previous.polygon,
        );
        if (polygonArea(overlap) <= 1e-12) continue;
        // The norm of the difference of two affine maps is convex. Checking
        // every overlap vertex bounds the whole polygon, unlike its centroid.
        for (const at of overlap) {
          const a: IAutoMovieVector3 = point(
            triangle,
            barycentric(triangle, ...at),
          );
          const b: IAutoMovieVector3 = point(
            previous.triangle,
            barycentric(previous.triangle, ...at),
          );
          if (
            triangle.eligible !== previous.triangle.eligible ||
            Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > 0.1
          )
            return { ambiguous: true, triangle, value: zero() };
        }
      }
      pieces.push({ triangle, polygon, area });
    }
    if (pieces.length === 0) {
      if (padding === undefined) return null;
      ++this.stats.paddingTexels;
      if (!padding.eligible) {
        ++this.stats.excludedTexels;
        return { ambiguous: false, triangle: padding, value: zero() };
      }
      const weights: number[] = barycentric(padding, x, y).map(
        (v: number): number => Math.max(0, v),
      );
      const sum: number = weights.reduce(
        (a: number, b: number): number => a + b,
        0,
      );
      return {
        ambiguous: false,
        triangle: padding,
        value: this.props_.field.sample(
          point(
            padding,
            weights.map((v: number): number => v / sum),
          ),
        ),
      };
    }
    const value: ReturnType<AutoMovieHumanSkinFeatureField["sample"]> = zero();
    let total: number = 0;
    let largest: (typeof pieces)[number] = pieces[0]!;
    let eligible: boolean = false;
    for (const piece of pieces) {
      total += piece.area;
      if (piece.area > largest.area) largest = piece;
      if (!piece.triangle.eligible) continue;
      eligible = true;
      if (piece.triangle.filter === undefined)
        piece.triangle.filter = this.props_.field.prepare(
          piece.triangle.p.map(
            (p: number[]): IAutoMovieVector3 => ({
              x: p[0]!,
              y: p[1]!,
              z: p[2]!,
            }),
          ),
        );
      if (piece.triangle.filter === null) {
        ++this.stats.unsupportedTexels;
        return null;
      }
      const sample: ReturnType<
        AutoMovieHumanSkinFeatureField["sample"]
      > | null = piece.triangle.filter(
        piece.polygon.map(
          (p: [number, number]): IAutoMovieVector3 =>
            point(piece.triangle, barycentric(piece.triangle, ...p)),
        ),
      );
      if (sample === null) {
        ++this.stats.unsupportedTexels;
        return null;
      }
      value.freckles += sample.freckles * piece.area;
      value.acne += sample.acne * piece.area;
      value.gradient.x += sample.gradient.x * piece.area;
      value.gradient.y += sample.gradient.y * piece.area;
      value.gradient.z += sample.gradient.z * piece.area;
    }
    if (!eligible) ++this.stats.excludedTexels;
    value.freckles /= total;
    value.acne /= total;
    value.gradient.x /= total;
    value.gradient.y /= total;
    value.gradient.z /= total;
    return { ambiguous: false, triangle: largest.triangle, value };
  }
}

/** Actual domain-query records, scoped to one bake. */
export namespace AutoMovieHumanSkinTextureAtlas {
  /**
   * A rest-mm field's point extension and actual-polygon filtering authority.
   *
   * @author Samchon
   */
  export interface IField {
    /** Point extension used only outside incident triangle coverage. */
    sample: (
      point: IAutoMovieVector3,
    ) => ReturnType<AutoMovieHumanSkinFeatureField["sample"]>;
    /** Prepare one actual triangle; null explicitly refuses its filter or a later footprint. */
    prepare: (
      triangle: readonly IAutoMovieVector3[],
    ) =>
      | ((
          polygon: readonly IAutoMovieVector3[],
        ) => ReturnType<AutoMovieHumanSkinFeatureField["sample"]> | null)
      | null;
  }
  /**
   * One actual emitted triangle and its lazy polynomial field preparation.
   *
   * @author Samchon
   */
  export interface ITriangle {
    /** Actual UV0 in pixel coordinates. */
    uv: [number, number][];
    /** Actual physical rest points, millimetres. */
    p: number[][];
    /** Signed twice UV area. */
    det: number;
    /** Source eligibility, not an atlas-rectangle guess. */
    eligible: boolean;
    /** Prepared field or unsupported null; undefined has not been prepared yet. */
    filter: ReturnType<IField["prepare"]> | undefined;
  }
  /**
   * Scalar coverage and mean latent height slope on the supported texel domain.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Nonlocal overlapping skin cannot supply one field value. */
    ambiguous: boolean;
    /** Largest incident UV piece supplies the later normal encoding frame. */
    triangle: ITriangle;
    /** Filtered field; zero for excluded source roles. */
    value: ReturnType<AutoMovieHumanSkinFeatureField["sample"]>;
  }
}

/** Signed twice-area of an actual UV triangle. */
function cross(
  a: [number, number],
  b: [number, number],
  c: [number, number],
): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
/** Positive polygon area; zero-length boundary contacts contribute none. */
function polygonArea(polygon: [number, number][]): number {
  let area: number = 0;
  for (let i: number = 0; i < polygon.length; ++i) {
    const a: [number, number] = polygon[i]!;
    const b: [number, number] = polygon[(i + 1) % polygon.length]!;
    area += a[0] * b[1] - a[1] * b[0];
  }
  return Math.abs(area) / 2;
}
/** Affine coordinates only on this triangle; the caller supplies its actual clipped domain. */
function barycentric(
  t: AutoMovieHumanSkinTextureAtlas.ITriangle,
  x: number,
  y: number,
): number[] {
  const b: number =
    ((x - t.uv[0]![0]) * (t.uv[2]![1] - t.uv[0]![1]) -
      (y - t.uv[0]![1]) * (t.uv[2]![0] - t.uv[0]![0])) /
    t.det;
  const c: number =
    ((t.uv[1]![0] - t.uv[0]![0]) * (y - t.uv[0]![1]) -
      (t.uv[1]![1] - t.uv[0]![1]) * (x - t.uv[0]![0])) /
    t.det;
  return [1 - b - c, b, c];
}
/** Read the actual rest triangle in millimetres. */
function point(
  t: AutoMovieHumanSkinTextureAtlas.ITriangle,
  w: number[],
): IAutoMovieVector3 {
  return {
    x: t.p[0]![0]! * w[0]! + t.p[1]![0]! * w[1]! + t.p[2]![0]! * w[2]!,
    y: t.p[0]![1]! * w[0]! + t.p[1]![1]! * w[1]! + t.p[2]![1]! * w[2]!,
    z: t.p[0]![2]! * w[0]! + t.p[1]![2]! * w[1]! + t.p[2]![2]! * w[2]!,
  };
}
/** Largest crossed edge altitude for the preserved two-pixel padding rule. */
function outsideDistance(
  t: AutoMovieHumanSkinTextureAtlas.ITriangle,
  weights: number[],
): number {
  let distance: number = 0;
  for (let i: number = 0; i < 3; ++i) {
    const a: [number, number] = t.uv[(i + 1) % 3]!;
    const b: [number, number] = t.uv[(i + 2) % 3]!;
    distance = Math.max(
      distance,
      (-weights[i]! * Math.abs(t.det)) / Math.hypot(a[0] - b[0], a[1] - b[1]),
    );
  }
  return distance;
}
/** Disabled/excluded field identity. */
function zero(): ReturnType<AutoMovieHumanSkinFeatureField["sample"]> {
  return { freckles: 0, acne: 0, gradient: { x: 0, y: 0, z: 0 } };
}
