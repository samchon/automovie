import { AutoMovieSolidMesh, fairAutoMovieSolidMesh } from "@automovie/engine";

/**
 * The sharpest dihedral a G1 fill may keep where it meets the flat flanks round its rim, degrees: between the thin-plate fill's 8.8 and a
 * harmonic fill's 27.3 on scenario 2's grid.
 */
const RIM_DEGREES: number = 15;

/** A flat `[x, y, z]` position list and its triangles, mm. */
interface Sheet {
  /** Positions, mm. */
  positions: number[];

  /** Triangle indices. */
  indices: number[];
}

/**
 * A disc of a drawn mesh faired about a vertex is filled by the thin-plate surface its two outer rings hold: a fold through the disc is
 * taken out and the fill meets the skin round it with that skin's tangent plane, and nothing outside the disc moves.
 *
 * Scenarios:
 * 1. Dented plane: a unit grid of 41 by 41 vertices in z = 0 whose vertices within 2 mm of the middle are pushed 1 mm down, the notch a
 *    construction leaves at a corner. Faired over 4 mm, every vertex lies within 1e-9 mm of the plane, since a plane is the thin-plate
 *    surface its flat rim holds, and every vertex past 4 mm along the mesh keeps its exact position.
 * 2. Folded plane: the same grid folded along the line x = 0 by 30 degrees each side, `z = -tan(30 deg) |x|`, and its middle row
 *    pushed down 1.5 mm more within 3 mm of the middle, a pleat at the fold. Faired over 5 mm, the sharpest dihedral between neighbouring
 *    triangles within 2.5 mm of the middle falls below half the fold's own 60 degrees (the pleat's is above 60), and where the fill meets
 *    the flat flanks round its rim, off the fold line, no dihedral reaches `RIM_DEGREES`: the thin-plate fill meets them at 8.8 degrees,
 *    where a harmonic fill, which holds only the rim's positions, meets them at 27.3 (both measured on this grid).
 * 3. Seam: the dented plane drawn as two faces whose shared row x = 0 is held twice, as distinct vertex IDs at one position, the way
 *    two faces' boundaries may hold a shared curve. Faired over 4 mm, both copies of every seam vertex take one position, so the seam
 *    does not open, and the result equals scenario 1's.
 * 4. Gap: a second dented sheet 1 mm under the first, unconnected. Faired over 4 mm about the first sheet's middle, the second sheet keeps
 *    every position, since a disc is gathered along the mesh's edges and not through space.
 * 5. Premise: a region with no source, with a source that is no vertex of the mesh, or whose radius is not positive is refused by a thrown error.
 * 6. Groove: the plane with a groove 1 mm deep along x = 0 from y = -6 to 6 mm, the trace a merge's narrow blend leaves. Faired over a band 3 mm
 *    wide about the groove's 13 vertices, every vertex lies within 1e-9 mm of the plane: a band about a curve is filled as a disc is.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls fairAutoMovieSolidMesh on analytic grids and reads only the returned positions: distances to the plane, dihedrals between neighbouring triangles, coincidence of duplicated IDs and the untouched positions outside the disc.
 * @evidence contracts/development/testing.md#independent-expectations A plane holds its flat rim exactly, so the dent's fill is the plane; the fold's dihedral is 60 degrees by construction, and the unfaired pleat's is measured here before the call, so the expectation does not read the engine.
 * @evidence contracts/development/testing.md#distinguishing-cases The dent separates a fill from no fill, the fold separates a G1 fill from a harmonic one that only meets the rim's positions (27.3 degrees at the rim against 8.8), the seam separates a weld of coincident IDs from per-ID moves that open a crack, the gap separates a disc walked along the mesh from a ball in space, and the groove separates a band about many sources from a disc about one.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include construction_mesh_fair. It generates no person and starts no renderer, host or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six numbered scenarios it runs, each naming its input and the behavior it pins.
 */
