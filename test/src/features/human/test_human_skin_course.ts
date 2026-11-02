import { AutoMovieHumanSkinCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCourse";
import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanSkinPathAudit as Independent } from "../internal/HumanSkinPathAudit";

/**
 * An emitted course crosses connected triangle interiors instead of following mesh-edge stairs.
 *
 * Scenarios:
 * 1. Both diagonals of the planar field S(s,z)=(5,s,z) admit the known straight course.
 * 2. An actually stretched field is red against that same physical length.
 * 3. A ten-mm endpoint change has the independently known Euclidean response.
 * 4. Coincident disconnected panels and a remote overlapping sheet cannot supply a path.
 * 5. An actual broken original-face witness fails the independent continuity reader.
 * 6. A nonfinite or collapsed actual selected triangle refuses with its intended cause.
 * 7. Interior endpoints require neither a station-aligned row nor a contained original vertex.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual indexed-skin producer, unfolding/string-pull corridor and independent original-triangle reader on authored physical meshes. Both diagonal choices must remove edge stair steps. Real stretched, disconnected, overlapping and degenerate geometry and a broken original incidence witness are observed rather than replacing evaluation.
 * @evidence contracts/testing.md#independent-expectations The geometric primitive is an open planar rectangle, not a normal human. Its fixed endpoint displacement is (0,20,8), so the straight surface length is sqrt(464); doubling physical Y gives sqrt(1664). Extending the fixed endpoint from material twenty to thirty gives sqrt(964)-sqrt(464). A 1e-9 mm arithmetic allowance covers these small finite fixtures; it is not an anatomy or mesh approximation allowance. Original indexed incidence independently defines continuity even when world positions coincide.
 * @evidence contracts/testing.md#distinguishing-cases Includes opposite triangulations, actual field stretch, endpoint input delta, coincident disconnected seams, a forward overlap sheet, real invalid physical triangles and corrupted face ownership. A shortest path inside one finite corridor is not asserted to be globally shortest on an arbitrary folded body or clinically registered.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous portable CPU unit using resident mesh arrays and local audit state only. No whole person, process, browser, GPU, cache, monkeypatch or file I/O is used.
 */
