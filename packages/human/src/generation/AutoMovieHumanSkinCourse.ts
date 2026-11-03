import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import { AutoMovieHumanSkinCorridor as Corridor } from "./AutoMovieHumanSkinCorridor";
import { AutoMovieHumanSkinShortening as Shortening } from "./AutoMovieHumanSkinShortening";
import type { AutoMovieHumanSurfaceCorrespondence as Correspondence } from "./AutoMovieHumanSurfaceCorrespondence";
import type { AutoMovieHumanThoracicCourse as Source } from "./AutoMovieHumanThoracicCourse";
import type { IAutoMovieHumanBodyCalibration as Body } from "./IAutoMovieHumanBodyCalibration";

/** A directed physical course on the actual indexed skin, including its mesher-owned shared boundaries. */
export namespace AutoMovieHumanSkinCourse {
  /** Actual emitted path and one original face witness for every segment. */
  export interface IReading extends Omit<Source.IReading, "graph"> {
    /** Distinguish this consumer from a curve-only reference path. */
    physicalStage: "emitted-skin-corridor-path";
    /** The coarse seed's original mesh identities; refined points use bindings instead. */
    seedVertices: number[];
    /** Original portal edges or endpoint faces for every refined point. */
    bindings: Corridor.IReading["bindings"];
    /** Original triangle index-buffer offset containing each consecutive segment. */
    triangles: number[];
    /** Every refused local corridor alternative, with its original physical witness. */
    alternatives: NonNullable<Corridor.IReading["alternatives"]>;
    /** Measured bounded material-constraint work, when the unmodified funnel path was inadmissible. */
    directedWork?: Corridor.IReading["directedWork"];
    /** All local-alternative costs, including directed paths discarded by shortening. */
    shorteningWork?: Corridor.IReading["shorteningWork"];
    /** Finite edge-path evidence; a virtual endpoint has an actual triangle rather than a source-ring phase. */
    graph: Omit<Source.IReading["graph"], "route"> & { route: { owner: string; station: number; phase?: number; point: Source.Point }[] };
  }

  /** A directed actual mesh edge and the original face that contains it. */
  interface IEdge { to: number; length: number; triangle: number }

  /** A virtual endpoint on an actual triangle, in world millimetres. */
  interface IEndpoint { point: Source.Point; triangle: number; vertices: number[] }

