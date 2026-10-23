import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Texture coordinates of the generated skin in rest-surface millimetres,
 * computed from the final skin pieces whatever vertices they contain.
 *
 * The coordinates serve tiled micro-detail images, so they need to be
 * locally close to an isometry (one millimetre of skin, one millimetre of
 * texture, in every direction) and continuous over large areas; they are
 * not an atlas and no two regions need distinct coordinates. Each chart is
 * a cylinder about a central axis:
 *
 * - The head family (`head`, `head.*`) and the neck and trunk (`upper`,
 *   `trunk`) are lofted from horizontal sections, so each forms one chart
 *   about a vertical axis through the centroids of 2 mm height bins. The
 *   face and the torso therefore carry no seam between their chains.
 * - Every other chain is its own chart about the polyline through its band
 *   centroids, `human.skin.<chain>/<k>` in order of `k`; a chain of one band
 *   or with nearly coincident centroids uses the direction its normals are
 *   most nearly perpendicular to.
 *
 * The chart's surface is sampled as a radius over a polar grid whose
 * stations are one mean edge length apart (1.5 to 6 mm) and whose sectors
 * span about as much arc (32 to 256 per turn), and the grid is flattened
 * by least squares: every grid edge asks for the differences its
 * 3D vector has in the local frame of the section direction and the
 * in-surface direction perpendicular to it, and successive over-relaxation
 * from the unrolled cylinder finds the coordinates that best meet all of
 * them. The flanks of the nose, the underside of the chin and the zipper
 * bands next to branch rings thus keep their true size instead of the
 * projected one, and shear does not accumulate around a section. A vertex
 * takes the bilinear grid coordinates at its angle and station plus its
 * radial offset from the sampled surface resolved in the same frame, so
 * vertices off the sampled sheet (eyelid tucks, rings perpendicular to the
 * axis) are spread rather than collapsed.
 *
 * The cut is at the back, opposite the reference (`+X` projected off the
 * axis, or `+Y` for an axis that runs forward): down the back of the head
 * and the spine, behind each limb, on top of each toe. The grid continues
 * a sixteenth of a turn past the cut, and triangles crossing it take
 * duplicated vertices evaluated there, so the coordinates stay continuous
 * inside every triangle. Chart boundaries at chain junctions (shoulder, hip, wrist,
 * ankle, finger and toe roots, ears) are discontinuities of the
 * coordinates only, not of position or normal.
 *
 * Remaining distortion: the least-squares solution spreads the surface's
 * intrinsic curvature as mild scale and shear, largest at poles (crown,
 * fingertips) where sections shrink to a point; a surface that folds back
 * over itself along a ray from the axis has one sampled radius and relies
 * on the radial offset alone.
 */
export namespace AutoMovieHumanSkinChart {
  /** One skin piece in millimetres, as split from the whole skin. */
  export interface IPiece {
    /** Part name without the `human.skin.` prefix: `<chain>/<k>`. */
    name: string;

    /** Flat vertex positions in mm. */
    positions: number[];

    /** Flat unit vertex normals. */
    normals: number[];

    /** Flat triangle indices. */
    indices: number[];
  }

  /** A piece with texture coordinates and its cut vertices duplicated. */
  export interface IOutput extends IPiece {
    /** Flat `[u, v, ...]` in rest-surface mm, one pair per vertex. */
    uvs: number[];
  }

  /**
   * Chart every piece.
   *
   * @param pieces Skin pieces of the whole body, in mm
   * @returns The pieces in the same order, with coordinates
   */
  export function generate(pieces: readonly IPiece[]): IOutput[] {
    const groups: Map<string, number[]> = new Map();
    pieces.forEach((piece: IPiece, index: number): void => {
      const key: string = chartOf(chainOf(piece.name));
      const list: number[] | undefined = groups.get(key);
      if (list === undefined) groups.set(key, [index]);
      else list.push(index);
    });

    const out: IOutput[] = new Array(pieces.length);
    for (const [key, members] of groups) {
      const chosen: IPiece[] = members.map((i: number): IPiece => pieces[i]!);
      const axis: IAxis =
        key === "head" || key === "trunk"
          ? verticalAxis(chosen)
          : chainAxis(chosen);
      const grid: IGrid = flatten(axis, chosen);
      members.forEach((i: number, m: number): void => {
        out[i] = unroll(axis, grid, chosen[m]!);
      });
    }
    pack(
      [...groups.values()].map((members: number[]): IOutput[] =>
        members.map((i: number): IOutput => out[i]!),
      ),
    );
    return out;
  }
}

/** One chart's pieces and coordinate bounding box. */
interface IBox {
  /** The chart's pieces. */
  chart: AutoMovieHumanSkinChart.IOutput[];

  /** Lower corner of the coordinates in mm. */
  lo: [number, number];

  /** Extent of the coordinates in mm. */
  size: [number, number];
}

/** Gap between packed charts in mm, so filtered marks never bleed across. */
const GUTTER: number = 12;

