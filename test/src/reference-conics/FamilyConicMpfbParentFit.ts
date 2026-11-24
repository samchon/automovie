import {
  AutoMovieSolidVector as V,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft as Loft } from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  AutoMovieVector2Tuple as Plane,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbDirectedSheet as Sheet } from "./FamilyConicMpfbDirectedSheet";
import { FamilyConicMpfbScalarAtlas as Scalar } from "./FamilyConicMpfbScalarAtlas";
import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import type { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";

/** Measured upper torso charts and their independent source checks. */
export namespace FamilyConicMpfbParentFit {
  /** A section observation at one physical parent rail point. */
  export interface IRailRow {
    position: Point;
    station: number;
    clock: number;
    measured?: { radii?: number[] };
    vertical?: { gap: number; normalUp: number };
  }

  /** World position, normal and local support of an admitted fitted point. */
  export interface IChartPoint {
    position: Point;
    normal: Point;
    observedNormal: Point;
    conditioning: number;
    support: number;
  }

  /** Body course and the held-out seam from the independently generated parent. */
  export interface IInput {
    support: IAutoMovieHumanConicLoft.IFamily;
    stockRail: { rows: IRailRow[] };
  }

  /**
   * Bound a physical chart with two extra lattice cells for the directed
   * source.
   */
  function chartRange(
    domain: readonly Plane[],
    i: 0 | 1,
    pitch: number,
  ): Plane {
    const values: number[] = domain.map((point): number => point[i]);
    return [
      Math.floor(Math.min(...values) / pitch) * pitch - 2 * pitch,
      Math.ceil(Math.max(...values) / pitch) * pitch + 2 * pitch,
    ];
  }

  /** Unoriented angular difference between outward world normals. */
  export function angle(a: Point, b: Point): number {
    return Math.atan2(V.norm(V.cross(a, b)), V.dot(a, b));
  }

  /** Project source chart edges at each end and midpoint before atlas trimming. */
  function projectBoundaries(
    edges: ReturnType<typeof Sheet.prepare>["boundaries"],
    coordinates: (point: Point) => Plane,
  ): Scalar.IBoundary[] {
    return edges.map(({ component, edge: [a, b] }) => {
      const view: Plane[] = [
        coordinates(a),
        coordinates(V.scale(V.add(a, b), 1 / 2)),
        coordinates(b),
      ];
      // Include the campaign's 0.01 mm contact resolution around the projected edge.
      const margin: number = 0.01;
      const range = (i: 0 | 1): Plane => {
        const values: number[] = view.map((p): number => p[i]);
        return [Math.min(...values) - margin, Math.max(...values) + margin];
      };
      return { component, u: range(0), v: range(1) };
    });
  }

  /**
   * Fit the complementary unambiguous flank on its measured horizontal cuts.
   * Scale phase by the measured median reach to use millimetres on both axes.
   */
  export function radialStudy(
    receipt: IInput,
    input: Mpfb.IGeometry,
    source: Subdivision.ISample,
    pitch: number,
  ) {
    const rows = receipt.stockRail.rows;
    const heldOut = rows.filter(
      ({ measured }): boolean => measured?.radii?.length === 1,
    );
    const values: number[] = heldOut
      .map(({ measured }): number => measured!.radii![0]!)
      .sort((a, b): number => a - b);
    const reach: number = values[Math.floor(values.length / 2)]!;
    const axis = Loft.axis(receipt.support);
    const base: number = receipt.support.centres[0]![1];
    const owns = Armscye.divider(Armscye.measure(input)).side;
    const domain: Plane[] = heldOut.map(
      ({ station, clock }): Plane => [station, clock * reach],
    );
    const [s0, s1] = chartRange(domain, 0, pitch);
    const [a0, a1] = chartRange(domain, 1, pitch);
    const sheet = Sheet.prepare(source, (p): Point | null => {
      const s: number = p[1] - base;
      if (s < s0 || s > s1 || p[2] <= 0 || owns(p) > 0) return null;
      const { origin, u, v } = axis.at(s);
      const delta: Point = V.sub(p, origin);
      const phase: number = Math.atan2(V.dot(delta, v), V.dot(delta, u));
      const distance: number = phase * reach;
      if (distance < a0 || distance > a1) return null;
      return V.unit(delta);
    });
    const lane = (s: number): ((phi: number) => Sheet.IHit | null) => {
      const { origin, u, v } = axis.at(s);
      return (phi: number): Sheet.IHit | null =>
        sheet.unique(
          origin,
          V.combine([
            [Math.cos(phi), u],
            [Math.sin(phi), v],
          ]),
        );
    };
    const coordinates = (point: Point): Plane => {
      const station: number = point[1] - base;
      const { origin, u, v } = axis.at(station);
      const delta: Point = V.sub(point, origin);
      return [station, Math.atan2(V.dot(delta, v), V.dot(delta, u)) * reach];
    };
    const atlas = Scalar.prepare({
      domain,
      pitch,
      boundaries: projectBoundaries(sheet.boundaries, coordinates),
      observe: (s: number) => {
        const read = lane(s);
        return (distance: number): Scalar.IObservation | null => {
          const hit: Sheet.IHit | null = read(distance / reach);
          return hit === null
            ? null
            : { component: hit.component, value: hit.distance };
        };
      },
    });
    const at = (point: Point): IChartPoint | null => {
      const [s, z] = coordinates(point);
      if (s < s0 || s > s1 || z < a0 || z > a1) return null;
      const frame = axis.jet?.(s);
      if (frame === null || frame === undefined) return null;
      const c: number = Math.cos(z / reach),
        t: number = Math.sin(z / reach);
      const { origin, u, v } = frame.value;
      const e: Point = V.combine([
        [c, u],
        [t, v],
      ]);
      const hit: Sheet.IHit | null = sheet.unique(origin, e);
      if (
        hit === null ||
        V.norm(V.sub(point, V.add(origin, V.scale(e, hit.distance)))) > 0.01
      )
        return null;
      const sample = atlas.read(s)(z, hit.component);
      if (sample === null) return null;
      const { jet, support } = sample;
      const r: number = jet.p[1];
      const longitudinal: Point = V.combine([
        [1, frame.first.origin],
        [jet.u[1], e],
        [r * c, frame.first.u],
        [r * t, frame.first.v],
      ]);
      const around: Point = V.combine([
        [jet.v[1], e],
        [(-r * t) / reach, u],
        [(r * c) / reach, v],
      ]);
      const n: Point | null = V.unit(V.cross(longitudinal, around));
      if (n === null) return null;
      return {
        position: V.add(origin, V.scale(e, r)),
        normal: V.dot(n, e) > 0 ? n : V.scale(n, -1),
        observedNormal: hit.normal,
        conditioning: V.dot(hit.normal, e),
        support,
      };
    };
    const supported = heldOut.flatMap((row) => {
      const measured: IChartPoint | null = at(row.position);
      return measured === null
        ? []
        : [
            {
              row,
              error: V.norm(V.sub(row.position, measured.position)),
              normalError: angle(measured.normal, measured.observedNormal),
            },
          ];
    });
    const covered = new Set(supported.map(({ row }) => row));
    supported.sort((a, b): number => b.error - a.error);
    return {
      at,
      pitch,
      reach,
      components: sheet.components,
      sourceTriangles: sheet.triangles,
      sourceBoundaryEdges: sheet.boundaries.length,
      boundaryRefusals: atlas.boundaryRefusals,
      interpolationRefusals: atlas.interpolationRefusals,
      tiles: atlas.tiles,
      refusedGrid: atlas.refusedGrid,
      heldOut: supported.length,
      covered: supported.map(({ row }) => row.position),
      unsupported: heldOut.filter((row): boolean => !covered.has(row)),
      maximumMm: supported[0]?.error ?? null,
      maximumNormal: Math.max(
        ...supported.map(({ normalError }): number => normalError),
      ),
      worst: supported[0]?.row.position,
    };
  }

  /** Preserve the exact generating limit's top position and angular normal. */
  export function vertical(source: Subdivision.ISample) {
    const positions: number[] = Array.from(
      source.body.positions,
      (mm): number => mm / 1_000,
    );
    const indices: number[] = Array.from(source.body.indices);
    const caster = createAutoMovieMeshRayCaster({
      positions,
      indices,
      normals: null,
      uvs: null,
      skin: null,
    });
    let high: number = -Infinity;
    for (let i: number = 1; i < positions.length; i += 3)
      high = Math.max(high, positions[i]!);
    const facePoint = (index: number): Plane => [
      1_000 * positions[3 * index]!,
      1_000 * positions[3 * index + 2]!,
    ];
    const normal = (corner: number): Point => {
      const index: number = 3 * source.normals.indices[corner]!;
      const values: readonly number[] = source.normals.values;
      return [values[index]!, values[index + 1]!, values[index + 2]!];
    };
    const cross = (a: Plane, b: Plane): number => a[0] * b[1] - a[1] * b[0];
    const sub = (a: Plane, b: Plane): Plane => [a[0] - b[0], a[1] - b[1]];
    return (x: number, z: number) => {
      const hit = caster.nearestHit(
        [x / 1_000, high, z / 1_000],
        [0, -1, 0],
        Infinity,
      );
      if (hit === null) return null;
      const a: number = 3 * hit.triangle;
      const p: Plane = facePoint(indices[a]!);
      const q: Plane = sub(facePoint(indices[a + 1]!), p);
      const r: Plane = sub(facePoint(indices[a + 2]!), p);
      const d: Plane = sub([x, z], p);
      const determinant: number = cross(q, r);
      if (determinant === 0) return null;
      const beta: number = cross(d, r) / determinant;
      const gamma: number = cross(q, d) / determinant;
      const outward: Point | null = V.unit(
        V.combine([
          [1 - beta - gamma, normal(a)],
          [beta, normal(a + 1)],
          [gamma, normal(a + 2)],
        ]),
      );
      if (outward === null || !(outward[1] > 0)) return null;
      return { height: 1_000 * (high - hit.distance), normal: outward };
    };
  }

  /**
   * Use the better-conditioned projected normal around the mandatory top arc.
   * Rail inclusion is decided on observed Jacobians before fitting either
   * chart.
   */
  export function topArc(
    receipt: IInput,
    observe: ReturnType<typeof vertical>,
  ): IRailRow[] {
    const rows: readonly IRailRow[] = receipt.stockRail.rows;
    const axis = Loft.axis(receipt.support);
    const allowed: boolean[] = rows.map(
      ({ position, station, clock }): boolean => {
        const hit = observe(position[0], position[2]);
        if (hit === null || Math.abs(hit.height - position[1]) > 0.01)
          return false;
        const { u, v } = axis.at(station);
        const outward: Point = V.combine([
          [Math.cos(clock), u],
          [Math.sin(clock), v],
        ]);
        return hit.normal[1] >= V.dot(hit.normal, outward);
      },
    );
    const required: boolean[] = rows.map(
      ({ measured }): boolean => (measured?.radii?.length ?? 0) > 1,
    );
    const connected: boolean[] = [...required];
    for (let i: number = 0; i < rows.length; ++i) {
      if (!required[i]) continue;
      for (const sign of [-1, 1])
        for (let step: number = 1; step < rows.length; ++step) {
          const j: number = (i + sign * step + rows.length) % rows.length;
          if (connected[j] || !allowed[j]) break;
          connected[j] = true;
        }
    }
    return rows.filter((_, i): boolean => connected[i]);
  }

  /**
   * Identify the graph's same connected, upward-facing source sheet at the rail
   * and the training grid.
   */
  export function topStudy(
    source: Subdivision.ISample,
    rail: readonly Point[],
    pitch: number,
  ) {
    const margin: number = 2 * pitch;
    const bounds = ([0, 1, 2] as const).map((k): [number, number] => {
      const values: number[] = rail.map((point): number => point[k]);
      return [Math.min(...values) - margin, Math.max(...values) + margin];
    });
    const cap = Sheet.prepare(source, (p): Point | null =>
      p.every((v, k): boolean => v >= bounds[k]![0] && v <= bounds[k]![1])
        ? [0, 1, 0]
        : null,
    );
    const maximum: number = bounds[1]![1] + margin;
    const observe = (x: number, z: number): Sheet.IHit | null =>
      cap.unique([x, maximum, z], [0, -1, 0], -1);
    const validated = rail.map((p) => {
      const observed: Sheet.IHit | null = observe(p[0], p[2]);
      if (
        observed === null ||
        Math.abs(maximum - observed.distance - p[1]) > 0.01
      )
        throw new Error(
          "A held-out rail point leaves the directed upper source sheet",
        );
      return {
        point: p,
        normal: observed.normal,
        component: observed.component,
      };
    });
    const owner: number = validated[0]!.component;
    if (validated.some(({ component }): boolean => component !== owner))
      throw new Error(
        "The upper chart observations span disconnected source regions",
      );
    return {
      cap,
      rail: validated,
      observe,
      maximum,
      height:
        (x: number) =>
        (z: number): number | null => {
          const observed: Sheet.IHit | null = observe(x, z);
          return observed?.component === owner
            ? maximum - observed.distance
            : null;
        },
    };
  }

  /**
   * Compare the trimmed upper atlas with independent observations on the cap
   * arc.
   */
  export function tiledTop(top: ReturnType<typeof topStudy>, pitch: number) {
    const coordinate = ([x, , z]: Point): Plane => [x, z];
    const domain: Plane[] = top.rail.map(
      ({ point }): Plane => coordinate(point),
    );
    const [x0, x1] = chartRange(domain, 0, pitch);
    const [z0, z1] = chartRange(domain, 1, pitch);
    const atlas = Scalar.prepare({
      domain,
      pitch,
      boundaries: projectBoundaries(top.cap.boundaries, coordinate),
      observe:
        (x: number) =>
        (z: number): Scalar.IObservation | null => {
          const hit: Sheet.IHit | null = top.observe(x, z);
          return hit === null
            ? null
            : { component: hit.component, value: top.maximum - hit.distance };
        },
    });
    const at = ([x, y, z]: Point): IChartPoint | null => {
      if (x < x0 || x > x1 || z < z0 || z > z1) return null;
      const hit: Sheet.IHit | null = top.observe(x, z);
      if (hit === null || Math.abs(top.maximum - hit.distance - y) > 0.01)
        return null;
      const sample = atlas.read(x)(z, hit.component);
      if (sample === null) return null;
      const { jet, support } = sample;
      const up: Point | null = V.unit(V.cross(jet.v, jet.u));
      return up === null
        ? null
        : {
            position: jet.p,
            normal: up,
            observedNormal: hit.normal,
            conditioning: hit.normal[1],
            support,
          };
    };
    const validation = top.rail.flatMap(({ point }) => {
      const sampled: IChartPoint | null = at(point);
      return sampled === null
        ? []
        : [
            {
              point,
              millimetres: Math.abs(sampled.position[1] - point[1]),
              radians: angle(sampled.normal, sampled.observedNormal),
              normalUp: sampled.normal[1],
            },
          ];
    });
    return {
      at,
      pitch,
      maximumMm: Math.max(
        ...validation.map(({ millimetres }): number => millimetres),
      ),
      maximumNormal: Math.max(
        ...validation.map(({ radians }): number => radians),
      ),
      minimumUp: Math.min(
        ...validation.map(({ normalUp }): number => normalUp),
      ),
      sourceComponents: top.cap.components,
      sourceTriangles: top.cap.triangles,
      tiles: atlas.tiles,
      boundaryRefusals: atlas.boundaryRefusals,
      interpolationRefusals: atlas.interpolationRefusals,
      validation,
    };
  }
}
