import { AutoMovieSolidMeshLoop } from "./AutoMovieSolidMeshLoop";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSolidZip } from "./AutoMovieSolidZip";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cross, dot, norm, sub } = AutoMovieSolidVector;

/**
 * The tessellation of solids joined by merge and diff: each face's kept
 * region of its chart, each blend's columns, and the seams between them,
 * as one indexed triangle mesh whose every vertex carries its owner and its
 * chart coordinates.
 *
 * A seam ({@link seam}) draws a join's published blend
 * (`AutoMovieSolidBlendChain`): one vertex per column on the host's
 * rail and one on the part's, each an evaluation of its own face at the
 * rail's chart point, and the blend chain's interior rows between them, so
 * the blend shares both seams vertex for vertex. Each rail is also a trim
 * loop of its face (`ILoop`): a hole in the host's chart, or a loop that
 * winds round the face's periodic phase (the part's rail; a host rail round
 * a tube).
 *
 * A face ({@link face}) is drawn on its own grid of stations and phases.
 * A grid vertex is kept when it lies on every loop's kept side and at least
 * half a cell from the loop (measured in millimetres by the face's first
 * fundamental form), so no sliver is left between the grid and the loop; a
 * cell is drawn when its four corners are kept. The edge of the drawn cells
 * nearest each loop is then joined to the loop's vertices by one band of
 * triangles (`AutoMovieSolidZip`). Every vertex is an exact evaluation
 * of its owner's surface; the seams add none. Shared vertices are one index,
 * so they are bit-identical on both sides.
 *
 * Coordinates are `[owner, u, v]` per vertex, the owner a face (a blend is
 * the face of its chain); {@link evaluate} reads them back. Every triangle
 * turns outward: counter-clockwise seen from the solid's outside, the
 * viewer's front-face rule.
 *
 * @evidence contracts/common.md#principled-implementation Each face is tessellated on its own grid, trimmed by its loops with a metric margin, and zipped to its loops on arclength, so shared boundaries are the same vertices on both sides.
 * @evidence contracts/common.md#clear-and-simple-design One mesh record; face, seam, close and bridge add triangles to it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Triangles are turned outward by the face's orientation, never by a guessed winding.
 * @evidence contracts/common.md#meaningful-documentation States the grid, the loops' kinds, the zipper and the outward rule.
 * @evidence contracts/performance.md#efficient-algorithms Linear in grid cells and loop vertices per face.
 * @evidence contracts/performance.md#reuse-equivalent-work Owners are registered once per surface and grid jets evaluated once per vertex.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Flat number arrays hold the mesh; per-face scratch ends with the face.
 */
export namespace AutoMovieSolidMesh {
  /** What a coordinate is read on. */
  export interface IOwner {
    /** The surface's name. */
    name: string;

    /**
     * The point at owner coordinates.
     *
     * @param a The face's `u`.
     * @param b The face's `v`.
     * @returns The point, mm.
     */
    point(a: number, b: number): Vec3;
  }

  /** The mesh. */
  export interface IMesh {
    /** Flat `[x, y, z, ...]` positions, mm. */
    positions: number[];

    /** Flat triangle indices, outward. */
    indices: number[];

    /** Flat `[owner, a, b]` per vertex. */
    coordinates: number[];

    /** Owners by index. */
    owners: IOwner[];
  }

  /**
   * A trim loop on a face: vertices already in the mesh with their charts.
   *
   * - `hole`: a closed loop enclosing a region of the chart; the face keeps
   *   its outside.
   * - `start`: a loop winding once round the face's periodic phase; the face
   *   keeps the stations above it.
   * - `end`: the same, keeping the stations below it.
   */
  export interface ILoop {
    /** Which side the face keeps. */
    kind: "hole" | "start" | "end";

    /** Vertex indices, in loop order. */
    vertices: number[];

    /** Each vertex's chart point `[u, v]` on the face, `v` unwrapped along the loop. */
    chart: [number, number][];
  }