/**
 * Shelf-pack the charts into one layout starting at the origin, so no two
 * charts share coordinates and a single image can address the whole skin.
 * Charts are placed tallest first, left to right, on shelves about as wide as
 * the square root of their total area; each chart moves rigidly.
 *
 * @param charts Pieces of each chart, coordinates updated in place
 */
function pack(charts: AutoMovieHumanSkinChart.IOutput[][]): void {
  const boxes: IBox[] = charts.map(
    (chart: AutoMovieHumanSkinChart.IOutput[]): IBox => {
      const lo: [number, number] = [Infinity, Infinity];
      const hi: [number, number] = [-Infinity, -Infinity];
      for (const piece of chart)
        for (let i: number = 0; i < piece.uvs.length; i += 2)
          for (let c: number = 0; c < 2; ++c) {
            lo[c] = Math.min(lo[c]!, piece.uvs[i + c]!);
            hi[c] = Math.max(hi[c]!, piece.uvs[i + c]!);
          }
      return { chart, lo, size: [hi[0] - lo[0], hi[1] - lo[1]] };
    },
  );
  const area: number = boxes.reduce(
    (s: number, b: IBox): number =>
      s + (b.size[0] + GUTTER) * (b.size[1] + GUTTER),
    0,
  );
  const width: number = Math.max(
    1.1 * Math.sqrt(area),
    ...boxes.map((b: IBox): number => b.size[0] + GUTTER),
  );
  boxes.sort((a: IBox, b: IBox): number => b.size[1] - a.size[1]);
  let x: number = GUTTER;
  let y: number = GUTTER;
  let shelf: number = 0;
  for (const box of boxes) {
    if (x + box.size[0] + GUTTER > width) {
      x = GUTTER;
      y += shelf + GUTTER;
      shelf = 0;
    }
    const du: number = x - box.lo[0];
    const dv: number = y - box.lo[1];
    for (const piece of box.chart)
      for (let i: number = 0; i < piece.uvs.length; i += 2) {
        piece.uvs[i] = piece.uvs[i]! + du;
        piece.uvs[i + 1] = piece.uvs[i + 1]! + dv;
      }
    x += box.size[0] + GUTTER;
    shelf = Math.max(shelf, box.size[1]);
  }
}

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

/** Most angular sectors of a polar grid. */
const MAX_SECTORS: number = 256;

/** Fewest angular sectors of a polar grid. */
const MIN_SECTORS: number = 32;

/** Successive over-relaxation sweeps of the flattening. */
const SWEEPS: number = 300;

/** Over-relaxation factor. */
const OMEGA: number = 1.85;

/** Cylindrical coordinates about a chart axis. */
interface IAxis {
  /**
   * Station along the axis, radius and angle of a point.
   *
   * @param p Point in mm
   * @param band Band index of the piece holding the point
   * @returns `[s, rho, theta]`, theta in `(-pi, pi]` with zero at the front reference
   */
  locate(p: Vec3, band: number): [number, number, number];

  /**
   * Point at cylindrical coordinates.
   *
   * @param s Station in mm
   * @param theta Angle in radians
   * @param rho Radius in mm
   * @returns Point in mm
   */
  point(s: number, theta: number, rho: number): Vec3;
}

/** Flattened polar grid of one chart. */
interface IGrid {
  /** First station in mm. */
  lo: number;

  /** Station step in mm. */
  step: number;

  /** Station rows. */
  rows: number;

  /** Angular sectors, a multiple of 16, so the front reference and the overlap fall on nodes. */
  sectors: number;

  /** Extra sectors continuing the grid past the cut, a sixteenth of a turn. */
  overlap: number;

  /** Sampled radius per row and sector node, `rows * sectors`. */
  radius: Float64Array;

  /** Coordinates per row and extended node, `rows * (sectors + overlap + 1)`, interleaved u, v. */
  uv: Float64Array;

  /** Local frame per extended node: section direction then in-surface perpendicular, 6 numbers each. */
  frame: Float64Array;
}

/**
 * Chain name of a piece name `<chain>/<k>`.
 *
 * @param name Piece name
 * @returns Chain name
 */
function chainOf(name: string): string {
  return name.slice(0, name.lastIndexOf("/"));
}

/**
 * Band index of a piece name `<chain>/<k>`.
 *
 * @param name Piece name
 * @returns Band index
 */
function bandOf(name: string): number {
  return Number(name.slice(name.lastIndexOf("/") + 1));
}

/**
 * Chart key: shared charts for horizontally lofted families, else the chain.
 *
 * @param chain Chain name
 * @returns Chart key
 */
function chartOf(chain: string): string {
  if (chain === "head" || chain.startsWith("head.")) return "head";
  if (chain === "upper" || chain === "trunk") return "trunk";
  return chain;
}

/**
 * Vertical axis through the centroids of height bins, for charts lofted from
 * horizontal sections; the reference is `+X`.
 *
 * @param pieces The chart's pieces
 * @returns The axis
 */