  /**
   * Find a directed edge seed on the selected left-half skin, then unfold
   * its actual face corridor and remove the seed's edge stair steps.
   * Endpoint material/lateral coordinates remain fixed; their positions come
   * from actual triangles. Shared mesh indices provide continuity, never a
   * same-phase assumption or a tolerance joining two separate source curves.
   * The physical path is shortest inside this finite triangle corridor;
   * it is not a global geodesic certificate, clinical registration or
   * source-loft C0 certification. Its endpoints and target remain unchanged.
   */
  export function read(body: Body, skin: Surface.IGeometry, owners: ReadonlySet<string>, from: Source.IAddress, to: Source.IAddress, boundaries: readonly Correspondence.IBoundary[] = []): IReading {
    if (![from.station, from.lateral, to.station, to.lateral].every(Number.isFinite) || from.station === to.station) throw new Error("An emitted skin course needs distinct finite material endpoints");
    const count: number = skin.mesh.positions.length / 3;
    if (!Number.isInteger(count) || skin.coordinates.length !== skin.mesh.positions.length || skin.mesh.indices.length % 3 !== 0) throw new Error("An emitted skin course has invalid buffer cardinalities");
    const coordinates: number[] = [...skin.coordinates];
    for (const boundary of boundaries) {
      if (!owners.has(boundary.chain)) continue;
      const chain: number = body.chains.findIndex((item: Body["chains"][number]): boolean => item.name === boundary.chain);
      boundary.vertices.forEach((vertex: number, index: number): void => {
        if (![coordinates[3 * vertex], coordinates[3 * vertex + 1], coordinates[3 * vertex + 2]].every(Number.isFinite)) {
          coordinates[3 * vertex] = chain; coordinates[3 * vertex + 1] = boundary.station; coordinates[3 * vertex + 2] = boundary.phases[index]!;
        }
      });
    }
    const direction: number = Math.sign(to.station - from.station);
    const bottom: number = Math.min(from.station, to.station);
    const top: number = Math.max(from.station, to.station);
    const allowed: boolean[] = Array.from({ length: count }, (_: unknown, vertex: number): boolean => {
      const chain: Body["chains"][number] | undefined = body.chains[coordinates[3 * vertex]!];
      const station: number = coordinates[3 * vertex + 1]!;
      const phase: number = coordinates[3 * vertex + 2]!;
      const canonical: number = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return chain !== undefined && owners.has(chain.name) && Number.isFinite(station) && Number.isFinite(phase) && canonical <= Math.PI;
    });
    const edges: IEdge[][] = Array.from({ length: count + 2 }, (): IEdge[] => []);
    const starts: IEndpoint[] = [];
    const ends: IEndpoint[] = [];
    const selectedFaces: number[] = [];
    for (let group: number = 0; group < skin.mesh.groups.length; group++) {
      const current: typeof skin.mesh.groups[number] = skin.mesh.groups[group]!;
      if (!owners.has(current.name.slice(0, current.name.lastIndexOf("/")))) continue;
      const end: number = skin.mesh.groups[group + 1]?.start ?? skin.mesh.indices.length;
      for (let offset: number = current.start; offset < end; offset += 3) {
        const ids: number[] = skin.mesh.indices.slice(offset, offset + 3);
        if (ids.some((vertex: number): boolean => !Number.isInteger(vertex) || vertex < 0 || vertex >= count)) throw new Error("An emitted skin course face has an invalid vertex", { cause: { triangle: offset, ids } });
        const points: Source.Point[] = ids.map((vertex: number): Source.Point => point(skin, vertex));
        const a: Source.Point = subtract(points[1]!, points[0]!);
        const b: Source.Point = subtract(points[2]!, points[0]!);
        const area: number = Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]);
        if (points.some((p: Source.Point): boolean => p.length !== 3 || !p.every(Number.isFinite)) || !(area > 0) || !Number.isFinite(area)) throw new Error("An emitted skin course has a nonfinite or degenerate selected face", { cause: { triangle: offset, ids, coordinates: points, twiceArea: area, units: "mm and mm^2" } });
        const stations: number[] = ids.map((vertex: number): number => coordinates[3 * vertex + 1]!);
        if (stations.some((station: number): boolean => !Number.isFinite(station))) throw new Error("An emitted skin course face has unavailable material ownership", { cause: { triangle: offset, ids, stations, units: "mm" } });
        if (Math.max(...stations) < bottom || Math.min(...stations) > top) continue;
        if (!ids.some((vertex: number): boolean => allowed[vertex])) continue;
        selectedFaces.push(offset);
        for (const [address, candidates] of [[from, starts], [to, ends]] as const)
          for (const p of endpoint(points, stations, address)) candidates.push({ point: p, triangle: offset, vertices: ids });
        for (let corner: number = 0; corner < 3; corner++) {
          const first: number = ids[corner]!;
          const second: number = ids[(corner + 1) % 3]!;
          if (!allowed[first] || !allowed[second]) continue;
          const length: number = distance(points[corner]!, points[(corner + 1) % 3]!);
          const step: number = (coordinates[3 * second + 1]! - coordinates[3 * first + 1]!) * direction;
          if (step >= 0) edges[first]!.push({ to: second, length, triangle: offset });
          if (step <= 0) edges[second]!.push({ to: first, length, triangle: offset });
        }
      }
    }
    const choose: (candidates: IEndpoint[], stage: string, address: Source.IAddress) => Source.Point = (candidates: IEndpoint[], stage: string, address: Source.IAddress): Source.Point => {
      if (candidates.length === 0) throw new Error("An emitted skin course endpoint has no actual triangle crossing", { cause: { stage, station: address.station, targetCoordinate: address.lateral, observed: "unavailable", expected: "A finite actual skin crossing", units: "mm" } });
      return candidates.reduce((a: IEndpoint, b: IEndpoint): IEndpoint => a.point[0] >= b.point[0] ? a : b).point;
    };
    const start: Source.Point = choose(starts, "start", from);
    const finish: Source.Point = choose(ends, "end", to);
    for (const [candidates, selected, virtual, outgoing] of [[starts, start, count, true], [ends, finish, count + 1, false]] as const)
      for (const candidate of candidates) {
        const arithmetic: number = 128 * Number.EPSILON * Math.max(1, ...selected.map(Math.abs));
        if (distance(candidate.point, selected) > arithmetic) continue;
        for (const vertex of candidate.vertices) {
          if (!allowed[vertex]) continue;
          const advance: number = (coordinates[3 * vertex + 1]! - (outgoing ? from.station : to.station)) * direction;
          if (outgoing ? advance < 0 : advance > 0) continue;
          const edge: IEdge = { to: outgoing ? vertex : virtual, length: distance(point(skin, vertex), selected), triangle: candidate.triangle };
          edges[outgoing ? virtual : vertex]!.push(edge);
        }
      }

    // Interior endpoints can occupy one actual face without containing any
    // original vertex in their material interval. The physical segment is
    // then a direct face corridor, not a reason to invent or move a station.
    for (const first of starts)
      for (const last of ends) {
        if (first.triangle !== last.triangle || !selectedFaces.includes(first.triangle)) continue;
        const arithmetic: number = 128 * Number.EPSILON * Math.max(1, ...start.map(Math.abs), ...finish.map(Math.abs));
        if (distance(first.point, start) > arithmetic || distance(last.point, finish) > arithmetic) continue;
        edges[count]!.push({ to: count + 1, length: distance(start, finish), triangle: first.triangle });
      }
    const distances: number[] = new Array<number>(count + 2).fill(Infinity);
    const before: number[] = new Array<number>(count + 2).fill(-1);
    const face: number[] = new Array<number>(count + 2).fill(-1);
    const queue: [number, number][] = [];
    distances[count] = 0; push(queue, [0, count]);
    while (queue.length > 0) {
      const [cost, vertex]: [number, number] = pop(queue);
      if (cost !== distances[vertex]) continue;
      if (vertex === count + 1) break;
      for (const edge of edges[vertex]!) {
        const candidate: number = cost + edge.length;
        if (candidate >= distances[edge.to]!) continue;
        distances[edge.to] = candidate; before[edge.to] = vertex; face[edge.to] = edge.triangle; push(queue, [candidate, edge.to]);
      }
    }
    if (!Number.isFinite(distances[count + 1])) throw new Error("An emitted skin course has no connected directed path", { cause: { stage: "shared indexed surface", owners: [...owners], from, to, coordinates: [start, finish], observed: "Disconnected or inadmissible actual indexed skin", expected: "One path through shared physical vertices and original triangles", units: "mm" } });
    const vertices: number[] = [];
    for (let vertex: number = count + 1; vertex >= 0; vertex = before[vertex]!) vertices.push(vertex);
    vertices.reverse();
    const seedFaces: number[] = vertices.slice(1).map((vertex: number): number => face[vertex]!);
    const incidence: Corridor.Connectivity = Corridor.prepare(skin, selectedFaces);
    const seed: Corridor.IReading = Corridor.read(skin, vertices, seedFaces, start, finish, coordinates, selectedFaces, incidence);
    const refined: Corridor.IReading = Shortening.read(skin, seed, coordinates, selectedFaces, incidence);
    const points: Source.Point[] = refined.points;
    const addresses: Source.IAddress[] = points.map((p: Source.Point, index: number): Source.IAddress => ({ station: index === 0 ? from.station : index === points.length - 1 ? to.station : refined.stations[index]!, lateral: p[2] }));
    for (let index: number = 0; index < addresses.length; index++) {
      const station: number = addresses[index]!.station;
      const previous: number = addresses[Math.max(0, index - 1)]!.station;
      const arithmetic: number = 512 * Number.EPSILON * Math.max(1, Math.abs(station), Math.abs(previous), Math.abs(bottom), Math.abs(top));
      if (!Number.isFinite(station) || station < bottom - arithmetic || station > top + arithmetic || (station - previous) * direction < -arithmetic)
        throw new Error("An emitted skin corridor leaves its directed material domain", { cause: { stage: "refined physical corridor", index, station, previous, from, to, coordinates: points[index], expected: "A finite monotone path inside the unchanged endpoint material interval", tolerance: arithmetic, units: "mm" } });
    }
    const triangles: number[] = refined.triangles;
    const length: number = refined.length;
    if (!(length > 0) || !Number.isFinite(length)) throw new Error("An emitted skin course has no finite positive physical length");
    let graph: IReading["graph"] | undefined;
    return { physicalStage: "emitted-skin-corridor-path", points, addresses, seedVertices: vertices, bindings: refined.bindings, triangles, length, alternatives: refined.alternatives ?? [], directedWork: refined.directedWork, shorteningWork: refined.shorteningWork,
      /** Allocate diagnostic row/route records only when a caller requests them. */
      get graph(): IReading["graph"] {
        graph ??= { stations: addresses.map((address: Source.IAddress): number => address.station), ordered: addresses.map((address: Source.IAddress): number => address.station), uniformCount: 0, rowOwners: points.map((_: Source.Point, index: number): string[] => [groupName(skin, triangles[Math.min(index, triangles.length - 1)]!)]), intervalOwners: triangles.map((offset: number): string => groupName(skin, offset)), rowNodes: points.map((): number => 1), cost: distances[count + 1]!, route: points.map((p: Source.Point, index: number): { owner: string; station: number; point: Source.Point } => ({ owner: groupName(skin, triangles[Math.min(index, triangles.length - 1)]!), station: addresses[index]!.station, point: p })) };
        return graph;
      },
    };
  }

  /** Original emitting interval at this face offset, compatible with the shared ES2022 consumer. */
  function groupName(skin: Surface.IGeometry, offset: number): string {
    for (let index: number = skin.mesh.groups.length - 1; index >= 0; index--)
      if (skin.mesh.groups[index]!.start <= offset) return skin.mesh.groups[index]!.name;
    throw new Error("A physical course face omitted its original interval owner", { cause: { triangle: offset, expected: "An original emitting group" } });
  }

  /** Triangle intersection with the two fixed material/lateral planes, using barycentric coordinates. */
  function endpoint(points: readonly Source.Point[], stations: readonly number[], address: Source.IAddress): Source.Point[] {
    const a: number = stations[1]! - stations[0]!;
    const b: number = stations[2]! - stations[0]!;
    const c: number = points[1]![2] - points[0]![2];
    const d: number = points[2]![2] - points[0]![2];
    const x: number = address.station - stations[0]!;
    const y: number = address.lateral - points[0]![2];
    const determinant: number = a * d - b * c;
    const found: Source.Point[] = [];
    if (determinant !== 0) {
      const u: number = (x * d - b * y) / determinant;
      const v: number = (a * y - x * c) / determinant;
      if ([u, v].every(Number.isFinite) && u >= 0 && v >= 0 && u + v <= 1)
        found.push(points[0]!.map((value: number, axis: number): number => value + u * (points[1]![axis]! - value) + v * (points[2]![axis]! - value)) as Source.Point);
    } else {
      for (let index: number = 0; index < 3; index++) {
        const next: number = (index + 1) % 3;
        const ds: number = stations[next]! - stations[index]!;
        const dz: number = points[next]![2] - points[index]![2];
        const unit: number = Math.abs(ds) > Math.abs(dz) ? (address.station - stations[index]!) / ds : dz !== 0 ? (address.lateral - points[index]![2]) / dz : 0;
        if (!(unit >= 0 && unit <= 1)) continue;
        const station: number = stations[index]! + unit * ds;
        const p: Source.Point = points[index]!.map((value: number, axis: number): number => value + unit * (points[next]![axis]! - value)) as Source.Point;
        const arithmetic: number = 128 * Number.EPSILON * Math.max(1, Math.abs(address.station), Math.abs(address.lateral), Math.abs(station), Math.abs(p[2]));
        if (Math.abs(station - address.station) <= arithmetic && Math.abs(p[2] - address.lateral) <= arithmetic) found.push(p);
      }
    }
    return found;
  }

  /** Original world vertex, never a fitted replacement. */
  function point(skin: Surface.IGeometry, vertex: number): Source.Point { return skin.mesh.positions.slice(3 * vertex, 3 * vertex + 3) as Source.Point; }

  /** World displacement in calibration millimetres. */
  function subtract(a: Source.Point, b: Source.Point): Source.Point { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }

  /** Euclidean physical segment length. */
  function distance(a: Source.Point, b: Source.Point): number { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

  /** Stable-cost binary min heap; equal costs preserve first-discovered source edges. */
  function push(heap: [number, number][], value: [number, number]): void {
    let index: number = heap.length; heap.push(value);
    while (index > 0) { const parent: number = Math.floor((index - 1) / 2); if (heap[parent]![0] <= value[0]) break; heap[index] = heap[parent]!; index = parent; }
    heap[index] = value;
  }

  /** Remove the next finite shortest-path candidate. */
  function pop(heap: [number, number][]): [number, number] {
    const first: [number, number] = heap[0]!;
    const last: [number, number] = heap.pop()!;
    if (heap.length > 0) {
      let index: number = 0;
      while (index * 2 + 1 < heap.length) { let child: number = index * 2 + 1; if (child + 1 < heap.length && heap[child + 1]![0] < heap[child]![0]) child++; if (last[0] <= heap[child]![0]) break; heap[index] = heap[child]!; index = child; }
      heap[index] = last;
    }
    return first;
  }
}