export function test_construction_mesh_fair(): void {
  const failures: string[] = [];

  // Scenario 1.
  const dented: Sheet = grid(20, (x: number, y: number): number => (Math.hypot(x, y) < 2 ? -1 : 0));
  const middle: number = 20 * 41 + 20;
  const before: number[] = dented.positions.slice();
  fair(dented, [{ vertices: [middle], radius: 4 }]);
  const flatness: number = Math.max(...range(dented.positions.length / 3).map((v: number): number => Math.abs(dented.positions[3 * v + 2]!)));
  if (!(flatness < 1e-9)) failures.push(`dented plane: a vertex stands ${flatness} mm off the plane after the fill`);
  const outside: number = range(dented.positions.length / 3).filter((v: number): boolean => Math.hypot(before[3 * v]!, before[3 * v + 1]!) > 4 * Math.SQRT2 && [0, 1, 2].some((a: number): boolean => dented.positions[3 * v + a] !== before[3 * v + a])).length;
  if (outside !== 0) failures.push(`dented plane: ${outside} vertices beyond the disc moved`);

  // Scenario 2.
  const slope: number = Math.tan(Math.PI / 6);
  const folded: Sheet = grid(20, (x: number, y: number): number => -slope * Math.abs(x) - (x === 0 && Math.abs(y) < 3 ? 1.5 : 0));
  const fold: number = (2 * Math.atan(slope) * 180) / Math.PI;
  const centre = (p: number[]): boolean => Math.hypot(p[0]!, p[1]!) < 2.5;
  const flank = (p: number[]): boolean => Math.abs(p[0]!) > 1.5 && Math.hypot(p[0]!, p[1]!) > 3.5 && Math.hypot(p[0]!, p[1]!) < 6.5;
  const rough: number = sharpest(folded, centre);
  fair(folded, [{ vertices: [middle], radius: 5 }]);
  const smooth: number = sharpest(folded, centre);
  const rim: number = sharpest(folded, flank);
  if (!(rough > fold)) failures.push(`folded plane: the pleat's sharpest dihedral ${rough} degrees is not above the fold's ${fold}, so the case does not test a pleat`);
  if (!(smooth < fold / 2)) failures.push(`folded plane: the fill's sharpest dihedral about the middle is ${smooth} degrees, not under half the fold's ${fold}`);
  if (!(rim < RIM_DEGREES)) failures.push(`folded plane: the fill meets the flat flanks round its rim at ${rim} degrees, not under ${RIM_DEGREES}`);

  // Scenario 3.
  const seamed: Sheet = split(grid(20, (x: number, y: number): number => (Math.hypot(x, y) < 2 ? -1 : 0)));
  fair(seamed, [{ vertices: [middle], radius: 4 }]);
  const copies: number = 41 * 41;
  let opened: number = 0;
  let differs: number = 0;
  for (let k: number = 0; k < 41; ++k) {
    const [v, w] = [20 * 41 + k, copies + k];
    if ([0, 1, 2].some((a: number): boolean => seamed.positions[3 * v + a] !== seamed.positions[3 * w + a])) ++opened;
  }
  for (let v: number = 0; v < copies; ++v) if ([0, 1, 2].some((a: number): boolean => Math.abs(seamed.positions[3 * v + a]! - dented.positions[3 * v + a]!) > 1e-9)) ++differs;
  if (opened !== 0) failures.push(`seam: ${opened} of 41 seam vertices took two positions`);
  if (differs !== 0) failures.push(`seam: ${differs} vertices differ from the single face's fill`);

  // Scenario 4.
  const upper: Sheet = grid(20, (x: number, y: number): number => (Math.hypot(x, y) < 2 ? -1 : 0));
  const lower: Sheet = grid(20, (x: number, y: number): number => (Math.hypot(x, y) < 2 ? -2 : -1));
  const pair: Sheet = { positions: [...upper.positions, ...lower.positions], indices: [...upper.indices, ...lower.indices.map((i: number): number => i + copies)] };
  const kept: number[] = pair.positions.slice(3 * copies);
  fair(pair, [{ vertices: [middle], radius: 4 }]);
  const moved: number = range(copies).filter((v: number): boolean => [0, 1, 2].some((a: number): boolean => pair.positions[3 * (copies + v) + a] !== kept[3 * v + a])).length;
  if (moved !== 0) failures.push(`gap: ${moved} vertices of the unconnected sheet moved`);

  // Scenario 5.
  for (const disc of [{ vertices: [copies], radius: 4 }, { vertices: [], radius: 4 }, { vertices: [middle], radius: 0 }, { vertices: [middle], radius: Number.NaN }]) {
    let thrown: boolean = false;
    try {
      fair(grid(20, (): number => 0), [disc]);
    } catch {
      thrown = true;
    }
    if (!thrown) failures.push(`premise: the disc ${JSON.stringify(disc)} was not refused`);
  }

  // Scenario 6.
  const grooved: Sheet = grid(20, (x: number, y: number): number => (x === 0 && Math.abs(y) <= 6 ? -1 : 0));
  fair(grooved, [{ vertices: range(13).map((k: number): number => 20 * 41 + 14 + k), radius: 3 }]);
  const groove: number = Math.max(...range(grooved.positions.length / 3).map((v: number): number => Math.abs(grooved.positions[3 * v + 2]!)));
  if (!(groove < 1e-9)) failures.push(`groove: a vertex stands ${groove} mm off the plane after the band's fill`);
  if (failures.length > 0) throw new Error(`${failures.length} fairing failures:\n${failures.join("\n")}`);
}

