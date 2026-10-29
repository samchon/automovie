import { AutoMovieHumanNailClosure } from "./AutoMovieHumanNailClosure";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanNailFrame } from "./IAutoMovieHumanNailFrame";

/** Closed nail plates sampled from the actual generated distal skin. */
export namespace AutoMovieHumanNailPlate {
  /** Point or direction in mm. */
  type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** Vector arithmetic. */
  const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

  /** Plate height above the skin in mm. */
  const THICKNESS: number = 0.45;

  /** Grid of one plate: samples along the digit and around it. */
  const ALONG: number = 14;

  /** Samples around the digit. */
  const AROUND: number = 11;

  /** Plate mesh in mm. */
  export interface IOutput {
    /** Flat positions in mm. */
    positions: number[];

    /** Flat unit normals. */
    normals: number[];

    /** Flat normalized coordinates: u across, v from cuticle to free edge. */
    uvs: number[];

    /** Triangle indices. */
    indices: number[];
  }

  /**
   * Plate of one nail: rays from the digit axis meet its triangles.
   *
   * @param list The digit chain's pieces
   * @param digit The digit's frame
   * @param kind Finger, thumb or toe
   * @returns The plate mesh
   */
  export function generate(
    list: readonly AutoMovieHumanSkinChart.IOutput[],
    digit: IAutoMovieHumanNailFrame,
    kind: "finger" | "thumb" | "toe",
  ): IOutput {
    const toe: boolean = kind === "toe";
    const r: number = digit.radius;
    const distal: number = digit.tip - (toe ? 0.45 : 0.35) * r;
    const length: number = (toe ? 1.25 : 1.6) * r;
    const halfAngle: number = toe ? 0.68 : 0.7;
    const side: Vec3 = V.cross(digit.axis, digit.dorsal);
    const out: IOutput = { positions: [], normals: [], uvs: [], indices: [] };

    // A straight local axis fitted through the section centroids of the
    // rows, so the plate does not jump where a window gains or loses vertices.
    const stations: number[] = [];
    const centres: Vec3[] = [];
    for (let i: number = 0; i < ALONG; ++i) {
      stations.push(distal - length * (1 - i / (ALONG - 1)));
      centres.push(section(list, digit, stations[i]!));
    }
    const line: (station: number) => Vec3 = fitLine(stations, centres);

    // Per row: ray hits around the nail, a quadratic across the nail through
    // the trusted hits (within 35 percent of the row median), then the whole
    // row pushed out by its largest positive residual so the smooth plate
    // never dips under a facet.
    const grid: Vec3[] = [];
    const directions: Vec3[] = [];
    const bed: number[] = [];
    const bedNormals: number[] = [];
    const coordinates: number[] = [];
    for (let i: number = 0; i < ALONG; ++i) {
      const ts: number[] = [];
      const ds: number[] = [];
      const rowDirections: Vec3[] = [];
      for (let j: number = 0; j < AROUND; ++j) {
        // The geometric boundary is the image's actual nail outline. Its
        // cuticle and free-edge arcs are not an alpha cut through a detached
        // rectangular sheet, so the physical side wall has the same boundary.
        const t: number = 0.88 * (-1 + (2 * j) / (AROUND - 1));
        const proximal: number = 0.04 + 0.2 * t * t;
        const free: number = 0.99 - 0.16 * Math.abs(t) ** 2.5;
        const v: number = proximal + ((free - proximal) * i) / (ALONG - 1);
        const origin: Vec3 = line(distal - length * (1 - v));
        const phi: number = t * halfAngle;
        const direction: Vec3 = V.add(
          V.scale(digit.dorsal, Math.cos(phi)),
          V.scale(side, Math.sin(phi)),
        );
        const hit: [Vec3, Vec3] | null = cast(list, origin, direction);
        if (hit === null)
          throw failure(list, digit, kind, i, j, t, v,
            distal - length * (1 - v), origin, direction);
        bed.push(...hit[0]);
        bedNormals.push(...hit[1]);
        coordinates.push((t + 1) / 2, v);
        rowDirections.push(direction);
        ts.push(t);
        ds.push(V.norm(V.sub(hit[0], origin)));
      }
      const known: number[] = ds
        .filter((d: number): boolean => !Number.isNaN(d))
        .sort((a: number, b: number): number => a - b);
      const median: number =
        known.length === 0 ? r : known[Math.floor(known.length / 2)]!;
      const trusted: boolean[] = ds.map(
        (d: number): boolean =>
          !Number.isNaN(d) && Math.abs(d - median) <= 0.35 * median,
      );
      const fit: (t: number) => number = fitQuadratic(ts, ds, trusted, median);
      let lift: number = 0;
      ds.forEach((d: number, j: number): void => {
        if (trusted[j]) lift = Math.max(lift, d - fit(ts[j]!));
      });
      for (let j: number = 0; j < AROUND; ++j) {
        const v: number = coordinates[2 * (i * AROUND + j) + 1]!;
        const origin: Vec3 = line(distal - length * (1 - v));
        // A plate enters the proximal and lateral skin folds instead of
        // exposing a vertical box wall around its entire perimeter. The
        // physical 0.8 mm seating band has zero thickness and zero thickness
        // derivative at those three contact edges. Only the distal edge
        // retains a free plate thickness; these are shared anatomical
        // conventions, independent of a person's identity.
        const proximalDistance: number = (i / (ALONG - 1)) * length;
        const lateralDistance: number =
          (Math.min(j, AROUND - 1 - j) * (1.76 * halfAngle * r)) / (AROUND - 1);
        const seating: number = V.smooth(
          Math.min(proximalDistance, lateralDistance) / 0.8,
        );
        const depth: number =
          ds[j]! + seating * (fit(ts[j]!) + lift + THICKNESS - ds[j]!);
        grid.push(V.add(origin, V.scale(rowDirections[j]!, depth)));
        directions.push(rowDirections[j]!);
      }
    }

    // Normals of the smooth plate, outward along the rays.
    for (let i: number = 0; i < ALONG; ++i)
      for (let j: number = 0; j < AROUND; ++j) {
        const at: (a: number, b: number) => Vec3 = (
          a: number,
          b: number,
        ): Vec3 =>
          grid[
            Math.min(ALONG - 1, Math.max(0, a)) * AROUND +
              Math.min(AROUND - 1, Math.max(0, b))
          ]!;
        const along: Vec3 = V.sub(at(i + 1, j), at(i - 1, j));
        const around: Vec3 = V.sub(at(i, j + 1), at(i, j - 1));
        let normal: Vec3 = V.normalize(V.cross(along, around));
        if (V.dot(normal, directions[i * AROUND + j]!) < 0)
          normal = V.scale(normal, -1);
        if (i === 0 || j === 0 || j === AROUND - 1)
          normal = V.at(bedNormals, i * AROUND + j);
        out.positions.push(...grid[i * AROUND + j]!);
        out.normals.push(...normal);
        out.uvs.push(
          coordinates[2 * (i * AROUND + j)]!,
          coordinates[2 * (i * AROUND + j) + 1]!,
        );
      }

    // Counter-clockwise seen from outside: along the axis then around it
    // turns inward, so each quad is wound around-then-along.
    for (let i: number = 0; i + 1 < ALONG; ++i)
      for (let j: number = 0; j + 1 < AROUND; ++j) {
        const a: number = i * AROUND + j;
        const b: number = a + 1;
        const c: number = a + AROUND;
        const d: number = c + 1;
        out.indices.push(a, b, c, c, b, d);
      }
    AutoMovieHumanNailClosure.append(out, bed, ALONG, AROUND);
    return out;
  }