export function test_human_skin_course(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("indexed-physical-course", "actual-triangle-corridor");
  const body: Body = { stature: 30, chains: [{ name: "patch", order: 1, samples: 32, rule: "polar", layers: [0, 30].map((y: number): Body["chains"][number]["layers"][number] => ({ y, coefficients: [0, 10, 0, 0, 0, 10], slopes: [0, 0, 0, 0, 0, 0] })) }], events: [], poles: [], apertures: [], eyes: [] };
  const owners: Set<string> = new Set(["patch"]);
  const from: { station: number; lateral: number } = { station: 0, lateral: 1 };
  const to: { station: number; lateral: number } = { station: 20, lateral: 9 };
  for (const diagonal of [false, true])
    audit.run({ scenario: "1-3 physical planar normal defect delta", part: "patch", interval: [0, 10, 20, 30], station: [from, to], phase: "authored planar material patch", diagonal }, (): void => {
      const skin: Surface.IGeometry = patch(diagonal, 1);
      const before: string = JSON.stringify(skin);
      const normal: Course.IReading = Course.read(body, skin, owners, from, to);
      const independent: Independent.IReading = Independent.read(skin, normal, from, to);
      audit.scope({ scenario: "1-3 physical planar normal defect delta", diagonal, part: "patch", station: [from, to], coordinates: independent.points, triangles: independent.triangles });
      audit.measure("normal corridor physical length", normal.length, Math.sqrt(464), 1e-9, "mm");
      audit.measure("independent original-triangle physical length", independent.length, Math.sqrt(464), 1e-9, "mm");
      audit.bound("edge seed cannot beat the independent Euclidean lower bound", normal.graph.cost - Math.sqrt(464), -1e-9, ">=", "mm");
      audit.category("physical source immutability", JSON.stringify(skin), before);
      const stretched: Surface.IGeometry = patch(diagonal, 2);
      const defect: Course.IReading = Course.read(body, stretched, owners, from, to);
      const defective: Independent.IReading = Independent.read(stretched, defect, from, to);
      audit.measure("actual stretched-field length", defective.length, Math.sqrt(1664), 1e-9, "mm");
      audit.reject("stretched actual surface is red against normal", defective.length, Math.sqrt(464), 1e-9, "mm");
      const extended: { station: number; lateral: number } = { station: 30, lateral: 9 };
      const delta: Course.IReading = Course.read(body, skin, owners, from, extended);
      audit.scope({ scenario: "3 actual known endpoint delta", diagonal, part: "patch", station: [from, extended], coordinates: delta.points, triangles: delta.triangles, seed: delta.seedVertices, baselineLength: independent.length, expectedLength: Math.sqrt(964) });
      audit.measure("known endpoint delta", Independent.read(skin, delta, from, extended).length - independent.length, Math.sqrt(964) - Math.sqrt(464), 1e-9, "mm");
    });
  audit.run({ scenario: "1 edge stair bias on a non-collinear seed", part: "patch", station: [0, 20], phase: "planar lateral one to eight" }, (): void => {
    const skin: Surface.IGeometry = patch(false, 1);
    const end: { station: number; lateral: number } = { station: 20, lateral: 8 };
    const reading: Course.IReading = Course.read(body, skin, owners, from, end);
    audit.scope({ scenario: "1 edge stair bias on a non-collinear seed", part: "patch", station: [from, end], coordinates: reading.points, triangles: reading.triangles, seed: reading.seedVertices });
    audit.bound("actual non-collinear edge seed is longer", reading.graph.cost - Math.sqrt(449), 0.01, ">", "mm");
    audit.measure("triangle-interior refinement removes edge stairs", Independent.read(skin, reading, from, end).length, Math.sqrt(449), 1e-9, "mm");
  });
  for (const overlap of [false, true])
    audit.run({ scenario: "4 disconnected actual panels", part: "patch", station: [from, to], overlap }, (): void => {
      const first: Surface.IGeometry = patch(false, 1, [0, 10]);
      const second: Surface.IGeometry = patch(false, 1, [10, 20, 30], overlap ? 8 : 5);
      const count: number = first.mesh.positions.length / 3;
      const skin: Surface.IGeometry = { mesh: { positions: [...first.mesh.positions, ...second.mesh.positions], indices: [...first.mesh.indices, ...second.mesh.indices.map((index: number): number => index + count)], groups: [{ name: "patch/0", start: 0 }] }, coordinates: [...first.coordinates, ...second.coordinates], construction: [] };
      refusal(audit, (): unknown => Course.read(body, skin, owners, from, to), "An emitted skin course has no connected directed path");
    });
  audit.run({ scenario: "7 two interior endpoints of the same original triangle", part: "patch", station: [2, 4], phase: "interior barycentric addresses" }, (): void => {
    const skin: Surface.IGeometry = { mesh: { positions: [0, 0, 0, 0, 10, 0, 0, 0, 10], indices: [0, 1, 2], groups: [{ name: "patch/0", start: 0 }] }, coordinates: [0, 0, 0, 0, 10, 0, 0, 0, Math.PI / 2], construction: [] };
    const a: { station: number; lateral: number } = { station: 2, lateral: 2 };
    const b: { station: number; lateral: number } = { station: 4, lateral: 2 };
    const reading: Course.IReading = Course.read(body, skin, owners, a, b);
    audit.measure("known same-face interior distance", Independent.read(skin, reading, a, b).length, 2, 1e-12, "mm");
  });
  for (const diagonal of [false, true])
    audit.run({ scenario: "7 interior endpoints across multiple original faces", part: "patch", station: [2, 24], diagonal }, (): void => {
      const skin: Surface.IGeometry = patch(diagonal, 1);
      const a: { station: number; lateral: number } = { station: 2, lateral: 2 };
      const b: { station: number; lateral: number } = { station: 24, lateral: 8 };
      const reading: Course.IReading = Course.read(body, skin, owners, a, b);
      audit.measure("known unaligned endpoint distance", Independent.read(skin, reading, a, b).length, Math.sqrt(520), 1e-9, "mm");
    });
  audit.run({ scenario: "5 broken original incidence", part: "patch", station: [from, to] }, (): void => {
    const skin: Surface.IGeometry = patch(false, 1);
    const reading: Course.IReading = Course.read(body, skin, owners, from, to);
    const invalid: Course.IReading = { ...reading, triangles: [...reading.triangles] };
    invalid.triangles[0] = skin.mesh.indices.length - 3;
    refusal(audit, (): unknown => Independent.read(skin, invalid, from, to), "An emitted path failed independent surface continuity");
  });
  for (const invalid of ["nonfinite", "collapsed"])
    audit.run({ scenario: "6 invalid actual physical triangle", part: "patch", invalid }, (): void => {
      const skin: Surface.IGeometry = patch(false, 1);
      if (invalid === "nonfinite") skin.mesh.positions[0] = NaN;
      else skin.mesh.indices[1] = skin.mesh.indices[0]!;
      refusal(audit, (): unknown => Course.read(body, skin, owners, from, to), "An emitted skin course has a nonfinite or degenerate selected face");
    });
  audit.finish();
}

/** An exact planar physical primitive with explicit material coordinates and either actual triangulation. */
function patch(diagonal: boolean, advance: number, stations: number[] = [0, 10, 20, 30], x: number = 5): Surface.IGeometry {
  const positions: number[] = [];
  const coordinates: number[] = [];
  const indices: number[] = [];
  for (const station of stations)
    for (const z of [0, 5, 10]) { positions.push(x, advance * station, z); coordinates.push(0, station, 0.5); }
  for (let row: number = 0; row < stations.length - 1; row++)
    for (let col: number = 0; col < 2; col++) {
      const a: number = 3 * row + col;
      const b: number = a + 3;
      const c: number = a + 1;
      const d: number = b + 1;
      indices.push(...(diagonal ? [a, b, c, c, b, d] : [a, b, d, a, d, c]));
    }
  return { mesh: { positions, indices, groups: [{ name: "patch/0", start: 0 }] }, coordinates, construction: [] };
}

/** Refusal means the intended native failure, never any exception from a broken fixture. */
function refusal(audit: HumanFixtureAudit, action: () => unknown, reason: string): void {
  let failure: unknown;
  try { action(); } catch (error) { failure = error; }
  audit.check("native refusal category", failure instanceof Error && failure.constructor === Error && failure.name === "Error");
  audit.category("intended native refusal reason", failure instanceof Error ? failure.message : undefined, reason);
}
