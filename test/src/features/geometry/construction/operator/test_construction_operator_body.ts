import { type AutoMovieLoftContract, AutoMovieSolidBody, AutoMovieSolidMesh, type AutoMovieSolidVector, type IAutoMovieSolidSurface } from "@automovie/engine";
import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

type Vec3 = AutoMovieSolidVector.Vec3;
type IMerged = ReturnType<typeof AutoMovieSolidBody.merge>;
const { cross, cylinder, distance, dot, plane } = HumanSolidShapes;

/**
 * A body built by two merges, the second traced against the first's faces,
 * tessellates as one closed, outward skin: a column merged onto a floor, then
 * a beam merged onto the column where its curve crosses from the column's
 * face onto the column's blend.
 *
 * Scenarios:
 * 1. A 10 mm cylinder along `z` merged onto the plane `z = 0` (chords 6 mm), then a 6 mm cylinder along `-x` at height 9 merged onto that body (chords 3 mm on the beam, 2 mm on the body): both merges publish a blend with no diagnostic, and the second's host rail runs over more than one face of the body (the column's face and its blend).
 * 2. The drawn mesh: every edge used once each way but on the open ends `draw` returns, every floor triangle facing up (so, with the edges paired, every triangle faces out), every vertex's owner coordinates evaluating back to it, and no vertex twice.
 * 3. Red: the same mesh with one triangle turned, one triangle dropped and one coordinate moved must each fail its own check.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the body with `AutoMovieSolidBody.create`, `.merge` twice and `.draw`, and reads the blends' host rail faces and actual mesh triangles, positions and coordinates (`AutoMovieSolidMesh.evaluate`). Caller-owned input wrappers invoke each original jet once with its original receiver and record index offsets at the first draw reading of each face; they replace no producer method. Failure-only public records include every emission range, cycle chart and mesh buffer, distinguishing emitter faces from vertex provenance. Original manifold, orientation, coordinate and duplicate checks remain unchanged.
 * @evidence contracts/testing.md#independent-expectations The expectations are what a closed oriented two-manifold with boundary is (each interior edge in two triangles, opposite in direction; a connected orientable skin is outward everywhere once it is outward on one face, the floor's `+z`), and the owner coordinates' contract (a vertex's coordinates evaluate to its own point, within 1e-9 mm). The beam's bottom line at height 3 lies between the floor and the column's part rail at 6 mm, so its curve meets the column's blend there and the column's face above it; this is the kernel worker's suggested case for merging onto a merged body (b84ae180d). Oracle limit: the curve's own shape is read by the intersection and merge tests, not here.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the two-merge body. Negative: the turned, dropped and moved made meshes. Single merges and their rails belong to `test_construction_operator_merge` and `test_construction_operator_mesh`; continuity at the rails to the seam audit.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_body`; it builds closed-form surfaces in process, generates no person and starts no host, browser or GPU.
 */