  /** A trim loop's chart points before its vertices exist: what a join publishes. */
  export interface ILoopChart {
    /** Which side the face keeps, as {@link ILoop.kind}. */
    kind: ILoop["kind"];

    /** Each point `[u, v]` on the face, `v` unwrapped along the loop, in loop order. */
    chart: [number, number][];

    /** Each point's face on an atlas host (`AutoMovieSolidRail.IRail.hostFace`); absent, every point on the one face. */
    faces?: number[];
  }

  /** A face to draw. */
  export interface IFace {
    /** The surface. */
    surface: IAutoMovieSolidSurface;

    /** Grid stations (`u`), strictly increasing; the first and last are the face's open ends. */
    stations: number[];

    /** Grid phases (`v`), strictly increasing; one period's worth (without its repeat) on a periodic face. */
    phases: number[];

    /** Its trim loops. */
    loops: ILoop[];

    /**
     * Whether the face is a diff's cutter, whose kept wall faces into the
     * cutter: the solid's outside there is the cutter's inside. Absent, false.
     */
    inverted?: boolean;
  }

  /** The two loops a join publishes. */
  export interface IJoined {
    /** The host's rail as a trim of the host's face. */
    host: ILoop;

    /** The part's rail as a trim of the part's face. */
    part: ILoop;
  }

  /** An empty mesh. */
  export function create(): IMesh {
    return { positions: [], indices: [], coordinates: [], owners: [] };
  }

  /**
   * A surface's owner index, registered on first use.
   *
   * @param mesh The mesh.
   * @param surface The surface.
   * @returns Its owner index.
   */
  export function owner(mesh: IMesh, surface: IAutoMovieSolidSurface): number {
    const known: number = mesh.owners.findIndex((o: IOwner): boolean => o.name === surface.name);
    if (known >= 0) return known;
    mesh.owners.push({ name: surface.name, point: (a: number, b: number): Vec3 => surface.jet(a, b).p });
    return mesh.owners.length - 1;
  }

  /** A seam to draw: a published blend between its host and its part. */
  export interface ISeam {
    /** The host's surface. */
    host: IAutoMovieSolidSurface;

    /** The part's surface. */
    part: IAutoMovieSolidSurface;

    /** The blend chain's surface (`AutoMovieSolidBlendChain`): `u` its station in `[0, length]`, `v` its phase. */
    blend: IAutoMovieSolidSurface;

    /** The blend's station span, mm. */
    length: number;

    /** The host's rail, column `k` at the blend's phase `2 pi k / count`. */
    hostLoop: ILoopChart;

    /** The part's rail at the same columns. */
    partLoop: ILoopChart;

    /** Rows of the blend between its rails, at least 1. */
    rows: number;
  }

