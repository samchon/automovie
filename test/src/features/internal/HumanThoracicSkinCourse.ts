import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";

/** Independently intersect emitted triangles with a declared material/lateral course. */
export namespace HumanThoracicSkinCourse {
  /** World coordinates in calibration millimetres. */
  export type V = [number, number, number];
  /** A declared course endpoint, independent of its circumference target. */
  export interface IAddress {
    /** Column material coordinate, not physical Y on a lifted surface. */
    station: number;
    /** World lateral coordinate in the registered model frame, mm. */
    lateral: number;
  }
  /** Every actually intersected skin point and its triangle witness. */
  export interface IReading {
    /** Open three-dimensional polyline length in millimetres. */
    length: number;
    /** Full points, never a hull or a repaired missing crossing. */
    points: V[];
    /** Original triangle-index-buffer offset for every point. */
    triangles: number[];
    /** Actual sampling pitch in material millimetres. */
    pitch: number;
  }
  /** A physical triangle and the generating material coordinate of each vertex. */
  interface IFace {
    /** Actual world vertices. */
    points: V[];
    /** Material stations published with those same vertices. */
    stations: number[];
    /** Original triangle-index-buffer offset. */
    offset: number;
  }

  /**
   * Read actual emitted skin without the source reader or loft evaluator.
   * Each query intersects a triangle first at its interpolated material
   * station and then at its physical lateral coordinate. All anterior
   * candidates are retained before choosing the maximum physical X.
   * Source material coordinates locate the declared course only; physical
   * points and length come exclusively from the emitted triangle buffers.
   * Sampling is at most one material mm, including every selected source
   * vertex station. This is not clinical registration or a continuous
   * integration bound. Missing crossings and invalid relevant faces fail.
   */
  export function read(skin: Surface.IOutput, owners: ReadonlySet<string>, from: IAddress, to: IAddress, guides: readonly IAddress[] = [from, to]): IReading {
    if (![from.station, from.lateral, to.station, to.lateral].every(Number.isFinite) || from.station === to.station)
      throw new Error("A skin course needs distinct finite material stations and finite lateral endpoints");
    if (guides.length < 2 || guides.some((guide: IAddress, index: number): boolean => !Number.isFinite(guide.station) || !Number.isFinite(guide.lateral) || index > 0 && (guide.station - guides[index - 1]!.station) * (to.station - from.station) <= 0) || Math.abs(guides[0]!.station - from.station) > ROUND || Math.abs(guides.at(-1)!.station - to.station) > ROUND || Math.abs(guides[0]!.lateral - from.lateral) > ROUND || Math.abs(guides.at(-1)!.lateral - to.lateral) > ROUND)
      throw new Error("A skin course needs an ordered finite surface guide with the declared endpoints");
    const bottom: number = Math.min(from.station, to.station);
    const top: number = Math.max(from.station, to.station);
    const faces: IFace[] = [];
    const keys: Set<number> = new Set(guides.map((guide: IAddress): number => guide.station));
    for (let group: number = 0; group < skin.mesh.groups.length; group++) {
      const current: typeof skin.mesh.groups[number] = skin.mesh.groups[group]!;
      if (!owners.has(current.name.slice(0, current.name.lastIndexOf("/")))) continue;
      const end: number = skin.mesh.groups[group + 1]?.start ?? skin.mesh.indices.length;
      for (let offset: number = current.start; offset < end; offset += 3) {
        const vertices: number[] = skin.mesh.indices.slice(offset, offset + 3);
        const stations: number[] = vertices.map((vertex: number): number => skin.coordinates[3 * vertex + 1]!);
        if (!stations.every(Number.isFinite)) throw new Error("A selected skin course face has unavailable material coordinates at triangle " + offset.toString());
        if (Math.max(...stations) < bottom || Math.min(...stations) > top) continue;
        const points: V[] = vertices.map((vertex: number): V => skin.mesh.positions.slice(3 * vertex, 3 * vertex + 3) as V);
        if (points.some((point: V): boolean => point.length !== 3 || !point.every(Number.isFinite))) throw new Error("A selected skin course face has nonfinite physical coordinates at triangle " + offset.toString());
        const a: V = points[1]!.map((value: number, axis: number): number => value - points[0]![axis]!) as V;
        const b: V = points[2]!.map((value: number, axis: number): number => value - points[0]![axis]!) as V;
        const area: number = Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]);
        if (!(area > 0) || !Number.isFinite(area)) throw new Error("A selected skin course face is physically degenerate at triangle " + offset.toString());
        faces.push({ points, stations, offset });
        for (const station of stations) if (station >= bottom && station <= top) keys.add(station);
      }
    }
    if (faces.length === 0) throw new Error("A skin course has no selected physical faces");
    const buckets: Map<number, IFace[]> = new Map();
    for (const face of faces) {
      const low: number = Math.floor(Math.max(bottom, Math.min(...face.stations)));
      const high: number = Math.floor(Math.min(top, Math.max(...face.stations)));
      for (let bucket: number = low; bucket <= high; bucket++) {
        const owned: IFace[] = buckets.get(bucket) ?? [];
        owned.push(face); buckets.set(bucket, owned);
      }
    }
    const count: number = Math.ceil(top - bottom);
    for (let index: number = 0; index <= count; index++) keys.add(from.station + index * (to.station - from.station) / count);
    const stations: number[] = [...keys].sort((a: number, b: number): number => (a - b) * Math.sign(to.station - from.station));
    const points: V[] = [];
    const triangles: number[] = [];
    for (const station of stations) {
      const end: number = Math.max(1, guides.findIndex((guide: IAddress): boolean => (guide.station - station) * (to.station - from.station) >= 0));
      const a: IAddress = guides[end - 1]!;
      const b: IAddress = guides[end]!;
      const fraction: number = (station - a.station) / (b.station - a.station);
      const lateral: number = a.lateral + fraction * (b.lateral - a.lateral);
      const candidates: { point: V; triangle: number }[] = [];
      for (const face of buckets.get(Math.floor(station)) ?? []) {
        if (station < Math.min(...face.stations) - ROUND || station > Math.max(...face.stations) + ROUND) continue;
        const cut: V[] = intersection(face.points, face.stations, station);
        if (cut.length === 0) continue;
        for (const point of intersection(cut, cut.map((value: V): number => value[2]), lateral)) candidates.push({ point, triangle: face.offset });
      }
      if (candidates.length === 0) throw new Error("A skin course lacks a physical crossing: " + JSON.stringify({ station, lateral, units: "mm" }));
      const anterior: typeof candidates[number] = candidates.reduce((a: typeof candidates[number], b: typeof candidates[number]): typeof candidates[number] => a.point[0] >= b.point[0] ? a : b);
      points.push(anterior.point); triangles.push(anterior.triangle);
    }
    const length: number = points.reduce((sum: number, point: V, index: number): number => index === 0 ? sum : sum + Math.hypot(...point.map((value: number, axis: number): number => value - points[index - 1]![axis]!)), 0);
    if (!(length > 0) || !Number.isFinite(length)) throw new Error("A skin course has no finite positive physical length");
    return { length, points, triangles, pitch: Math.max(...stations.slice(1).map((station: number, index: number): number => Math.abs(station - stations[index]!))) };
  }

  /** Intersect every polygon edge, also admitting an edge contained in the query plane. */
  function intersection(points: readonly V[], values: readonly number[], target: number): V[] {
    const found: V[] = [];
    for (let index: number = 0; index < points.length; index++) {
      const next: number = (index + 1) % points.length;
      const a: number = values[index]! - target;
      const b: number = values[next]! - target;
      if (Math.abs(a) <= ROUND) found.push(points[index]!);
      if ((a < -ROUND && b > ROUND) || (a > ROUND && b < -ROUND)) {
        const unit: number = a / (a - b);
        found.push(points[index]!.map((value: number, axis: number): number => value + unit * (points[next]![axis]! - value)) as V);
      }
    }
    return found;
  }
}

/** Arithmetic boundary allowance in millimetres, unrelated to anatomy tolerance. */
const ROUND: number = 1e-8;
