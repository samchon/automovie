import {
  AutoMovieSolidMesh as Mesh,
  AutoMovieSolidVector as V,
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshPieces,
} from "@automovie/engine";
import type {
  AutoMovieVector2Tuple as Chart,
  IAutoMovieMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";

/**
 * Retain actual source panels outside the two indexed boundaries of a meridian
 * test.
 */
export function inspectHumanArmscyeSkin(input: {
  host: IAutoMovieSolidSurface & { domain: [number, number] };
  child: IAutoMovieSolidSurface & { domain: [number, number] };
  hostChart: Chart[];
  childChart: Chart[];
  rings: Point[][];
  reach: number;
}) {
  const { host, child, hostChart, rings, reach } = input;
  const mesh = Mesh.create();
  const count = hostChart.length;
  const period = 2 * Math.PI;
  const childChart: Chart[] = [];
  for (const [station, phase] of input.childChart) {
    const previous = childChart.at(-1)?.[1] ?? phase;
    childChart.push([
      station,
      phase + period * Math.round((previous - phase) / period),
    ]);
  }
  const phases = Array.from({ length: count }, (_, i) => (period * i) / count);
  const mark = childChart[0]![0];
  const h = Mesh.owner(mesh, host);
  const c = Mesh.owner(mesh, child);
  const band = mesh.owners.length;
  mesh.owners.push({
    name: "armscye.meridians",
    point: (row, column) => rings[row]![column]!,
  });
  const ids = rings.map((points, row) =>
    points.map((point, k) => {
      const a = hostChart[k]!;
      const b = childChart[k]!;
      if (row === 0) return Mesh.vertex(mesh, point, h, ...a);
      if (row === rings.length - 1) return Mesh.vertex(mesh, point, c, ...b);
      return Mesh.vertex(mesh, point, band, row, k);
    }),
  );
  const adjacent = V.sub(rings[0]![1]!, rings[0]![0]!);
  const approach = V.sub(rings[1]![0]!, rings[0]![0]!);
  const parent = host.jet(...hostChart[0]!);
  const outward = V.scale(V.cross(parent.u, parent.v), host.orientation);
  const sense = V.dot(V.cross(approach, adjacent), outward) > 0;
  for (let row = 1; row < ids.length; ++row)
    for (let k = 0; k < count; ++k) {
      const next = (k + 1) % count;
      const a = ids[row - 1]![k]!;
      const b = ids[row - 1]![next]!;
      const c = ids[row]![k]!;
      const d = ids[row]![next]!;
      if (sense) mesh.indices.push(a, c, b, c, d, b);
      else mesh.indices.push(a, b, c, c, b, d);
    }
  const levels = hostChart.map(([u]) => u);
  const low = Math.max(host.domain[0], Math.min(...levels) - reach);
  const high = Math.min(host.domain[1], Math.max(...levels) + reach);
  const stripEnd = mesh.indices.length;
  Mesh.face(mesh, {
    surface: host,
    stations: stations(low, high),
    phases,
    loops: [{ kind: "hole", chart: hostChart, vertices: ids[0]! }],
  });
  const hostEnd = mesh.indices.length;
  Mesh.face(mesh, {
    surface: child,
    stations: stations(mark, child.domain[1]),
    phases,
    loops: [],
    domainLoops: [{ kind: "start", chart: childChart, vertices: ids.at(-1)! }],
  });
  const geometry: IAutoMovieMesh = {
    positions: mesh.positions.map((mm) => mm / 1000),
    indices: mesh.indices,
    normals: null,
    skin: null,
    uvs: null,
  };
  const pieces = measureAutoMovieMeshPieces(geometry).map(
    ({ boundaryLoops, genus, manifold, consistentlyWound }) => ({
      boundaryLoops,
      genus,
      manifold,
      consistentlyWound,
    }),
  );
  const crossings = measureAutoMovieMeshCrossings(geometry, geometry);
  const seam = boundaryNormals(
    mesh,
    host,
    hostChart,
    ids[0]!,
    stripEnd,
    hostEnd,
  );
  return {
    positions: geometry.positions,
    indices: mesh.indices,
    report: {
      pieces,
      crossings: crossings.length,
      sampleCrossings: crossings.slice(0, 8),
      seam,
    },
  };
}

/** Compare the two indexed faces incident to each exact shared parent edge. */
function boundaryNormals(
  mesh: ReturnType<typeof Mesh.create>,
  host: IAutoMovieSolidSurface,
  chart: Chart[],
  rim: number[],
  stripEnd: number,
  hostEnd: number,
) {
  const count = rim.length;
  const columns: (number | undefined)[] = [];
  rim.forEach((vertex, i) => {
    columns[vertex] = i;
  });
  const parent: (Point | undefined)[] = [];
  const strip: (Point | undefined)[] = [];
  const point = (index: number): Point => {
    const i = 3 * index;
    return [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
  };
  const unit = (n: Point): Point => V.scale(n, 1 / V.norm(n));
  const angle = (a: Point, b: Point): number =>
    (180 / Math.PI) * Math.atan2(V.norm(V.cross(a, b)), V.dot(a, b));
  for (let i = 0; i < hostEnd; i += 3) {
    const a = mesh.indices[i]!;
    const b = mesh.indices[i + 1]!;
    const c = mesh.indices[i + 2]!;
    const onRim = [columns[a], columns[b], columns[c]].filter(
      (column): column is number => column !== undefined,
    );
    if (onRim.length < 2) continue;
    const p = point(a);
    const normal = unit(V.cross(V.sub(point(b), p), V.sub(point(c), p)));
    const faces = i < stripEnd ? strip : parent;
    for (const column of onRim)
      if (onRim.includes((column + 1) % count)) faces[column] = normal;
  }
  const native = chart.map(([station, phase]) => {
    const { u, v } = host.jet(station, phase);
    return unit(V.scale(V.cross(u, v), host.orientation));
  });
  return rim.map((vertex, i) => {
    const next = (i + 1) % count;
    const owner = unit(V.add(native[i]!, native[next]!));
    return {
      column: i,
      vertex,
      point: point(vertex),
      normal: native[i]!,
      ownerTurn: angle(native[i]!, native[next]!),
      parent: parent[i] === undefined ? null : angle(owner, parent[i]!),
      strip: strip[i] === undefined ? null : angle(owner, strip[i]!),
      between:
        parent[i] === undefined || strip[i] === undefined
          ? null
          : angle(parent[i]!, strip[i]!),
    };
  });
}

function stations(low: number, high: number): number[] {
  const intervals = Math.ceil((high - low) / AutoMovieHumanTrunkRows.MAX_GAP);
  return Array.from(
    { length: intervals + 1 },
    (_, i) => low + ((high - low) * i) / intervals,
  );
}