  /**
   * A seam's rails and blend: one vertex per column on each rail (the host's
   * and the part's surface evaluated at the loops' chart points), the blend's
   * `rows - 1` interior rows from its chain, and the blend's triangles.
   *
   * @param mesh The mesh.
   * @param seam The seam.
   * @returns The two trim loops with their vertices.
   */
  export function seam(mesh: IMesh, seam: ISeam): IJoined {
    const hostOwner: number = owner(mesh, seam.host);
    const partOwner: number = owner(mesh, seam.part);
    const blendOwner: number = owner(mesh, seam.blend);
    const count: number = seam.hostLoop.chart.length;
    const grid: number[][] = seam.hostLoop.chart.map((h: [number, number], k: number): number[] => {
      const phase: number = (2 * Math.PI * k) / count;
      const p: [number, number] = seam.partLoop.chart[k]!;
      const ids: number[] = [vertex(mesh, seam.host.jet(h[0], h[1]).p, hostOwner, h[0], h[1])];
      for (let i: number = 1; i < seam.rows; i++) {
        const s: number = (seam.length * i) / seam.rows;
        ids.push(vertex(mesh, seam.blend.jet(s, phase).p, blendOwner, s, phase));
      }
      ids.push(vertex(mesh, seam.part.jet(p[0], p[1]).p, partOwner, p[0], p[1]));
      return ids;
    });

    // The blend's quads, turned to the host's outward side at the first.
    const triangles: [number, number, number][] = [];
    for (let k: number = 0; k < count; k++)
      for (let i: number = 0; i < seam.rows; i++) {
        const a: number = grid[k]![i]!;
        const b: number = grid[(k + 1) % count]![i]!;
        const c: number = grid[(k + 1) % count]![i + 1]!;
        const d: number = grid[k]![i + 1]!;
        triangles.push([a, b, c], [a, c, d]);
      }
    const h0: [number, number] = seam.hostLoop.chart[0]!;
    emit(mesh, triangles, outward(seam.host, h0[0], h0[1]));

    return {
      host: { kind: seam.hostLoop.kind, vertices: grid.map((g: number[]): number => g[0]!), chart: seam.hostLoop.chart },
      part: { kind: seam.partLoop.kind, vertices: grid.map((g: number[]): number => g[seam.rows]!), chart: seam.partLoop.chart },
    };
  }

