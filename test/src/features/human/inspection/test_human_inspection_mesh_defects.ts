import { HumanInspectionMeshDefects as M } from "../../../../../packages/human/src/inspection/HumanInspectionMeshDefects";

/** A made closed octahedron of radius r centred at c, wound outward (counter-clockwise seen from outside). */
function octahedron(r: number, c: [number, number, number] = [0, 0, 0]): M.IMesh {
  const v: number[][] = [
    [r, 0, 0],
    [-r, 0, 0],
    [0, r, 0],
    [0, -r, 0],
    [0, 0, r],
    [0, 0, -r],
  ];
  return {
    positions: v.flatMap((p: number[]): number[] => [p[0]! + c[0], p[1]! + c[1], p[2]! + c[2]]),
    indices: [0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3, 5],
  };
}

/** Two made meshes as one. */
function join(a: M.IMesh, b: M.IMesh): M.IMesh {
  const offset: number = a.positions.length / 3;
  return { positions: [...Array.from(a.positions), ...Array.from(b.positions)], indices: [...Array.from(a.indices), ...Array.from(b.indices).map((i: number): number => i + offset)] };
}

/**
 * The mesh defect detectors report every open, non-manifold and
 * inconsistently wound edge, an inside-out skin, sliver and degenerate
 * triangles, and skin crossing itself, on made meshes, and nothing on a
 * sound closed mesh.
 *
 * Scenarios:
 * 1. A closed octahedron wound outward: no edge finding, volume `4 r^3 / 3`, no sliver at aspect 2, no crossing.
 * 2. Red: one triangle removed leaves its three edges open; one triangle reversed makes its three edges inconsistent; the whole mesh reversed has volume `-4 r^3 / 3`; a triangle repeated makes three non-manifold edges; a declared boundary edge is not reported.
 * 3. Red: a triangle with a 100 to 1 base-to-height shape is a sliver; a triangle with three collinear corners is degenerate.
 * 4. Red: two octahedra whose centres stand 0.5 r apart cross, each crossing pair reported once and the search stopping at a given limit; two 3 r apart do not.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `edges`, `volume`, `triangles` and `crossings` of `HumanInspectionMeshDefects` on made meshes and reads their findings.
 * @evidence contracts/testing.md#independent-expectations A regular octahedron of radius r encloses `4 r^3 / 3` (two square pyramids of base `2 r^2` and height r); each made defect is constructed to break exactly the property its detector reads (a removed, reversed or repeated triangle; an equilateral aspect of 1 against a 100 to 1 triangle; overlapping solids), so the expected findings follow from the edge-use and orientation definitions.
 * @evidence contracts/testing.md#distinguishing-cases Sound against each defect; a declared open boundary is not a defect; separated solids do not cross.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_inspection_mesh_defects`, on made meshes with no person, reference, loft or browser.
 */
export function test_human_inspection_mesh_defects(): void {
  const failures: string[] = [];
  const r: number = 10;
  const sound: M.IMesh = octahedron(r);
  if (M.edges(sound).length !== 0) failures.push("a closed outward octahedron reports edge defects");
  if (!(Math.abs(M.volume(sound) - (4 * r ** 3) / 3) <= 1e-9)) failures.push(`octahedron volume ${M.volume(sound)}, expected ${(4 * r ** 3) / 3}`);
  if (M.triangles(sound, 2).length !== 0) failures.push("an octahedron's equilateral faces read as slivers");
  if (M.crossings(sound).length !== 0) failures.push("an octahedron reads as crossing itself");

  // 2. Edge defects.
  const indices: number[] = Array.from(sound.indices);
  const open: M.IEdgeFinding[] = M.edges({ positions: sound.positions, indices: indices.slice(3) });
  if (open.length !== 3 || open.some((f: M.IEdgeFinding): boolean => f.kind !== "open")) failures.push(`one removed triangle reports ${JSON.stringify(open.map((f: M.IEdgeFinding): string => f.kind))}`);
  const boundary: Set<string> = new Set(open.map((f: M.IEdgeFinding): string => `${f.edge[0]},${f.edge[1]}`));
  if (M.edges({ positions: sound.positions, indices: indices.slice(3) }, boundary).length !== 0) failures.push("declared boundary edges were reported");
  const flipped: number[] = [indices[0]!, indices[2]!, indices[1]!, ...indices.slice(3)];
  const inconsistent: M.IEdgeFinding[] = M.edges({ positions: sound.positions, indices: flipped });
  if (inconsistent.length !== 3 || inconsistent.some((f: M.IEdgeFinding): boolean => f.kind !== "inconsistent")) failures.push(`one reversed triangle reports ${JSON.stringify(inconsistent.map((f: M.IEdgeFinding): string => f.kind))}`);
  const reversed: number[] = [];
  for (let t: number = 0; t < indices.length; t += 3) reversed.push(indices[t]!, indices[t + 2]!, indices[t + 1]!);
  if (!(Math.abs(M.volume({ positions: sound.positions, indices: reversed }) + (4 * r ** 3) / 3) <= 1e-9)) failures.push("an inside-out octahedron's volume is not negative");
  const repeated: M.IEdgeFinding[] = M.edges({ positions: sound.positions, indices: [...indices, ...indices.slice(0, 3)] });
  if (repeated.filter((f: M.IEdgeFinding): boolean => f.kind === "non-manifold").length !== 3) failures.push(`a repeated triangle reports ${JSON.stringify(repeated.map((f: M.IEdgeFinding): string => f.kind))}`);

  // 3. Triangle quality.
  const thin: M.IMesh = { positions: [0, 0, 0, 100, 0, 0, 50, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0], indices: [0, 1, 2, 3, 4, 5] };
  const quality: M.ITriangleFinding[] = M.triangles(thin, 20);
  if (quality.length !== 2 || quality[0]!.kind !== "sliver" || quality[1]!.kind !== "degenerate") failures.push(`thin and collinear triangles report ${JSON.stringify(quality)}`);

  // 4. Self-crossing.
  const overlapping: M.IMesh = join(octahedron(r), octahedron(r, [0.5 * r, 0.3 * r, 0.2 * r]));
  const crossed: M.ICrossing[] = M.crossings(overlapping);
  if (crossed.length === 0) failures.push("overlapping octahedra do not read as crossing");
  if (new Set(crossed.map((c: M.ICrossing): string => c.triangles.join(","))).size !== crossed.length) failures.push("a crossing pair is reported twice");
  if (crossed.length > 1 && M.crossings(overlapping, 1).length !== 1) failures.push("the crossing limit does not stop the search");
  if (M.crossings(join(octahedron(r), octahedron(r, [3 * r, 0, 0]))).length !== 0) failures.push("separated octahedra read as crossing");
  if (failures.length !== 0) throw new Error(`${failures.length} mesh defect failures:\n${failures.join("\n")}`);
}