/** A square grid of unit cells from `-half` to `half` in x and y, heights `z(x, y)`, each cell cut along its first diagonal. */
function grid(half: number, z: (x: number, y: number) => number): Sheet {
  const side: number = 2 * half + 1;
  const positions: number[] = [];
  for (let i: number = 0; i < side; ++i) for (let j: number = 0; j < side; ++j) positions.push(i - half, j - half, z(i - half, j - half));
  const indices: number[] = [];
  for (let i: number = 0; i + 1 < side; ++i)
    for (let j: number = 0; j + 1 < side; ++j) {
      const [a, b, c, d] = [i * side + j, (i + 1) * side + j, (i + 1) * side + j + 1, i * side + j + 1];
      indices.push(a, b, c, a, c, d);
    }
  return { positions, indices };
}

/** The grid of side 41 with its row x = 0 (i = 20) held twice: the cells with x > 0 read a copy of each of its vertices, appended. */
function split(sheet: Sheet): Sheet {
  const side: number = 41;
  const copies: number = side * side;
  const positions: number[] = [...sheet.positions];
  for (let k: number = 0; k < side; ++k) positions.push(...sheet.positions.slice(3 * (20 * side + k), 3 * (20 * side + k) + 3));
  const indices: number[] = sheet.indices.map((v: number, n: number): number => {
    const t: number = n - (n % 3);
    const right: boolean = [0, 1, 2].every((k: number): boolean => Math.floor(sheet.indices[t + k]! / side) >= 20);
    return right && Math.floor(v / side) === 20 ? copies + (v % side) : v;
  });
  return { positions, indices };
}

/** Run the fill on a sheet as a mesh with no owners. */
function fair(sheet: Sheet, discs: { vertices: number[]; radius: number }[]): void {
  const mesh: AutoMovieSolidMesh.IMesh = { positions: sheet.positions, indices: sheet.indices, coordinates: [], owners: [] };
  fairAutoMovieSolidMesh(mesh, discs);
}

/** The sharpest dihedral, degrees, between two triangles sharing an edge whose midpoint `where` admits. */
function sharpest(sheet: Sheet, where: (p: number[]) => boolean): number {
  const at = (v: number): number[] => sheet.positions.slice(3 * v, 3 * v + 3);
  const normal = (t: number): number[] => {
    const [a, b, c] = [0, 1, 2].map((k: number): number[] => at(sheet.indices[t + k]!)) as [number[], number[], number[]];
    const u: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
    const w: number[] = [c[0]! - a[0]!, c[1]! - a[1]!, c[2]! - a[2]!];
    const n: number[] = [u[1]! * w[2]! - u[2]! * w[1]!, u[2]! * w[0]! - u[0]! * w[2]!, u[0]! * w[1]! - u[1]! * w[0]!];
    const l: number = Math.hypot(n[0]!, n[1]!, n[2]!);
    return n.map((x: number): number => x / l);
  };
  const edges: Map<string, number[]> = new Map();
  for (let t: number = 0; t < sheet.indices.length; t += 3)
    for (let k: number = 0; k < 3; ++k) {
      const [a, b] = [sheet.indices[t + k]!, sheet.indices[t + ((k + 1) % 3)]!];
      const key: string = Math.min(a, b) + "_" + Math.max(a, b);
      edges.set(key, [...(edges.get(key) ?? []), t]);
    }
  let worst: number = 0;
  for (const [key, ts] of edges) {
    if (ts.length !== 2) continue;
    const [a, b] = key.split("_").map(Number) as [number, number];
    if (!where([0, 1, 2].map((k: number): number => (at(a)[k]! + at(b)[k]!) / 2))) continue;
    const [n, m] = [normal(ts[0]!), normal(ts[1]!)] as [number[], number[]];
    worst = Math.max(worst, (Math.acos(Math.max(-1, Math.min(1, n[0]! * m[0]! + n[1]! * m[1]! + n[2]! * m[2]!))) * 180) / Math.PI);
  }
  return worst;
}

/** `[0, n)`. */
function range(n: number): number[] {
  return Array.from({ length: n }, (_: unknown, k: number): number => k);
}