  /**
   * A face's kept grid and its bands to its loops.
   *
   * @param mesh The mesh.
   * @param input The face.
   * @returns The open ends' boundary cycles (vertex indices), the face's
   *   untrimmed first and last stations, for the caller to close or join.
   */
  export function face(mesh: IMesh, input: IFace): number[][] {
    const { surface, stations, phases, loops }: IFace = input;
    const id: number = owner(mesh, surface);
    const periodic: boolean = surface.period !== undefined;
    const nu: number = stations.length;
    const nv: number = phases.length;
    const cellsV: number = periodic ? nv : nv - 1;

    // Each grid vertex's surface jet once, and whether it is kept.
    const jets: IAutoMovieSolidSurface.IJet[][] = stations.map((u: number): IAutoMovieSolidSurface.IJet[] =>
      phases.map((v: number): IAutoMovieSolidSurface.IJet => surface.jet(u, v)),
    );
    const kept: boolean[][] = stations.map((u: number, i: number): boolean[] =>
      phases.map((v: number, j: number): boolean => {
        const du: number = Math.min(...[stations[i - 1], stations[i + 1]].filter((x: number | undefined): x is number => x !== undefined).map((x: number): number => Math.abs(x - u)));
        const vNext: number = phases[j + 1] ?? (periodic ? phases[0]! + surface.period! : phases[j - 1]!);
        const dv: number = Math.abs(vNext - v);
        const j0: IAutoMovieSolidSurface.IJet = jets[i]![j]!;
        const margin: number = 0.5 * Math.min(norm(j0.u) * du, norm(j0.v) * dv);
        return loops.every((l: ILoop): boolean => AutoMovieSolidMeshLoop.keeps(l, u, v, j0, margin, surface.period));
      }),
    );

    // Cells with four kept corners, and their vertices on first use.
    const ids: Map<number, number> = new Map();
    const at = (i: number, j: number): number => {
      const key: number = i * nv + (j % nv);
      const known: number | undefined = ids.get(key);
      if (known !== undefined) return known;
      const created: number = vertex(mesh, jets[i]![j % nv]!.p, id, stations[i]!, phases[j % nv]!);
      ids.set(key, created);
      return created;
    };
    const triangles: [number, number, number][] = [];
    const edges: Set<string> = new Set();
    const chart: Map<number, [number, number]> = new Map();
    for (let i: number = 0; i + 1 < nu; i++)
      for (let j: number = 0; j < cellsV; j++) {
        const j1: number = (j + 1) % nv;
        if (!(kept[i]![j]! && kept[i + 1]![j]! && kept[i + 1]![j1]! && kept[i]![j1]!)) continue;
        const a: number = at(i, j);
        const b: number = at(i + 1, j);
        const c: number = at(i + 1, j1);
        const d: number = at(i, j1);
        triangles.push([a, b, c], [a, c, d]);
        for (const [p, q] of [[a, b], [b, c], [c, d], [d, a]] as [number, number][]) {
          const reverse: string = `${q},${p}`;
          if (edges.has(reverse)) edges.delete(reverse);
          else edges.add(`${p},${q}`);
        }
        chart.set(a, [stations[i]!, phases[j]!]);
        chart.set(b, [stations[i + 1]!, phases[j]!]);
        chart.set(c, [stations[i + 1]!, phases[j1]!]);
        chart.set(d, [stations[i]!, phases[j1]!]);
      }
    emit(mesh, triangles, (surface.orientation === 1) !== (input.inverted === true) ? 1 : -1, true);

    // The drawn cells' boundary as cycles: each boundary edge's start maps
    // to its end, so following it walks one cycle.
    const cycles: number[][] = [];
    const left: Map<number, number> = new Map();
    for (const e of edges) {
      const [p, q] = e.split(",").map(Number) as [number, number];
      left.set(p, q);
    }
    while (left.size > 0) {
      const first: number = left.keys().next().value!;
      const cycle: number[] = [];
      let v: number = first;
      while (left.has(v)) {
        cycle.push(v);
        const next: number = left.get(v)!;
        left.delete(v);
        v = next;
      }
      cycles.push(cycle);
    }

    // Each loop is zipped to the cycle nearest it; the rest are the open ends.
    const open: number[][] = [...cycles];
    for (const loop of loops) {
      let best: number = -1;
      let distance: number = Infinity;
      open.forEach((cycle: number[], k: number): void => {
        const d: number = AutoMovieSolidMeshLoop.nearest(loop, cycle.map((v: number): [number, number] => chart.get(v)!), surface.period);
        if (d < distance) {
          distance = d;
          best = k;
        }
      });
      if (best < 0) continue;
      const cycle: number[] = AutoMovieSolidMeshLoop.aligned(mesh, loop.vertices, open.splice(best, 1)[0]!);
      const band: [number, number, number][] = AutoMovieSolidZip.band(
        { vertices: loop.vertices, angles: AutoMovieSolidMeshLoop.arc(mesh, loop.vertices) },
        { vertices: cycle, angles: AutoMovieSolidMeshLoop.arc(mesh, cycle) },
      );
      const p0: [number, number] = loop.chart[0]!;
      const o: Vec3 = outward(surface, p0[0], p0[1]);
      emit(mesh, band, input.inverted === true ? [-o[0], -o[1], -o[2]] : o);
    }
    return open;
  }

  /**
   * A closure's triangles added outward, such as the fan from a face's open
   * end to its pole: tested once against the face's outward normal at the
   * coordinates of the first triangle's first vertex.
   *
   * @param mesh The mesh.
   * @param triangles One turning sense, their first vertex on the face.
   * @param surface The face they close.
   * @param inverted Whether the face is a diff's cutter (`IFace.inverted`).
   */
  export function close(mesh: IMesh, triangles: readonly [number, number, number][], surface: IAutoMovieSolidSurface, inverted: boolean): void {
    if (triangles.length === 0) return;
    const v: number = triangles[0]![0];
    const o: Vec3 = outward(surface, mesh.coordinates[3 * v + 1]!, mesh.coordinates[3 * v + 2]!);
    emit(mesh, triangles, inverted ? [-o[0], -o[1], -o[2]] : o);
  }

