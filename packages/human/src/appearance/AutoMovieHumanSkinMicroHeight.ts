import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A continuous physical-height convention reused from the original cellular tile.
 *
 * The 20 mm periodic tile retains the original hashed Gaussian pits and cellular furrows (Worley, SIGGRAPH 1996, doi:10.1145/237170.237267). Its 256 samples are bilinearly reconstructed in each of the XY, YZ and ZX rest-mm planes and averaged. This removes the atlas metric from the source without claiming a rotationally invariant field or anatomical crease directions. The inherited pit sizes, cell densities and 0.046875 mm height unit are artistic conventions, not measured follicles. The height unit is the former 20/256 mm texel times its 0.6 material slope gain; changing mapping does not calibrate reflectance.
 *
 * A polygon's mean surface gradient follows the height boundary integral. Each edge is split at all physical grid-plane crossings, where the reconstructed height is quadratic along the segment; two-point Gaussian integration is exact for that polynomial in real arithmetic. This integrates small features instead of assuming a fixed supersampling grid is sufficient. More than 4096 grid crossings refuses the footprint; each original polygon edge contributes its base segment as well. Coordinates must retain safely addressable physical grid cells. Float arithmetic, normal quantization, curved shading, mip filtering and lost subpixel normal variance remain limits.
 */
export class AutoMovieHumanSkinMicroHeight {
  private readonly height_: Float64Array;

  /** Build one quantized wrinkle state, with no retained model, chart or image. */
  public constructor(furrows: number) {
    if (!Number.isFinite(furrows) || furrows < 0 || furrows > 1)
      throw new Error("Skin micro-height requires wrinkle depth in [0,1]");
    const depth: number = Math.round(furrows * 100) / 100;
    this.height_ = new Float64Array(SIZE * SIZE);
    for (let y: number = 0; y < SIZE; ++y)
      for (let x: number = 0; x < SIZE; ++x)
        this.height_[y * SIZE + x] =
          ((-poreDepth(x, y) - (0.25 + 0.5 * depth) * furrowDepth(x, y)) *
            UNIT_MM) /
          3;
  }

  /** Physical scalar height in millimetres; equal rest positions have one value across charts. */
  public height(p: IAutoMovieVector3): number {
    if (!addressable(p))
      throw new Error(
        "Skin micro-height needs finite, safely addressable rest coordinates",
      );
    return this.plane(p.x, p.y) + this.plane(p.y, p.z) + this.plane(p.z, p.x);
  }

  /** Point derivative for padding only; the actual interior uses the polygon integral. */
  public gradient(p: IAutoMovieVector3): IAutoMovieVector3 {
    if (!addressable(p))
      throw new Error(
        "Skin micro-height needs finite, safely addressable rest coordinates",
      );
    const xy: [number, number] = this.planeGradient(p.x, p.y);
    const yz: [number, number] = this.planeGradient(p.y, p.z);
    const zx: [number, number] = this.planeGradient(p.z, p.x);
    return { x: xy[0] + zx[1], y: xy[1] + yz[0], z: yz[1] + zx[0] };
  }

  /** Mean latent physical surface slope on this actual planar convex polygon, or explicit work refusal. */
  public integrate(
    polygon: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3 | null {
    if (polygon.some((p: IAutoMovieVector3): boolean => !addressable(p)))
      throw new Error(
        "Skin micro-height needs a finite, safely addressable physical polygon",
      );
    if (polygon.length < 3) return { x: 0, y: 0, z: 0 };
    const origin: IAutoMovieVector3 = polygon[0]!;
    const area: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let i: number = 1; i + 1 < polygon.length; ++i) {
      const a: IAutoMovieVector3 = subtract(polygon[i]!, origin);
      const b: IAutoMovieVector3 = subtract(polygon[i + 1]!, origin);
      area.x += (a.y * b.z - a.z * b.y) / 2;
      area.y += (a.z * b.x - a.x * b.z) / 2;
      area.z += (a.x * b.y - a.y * b.x) / 2;
    }
    const magnitude: number = Math.hypot(area.x, area.y, area.z);
    if (magnitude === 0) return { x: 0, y: 0, z: 0 };
    const n: IAutoMovieVector3 = {
      x: area.x / magnitude,
      y: area.y / magnitude,
      z: area.z / magnitude,
    };
    const result: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let work: number = 0;
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const e: IAutoMovieVector3 = subtract(
        polygon[(i + 1) % polygon.length]!,
        a,
      );
      const cuts: number[] = [0, 1];
      for (const axis of ["x", "y", "z"] as const) {
        if (e[axis] === 0) continue;
        const lo: number =
          Math.floor(Math.min(a[axis], a[axis] + e[axis]) / STEP_MM) + 1;
        const hi: number =
          Math.ceil(Math.max(a[axis], a[axis] + e[axis]) / STEP_MM) - 1;
        work += Math.max(0, hi - lo + 1);
        if (work > 4096) return null;
        for (let k: number = lo; k <= hi; ++k)
          cuts.push((k * STEP_MM - a[axis]) / e[axis]);
      }
      cuts.sort((a: number, b: number): number => a - b);
      let mean: number = 0;
      for (let j: number = 1; j < cuts.length; ++j) {
        const half: number = (cuts[j]! - cuts[j - 1]!) / 2;
        const middle: number = (cuts[j]! + cuts[j - 1]!) / 2;
        if (half <= 0) continue;
        const h: (t: number) => number = (t: number): number =>
          this.height({ x: a.x + e.x * t, y: a.y + e.y * t, z: a.z + e.z * t });
        mean +=
          half *
          (h(middle - half / Math.sqrt(3)) + h(middle + half / Math.sqrt(3)));
      }
      // edge cross normal is the outward conormal times edge length.
      result.x += ((e.y * n.z - e.z * n.y) * mean) / magnitude;
      result.y += ((e.z * n.x - e.x * n.z) * mean) / magnitude;
      result.z += ((e.x * n.y - e.y * n.x) * mean) / magnitude;
    }
    return result;
  }

  /** Periodic bilinear reconstruction of the original height samples. */
  private plane(x: number, y: number): number {
    const u: number = x / STEP_MM;
    const v: number = y / STEP_MM;
    const i: number = Math.floor(u);
    const j: number = Math.floor(v);
    const s: number = u - i;
    const t: number = v - j;
    return (
      (1 - t) * ((1 - s) * this.at(i, j) + s * this.at(i + 1, j)) +
      t * ((1 - s) * this.at(i, j + 1) + s * this.at(i + 1, j + 1))
    );
  }

  /** Derivative inside the current physical grid cell; grid-boundary values use its right derivative. */
  private planeGradient(x: number, y: number): [number, number] {
    const u: number = x / STEP_MM;
    const v: number = y / STEP_MM;
    const i: number = Math.floor(u);
    const j: number = Math.floor(v);
    const s: number = u - i;
    const t: number = v - j;
    return [
      ((1 - t) * (this.at(i + 1, j) - this.at(i, j)) +
        t * (this.at(i + 1, j + 1) - this.at(i, j + 1))) /
        STEP_MM,
      ((1 - s) * (this.at(i, j + 1) - this.at(i, j)) +
        s * (this.at(i + 1, j + 1) - this.at(i + 1, j))) /
        STEP_MM,
    ];
  }

  /** Wrap finite cell addresses at the same 20 mm period in either direction. */
  private at(i: number, j: number): number {
    return this.height_[
      (((j % SIZE) + SIZE) % SIZE) * SIZE + (((i % SIZE) + SIZE) % SIZE)
    ]!;
  }
}