function verticalAxis(
  pieces: readonly AutoMovieHumanSkinChart.IPiece[],
): IAxis {
  const BIN: number = 2;
  let lo: number = Infinity;
  let hi: number = -Infinity;
  for (const piece of pieces)
    for (let i: number = 1; i < piece.positions.length; i += 3) {
      lo = Math.min(lo, piece.positions[i]!);
      hi = Math.max(hi, piece.positions[i]!);
    }
  const n: number = Math.max(2, Math.ceil((hi - lo) / BIN) + 1);
  const sx: number[] = new Array(n).fill(0);
  const sz: number[] = new Array(n).fill(0);
  const count: number[] = new Array(n).fill(0);
  for (const piece of pieces)
    for (let i: number = 0; i < piece.positions.length; i += 3) {
      const b: number = Math.min(
        n - 1,
        Math.round((piece.positions[i + 1]! - lo) / BIN),
      );
      sx[b]! += piece.positions[i]!;
      sz[b]! += piece.positions[i + 2]!;
      count[b]! += 1;
    }
  const x: number[] = smooth(
    fill(
      sx.map((v: number, b: number): number =>
        count[b]! > 0 ? v / count[b]! : NaN,
      ),
    ),
    3,
  );
  const z: number[] = smooth(
    fill(
      sz.map((v: number, b: number): number =>
        count[b]! > 0 ? v / count[b]! : NaN,
      ),
    ),
    3,
  );
  const centre: (y: number) => [number, number] = (
    y: number,
  ): [number, number] => {
    const t: number = Math.min(n - 1, Math.max(0, (y - lo) / BIN));
    const b: number = Math.min(n - 2, Math.floor(t));
    const f: number = t - b;
    return [x[b]! + (x[b + 1]! - x[b]!) * f, z[b]! + (z[b + 1]! - z[b]!) * f];
  };
  return {
    locate: (p: Vec3): [number, number, number] => {
      const c: [number, number] = centre(p[1]);
      const dx: number = p[0] - c[0];
      const dz: number = p[2] - c[1];
      return [p[1], Math.hypot(dx, dz), Math.atan2(dz, dx)];
    },
    point: (s: number, theta: number, rho: number): Vec3 => {
      const c: [number, number] = centre(s);
      return [c[0] + rho * Math.cos(theta), s, c[1] + rho * Math.sin(theta)];
    },
  };
}

/**
 * Axis polyline through the band centroids of one chain, with a
 * rotation-minimising reference frame transported along it.
 *
 * @param pieces The chain's pieces
 * @returns The axis
 */