export function test_construction_operator_body(): void {
  const failures: string[] = [];
  const range: (from: number, to: number, step: number) => number[] = (from: number, to: number, step: number): number[] =>
    Array.from({ length: Math.round((to - from) / step) + 1 }, (_: unknown, i: number): number => from + i * step);
  const turn: number[] = range(0, 47, 1).map((k: number): number => (2 * Math.PI * k) / 48);
  const floor: IAutoMovieSolidSurface = plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const column: IAutoMovieSolidSurface = cylinder("column", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], 10);
  const beam: IAutoMovieSolidSurface = cylinder("beam", [30, 0, 9], [-1, 0, 0], [0, 0, 1], [0, 1, 0], 6);
  const details: (d: AutoMovieLoftContract.IDiagnostic[]) => string = (d: AutoMovieLoftContract.IDiagnostic[]): string => d.map((x: AutoMovieLoftContract.IDiagnostic): string => x.detail).join("; ");

  // 1. The column onto the floor, then the beam onto the body.
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("made", [{ surface: floor, stations: range(-40, 40, 2), phases: range(-40, 40, 2) }]);
  const first: IMerged = AutoMovieSolidBody.merge(body, {
    name: "blend.column",
    kind: "merge",
    part: { surface: column, stations: range(0, 40, 1), phases: turn },
    join: { seed: { phi: 0, s: 0.5, y: 9.6, theta: 0.3 }, count: 48, tolerance: 1e-12, grazing: 0.05, width: { part: (): number => 6, host: (): number => 6 } },
    count: 48,
    rows: 4,
  });
  if (first.blend === null) throw new Error(`column: no blend (${details(first.diagnostics)})`);
  if (first.diagnostics.length !== 0) failures.push(`column: diagnostics ${details(first.diagnostics)}`);

  // The beam's top at phase 0 meets the column's face (atlas face 1) at x = 10, height 15.
  const second: IMerged = AutoMovieSolidBody.merge(body, {
    name: "blend.beam",
    kind: "merge",
    part: { surface: beam, stations: range(0, 26, 0.5), phases: turn },
    join: { seed: { phi: 0, s: 19.6, y: 14.7, theta: 0.05, face: 1 }, count: 48, tolerance: 1e-12, grazing: 0.05, width: { part: (): number => 3, host: (): number => 2 } },
    count: 48,
    rows: 3,
  });
  if (second.blend === null) failures.push(`beam: no blend (${details(second.diagnostics)})`);
  else {
    if (second.diagnostics.length !== 0) failures.push(`beam: diagnostics ${details(second.diagnostics)}`);
    const faces: Set<number> = new Set(second.blend.host.faces ?? []);
    if (!(faces.size > 1)) failures.push(`beam: the host rail runs over ${faces.size} face(s), expected the column's face and its blend`);
  }

  // 2. The drawn mesh.
  // These caller-owned input wrappers preserve each actual jet and record the
  // emission ranges without replacing a producer method or attributing a face
  // from a triangle's first vertex owner.
  const ranges: { name: string; start: number; end: number }[] = [];
  const drawn: AutoMovieSolidBody.IBody = {
    ...body,
    faces: body.faces.map((face: AutoMovieSolidBody.IFace): AutoMovieSolidBody.IFace => {
      const range: { name: string; start: number; end: number } = {
        name: face.surface.name, start: -1, end: -1,
      };
      ranges.push(range);
      return {
        ...face,
        surface: {
          ...face.surface,
          jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
            if (range.start < 0) {
              const previous: { name: string; start: number; end: number } | undefined = ranges.find((candidate: { name: string; start: number; end: number }): boolean => candidate.start >= 0 && candidate.end < 0);
              if (previous !== undefined) previous.end = body.mesh.indices.length;
              range.start = body.mesh.indices.length;
            }
            return face.surface.jet.call(face.surface, u, v);
          },
        },
      };
    }),
  };
  const open: AutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(drawn);
  for (const range of ranges)
    if (range.start >= 0 && range.end < 0) range.end = body.mesh.indices.length;
  const rim: Set<number> = new Set(open.flat().flatMap((boundary: AutoMovieSolidMesh.IOpen): number[] => boundary.vertices));
  const mesh: AutoMovieSolidMesh.IMesh = body.mesh;
  failures.push(...audit(mesh, rim));

  // 3. Red: a turned triangle, a dropped triangle, a moved coordinate.
  const turned: AutoMovieSolidMesh.IMesh = copy(mesh);
  [turned.indices[0], turned.indices[1]] = [turned.indices[1]!, turned.indices[0]!];
  const dropped: AutoMovieSolidMesh.IMesh = copy(mesh);
  dropped.indices.splice(3 * Math.floor(dropped.indices.length / 6), 3);
  const moved: AutoMovieSolidMesh.IMesh = copy(mesh);
  moved.coordinates[3 * 7 + 1] = moved.coordinates[3 * 7 + 1]! + 0.01;
  for (const [what, made, check] of [
    ["a turned triangle", turned, "edge"],
    ["a dropped triangle", dropped, "edge"],
    ["a moved coordinate", moved, "coordinates"],
  ] as [string, AutoMovieSolidMesh.IMesh, string][])
    if (!audit(made, rim).some((f: string): boolean => f.startsWith(check))) failures.push(`made defect, ${what}: no "${check}" finding`);

  if (failures.length !== 0) {
    console.log(`construction_operator_body source record: ${JSON.stringify({
      ranges,
      faces: body.faces.map((face: AutoMovieSolidBody.IFace): { name: string; stations: number[]; phases: number[]; cycles: AutoMovieSolidBody.IFace["cycles"] } => ({
        name: face.surface.name, stations: face.stations, phases: face.phases, cycles: face.cycles,
      })),
      mesh: {
        positions: mesh.positions,
        indices: mesh.indices,
        coordinates: mesh.coordinates,
        owners: mesh.owners.map((owner: AutoMovieSolidMesh.IOwner): string => owner.name),
      },
      open,
    })}`);
    body.faces.forEach((f: AutoMovieSolidBody.IFace, i: number): void => {
      failures.push(`face ${f.surface.name}: cycles ${f.cycles.map((c: { kind: string; vertices: number[] }): string => `${c.kind}(${c.vertices.length})`).join(", ")}; open ${(open[i] ?? []).map((c: AutoMovieSolidMesh.IOpen): string => String(c.vertices.length)).join(", ")}`);
    });
    throw new Error(`${failures.length} solid body failures:\n${failures.join("\n")}`);
  }
}