  /** Preserve the first missed ray without changing the failed generation.
   *
   * Only this failure path scans the affected digit. Names are bounded leaves,
   * and geometry is summarized by scalar counts and bounds, never mesh data.
   * The worker transports Error.message, so the existing error's first line
   * is followed by one selected JSON record. Successful plates do no new work.
   */
  function failure(
    list: readonly AutoMovieHumanSkinChart.IOutput[],
    digit: IAutoMovieHumanNailFrame,
    kind: "finger" | "thumb" | "toe",
    row: number,
    column: number,
    t: number,
    v: number,
    station: number,
    origin: Vec3,
    direction: Vec3,
  ): Error {
    let vertexCount: number = 0;
    let triangleCount: number = 0;
    let finiteVertices: number = 0;
    let nonfiniteVertices: number = 0;
    let nonfiniteNormals: number = 0;
    let invalidIndices: number = 0;
    let finiteAxisProjections: number = 0;
    const lo: Vec3 = [Infinity, Infinity, Infinity];
    const hi: Vec3 = [-Infinity, -Infinity, -Infinity];
    let axisLo: number = Infinity;
    let axisHi: number = -Infinity;
    for (const piece of list) {
      const count: number = piece.positions.length / 3;
      vertexCount += count;
      triangleCount += piece.indices.length / 3;
      for (let i: number = 0; i < count; i++) {
        const p: Vec3 = V.at(piece.positions, i);
        if (p.every(Number.isFinite)) {
          finiteVertices++;
          for (let k: number = 0; k < 3; k++) {
            lo[k] = Math.min(lo[k]!, p[k]!);
            hi[k] = Math.max(hi[k]!, p[k]!);
          }
          const axial: number = V.dot(V.sub(p, digit.origin), digit.axis);
          if (Number.isFinite(axial)) {
            finiteAxisProjections++;
            axisLo = Math.min(axisLo, axial);
            axisHi = Math.max(axisHi, axial);
          }
        } else nonfiniteVertices++;
        if (!V.at(piece.normals, i).every(Number.isFinite)) nonfiniteNormals++;
      }
      for (const index of piece.indices)
        if (!Number.isInteger(index) || index < 0 || index >= count) invalidIndices++;
    }
    const first: string = list[0]?.name ?? "";
    const context: string = JSON.stringify({
      schema: "human.nail.failure.v1",
      chain: first.slice(0, first.lastIndexOf("/")).slice(0, 128),
      kind, row, column, t, v, station,
      ray: { origin, direction, finite: [...origin, ...direction].every(Number.isFinite) },
      frame: { origin: digit.origin, axis: digit.axis, dorsal: digit.dorsal,
        tip: digit.tip, radius: digit.radius,
        finite: [...digit.origin, ...digit.axis, ...digit.dorsal, digit.tip, digit.radius].every(Number.isFinite) },
      geometry: { pieceCount: list.length, vertexCount, triangleCount,
        finiteVertices, nonfiniteVertices, nonfiniteNormals, invalidIndices,
        finiteAxisProjections,
        bounds: finiteVertices === 0 ? null : { min: lo, max: hi },
        axisRange: finiteAxisProjections === 0 ? null : [axisLo, axisHi],
        firstPiece: first.slice(0, 128),
        lastPiece: (list[list.length - 1]?.name ?? "").slice(0, 128) },
    });
    return new Error("Nail outline lacks generated digit skin\nhuman.nail.failure=" + context);
  }