function chainAxis(pieces: readonly AutoMovieHumanSkinChart.IPiece[]): IAxis {
  const ordered: AutoMovieHumanSkinChart.IPiece[] = [...pieces].sort(
    (
      a: AutoMovieHumanSkinChart.IPiece,
      b: AutoMovieHumanSkinChart.IPiece,
    ): number => bandOf(a.name) - bandOf(b.name),
  );
  let bands: number[] = ordered.map(
    (piece: AutoMovieHumanSkinChart.IPiece): number => bandOf(piece.name),
  );
  let centres: Vec3[] = ordered.map(
    (piece: AutoMovieHumanSkinChart.IPiece): Vec3 =>
      V.centroid(piece.positions),
  );

  // Without a usable centroid polyline (one band, or centroids closer than
  // half the chain's radius), the axis is the direction the normals are most
  // nearly perpendicular to, through the chain's centroid and spanning it.
  let length: number = 0;
  for (let k: number = 1; k < centres.length; ++k)
    length += V.norm(V.sub(centres[k]!, centres[k - 1]!));
  if (centres.length < 2 || length < 0.5 * spread(ordered)) {
    const all: number[] = ordered.flatMap(
      (piece: AutoMovieHumanSkinChart.IPiece): number[] => piece.positions,
    );
    const c: Vec3 = V.centroid(all);
    const d: Vec3 = leastNormal(ordered);
    let reach: number = 1;
    for (let i: number = 0; i < all.length; i += 3)
      reach = Math.max(reach, Math.abs(V.dot(V.sub(V.at(all, i / 3), c), d)));
    centres = [V.sub(c, V.scale(d, reach)), V.add(c, V.scale(d, reach))];
    bands = [];
  }

  // Segment directions, cumulative stations and transported references.
  const m: number = centres.length - 1;
  const dirs: Vec3[] = [];
  const stations: number[] = [0];
  for (let k: number = 0; k < m; ++k) {
    const d: Vec3 = V.sub(centres[k + 1]!, centres[k]!);
    const len: number = Math.max(1e-9, V.norm(d));
    dirs.push(V.scale(d, 1 / len));
    stations.push(stations[k]! + len);
  }
  const mean: Vec3 = V.normalize(V.sub(centres[m]!, centres[0]!));
  const refs: Vec3[] = [];
  let r: Vec3 = Math.abs(mean[0]) > 0.8 ? [0, 1, 0] : [1, 0, 0];
  for (let k: number = 0; k < m; ++k) {
    const t: Vec3 = dirs[k]!;
    const projected: Vec3 = V.sub(r, V.scale(t, V.dot(r, t)));
    r = V.norm(projected) > 1e-6 ? V.normalize(projected) : perpendicular(t);
    refs.push(r);
  }

  // Joint frames: each inner centroid carries the bisector of its two
  // segments and the mean reference, the ends their segment's own. Space
  // between consecutive joint planes belongs to one segment, so stations
  // and frames vary continuously across joints instead of clamping every
  // point outside a bend onto the joint.
  const jointAxis: Vec3[] = [];
  const jointRef: Vec3[] = [];
  for (let k: number = 0; k <= m; ++k) {
    const t: Vec3 = V.normalize(
      V.add(dirs[Math.max(0, k - 1)]!, dirs[Math.min(m - 1, k)]!),
    );
    const raw: Vec3 = V.add(
      refs[Math.max(0, k - 1)]!,
      refs[Math.min(m - 1, k)]!,
    );
    jointAxis.push(t);
    jointRef.push(V.normalize(V.sub(raw, V.scale(t, V.dot(raw, t)))));
  }
  const frameAt: (k: number, f: number) => [Vec3, Vec3, Vec3, Vec3] = (
    k: number,
    f: number,
  ): [Vec3, Vec3, Vec3, Vec3] => {
    const g: number = Math.min(1, Math.max(0, f));
    const t: Vec3 = V.normalize(
      V.add(V.scale(jointAxis[k]!, 1 - g), V.scale(jointAxis[k + 1]!, g)),
    );
    const raw: Vec3 = V.add(
      V.scale(jointRef[k]!, 1 - g),
      V.scale(jointRef[k + 1]!, g),
    );
    const ref: Vec3 = V.normalize(V.sub(raw, V.scale(t, V.dot(raw, t))));
    const foot: Vec3 = V.add(
      centres[k]!,
      V.scale(V.sub(centres[k + 1]!, centres[k]!), f),
    );
    return [foot, t, ref, V.cross(t, ref)];
  };

  // A band's vertices search the segments around it: the band k spans
  // centroids k-1..k+1 in the polyline order.
  const position: Map<number, number> = new Map(
    bands.map((b: number, i: number): [number, number] => [b, i]),
  );
  return {
    locate: (p: Vec3, band: number): [number, number, number] => {
      const at: number = Math.min(m - 1, position.get(band) ?? 0);
      // Fallback where no nearby joint interval holds the point: the
      // unclamped projection onto the band's own segment.
      let k: number = at;
      let f: number =
        V.dot(V.sub(p, centres[at]!), dirs[at]!) /
        (stations[at + 1]! - stations[at]!);
      for (const candidate of [at, at - 1, at + 1, at - 2, at + 2]) {
        if (candidate < 0 || candidate > m - 1) continue;
        const a: number = V.dot(
          V.sub(p, centres[candidate]!),
          jointAxis[candidate]!,
        );
        const b: number = V.dot(
          V.sub(p, centres[candidate + 1]!),
          jointAxis[candidate + 1]!,
        );
        const inside: boolean =
          (a >= 0 || candidate === 0) && (b < 0 || candidate === m - 1);
        if (inside && a - b > 1e-9) {
          k = candidate;
          f = a / (a - b);
          break;
        }
      }
      const frame: [Vec3, Vec3, Vec3, Vec3] = frameAt(k, f);
      const d: Vec3 = V.sub(p, frame[0]);
      const across: Vec3 = V.sub(d, V.scale(frame[1], V.dot(d, frame[1])));
      return [
        stations[k]! + f * (stations[k + 1]! - stations[k]!),
        V.norm(across),
        Math.atan2(V.dot(across, frame[3]), V.dot(across, frame[2])),
      ];
    },
    point: (s: number, theta: number, rho: number): Vec3 => {
      let k: number = 0;
      while (k < m - 1 && s > stations[k + 1]!) ++k;
      const f: number = (s - stations[k]!) / (stations[k + 1]! - stations[k]!);
      const frame: [Vec3, Vec3, Vec3, Vec3] = frameAt(k, f);
      return V.add(
        frame[0],
        V.add(
          V.scale(frame[2], rho * Math.cos(theta)),
          V.scale(frame[3], rho * Math.sin(theta)),
        ),
      );
    },
  };
}

/**
 * Sample a chart's surface on a polar grid and flatten the grid.
 *
 * @param axis The chart's axis
 * @param pieces The chart's pieces
 * @returns The flattened grid
 */