/** Original tile edge and its physical sampling step. */
const SIZE: number = 256;
/** Conventional period, millimetres. */
const STEP_MM: number = 20 / SIZE;
/** Former tile slope gain expressed as a conventional physical height. */
const UNIT_MM: number = STEP_MM * 0.6;
/** Original conventional fine-cell count per 20 mm tile edge. */
const PORE_CELLS: number = 32;
/** Original conventional coarse-cell count per tile edge. */
const FURROW_CELLS: number = 20;

/** Grid addresses must remain finite safe integers so edge splitting cannot overflow or lose unit increments. */
function addressable(p: IAutoMovieVector3): boolean {
  return [p.x, p.y, p.z].every(
    (value: number): boolean =>
      Number.isFinite(value) &&
      Number.isSafeInteger(Math.floor(value / STEP_MM)),
  );
}

/** Physical vector subtraction without mutating the caller's polygon. */
function subtract(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Original Gaussian pit envelope at one tile sample. */
function poreDepth(x: number, y: number): number {
  const cell: number = SIZE / PORE_CELLS;
  const cx: number = Math.floor(x / cell);
  const cy: number = Math.floor(y / cell);
  let depth: number = 0;
  for (let j: number = -1; j <= 1; ++j)
    for (let i: number = -1; i <= 1; ++i) {
      const [px, py, r]: [number, number, number] = feature(
        cx + i,
        cy + j,
        PORE_CELLS,
        1,
      );
      const dx: number = x - (cx + i + px) * cell;
      const dy: number = y - (cy + j + py) * cell;
      const radius: number = ((0.9 + 0.9 * r) * cell) / 8;
      depth = Math.max(
        depth,
        Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius)),
      );
    }
  return depth;
}

/** Original coarse cellular furrow envelope at one tile sample. */
function furrowDepth(x: number, y: number): number {
  const cell: number = SIZE / FURROW_CELLS;
  const cx: number = Math.floor(x / cell);
  const cy: number = Math.floor(y / cell);
  let first: number = Infinity;
  let second: number = Infinity;
  for (let j: number = -2; j <= 2; ++j)
    for (let i: number = -2; i <= 2; ++i) {
      const [px, py]: [number, number, number] = feature(
        cx + i,
        cy + j,
        FURROW_CELLS,
        2,
      );
      const d: number = Math.hypot(
        x - (cx + i + px) * cell,
        y - (cy + j + py) * cell,
      );
      if (d < first) {
        second = first;
        first = d;
      } else if (d < second) second = d;
    }
  const gap: number = (second - first) / 2;
  return Math.exp((-gap * gap) / (2 * 1.5 * 1.5));
}

/** Same wrapped feature-point authority as the inherited cellular source. */
function feature(
  i: number,
  j: number,
  cells: number,
  seed: number,
): [number, number, number] {
  const wi: number = ((i % cells) + cells) % cells;
  const wj: number = ((j % cells) + cells) % cells;
  return [hash(wi, wj, seed, 0), hash(wi, wj, seed, 1), hash(wi, wj, seed, 2)];
}

/** Deterministic integer-cell avalanche used by the original procedural tile. */
function hash(i: number, j: number, seed: number, k: number): number {
  let h: number =
    Math.imul(i, 0x27d4eb2d) ^
    Math.imul(j, 0x165667b1) ^
    Math.imul(seed * 4 + k, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