  /**
   * The band between a ring another tessellation drew (an event's contact
   * ring, shared with the ring loft by vertex index) and a face's open
   * drawn-cell edge beside it: the same zipper as a trim loop's
   * (`AutoMovieSolidZip` on arclength from aligned starts), turned
   * outward. Nothing is added to the mesh; the caller adds the triangles
   * where the ring's vertices live.
   *
   * @param mesh A mesh whose positions hold both sequences' vertices.
   * @param ring The ring's vertices, in its own order.
   * @param cycle The face's open edge.
   * @param out The outward normal of the face near the band.
   * @returns The triangles, outward.
   */
  export function bridge(mesh: IMesh, ring: readonly number[], cycle: readonly number[], out: Readonly<Vec3>): [number, number, number][] {
    const turned: number[] = AutoMovieSolidMeshLoop.aligned(mesh, ring, cycle);
    const band: [number, number, number][] = AutoMovieSolidZip.band(
      { vertices: [...ring], angles: AutoMovieSolidMeshLoop.arc(mesh, ring) },
      { vertices: turned, angles: AutoMovieSolidMeshLoop.arc(mesh, turned) },
    );
    let best: Vec3 = [0, 0, 0];
    for (const t of band) {
      const n: Vec3 = normal(mesh, t);
      if (norm(n) > norm(best)) best = n;
    }
    return dot(best, out) < 0 ? band.map(([a, b, c]: [number, number, number]): [number, number, number] => [a, c, b]) : band;
  }

  /**
   * The point an owner's coordinates name.
   *
   * @param mesh The mesh.
   * @param index A vertex index.
   * @returns The owner's point at the vertex's coordinates.
   */
  export function evaluate(mesh: IMesh, index: number): Vec3 {
    const c: number[] = mesh.coordinates.slice(3 * index, 3 * index + 3);
    return mesh.owners[c[0]!]!.point(c[1]!, c[2]!);
  }

  /**
   * A new vertex of the mesh.
   *
   * @param mesh The mesh.
   * @param p Its position, mm.
   * @param owner Its owner's index.
   * @param a Its owner coordinate `u`.
   * @param b Its owner coordinate `v`.
   * @returns Its index.
   */
  export function vertex(mesh: IMesh, p: Readonly<Vec3>, owner: number, a: number, b: number): number {
    mesh.positions.push(p[0], p[1], p[2]);
    mesh.coordinates.push(owner, a, b);
    return mesh.positions.length / 3 - 1;
  }

  /**
   * Triangles added turned outward: as given when `sign` is positive or the
   * set is already known outward (`known`), else each turned when its normal
   * faces against `sign`'s reference.
   *
   * @param mesh The mesh.
   * @param triangles One turning sense in their parameter plane.
   * @param sign A face's orientation (`known`), or an outward normal to test the largest triangle against.
   * @param known Whether `sign` is the orientation itself.
   */
  function emit(mesh: IMesh, triangles: readonly [number, number, number][], sign: number | Vec3, known: boolean = false): void {
    let flip: boolean;
    if (known || typeof sign === "number") flip = (sign as number) < 0;
    else {
      // The largest triangle's normal against the reference.
      let best: Vec3 = [0, 0, 0];
      for (const t of triangles) {
        const n: Vec3 = normal(mesh, t);
        if (norm(n) > norm(best)) best = n;
      }
      flip = dot(best, sign) < 0;
    }
    for (const [a, b, c] of triangles) mesh.indices.push(...(flip ? [a, c, b] : [a, b, c]));
  }

  /** A triangle's unnormalised normal. */
  function normal(mesh: IMesh, t: readonly [number, number, number]): Vec3 {
    const p = (k: number): Vec3 => [mesh.positions[3 * k]!, mesh.positions[3 * k + 1]!, mesh.positions[3 * k + 2]!];
    return cross(sub(p(t[1]), p(t[0])), sub(p(t[2]), p(t[0])));
  }

  /** A surface's outward normal at a chart point. */
  function outward(surface: IAutoMovieSolidSurface, u: number, v: number): Vec3 {
    const j: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
    const n: Vec3 = cross(j.u, j.v);
    return [n[0] * surface.orientation, n[1] * surface.orientation, n[2] * surface.orientation];
  }

}