  /**
   * Least-squares line through points given at stations.
   *
   * @param stations Stations in mm
   * @param points Points at the stations
   * @returns Point on the fitted line at a station
   */
  function fitLine(
    stations: readonly number[],
    points: readonly Vec3[],
  ): (station: number) => Vec3 {
    const n: number = stations.length;
    const ms: number =
      stations.reduce((a: number, b: number): number => a + b, 0) / n;
    const mp: Vec3 = V.scale(
      points.reduce((a: Vec3, b: Vec3): Vec3 => V.add(a, b), [0, 0, 0]),
      1 / n,
    );
    let ss: number = 0;
    let slope: Vec3 = [0, 0, 0];
    stations.forEach((s: number, i: number): void => {
      ss += (s - ms) ** 2;
      slope = V.add(slope, V.scale(V.sub(points[i]!, mp), s - ms));
    });
    const b: Vec3 = ss > 0 ? V.scale(slope, 1 / ss) : [0, 0, 0];
    return (station: number): Vec3 => V.add(mp, V.scale(b, station - ms));
  }

  /**
   * Least-squares quadratic through the trusted samples of a row; with fewer
   * than three, a constant.
   *
   * @param ts Sample positions across the nail in `[-1, 1]`
   * @param ds Sample distances, NaN where missing
   * @param trusted Which samples to fit
   * @param fallback Constant used without trusted samples
   * @returns Fitted distance at a position
   */
  function fitQuadratic(
    ts: readonly number[],
    ds: readonly number[],
    trusted: readonly boolean[],
    fallback: number,
  ): (t: number) => number {
    // Normal equations of d = c0 + c1 t + c2 t^2.
    const m: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const y: number[] = [0, 0, 0];
    let count: number = 0;
    ts.forEach((t: number, j: number): void => {
      if (!trusted[j]) return;
      const basis: number[] = [1, t, t * t];
      for (let a: number = 0; a < 3; ++a) {
        y[a]! += basis[a]! * ds[j]!;
        for (let b: number = 0; b < 3; ++b)
          m[a * 3 + b]! += basis[a]! * basis[b]!;
      }
      count += 1;
    });
    if (count < 3) {
      const mean: number = count === 0 ? fallback : y[0]! / m[0]!;
      return (): number => mean;
    }
    const c: number[] = solve3(m, y);
    return (t: number): number => c[0]! + c[1]! * t + c[2]! * t * t;
  }