function flatten(
  axis: IAxis,
  pieces: readonly AutoMovieHumanSkinChart.IPiece[],
): IGrid {
  // Station range and the mean edge length set the station step.
  let lo: number = Infinity;
  let hi: number = -Infinity;
  let edge: number = 0;
  let edges: number = 0;
  const located: number[][] = pieces.map(
    (piece: AutoMovieHumanSkinChart.IPiece): number[] => {
      const band: number = bandOf(piece.name);
      const list: number[] = [];
      for (let i: number = 0; i < piece.positions.length / 3; ++i) {
        const c: [number, number, number] = axis.locate(
          V.at(piece.positions, i),
          band,
        );
        lo = Math.min(lo, c[0]);
        hi = Math.max(hi, c[0]);
        list.push(c[0], c[1], c[2]);
      }
      for (let t: number = 0; t < piece.indices.length; t += 3) {
        edge += V.norm(
          V.sub(
            V.at(piece.positions, piece.indices[t]!),
            V.at(piece.positions, piece.indices[t + 1]!),
          ),
        );
        edges += 1;
      }
      return list;
    },
  );
  const step: number = Math.max(1.5, Math.min(6, edges > 0 ? edge / edges : 1));
  const rows: number = Math.max(2, Math.ceil((hi - lo) / step) + 1);

  // About one station step of arc per sector at the mean radius.
  let rhoSum: number = 0;
  let rhoCount: number = 0;
  for (const list of located)
    for (let i: number = 1; i < list.length; i += 3) {
      rhoSum += list[i]!;
      rhoCount += 1;
    }
  const circumference: number = (2 * Math.PI * rhoSum) / Math.max(1, rhoCount);
  const SECTORS: number =
    16 *
    Math.round(
      Math.min(MAX_SECTORS, Math.max(MIN_SECTORS, circumference / step)) / 16,
    );
  const OVERLAP: number = SECTORS / 16;
  const dTheta: number = (2 * Math.PI) / SECTORS;

  // Mean radius of the vertices nearest each node; empty nodes take the
  // circular interpolation of their row, empty rows the nearest row, and one
  // 3x3 average removes the scatter of vertices off the main sheet.
  const sum: Float64Array = new Float64Array(rows * SECTORS);
  const count: Float64Array = new Float64Array(rows * SECTORS);
  for (const list of located)
    for (let i: number = 0; i < list.length; i += 3) {
      const j: number = Math.min(
        rows - 1,
        Math.max(0, Math.round((list[i]! - lo) / step)),
      );
      const k: number = wrap(
        Math.round((list[i + 2]! + Math.PI) / dTheta),
        SECTORS,
      );
      sum[j * SECTORS + k]! += list[i + 1]!;
      count[j * SECTORS + k]! += 1;
    }
  const sampled: number[][] = [];
  for (let j: number = 0; j < rows; ++j) {
    const row: number[] = [];
    for (let k: number = 0; k < SECTORS; ++k) {
      const n: number = count[j * SECTORS + k]!;
      row.push(n > 0 ? sum[j * SECTORS + k]! / n : NaN);
    }
    sampled.push(fillCircular(row));
  }
  for (let j: number = 0; j < rows; ++j)
    if (Number.isNaN(sampled[j]![0]!))
      for (let d: number = 1; d < rows; ++d) {
        const near: number[] | undefined = [
          sampled[j - d],
          sampled[j + d],
        ].find(
          (r: number[] | undefined): boolean =>
            r !== undefined && !Number.isNaN(r[0]!),
        );
        if (near !== undefined) {
          sampled[j] = near;
          break;
        }
      }
  const radius: Float64Array = new Float64Array(rows * SECTORS);
  for (let j: number = 0; j < rows; ++j)
    for (let k: number = 0; k < SECTORS; ++k) {
      let s: number = 0;
      let n: number = 0;
      for (let dj: number = -1; dj <= 1; ++dj) {
        const row: number[] | undefined = sampled[j + dj];
        if (row === undefined) continue;
        for (let dk: number = -1; dk <= 1; ++dk) {
          s += row[wrap(k + dk, SECTORS)]!;
          n += 1;
        }
      }
      radius[j * SECTORS + k] = s / n;
    }

  // Node positions over the extended columns.
  const C: number = SECTORS + OVERLAP + 1;
  const X: Vec3[] = new Array(rows * C);
  for (let j: number = 0; j < rows; ++j)
    for (let k: number = 0; k < C; ++k)
      X[j * C + k] = axis.point(
        lo + j * step,
        -Math.PI + k * dTheta,
        radius[j * SECTORS + (k % SECTORS)]!,
      );

  // Node frames: section direction e1 and the in-surface direction e2
  // perpendicular to it toward increasing station; NaN where degenerate.
  const frame: Float64Array = new Float64Array(rows * C * 6).fill(NaN);
  for (let j: number = 0; j < rows; ++j)
    for (let k: number = 0; k < C; ++k) {
      const along: Vec3 = V.sub(
        X[j * C + Math.min(C - 1, k + 1)]!,
        X[j * C + Math.max(0, k - 1)]!,
      );
      const up: Vec3 = V.sub(
        X[Math.min(rows - 1, j + 1) * C + k]!,
        X[Math.max(0, j - 1) * C + k]!,
      );
      const normal: Vec3 = V.cross(along, up);
      if (V.norm(along) < 1e-6 || V.norm(normal) < 1e-9) continue;
      const e1: Vec3 = V.normalize(along);
      const e2: Vec3 = V.normalize(V.cross(normal, e1));
      frame.set([...e1, ...e2], (j * C + k) * 6);
    }

  // Initial coordinates: the unrolled cylinder, section arc length from the
  // front reference and the mean meridian.
  const uv: Float64Array = new Float64Array(rows * C * 2);
  const front: number = SECTORS / 2;
  const meanRadius: number[] = [];
  for (let j: number = 0; j < rows; ++j) {
    let s: number = 0;
    for (let k: number = 0; k < SECTORS; ++k) s += radius[j * SECTORS + k]!;
    meanRadius.push(s / SECTORS);
  }
  let meridian: number = 0;
  for (let j: number = 0; j < rows; ++j) {
    if (j > 0)
      meridian += Math.hypot(step, meanRadius[j]! - meanRadius[j - 1]!);
    let arc: number = 0;
    for (let k: number = front; k < C; ++k) {
      if (k > front) arc += V.norm(V.sub(X[j * C + k]!, X[j * C + k - 1]!));
      uv[(j * C + k) * 2] = arc;
      uv[(j * C + k) * 2 + 1] = meridian;
    }
    arc = 0;
    for (let k: number = front - 1; k >= 0; --k) {
      arc -= V.norm(V.sub(X[j * C + k + 1]!, X[j * C + k]!));
      uv[(j * C + k) * 2] = arc;
      uv[(j * C + k) * 2 + 1] = meridian;
    }
  }

  // Edge targets: the edge vector in the mean frame of its two nodes, NaN
  // where neither node has a frame. Horizontal edges join a node to its
  // next sector, vertical edges to its next row.
  const N: number = rows * C;
  const hu: Float64Array = new Float64Array(N).fill(NaN);
  const hv: Float64Array = new Float64Array(N).fill(NaN);
  const vu: Float64Array = new Float64Array(N).fill(NaN);
  const vv: Float64Array = new Float64Array(N).fill(NaN);
  const target: (a: number, b: number) => [number, number] | null = (
    a: number,
    b: number,
  ): [number, number] | null => {
    const okA: boolean = !Number.isNaN(frame[a * 6]!);
    const okB: boolean = !Number.isNaN(frame[b * 6]!);
    if (!okA && !okB) return null;
    const pick: (o: number) => Vec3 = (o: number): Vec3 => {
      const sum: Vec3 = [0, 0, 0];
      for (const node of okA && okB ? [a, b] : okA ? [a] : [b])
        for (let c: number = 0; c < 3; ++c) sum[c] += frame[node * 6 + o + c]!;
      return sum;
    };
    const e1: Vec3 = V.normalize(pick(0));
    const raw: Vec3 = pick(3);
    const e2: Vec3 = V.normalize(V.sub(raw, V.scale(e1, V.dot(raw, e1))));
    const d: Vec3 = V.sub(X[b]!, X[a]!);
    return [V.dot(d, e1), V.dot(d, e2)];
  };
  for (let j: number = 0; j < rows; ++j)
    for (let k: number = 0; k < C; ++k) {
      const node: number = j * C + k;
      const h: [number, number] | null =
        k + 1 < C ? target(node, node + 1) : null;
      if (h !== null) {
        hu[node] = h[0];
        hv[node] = h[1];
      }
      const v: [number, number] | null =
        j + 1 < rows ? target(node, node + C) : null;
      if (v !== null) {
        vu[node] = v[0];
        vv[node] = v[1];
      }
    }

  // Successive over-relaxation of the least-squares edge equations: each
  // node moves toward the mean of what its incident edges ask of it.
  for (let sweep: number = 0; sweep < SWEEPS; ++sweep)
    for (let node: number = 0; node < N; ++node) {
      const k: number = node % C;
      let su: number = 0;
      let sv: number = 0;
      let n: number = 0;
      if (!Number.isNaN(hu[node]!)) {
        su += uv[(node + 1) * 2]! - hu[node]!;
        sv += uv[(node + 1) * 2 + 1]! - hv[node]!;
        ++n;
      }
      if (k > 0 && !Number.isNaN(hu[node - 1]!)) {
        su += uv[(node - 1) * 2]! + hu[node - 1]!;
        sv += uv[(node - 1) * 2 + 1]! + hv[node - 1]!;
        ++n;
      }
      if (!Number.isNaN(vu[node]!)) {
        su += uv[(node + C) * 2]! - vu[node]!;
        sv += uv[(node + C) * 2 + 1]! - vv[node]!;
        ++n;
      }
      if (node >= C && !Number.isNaN(vu[node - C]!)) {
        su += uv[(node - C) * 2]! + vu[node - C]!;
        sv += uv[(node - C) * 2 + 1]! + vv[node - C]!;
        ++n;
      }
      if (n === 0) continue;
      uv[node * 2] = uv[node * 2]! + OMEGA * (su / n - uv[node * 2]!);
      uv[node * 2 + 1] =
        uv[node * 2 + 1]! + OMEGA * (sv / n - uv[node * 2 + 1]!);
    }

  // Gauge: the front node of the middle row keeps its initial coordinates.
  const anchor: number = (Math.floor(rows / 2) * C + front) * 2;
  const shiftU: number = uv[anchor]!;
  for (let i: number = 0; i < uv.length; i += 2) uv[i] = uv[i]! - shiftU;
  return {
    lo,
    step,
    rows,
    sectors: SECTORS,
    overlap: OVERLAP,
    radius,
    uv,
    frame,
  };
}

