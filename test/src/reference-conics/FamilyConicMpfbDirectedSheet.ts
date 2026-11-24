import {
  AutoMovieSolidVector as V,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { AutoMovieVector3Tuple as Point } from "@automovie/interface";

import type { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";

/** Label connected source triangles with a positive projected chart determinant. */
export namespace FamilyConicMpfbDirectedSheet {
  /** A unique observation on one positively directed source component. */
  export interface IHit {
    /** Physical distance along the unit world direction, in mm. */
    distance: number;
    /** Stable edge-connected component identifier of the admitted source. */
    component: number;
    /** Outward observed limit normal at the triangle's contact. */
    normal: Point;
  }

  /**
   * Prepare one observed patch from indexed shared edges and the projected
   * signed area at its limit-normal corners. A direction callback marks
   * positions within a declared source chart and returns its outward gauge.
   */
  export function prepare(
    source: Subdivision.ISample,
    direction: (point: Point) => Point | null,
  ) {
    const world: readonly number[] = Array.from(source.body.positions);
    const input: readonly number[] = Array.from(source.body.indices);
    const point = (k: number): Point => [
      world[3 * k]!,
      world[3 * k + 1]!,
      world[3 * k + 2]!,
    ];
    const gauges = Array.from({ length: world.length / 3 }, (_, k) =>
      direction(point(k)),
    );
    const cornerNormal = (sourceIndex: number): Point => {
      const k: number = 3 * source.normals.indices[sourceIndex]!;
      const values: readonly number[] = source.normals.values;
      return [values[k]!, values[k + 1]!, values[k + 2]!];
    };
    const indices: number[] = [];
    const owners: number[] = [];
    const leaders: number[] = [];
    const neighbours = new Map<
      number,
      {
        owner: number;
        vertices: [number, number];
        other: number | null;
        uses: number;
      }
    >();
    const find = (index: number): number => {
      let at: number = index;
      while (at !== leaders[at]) {
        leaders[at] = leaders[leaders[at]!]!;
        at = leaders[at]!;
      }
      return at;
    };
    const count: number = gauges.length;
    for (let t: number = 0; t < input.length; t += 3) {
      const vertices: number[] = input.slice(t, t + 3);
      const a: Point = point(vertices[0]!);
      const chordNormal: Point = V.cross(
        V.sub(point(vertices[1]!), a),
        V.sub(point(vertices[2]!), a),
      );
      if (
        !vertices.every((k, j): boolean => {
          const own: Point | null = gauges[k]!;
          return (
            own !== null &&
            V.dot(own, cornerNormal(t + j)) > 0 &&
            V.dot(own, chordNormal) > 0
          );
        })
      )
        continue;
      const id: number = owners.length;
      owners.push(t);
      leaders.push(id);
      indices.push(...vertices);
      for (let e: number = 0; e < 3; ++e) {
        const a: number = vertices[e]!,
          b: number = vertices[(e + 1) % 3]!;
        const key: number = Math.min(a, b) * count + Math.max(a, b);
        const neighbour = neighbours.get(key);
        if (neighbour === undefined)
          neighbours.set(key, {
            owner: id,
            vertices: [a, b],
            other: null,
            uses: 1,
          });
        else {
          ++neighbour.uses;
          if (neighbour.vertices[0] === b) neighbour.other = id;
        }
      }
    }
    for (const { other, owner, uses } of neighbours.values())
      if (uses === 2 && other !== null) leaders[find(other)] = find(owner);
    const components: number[] = owners.map((_, i): number => find(i));
    const boundaries = Array.from(neighbours.values())
      .filter(({ uses }): boolean => uses === 1)
      .map(({ owner, vertices: [a, b] }) => ({
        component: components[owner]!,
        edge: [point(a), point(b)] as [Point, Point],
      }));
    const caster = createAutoMovieMeshRayCaster({
      positions: world.map((x): number => x / 1_000),
      indices,
      normals: null,
      uvs: null,
      skin: null,
    });
    const unique = (
      origin: Point,
      gauge: Point,
      sense: 1 | -1 = 1,
    ): IHit | null => {
      const metres: Point = V.scale(origin, 1 / 1_000);
      const hit = caster.nearestHit(metres, gauge, Infinity);
      if (hit === null) return null;
      const after: number =
        hit.distance + 32 * Number.EPSILON * Math.max(1, hit.distance);
      if (caster.blocked(metres, gauge, Infinity, after)) return null;
      const t: number = owners[hit.triangle]!;
      const a: Point = point(input[t]!);
      const u: Point = V.sub(point(input[t + 1]!), a);
      const v: Point = V.sub(point(input[t + 2]!), a);
      const physical: number = hit.distance * 1_000;
      const relative: Point = V.sub(V.add(origin, V.scale(gauge, physical)), a);
      const uu: number = V.dot(u, u),
        uv: number = V.dot(u, v),
        vv: number = V.dot(v, v);
      const ru: number = V.dot(relative, u),
        rv: number = V.dot(relative, v);
      const determinant: number = uu * vv - uv * uv;
      if (!(determinant > 0)) return null;
      const s: number = (vv * ru - uv * rv) / determinant;
      const r: number = (uu * rv - uv * ru) / determinant;
      const normal: Point | null = V.unit(
        V.combine([
          [1 - s - r, cornerNormal(t)],
          [s, cornerNormal(t + 1)],
          [r, cornerNormal(t + 2)],
        ]),
      );
      return normal === null || !(sense * V.dot(normal, gauge) > 0)
        ? null
        : { distance: physical, component: components[hit.triangle]!, normal };
    };
    return {
      unique,
      boundaries,
      components: new Set(components).size,
      triangles: owners.length,
    };
  }
}