/**
 * Every finding on a drawn body, each led by its check's name: `edge` (an
 * edge not used once each way, unless both its ends lie on an open end),
 * `outward` (a floor triangle facing down), `coordinates` (a vertex whose
 * coordinates evaluate elsewhere), `duplicate` (two vertices at one point).
 */
function audit(m: AutoMovieSolidMesh.IMesh, rim: ReadonlySet<number>): string[] {
  const out: string[] = [];
  const point: (v: number) => Vec3 = (v: number): Vec3 => [m.positions[3 * v]!, m.positions[3 * v + 1]!, m.positions[3 * v + 2]!];
  const uses: Map<string, number> = new Map();
  for (let t: number = 0; t + 2 < m.indices.length; t += 3)
    for (let k: number = 0; k < 3; k++) {
      const key: string = `${m.indices[t + k]},${m.indices[t + ((k + 1) % 3)]}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  for (const [key, n] of uses) {
    const [a, b]: number[] = key.split(",").map(Number);
    const back: number = uses.get(`${b},${a}`) ?? 0;
    if (n !== 1 || (back !== 1 && !(back === 0 && rim.has(a!) && rim.has(b!)))) {
      const describe: (v: number) => string = (v: number): string => `${m.owners[m.coordinates[3 * v]!]!.name}[${m.coordinates[3 * v + 1]},${m.coordinates[3 * v + 2]}]`;
      out.push(`edge ${a}-${b} used ${n} times this way and ${back} the other (${describe(a!)} to ${describe(b!)})`);
    }
  }
  for (let t: number = 0; t + 2 < m.indices.length; t += 3) {
    const [a, b, c]: Vec3[] = [m.indices[t]!, m.indices[t + 1]!, m.indices[t + 2]!].map(point);
    const owner: AutoMovieSolidMesh.IOwner = m.owners[m.coordinates[3 * m.indices[t]!]!]!;
    const n: Vec3 = cross([b![0] - a![0], b![1] - a![1], b![2] - a![2]], [c![0] - a![0], c![1] - a![1], c![2] - a![2]]);
    if (owner.name === "floor" && Math.abs(a![2]) < 1e-9 && Math.abs(b![2]) < 1e-9 && Math.abs(c![2]) < 1e-9 && !(dot(n, [0, 0, 1]) > 0)) out.push(`outward: floor triangle ${t / 3} faces down`);
  }
  const seen: Map<string, number> = new Map();
  for (let v: number = 0; v < m.positions.length / 3; v++) {
    const p: Vec3 = point(v);
    const e: Vec3 = AutoMovieSolidMesh.evaluate(m, v);
    if (!(distance(p, e) <= 1e-9)) out.push(`coordinates of vertex ${v} name ${e.join(", ")}, not ${p.join(", ")}`);
    const key: string = p.map((x: number): string => x.toFixed(6)).join(",");
    const other: number | undefined = seen.get(key);
    if (other !== undefined && distance(p, point(other)) <= 1e-9) out.push(`duplicate vertices ${other} and ${v} at ${p.join(", ")}`);
    seen.set(key, v);
  }
  return out;
}

/** A mesh's copy whose buffers can be changed. */
function copy(m: AutoMovieSolidMesh.IMesh): AutoMovieSolidMesh.IMesh {
  return { positions: [...m.positions], indices: [...m.indices], coordinates: [...m.coordinates], owners: m.owners };
}