/**
 * Coordinates of one piece, duplicating vertices of triangles that cross the
 * chart's cut.
 *
 * @param axis The chart's axis
 * @param grid The flattened grid
 * @param piece The piece
 * @returns The piece with coordinates
 */
function unroll(
  axis: IAxis,
  grid: IGrid,
  piece: AutoMovieHumanSkinChart.IPiece,
): AutoMovieHumanSkinChart.IOutput {
  const band: number = bandOf(piece.name);
  const positions: number[] = [...piece.positions];
  const normals: number[] = [...piece.normals];
  const uvs: number[] = [];
  const cylinder: Array<[number, number, number]> = [];
  const count: number = piece.positions.length / 3;
  for (let i: number = 0; i < count; ++i) {
    const c: [number, number, number] = axis.locate(
      V.at(piece.positions, i),
      band,
    );
    cylinder.push(c);
    uvs.push(...evaluate(axis, grid, c[0], c[1], c[2]));
  }

  // A triangle whose angles span more than half a turn crosses the cut at
  // the back; its vertices on the negative side take copies evaluated one
  // turn later, on the grid's continuation past the cut.
  const copies: Map<number, number> = new Map();
  const indices: number[] = [...piece.indices];
  for (let t: number = 0; t < indices.length; t += 3) {
    const a: number = cylinder[indices[t]!]![2];
    const b: number = cylinder[indices[t + 1]!]![2];
    const c: number = cylinder[indices[t + 2]!]![2];
    if (Math.max(a, b, c) - Math.min(a, b, c) <= Math.PI) continue;
    for (let e: number = 0; e < 3; ++e) {
      const v: number = indices[t + e]!;
      const at: [number, number, number] = cylinder[v]!;
      if (at[2] >= 0) continue;
      let copy: number | undefined = copies.get(v);
      if (copy === undefined) {
        copy = positions.length / 3;
        copies.set(v, copy);
        positions.push(...V.at(piece.positions, v));
        normals.push(...V.at(piece.normals, v));
        uvs.push(...evaluate(axis, grid, at[0], at[1], at[2] + 2 * Math.PI));
      }
      indices[t + e] = copy;
    }
  }
  return { name: piece.name, positions, normals, indices, uvs };
}