  /**
   * Solve a 3 by 3 linear system by Cramer's rule.
   *
   * @param m Row-major matrix
   * @param y Right-hand side
   * @returns Solution
   */
  function solve3(m: readonly number[], y: readonly number[]): number[] {
    const det: (a: readonly number[]) => number = (
      a: readonly number[],
    ): number =>
      a[0]! * (a[4]! * a[8]! - a[5]! * a[7]!) -
      a[1]! * (a[3]! * a[8]! - a[5]! * a[6]!) +
      a[2]! * (a[3]! * a[7]! - a[4]! * a[6]!);
    const d: number = det(m);
    return [0, 1, 2].map((k: number): number => {
      const a: number[] = [...m];
      for (let r: number = 0; r < 3; ++r) a[r * 3 + k] = y[r]!;
      return Math.abs(d) < 1e-12
        ? k === 0
          ? y[0]! / Math.max(1, m[0]!)
          : 0
        : det(a) / d;
    });
  }

  /**
   * Centroid of the digit's cross-section at a station: the mean of its
   * vertices within a third of a radius (at least 1.2 mm) of the station,
   * widening the window until some are found. Rays start there rather than on
   * the straight axis, which leaves a curled toe or a bent fingertip.
   *
   * @param list The digit chain's pieces
   * @param digit The digit's frame
   * @param station Station along the axis in mm
   * @returns Section centroid
   */
  function section(
    list: readonly AutoMovieHumanSkinChart.IOutput[],
    digit: IAutoMovieHumanNailFrame,
    station: number,
  ): Vec3 {
    for (
      let window: number = Math.max(1.2, digit.radius / 3);
      window < 4 * digit.radius;
      window *= 2
    ) {
      const sum: Vec3 = [0, 0, 0];
      let count: number = 0;
      for (const piece of list)
        for (let i: number = 0; i < piece.positions.length / 3; ++i) {
          const p: Vec3 = V.at(piece.positions, i);
          const s: number = V.dot(V.sub(p, digit.origin), digit.axis);
          if (Math.abs(s - station) > window) continue;
          sum[0] += p[0];
          sum[1] += p[1];
          sum[2] += p[2];
          count += 1;
        }
      if (count >= 3) return V.scale(sum, 1 / count);
    }
    return V.add(digit.origin, V.scale(digit.axis, station));
  }

  /**
   * Nearest forward intersection of a ray with some pieces' triangles
   * (Moller-Trumbore), with the barycentric interpolation of the vertex
   * normals there.
   *
   * @param list Pieces in mm
   * @param origin Ray origin
   * @param direction Unit ray direction
   * @returns Hit point and unit normal, or null
   */
  function cast(
    list: readonly AutoMovieHumanSkinChart.IOutput[],
    origin: Vec3,
    direction: Vec3,
  ): [Vec3, Vec3] | null {
    let best: number = Infinity;
    let result: [Vec3, Vec3] | null = null;
    for (const piece of list)
      for (let t: number = 0; t < piece.indices.length; t += 3) {
        const ia: number = piece.indices[t]!;
        const ib: number = piece.indices[t + 1]!;
        const ic: number = piece.indices[t + 2]!;
        const a: Vec3 = V.at(piece.positions, ia);
        const e1: Vec3 = V.sub(V.at(piece.positions, ib), a);
        const e2: Vec3 = V.sub(V.at(piece.positions, ic), a);
        const p: Vec3 = V.cross(direction, e2);
        const det: number = V.dot(e1, p);
        if (Math.abs(det) < 1e-12) continue;
        const q: Vec3 = V.sub(origin, a);
        const u: number = V.dot(q, p) / det;
        if (u < 0 || u > 1) continue;
        const w: Vec3 = V.cross(q, e1);
        const v: number = V.dot(direction, w) / det;
        if (v < 0 || u + v > 1) continue;
        const distance: number = V.dot(e2, w) / det;
        if (distance <= 0 || distance >= best) continue;
        best = distance;
        const n: Vec3 = V.normalize(
          V.add(
            V.scale(V.at(piece.normals, ia), 1 - u - v),
            V.add(
              V.scale(V.at(piece.normals, ib), u),
              V.scale(V.at(piece.normals, ic), v),
            ),
          ),
        );
        result = [V.add(origin, V.scale(direction, distance)), n];
      }
    return result;
  }
}
