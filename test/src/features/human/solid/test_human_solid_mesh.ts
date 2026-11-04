import type { AutoMovieHumanLoftContract } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftContract";
import type { AutoMovieHumanSolidJoin } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidJoin";
import { AutoMovieHumanSolidBlend } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidBlend";
import { AutoMovieHumanSolidBlendChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidBlendChain";
import { AutoMovieHumanSolidChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidChain";
import { AutoMovieHumanSolidMerge } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidMerge";
import { AutoMovieHumanSolidMesh } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidMesh";
import type { AutoMovieHumanSolidVector } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "../../../../../packages/human/src/lofting/IAutoMovieHumanSolidSurface";
import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
const { cross, cylinder, distance, dot, plane } = HumanSolidShapes;

/**
 * A cylinder merged onto a plane tessellates as one closed, outward skin:
 * every seam shared vertex for vertex, every vertex carrying the owner
 * coordinates that evaluate back to it, nothing left inside the cut.
 *
 * @evidence contracts/testing.md#behavioral-verification Merges a 20 mm cylinder along z onto the plane z = 0 with `AutoMovieHumanSolidMerge.create` (part and host chords 8 mm), publishes its blend as a chain with `AutoMovieHumanSolidBlendChain.of` (64 columns), draws it with `AutoMovieHumanSolidMesh.seam` (6 rows) and `AutoMovieHumanSolidMesh.face` for the plane (a 3 mm grid over 120 by 120 mm) and the cylinder (2 mm stations to z = 60, 48 phases), and reads the blend chain's jets against `AutoMovieHumanSolidBlend.jet` at four columns and the mesh's triangles, positions and coordinates alone. It catches a blend chain that is not the blend or loses a ribbon's 2-jet, a seam drawn twice (an edge used once inside the skin or more than twice), a triangle turned inward, a vertex whose coordinates name another point, a duplicate vertex at a seam, and a grid vertex left inside the cut.
 * @evidence contracts/testing.md#independent-expectations Expectations are closed forms of the configuration: the merged solid's boundary is open only along the plane's square edge and the cylinder's top at z = 60, so every other edge is used by exactly two triangles in opposite directions; the outside of every face and of the blend has a positive component along `(x / rho, y / rho, 1)` (the plane's `+z`, the cylinder's radial direction, and the blend turning between them); the host's rail is the circle of radius 28 and the part's rail the circle at z = 8, so no plane vertex lies inside radius 28 and no cylinder vertex below z = 8. Limits: the blend chain within 1e-6 mm of the blend and of its first and second cross derivatives scaled by the span (the B-spline interpolation filter truncated at 14 neighbours keeps `(2 - sqrt 3)^14`, about 1e-8, of a 30 mm column); coordinates read back within 1e-9 mm, a thousand times the rounding of a 60 mm evaluation; distinct vertices more than 1e-9 mm apart.
 * @evidence contracts/testing.md#distinguishing-cases Green: the merged mesh. Red: three made defects on copies of it must each be listed by the check they break: one host rail vertex duplicated into the blend's row (an unshared seam), one triangle turned, and one vertex's coordinate moved by 0.01 radians.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_solid_mesh`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 */
export function test_human_solid_mesh(): void {
  const failures: string[] = [];
  const r: number = 20;
  const part: IAutoMovieHumanSolidSurface = cylinder("column", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], r);
  const host: IAutoMovieHumanSolidSurface = plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const merged: AutoMovieHumanSolidJoin.IResult = AutoMovieHumanSolidMerge.create({
    part,
    host,
    seed: { phi: 0, s: 0.5, y: r - 0.4, theta: 0.3 },
    count: 48,
    tolerance: 1e-12,
    grazing: 0.05,
    width: { part: (): number => 8, host: (): number => 8 },
  });
  if (merged.join === null)
    throw new Error(`no join: ${merged.diagnostics.map((d: AutoMovieHumanLoftContract.IDiagnostic): string => d.detail).join("; ")}`);

  // The blend published as a chain: at every column it is the blend, with
  // both ribbons' 2-jets.
  const count: number = 64;
  const blend: AutoMovieHumanSolidBlendChain.IBlend | null = AutoMovieHumanSolidBlendChain.of("blend", merged.join, count);
  if (blend === null) throw new Error("the join has no rail at a column");
  const blendSurface: IAutoMovieHumanSolidSurface | null = AutoMovieHumanSolidChain.surface(blend.chain);
  if (blendSurface === null) throw new Error("the blend chain carries no jets");
  for (const k of [0, 9, 31, 50]) {
    const c: AutoMovieHumanSolidJoin.IColumn = merged.join.column(blend.seed + (2 * Math.PI * k) / count)!;
    const phase: number = (2 * Math.PI * k) / count;
    for (const w of [0, 0.3, 0.7, 1]) {
      const exact: AutoMovieHumanSolidBlend.IJet = AutoMovieHumanSolidBlend.jet(c.start, c.end, w);
      const read: IAutoMovieHumanSolidSurface.IJet = blendSurface.jet(w * blend.length, phase);
      const L: number = blend.length;
      const gaps: number[] = [
        distance(read.p, exact.point),
        distance([read.u[0] * L, read.u[1] * L, read.u[2] * L], exact.first),
        distance([read.uu[0] * L * L, read.uu[1] * L * L, read.uu[2] * L * L], exact.second),
      ];
      if (!gaps.every((g: number): boolean => g <= 1e-6))
        failures.push(`blend chain at column ${k}, share ${w}: point, first and second derivative off the blend by ${gaps.join(", ")} mm`);
    }
  }

  // The mesh: the seam's rails and blend, then both faces trimmed by them.
  const mesh: AutoMovieHumanSolidMesh.IMesh = AutoMovieHumanSolidMesh.create();
  const joined: AutoMovieHumanSolidMesh.IJoined = AutoMovieHumanSolidMesh.seam(mesh, {
    host,
    part,
    blend: blendSurface,
    length: blend.length,
    hostLoop: blend.host,
    partLoop: blend.part,
    rows: 6,
  });
  const range = (from: number, to: number, step: number): number[] =>
    Array.from({ length: Math.round((to - from) / step) + 1 }, (_: unknown, k: number): number => from + k * step);
  const plate: number[][] = AutoMovieHumanSolidMesh.face(mesh, { surface: host, stations: range(-60, 60, 3), phases: range(-60, 60, 3), loops: [joined.host] });
  const tube: number[][] = AutoMovieHumanSolidMesh.face(mesh, {
    surface: part,
    stations: range(0, 60, 2),
    phases: range(0, 47, 1).map((k: number): number => (2 * Math.PI * k) / 48),
    loops: [joined.part],
  });
  if (plate.length !== 1) failures.push(`the plane leaves ${plate.length} open cycles, expected its outer square only`);
  if (tube.length !== 1) failures.push(`the cylinder leaves ${tube.length} open cycles, expected its top only`);

  // Green, then the three made defects, each listed by its own check.
  failures.push(...audit(mesh).map((f: string): string => `merged mesh: ${f}`));
  const seam: AutoMovieHumanSolidMesh.IMesh = copy(mesh);
  const shared: number = joined.host.vertices[0]!;
  const twin: number = seam.positions.length / 3;
  seam.positions.push(seam.positions[3 * shared]!, seam.positions[3 * shared + 1]!, seam.positions[3 * shared + 2]!);
  seam.coordinates.push(seam.coordinates[3 * shared]!, seam.coordinates[3 * shared + 1]!, seam.coordinates[3 * shared + 2]!);
  const blendTriangle: number = triangles(seam).findIndex(
    (t: number[]): boolean => t.includes(shared) && t.some((v: number): boolean => mesh.owners[mesh.coordinates[3 * v]!]!.name === "blend"),
  );
  for (let k: number = 0; k < 3; k++) if (seam.indices[3 * blendTriangle + k] === shared) seam.indices[3 * blendTriangle + k] = twin;
  const turned: AutoMovieHumanSolidMesh.IMesh = copy(mesh);
  [turned.indices[0], turned.indices[1]] = [turned.indices[1]!, turned.indices[0]!];
  const moved: AutoMovieHumanSolidMesh.IMesh = copy(mesh);
  moved.coordinates[3 * joined.part.vertices[5]! + 2] = moved.coordinates[3 * joined.part.vertices[5]! + 2]! + 0.01;
  const red: [string, AutoMovieHumanSolidMesh.IMesh, string][] = [
    ["an unshared seam", seam, "edge"],
    ["a turned triangle", turned, "inward"],
    ["a moved coordinate", moved, "coordinates"],
  ];
  for (const [what, made, check] of red)
    if (!audit(made).some((f: string): boolean => f.startsWith(check))) failures.push(`made defect, ${what}: no "${check}" finding`);

  if (failures.length) throw new Error(`${failures.length} solid mesh failures:\n${failures.join("\n")}`);

  /**
   * Every finding on a mesh of the merged cylinder, each led by its check's
   * name: `edge`, `inward`, `coordinates`, `duplicate`, `inside`.
   */
  function audit(m: AutoMovieHumanSolidMesh.IMesh): string[] {
    const out: string[] = [];
    const point = (v: number): Vec3 => [m.positions[3 * v]!, m.positions[3 * v + 1]!, m.positions[3 * v + 2]!];

    // Edges: two uses in opposite directions, but on the open rims.
    const uses: Map<string, number> = new Map();
    for (const t of triangles(m))
      for (let k: number = 0; k < 3; k++) {
        const key: string = `${t[k]},${t[(k + 1) % 3]}`;
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }
    const rim = (v: number): boolean => {
      const p: Vec3 = point(v);
      return Math.abs(p[2] - 60) < 1e-9 || (Math.abs(p[2]) < 1e-9 && Math.max(Math.abs(p[0]), Math.abs(p[1])) > 60 - 1e-9);
    };
    for (const [key, n] of uses) {
      const [a, b] = key.split(",").map(Number) as [number, number];
      const back: number = uses.get(`${b},${a}`) ?? 0;
      if (n !== 1 || (back !== 1 && !(back === 0 && rim(a) && rim(b))))
        out.push(`edge ${a}-${b} used ${n} times this way and ${back} the other`);
    }

    // Outward: every triangle faces along (x / rho, y / rho, 1).
    for (const t of triangles(m)) {
      const [a, b, c] = t.map(point) as [Vec3, Vec3, Vec3];
      const n: Vec3 = cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
      const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      const rho: number = Math.hypot(g[0], g[1]);
      if (!(dot(n, [g[0] / rho, g[1] / rho, 1]) > 0)) out.push(`inward triangle ${t.join(", ")} at ${g.join(", ")}`);
    }

    // Coordinates name their own points; no vertex twice; none in the cut.
    const count: number = m.positions.length / 3;
    const seen: Map<string, number> = new Map();
    for (let v: number = 0; v < count; v++) {
      const p: Vec3 = point(v);
      const e: Vec3 = AutoMovieHumanSolidMesh.evaluate(m, v);
      if (!(distance(p, e) <= 1e-9)) out.push(`coordinates of vertex ${v} name ${e.join(", ")}, not ${p.join(", ")}`);
      const key: string = p.map((x: number): string => x.toFixed(6)).join(",");
      const other: number | undefined = seen.get(key);
      if (other !== undefined && distance(p, point(other)) <= 1e-9) out.push(`duplicate vertices ${other} and ${v} at ${p.join(", ")}`);
      seen.set(key, v);
      const owner: AutoMovieHumanSolidMesh.IOwner = m.owners[m.coordinates[3 * v]!]!;
      if (owner.name === "floor" && Math.hypot(p[0], p[1]) < 28 - 1e-9) out.push(`inside the cut: plane vertex ${v} at radius ${Math.hypot(p[0], p[1])}`);
      if (owner.name === "column" && p[2] < 8 - 1e-9) out.push(`inside the cut: cylinder vertex ${v} at z ${p[2]}`);
    }
    return out;
  }
}

/** A mesh's triangles as index triples. */
function triangles(m: AutoMovieHumanSolidMesh.IMesh): number[][] {
  return Array.from({ length: m.indices.length / 3 }, (_: unknown, k: number): number[] => m.indices.slice(3 * k, 3 * k + 3));
}

/** A mesh's copy whose buffers can be changed. */
function copy(m: AutoMovieHumanSolidMesh.IMesh): AutoMovieHumanSolidMesh.IMesh {
  return { positions: [...m.positions], indices: [...m.indices], coordinates: [...m.coordinates], owners: m.owners };
}