/**
 * Coordinates of a point given in cylindrical coordinates: bilinear grid
 * coordinates plus the radial offset from the sampled surface in the
 * nearest node's frame.
 *
 * @param axis The chart's axis
 * @param grid The flattened grid
 * @param s Station in mm
 * @param rho Radius in mm
 * @param theta Angle, up to the grid's overlap past `+pi`
 * @returns `[u, v]` in mm
 */
function evaluate(
  axis: IAxis,
  grid: IGrid,
  s: number,
  rho: number,
  theta: number,
): [number, number] {
  const SECTORS: number = grid.sectors;
  const C: number = SECTORS + grid.overlap + 1;
  const gx: number = Math.min(
    C - 1,
    Math.max(0, ((theta + Math.PI) / (2 * Math.PI)) * SECTORS),
  );
  const gy: number = Math.min(
    grid.rows - 1,
    Math.max(0, (s - grid.lo) / grid.step),
  );
  const k: number = Math.min(C - 2, Math.floor(gx));
  const j: number = Math.min(grid.rows - 2, Math.floor(gy));
  const fx: number = gx - k;
  const fy: number = gy - j;
  const w: number[] = [
    (1 - fx) * (1 - fy),
    fx * (1 - fy),
    (1 - fx) * fy,
    fx * fy,
  ];
  const nodes: number[] = [
    j * C + k,
    j * C + k + 1,
    (j + 1) * C + k,
    (j + 1) * C + k + 1,
  ];
  let u: number = 0;
  let v: number = 0;
  let r: number = 0;
  nodes.forEach((node: number, i: number): void => {
    u += w[i]! * grid.uv[node * 2]!;
    v += w[i]! * grid.uv[node * 2 + 1]!;
    const row: number = Math.floor(node / C);
    r += w[i]! * grid.radius[row * SECTORS + ((node % C) % SECTORS)]!;
  });

  // Radial offset from the sampled sheet, resolved in the nearest valid frame.
  const offset: number = rho - r;
  if (Math.abs(offset) > 1e-6) {
    let node: number = -1;
    let weight: number = -1;
    nodes.forEach((n: number, i: number): void => {
      if (!Number.isNaN(grid.frame[n * 6]!) && w[i]! > weight) {
        node = n;
        weight = w[i]!;
      }
    });
    if (node !== -1) {
      const radial: Vec3 = V.sub(
        axis.point(s, theta, 1),
        axis.point(s, theta, 0),
      );
      const f: Float64Array = grid.frame.subarray(node * 6, node * 6 + 6);
      u += offset * (radial[0] * f[0]! + radial[1] * f[1]! + radial[2] * f[2]!);
      v += offset * (radial[0] * f[3]! + radial[1] * f[4]! + radial[2] * f[5]!);
    }
  }
  return [u, v];
}

