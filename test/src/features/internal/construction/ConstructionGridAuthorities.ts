import { AutoMovieSolidMesh, type IAutoMovieSolidSurface } from "@automovie/engine";

/** Original face-chart coordinates, independent of a shared vertex's owner. */
type Point = [number, number];

/**
 * A curved face retains its grid's independent chord bound beside aligned authorities.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public Mesh.face with actual foreign-owned indexed domain boundaries and reads emitted positions, triangles and directed edge uses. No private full-cell counter or replacement triangulator supplies the result.
 * @evidence contracts/testing.md#independent-expectations On S(u,v)=scale*(u,v,u*u), the maximum chord error is scale*(max(u)-min(u))^2/4 at the extreme-u edge midpoint. Its actual emitted endpoint midpoint is compared with the original parabola; a quarter-width cell bounds this by scale/64. The unit chart has area one, every original domain edge has one triangle use, and every interior edge has opposite uses. Binary64 arithmetic receives 64 epsilon times the world scale.
 * @evidence contracts/testing.md#distinguishing-cases Covers three world units, both orientations, aligned adjacent segments meeting grid corners, an extra exact mid-side authority, a near-but-unequal corner and a coarse unsplit authority. Only the aligned and added-midpoint grids claim the quarter-width chord bound; immutable coarse boundaries cannot promise that bound.
 * @evidence contracts/testing.md#execution-ownership Runs synchronously inside construction_mesh_selection with small analytic surfaces and caller-owned meshes; no person, file, process, renderer or profiler is created. Existing mesh_transaction and mesh_regions own original exceptions, rollback, true cuts and periodic domains.
 */
export function ConstructionGridAuthorities(failures: string[]): void {
  for (const scale of [0.001, 1, 1000])
    for (const orientation of [1, -1] as const)
      for (const kind of ["aligned", "split", "near", "coarse"] as const)
        try {
          inspect(scale, orientation, kind, failures);
        } catch (error: unknown) {
          failures.push(`Grid authority ${scale}/${orientation}/${kind}: ${String(error)}`);
        }
}

/** Verify actual triangles on the prescribed parabola, retaining every boundary identity. */
function inspect(scale: number, orientation: 1 | -1, kind: string, failures: string[]): void {
  const surface: IAutoMovieSolidSurface = {
    name: "parabolic-grid", orientation,

    /** Exact polynomial source and both physical partial orders. */
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      return { p: [scale * u, scale * v, scale * u * u],
        u: [scale, 0, 2 * scale * u], v: [0, scale, 0],
        uu: [0, 0, 2 * scale], uv: [0, 0, 0], vv: [0, 0, 0] };
    },
  };
  const stations: number[] = [0, 0.25, 0.5, 0.75, 1];
  const phases: number[] = [0, 0.5, 1];
  const bottom: number[] = kind === "coarse" ? [0, 1]
    : kind === "near" ? [0, 0.25 + 1 / 1024, 0.5, 0.75, 1]
    : kind === "split" ? [0, 0.125, 0.25, 0.5, 0.75, 1] : stations;
  const chart: Point[] = [
    ...bottom.map((u: number): Point => [u, 0]),
    ...phases.slice(1).map((v: number): Point => [1, v]),
    ...stations.slice(0, -1).reverse().map((u: number): Point => [u, 1]),
    [0, 0.5],
  ];
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const foreign: number = AutoMovieSolidMesh.owner(mesh, {
    ...surface, name: "foreign-domain-owner",

    /** Deliberately different original owner chart for the identical boundary points. */
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      return surface.jet(u - 4, v + 6);
    },
  });
  const vertices: number[] = chart.map(([u, v]: Point): number =>
    AutoMovieSolidMesh.vertex(mesh, [scale * u, scale * v, scale * u * u], foreign, u + 4, v - 6));
  const original: string = JSON.stringify({ positions: mesh.positions, coordinates: mesh.coordinates });
  const addresses: Map<number, Point> = new Map(vertices.map((id: number, k: number): [number, Point] => [id, chart[k]!]));
  AutoMovieSolidMesh.face(mesh, { surface, stations, phases, loops: [],
    domainLoops: [{ kind: "island", chart, vertices }] });
  const label: string = `Grid authority ${scale}/${orientation}/${kind}`;
  const edges: Map<string, number> = new Map();
  const used: Set<number> = new Set();
  let area: number = 0;
  let maxError: number = 0;
  if (mesh.indices.length === 0) failures.push(label + " returned no triangles");
  for (let at: number = 0; at < mesh.indices.length; at += 3) {
    const ids: number[] = mesh.indices.slice(at, at + 3);
    const points: Point[] = ids.map((id: number): Point => addresses.get(id) ?? [mesh.coordinates[3 * id + 1]!, mesh.coordinates[3 * id + 2]!]);
    const [a, b, c]: [Point, Point, Point] = points as [Point, Point, Point];
    const signed: number = orientation * ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
    if (!(Number.isFinite(signed) && signed > 0)) failures.push(label + " lost positive chart orientation");
    area += signed;
    const low: number = points.reduce((best: number, p: Point, k: number): number => p[0] < points[best]![0] ? k : best, 0);
    const high: number = points.reduce((best: number, p: Point, k: number): number => p[0] > points[best]![0] ? k : best, 0);
    const mean: number = (points[low]![0] + points[high]![0]) / 2;
    const chord: number = (mesh.positions[3 * ids[low]! + 2]! + mesh.positions[3 * ids[high]! + 2]!) / 2;
    const error: number = Math.abs(chord - scale * mean * mean);
    if (!Number.isFinite(error)) failures.push(label + " has nonfinite actual chord error");
    maxError = Math.max(maxError, error);
    for (let k: number = 0; k < 3; k++) {
      used.add(ids[k]!);
      const key: string = ids[k] + "/" + ids[(k + 1) % 3];
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  if (!(Number.isFinite(area) && Math.abs(area - 1) <= 64 * Number.EPSILON * mesh.indices.length))
    failures.push(label + " changed the unit analytic area");
  if ((kind === "aligned" || kind === "split") && !(maxError <= scale / 64 + 64 * Number.EPSILON * scale))
    failures.push(label + " exceeded its independent parabolic cell chord bound: " + maxError);
  const boundary: Set<string> = new Set();
  for (let k: number = 0; k < vertices.length; k++) {
    const a: number = vertices[k]!;
    const b: number = vertices[(k + 1) % vertices.length]!;
    boundary.add(Math.min(a, b) + "/" + Math.max(a, b));
    if (!used.has(a) || (edges.get(a + "/" + b) ?? 0) + (edges.get(b + "/" + a) ?? 0) !== 1)
      failures.push(label + " skipped or subdivided an original domain edge");
  }
  for (const [key, count] of edges) {
    const [a, b]: number[] = key.split("/").map(Number);
    const reverse: number = edges.get(b + "/" + a) ?? 0;
    const exterior: boolean = boundary.has(Math.min(a!, b!) + "/" + Math.max(a!, b!));
    if (count !== 1 || reverse !== (exterior ? 0 : 1))
      failures.push(label + " changed actual boundary/interior directed incidence: " + key);
  }
  if (JSON.stringify({ positions: mesh.positions.slice(0, 3 * vertices.length), coordinates: mesh.coordinates.slice(0, 3 * vertices.length) }) !== original)
    failures.push(label + " changed a foreign-owned boundary point or chart");
}
