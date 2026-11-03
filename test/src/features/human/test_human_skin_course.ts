import { AutoMovieHumanSkinCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCourse";
import { AutoMovieHumanSkinCorridor as Corridor } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCorridor";
import { AutoMovieHumanSkinShortening as Shortening } from "../../../../packages/human/src/generation/AutoMovieHumanSkinShortening";
import { AutoMovieHumanSkinLowerBound as LowerBound } from "../../../../packages/human/src/generation/AutoMovieHumanSkinLowerBound";
import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanSkinPathAudit as Independent } from "../internal/HumanSkinPathAudit";
import { HumanSkinStationarity } from "../internal/HumanSkinStationarity";
import { HumanSkinVariation } from "../internal/HumanSkinVariation";

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
 * 8. The retained actual wrong face corridor is locally shorten-able; its refined rays, not collinear seed rays, expose the defect.
 * 9. An isometric folded rectangle retains the same intrinsic length in both travel directions.
 * 10. An authored affine material field forces an actual vertex corner; an inadmissible geometric shortcut is red.
 * 11. An active equal-material block has a shortening direction even when each feasible single portal does not.
 * 12. A bent actual edge-interior path fails first variation without relying on a vertex-corner observer.
 * 13. A physical norm-dual certificate stays below analytic minima, responds to stretch/endpoints and does not mistake a bent path's length for a lower bound.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual indexed-skin producer, unfolding/string-pull and directed-portal owners, then independently reconstructs original triangles, feasible corner chords and constrained first variation. Both diagonal choices must remove edge stair steps. Real stretched, disconnected, overlapping, degenerate, material-reversing, active-block and edge-interior defective paths are observed rather than replacing evaluation.
 * @evidence contracts/testing.md#independent-expectations The geometric primitive is an open planar rectangle, not a normal human. Its fixed endpoint displacement is (0,20,8), so the straight surface length is sqrt(464); doubling physical Y gives sqrt(1664). Extending the fixed endpoint from material twenty to thirty gives sqrt(964)-sqrt(464). Folding the rectangle by a right angle along material ten is an isometry, preserving those intrinsic lengths. The retained wrong corridor's actual incoming/outgoing slopes are 0.2/0.4, giving an available intrinsic angle pi-atan(0.4)+atan(0.2), strictly below pi. The independent observer uses original triangle incidence and the cosine law. A 1e-9 mm arithmetic allowance covers these small finite fixtures; it is not an anatomy or mesh approximation allowance.
 * The material-constrained fan has station ranges [5,8] then [2,5], forcing both crossings to its shared vertex and length 2*hypot(1.5,height). Its geometric shortcut reverses those stations. The concave planar fan's shortest admitted path passes (0,0,10), with length sqrt(101)+sqrt(500). A real midpoint path has an active-block normalized derivative (-19/sqrt(241)-2+20/sqrt(250))/sqrt(2), below zero; single feasible portal moves do not expose that joint direction. Raising its start by one gives sqrt(122)-sqrt(101). The independent first-variation allowance includes coordinate subtraction conditioning and normalized-dot roundoff, separately from the unchanged length tolerance. The Cauchy–Schwarz norm-dual certificate must remain below the same analytic planar, folded and constrained optima, including the cutoff boundary. Actual field stretch makes its normal-target comparison red, while an actual bent interior path cannot inflate the valid lower bound. Edge endpoints, displaced off-triangle endpoints and actual nonfinite source coordinates refuse with their exact categories.
 *
 * @evidence contracts/testing.md#distinguishing-cases Includes opposite triangulations, actual field stretch, endpoint input delta, isometric folds in both directions, constrained normal corners, real active-block and edge-interior defects, coincident disconnected seams, a forward overlap sheet, real invalid physical triangles and corrupted face ownership. Local necessary conditions inside one finite corridor are not asserted to certify a global shortest path on an arbitrary folded body or a clinical registration.
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
      const certificate: LowerBound.IReading = LowerBound.read(skin, normal);
      audit.bound("physical norm-dual bound cannot exceed known planar minimum", certificate.lower, Math.sqrt(464), "<=", "mm");
      audit.measure("straight primitive has a sharp norm-dual certificate", certificate.lower, Math.sqrt(464), 1e-9, "mm");
      audit.bound("cutoff at the known physical optimum stays admitted", certificate.lower, Math.sqrt(464), "<", "mm");
      audit.bound("edge seed cannot beat the independent Euclidean lower bound", normal.graph.cost - Math.sqrt(464), -1e-9, ">=", "mm");
      audit.category("physical source immutability", JSON.stringify(skin), before);
      const stretched: Surface.IGeometry = patch(diagonal, 2);
      const defect: Course.IReading = Course.read(body, stretched, owners, from, to);
      const defective: Independent.IReading = Independent.read(stretched, defect, from, to);
      audit.measure("actual stretched-field length", defective.length, Math.sqrt(1664), 1e-9, "mm");
      audit.measure("actual field stretch changes the dual certificate", LowerBound.read(stretched, defect).lower, Math.sqrt(1664), 1e-9, "mm");
      audit.reject("a stretched actual source is red against the normal bound", LowerBound.read(stretched, defect).lower, Math.sqrt(464), 1e-9, "mm");
      audit.reject("stretched actual surface is red against normal", defective.length, Math.sqrt(464), 1e-9, "mm");
      const extended: { station: number; lateral: number } = { station: 30, lateral: 9 };
      const delta: Course.IReading = Course.read(body, skin, owners, from, extended);
      audit.scope({ scenario: "3 actual known endpoint delta", diagonal, part: "patch", station: [from, extended], coordinates: delta.points, triangles: delta.triangles, seed: delta.seedVertices, baselineLength: independent.length, expectedLength: Math.sqrt(964) });
      audit.measure("known endpoint delta", Independent.read(skin, delta, from, extended).length - independent.length, Math.sqrt(964) - Math.sqrt(464), 1e-9, "mm");
      audit.measure("known endpoint dual response", LowerBound.read(skin, delta).lower - certificate.lower, Math.sqrt(964) - Math.sqrt(464), 1e-9, "mm");
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
  audit.run({ scenario: "8 original actual wrong corridor and refined-ray shortening", part: "patch", station: [0, 30], phase: "retained r12 opposite diagonal" }, (): void => {
    const skin: Surface.IGeometry = patch(true, 1);
    const wrong: Corridor.IReading = Corridor.within(skin, [0, 3, 12, 15, 24, 27, 30, 33], [5, 0, 1], [5, 30, 9], skin.coordinates);
    const failures: object[] = HumanSkinStationarity.inspect(skin, wrong, wrong.points, 0, 30);
    audit.scope({ scenario: "8 original actual wrong corridor", part: "patch", station: wrong.stations, coordinates: wrong.points, triangles: wrong.triangles, independentFailures: failures });
    audit.reject("actual old physical path is red against independent planar length", wrong.length, Math.sqrt(964), 1e-9, "mm");
    audit.bound("independent intrinsic reader detects actual shorten-able corner", failures.length, 1, ">=", "findings");
    const witness: { observed?: number; units?: string; vertex?: number } | undefined = failures.find((item: object): boolean => (item as { vertex?: number }).vertex === 7) as { observed?: number; units?: string; vertex?: number } | undefined;
    audit.measure("independent known actual angular defect", witness?.observed ?? NaN, Math.PI - Math.atan(0.4) + Math.atan(0.2), 1e-8, "rad");
    audit.category("independent angular unit", witness?.units, "rad");
    const faces: number[] = Array.from({ length: skin.mesh.indices.length / 3 }, (_: unknown, index: number): number => index * 3);
    const corrected: Corridor.IReading = Shortening.read(skin, wrong, skin.coordinates, faces);
    audit.measure("actual refined-ray corridor correction", corrected.length, Math.sqrt(964), 1e-9, "mm");
    audit.measure("independent actual corner condition after correction", HumanSkinStationarity.inspect(skin, corrected, corrected.points, 0, 30).length, 0, 0, "findings");
  });
  for (const diagonal of [false, true])
    for (const reverse of [false, true])
      audit.run({ scenario: "9 actual isometric folded surface", part: "patch", station: [0, 20], diagonal, reverse }, (): void => {
        const skin: Surface.IGeometry = patch(diagonal, 1);
        for (let vertex: number = 0; vertex < skin.mesh.positions.length / 3; vertex++) {
          const station: number = skin.coordinates[3 * vertex + 1]!;
          skin.mesh.positions[3 * vertex] = 5 + Math.max(0, station - 10);
          skin.mesh.positions[3 * vertex + 1] = Math.min(station, 10);
        }
        const a: { station: number; lateral: number } = reverse ? to : from;
        const b: { station: number; lateral: number } = reverse ? from : to;
        const reading: Course.IReading = Course.read(body, skin, owners, a, b);
        const observed: Independent.IReading = Independent.read(skin, reading, a, b);
        audit.scope({ scenario: "9 actual isometric folded surface", part: "patch", station: [a, b], coordinates: observed.points, triangles: observed.triangles, diagonal, reverse });
        audit.measure("intrinsic folded physical length", observed.length, Math.sqrt(464), 1e-9, "mm");
        audit.bound("folded physical dual bound remains below the independent optimum", LowerBound.read(skin, reading).lower, Math.sqrt(464), "<=", "mm");
        const changed: { station: number; lateral: number } = { station: 30, lateral: 9 };
        const extended: Course.IReading = Course.read(body, skin, owners, reverse ? changed : from, reverse ? from : changed);
        audit.measure("folded endpoint input response", Independent.read(skin, extended, reverse ? changed : from, reverse ? from : changed).length - observed.length, Math.sqrt(964) - Math.sqrt(464), 1e-9, "mm");
      });
  for (const height of [10, 12])
    for (const reverse of [false, true])
      audit.run({ scenario: "10 material-constrained actual corner", part: "patch", height, reverse, station: [0, 10] }, (): void => {
        const skin: Surface.IGeometry = { mesh: { positions: [0, 0, 0, 0, 1, 0, 0, 1.5, height, 0, 2, 0, 0, 3, 0], indices: [0, 1, 2, 1, 3, 2, 3, 4, 2], groups: [{ name: "patch/0", start: 0 }] }, coordinates: [0, 0, 0.5, 0, 8, 0.5, 0, 5, 0.5, 0, 2, 0.5, 0, 10, 0.5], construction: [] };
        const a: { station: number; lateral: number } = { station: reverse ? 10 : 0, lateral: 0 };
        const b: { station: number; lateral: number } = { station: reverse ? 0 : 10, lateral: 0 };
        const reading: Course.IReading = Course.read(body, skin, owners, a, b);
        const actual: Independent.IReading = Independent.read(skin, reading, a, b);
        const expected: number = 2 * Math.hypot(1.5, height);
        audit.scope({ scenario: "10 material-constrained actual corner", coordinates: actual.points, triangles: actual.triangles, stations: reading.addresses, height, reverse });
        audit.measure("unique admissible material-constrained length", actual.length, expected, 1e-9, "mm");
        audit.bound("active material constraint does not inflate its dual lower bound", LowerBound.read(skin, reading).lower, expected, "<=", "mm");
        audit.measure("known physical embedding delta", actual.length - 2 * Math.hypot(1.5, 10), 2 * (Math.hypot(1.5, height) - Math.hypot(1.5, 10)), 1e-9, "mm");
        const wrong: Course.IReading = { ...reading, points: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]], bindings: [{ triangle: 0 }, { edge: [1, 2], unit: 0 }, { edge: [3, 2], unit: 0 }, { triangle: 6 }], triangles: [0, 3, 6] };
        refusal(audit, (): unknown => Independent.read(skin, wrong, { station: 0, lateral: 0 }, { station: 10, lateral: 0 }), "An emitted path failed independent surface continuity");
      });
  audit.run({ scenario: "11 actual active-block first variation", part: "patch", station: [0, 20] }, (): void => {
    const skin: Surface.IGeometry = { mesh: { positions: [0, -1, 20, 0, -10, 0, 0, 0, 10, 0, 10, 0, 0, 20, 0], indices: [0, 1, 2, 1, 3, 2, 3, 4, 2], groups: [{ name: "patch/0", start: 0 }] }, coordinates: [0, 0, 0.5, 0, 0, 0.5, 0, 10, 0.5, 0, 0, 0.5, 0, 20, 0.5], construction: [] };
    const a: { station: number; lateral: number } = { station: 0, lateral: 20 };
    const b: { station: number; lateral: number } = { station: 20, lateral: 0 };
    const normal: Course.IReading = Course.read(body, skin, owners, a, b);
    audit.measure("independent concave-domain boundary path", Independent.read(skin, normal, a, b).length, Math.sqrt(101) + Math.sqrt(500), 1e-9, "mm");
    const wrong: Course.IReading = { ...normal, points: [[0, -1, 20], [0, -5, 5], [0, 5, 5], [0, 20, 0]], bindings: [{ triangle: 0 }, { edge: [1, 2], unit: 0.5 }, { edge: [3, 2], unit: 0.5 }, { triangle: 6 }], triangles: [0, 3, 6] };
    const findings: object[] = HumanSkinVariation.inspect(skin, wrong, wrong.points, 0, 20);
    audit.scope({ scenario: "11 actual active-block first variation", coordinates: wrong.points, triangles: wrong.triangles, findings });
    const block: { observed?: number } | undefined = findings.find((finding: object): boolean => { const item: { first?: number; last?: number; edgeUnit?: boolean; sign?: number } = finding as { first?: number; last?: number; edgeUnit?: boolean; sign?: number }; return item.first === 1 && item.last === 2 && item.edgeUnit === false && item.sign === 1; }) as { observed?: number } | undefined;
    audit.measure("independent known active-block derivative", block?.observed ?? NaN, (-19 / Math.sqrt(241) - 2 + 20 / Math.sqrt(250)) / Math.sqrt(2), 1e-12, "mm per normalized perturbation");
    refusal(audit, (): unknown => Independent.read(skin, wrong, a, b), "An emitted path failed independent constrained first variation");
    skin.mesh.positions[2] = 21;
    const changed: { station: number; lateral: number } = { station: 0, lateral: 21 };
    const delta: Course.IReading = Course.read(body, skin, owners, changed, b);
    audit.measure("actual start embedding response", Independent.read(skin, delta, changed, b).length - (Math.sqrt(101) + Math.sqrt(500)), Math.sqrt(122) - Math.sqrt(101), 1e-9, "mm");
  });
  audit.run({ scenario: "12 actual edge-interior first variation", part: "patch", station: [0, 20] }, (): void => {
    const skin: Surface.IGeometry = patch(false, 1);
    const end: { station: number; lateral: number } = { station: 20, lateral: 8 };
    const normal: Course.IReading = Course.read(body, skin, owners, from, end);
    const bindings: Course.IReading["bindings"] = normal.bindings.map((binding: Course.IReading["bindings"][number]): Course.IReading["bindings"][number] => ({ ...binding }));
    const index: number = bindings.findIndex((binding: Course.IReading["bindings"][number]): boolean => "edge" in binding && binding.unit > 0.2 && binding.unit < 0.8);
    if (index < 0) throw new Error("The authored edge-interior primitive has no interior portal");
    const binding: Course.IReading["bindings"][number] = bindings[index]!;
    if (!("edge" in binding)) throw new Error("The authored edge-interior witness lost its original edge");
    binding.unit += 0.05;
    const points: Course.IReading["points"] = normal.points.map((p: Course.IReading["points"][number]): Course.IReading["points"][number] => [...p]);
    points[index] = [0, 1, 2].map((axis: number): number => skin.mesh.positions[3 * binding.edge[0] + axis]! * (1 - binding.unit) + skin.mesh.positions[3 * binding.edge[1] + axis]! * binding.unit) as Course.IReading["points"][number];
    const wrong: Course.IReading = { ...normal, bindings, points };
    const observations: object[] = HumanSkinVariation.inspect(skin, wrong, points, from.station, end.station);
    audit.bound("a bent physical path does not inflate the dual lower certificate", LowerBound.read(skin, wrong).lower, Math.sqrt(449), "<=", "mm");
    audit.scope({ scenario: "12 actual edge-interior first variation", coordinates: points, triangles: wrong.triangles, observations });
    audit.bound("actual edge-interior counterexample", observations.length, 1, ">=", "findings");
    refusal(audit, (): unknown => Independent.read(skin, wrong, from, end), "An emitted path failed independent constrained first variation");
  });
  audit.run({ scenario: "13 certificate identity and physical refusal", part: "patch", station: [0, 20] }, (): void => {
    const skin: Surface.IGeometry = patch(false, 1);
    const reading: Course.IReading = Course.read(body, skin, owners, from, to);
    const edgeEndpoint: Course.IReading = { ...reading, bindings: [{ edge: [0, 1], unit: 0.2 }, ...reading.bindings.slice(1)] };
    refusal(audit, (): unknown => LowerBound.read(skin, edgeEndpoint), "A physical norm-dual certificate needs fixed triangle endpoints");
    const displaced: Course.IReading = { ...reading, points: reading.points.map((p: Course.IReading["points"][number]): Course.IReading["points"][number] => [...p]) };
    displaced.points[0]![0] += 1;
    refusal(audit, (): unknown => LowerBound.read(skin, displaced), "A physical norm-dual endpoint leaves its original triangle");
    skin.mesh.positions[0] = NaN;
    refusal(audit, (): unknown => LowerBound.read(skin, reading), "A physical norm-dual certificate has unavailable original coordinates");
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