/**
 * Non-negative remainder.
 *
 * @param i Integer
 * @param n Positive modulus
 * @returns `i mod n` in `[0, n)`
 */
function wrap(i: number, n: number): number {
  return ((i % n) + n) % n;
}

/**
 * Linear fill of NaN gaps in a sequence, holding the ends.
 *
 * @param values Sequence with gaps
 * @returns Filled copy; all NaN becomes zeros
 */
function fill(values: readonly number[]): number[] {
  const out: number[] = [...values];
  const known: number[] = [];
  out.forEach((v: number, i: number): void => {
    if (!Number.isNaN(v)) known.push(i);
  });
  if (known.length === 0) return out.map((): number => 0);
  let k: number = 0;
  for (let i: number = 0; i < out.length; ++i) {
    if (!Number.isNaN(out[i]!)) continue;
    while (k < known.length && known[k]! < i) ++k;
    if (k === 0) out[i] = values[known[0]!]!;
    else if (k === known.length) out[i] = values[known[known.length - 1]!]!;
    else {
      const a: number = known[k - 1]!;
      const b: number = known[k]!;
      out[i] = values[a]! + ((values[b]! - values[a]!) * (i - a)) / (b - a);
    }
  }
  return out;
}

/**
 * Circular linear fill of NaN gaps.
 *
 * @param values Circular sequence with gaps
 * @returns Filled copy; an all-NaN sequence stays NaN
 */
function fillCircular(values: readonly number[]): number[] {
  const n: number = values.length;
  const out: number[] = [...values];
  const known: number[] = [];
  out.forEach((v: number, i: number): void => {
    if (!Number.isNaN(v)) known.push(i);
  });
  if (known.length === 0) return out;

  // Each gap lies between consecutive known entries, the last gap wrapping
  // from the last known entry to the first one a turn later.
  for (let k: number = 0; k < known.length; ++k) {
    const a: number = known[k]!;
    const b: number = k + 1 < known.length ? known[k + 1]! : known[0]! + n;
    for (let i: number = a + 1; i < b; ++i)
      out[i % n] =
        values[a]! + ((values[b % n]! - values[a]!) * (i - a)) / (b - a);
  }
  return out;
}

/**
 * Moving average with a half-width, holding the ends.
 *
 * @param values Sequence
 * @param half Half-width in samples
 * @returns Smoothed copy
 */
function smooth(values: readonly number[], half: number): number[] {
  return values.map((_: number, i: number): number => {
    let s: number = 0;
    let n: number = 0;
    for (let k: number = -half; k <= half; ++k) {
      s += values[Math.min(values.length - 1, Math.max(0, i + k))]!;
      n += 1;
    }
    return s / n;
  });
}

/**
 * Root-mean-square distance of a chain's vertices from their band centroids.
 *
 * @param pieces One chain's pieces
 * @returns Typical radius in mm
 */
function spread(pieces: readonly AutoMovieHumanSkinChart.IPiece[]): number {
  let sum: number = 0;
  let count: number = 0;
  for (const piece of pieces) {
    const c: Vec3 = V.centroid(piece.positions);
    for (let i: number = 0; i < piece.positions.length / 3; ++i) {
      const d: Vec3 = V.sub(V.at(piece.positions, i), c);
      sum += V.dot(d, d);
      count += 1;
    }
  }
  return Math.sqrt(sum / Math.max(1, count));
}

/**
 * Direction the vertex normals of some pieces are most nearly perpendicular
 * to: the eigenvector of the least eigenvalue of their scatter matrix, by
 * power iteration on its complement.
 *
 * @param pieces Pieces
 * @returns Unit direction
 */
function leastNormal(pieces: readonly AutoMovieHumanSkinChart.IPiece[]): Vec3 {
  const m: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const piece of pieces)
    for (let i: number = 0; i < piece.normals.length / 3; ++i) {
      const n: Vec3 = V.at(piece.normals, i);
      for (let a: number = 0; a < 3; ++a)
        for (let b: number = 0; b < 3; ++b) m[a * 3 + b]! += n[a]! * n[b]!;
    }
  const trace: number = m[0]! + m[4]! + m[8]!;
  let v: Vec3 = [0.577, 0.577, 0.577];
  for (let k: number = 0; k < 64; ++k) {
    const w: Vec3 = [
      trace * v[0] - (m[0]! * v[0] + m[1]! * v[1] + m[2]! * v[2]),
      trace * v[1] - (m[3]! * v[0] + m[4]! * v[1] + m[5]! * v[2]),
      trace * v[2] - (m[6]! * v[0] + m[7]! * v[1] + m[8]! * v[2]),
    ];
    if (V.norm(w) < 1e-12) return [0, 1, 0];
    v = V.normalize(w);
  }
  return v;
}

/**
 * Any unit vector perpendicular to a unit vector.
 *
 * @param t Unit vector
 * @returns Perpendicular unit vector
 */
function perpendicular(t: Vec3): Vec3 {
  const other: Vec3 = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  return V.normalize(V.cross(t, other));
}
