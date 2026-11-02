import { AutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh as Mesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../internal/HumanAnatomyAudit";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanSkinDistance } from "../internal/HumanSkinDistance";

/**
 * Actual nearest distances on the generated skin cannot hide distant defects.
 *
 * Scenarios:
 * 1. Evaluated loft interiors read on-skin and 0.25, 12 and 50 mm face offsets.
 * 2. Rigid rotation and a 600000 mm span preserve those independent distances.
 * 3. Empty geometry cannot supply a finite measurement; invalid vertices,
 *    non-finite points, collapsed triangles and overflow refuse explicitly.
 * 4. Repeated reads of one immutable skin preserve all measurements.
 * 5. Invalid symmetry is one unavailable failed row between two successful
 *    skin observations; all offending triangles remain attributed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls HumanAnatomy.distances on triangles emitted from two interior evaluations of a real loft. The former 27-cell query returns Infinity at the known 50 mm offset, which the symmetry reducer previously discarded as zero error; this test rejects that missing reading and accepts the exact observed distance. Calls the actual symmetry observer between successful skin observations and requires unavailable failed rows to retain both defective triangles. No person is generated.
 * @evidence contracts/testing.md#independent-expectations A point displaced outward by d along a flat face's unit normal is exactly d from that convex shaft. The expectation comes from plane distance and rigid-motion invariance, independently of the nearest-query implementation and the loft's coefficient formulas. The 1e-7 mm arithmetic allowance covers the large translated coordinates and does not alter any anatomical limit.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero and small offsets, offsets outside the former query neighbourhood, ordinary and elongated spans, rigid rotation, repeated queries, empty triangles, absent vertices, NaN points and positions, point and line degeneracy and overflowing triangle arithmetic. Expected refusals require the actual HumanSkinDistance.MeasurementError class and intended diagnostic issue; a different RangeError cannot satisfy them. A programming TypeError must propagate. It verifies the measurement consumer, not whole-person shape, the actual f2 allocation site or rendered acceptance.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU unit test_human_skin_distance selected by --include human_skin_distance. It evaluates one isolated loft span and calls local skin readers without generating a person or starting a process, host, renderer or GPU.
 */
export function test_human_skin_distance(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("generated skin distance", "HumanAnatomy.distances");
  const ordinary: A.ISkin = shaft(40, 10);
  for (const [label, skin] of [
    ["ordinary interior", ordinary],
    ["rigid rotation", rotated(ordinary)],
    ["long oblique triangles", rotated(shaft(600000, 1000))],
  ] as [string, A.ISkin][]) {
    const expected: number[] = [0, 0.25, 12, 50];
    const points: A.V3[] = expected.map((distance: number): A.V3 => offset(skin, distance));

    // One broken query must not hide the remaining offsets or repeated reads.
    for (let repeat: number = 0; repeat < 2; repeat++) {
      expected.forEach((distance: number, index: number): void => {
        audit.scope({ ...context(label, skin, points[index]!), repeat, pointIndex: index });
        let measured: number[] = [];
        let category: string = "none";
        let reason: string = "Distance reader returned normally.";
        try { measured = A.distances(skin, [points[index]!]); }
        catch (error) { category = errorCategory(error); reason = errorReason(error); }
        audit.scope({ ...context(label, skin, points[index]!), repeat, pointIndex: index, actualError: { category, reason } });
        audit.category("distance reader error", category, "none");
        audit.measure("returned query count", measured.length, 1, 0, "count");
        audit.measure("face-normal distance", measured[0] ?? NaN, distance, 1e-7, "mm");
      });
    }
  }

  // Empty geometry is unavailable; invalid geometry must explain its refusal.
  const empty: A.ISkin = { ...ordinary, I: new Uint32Array(), tri: new Int32Array() };
  let emptyMeasured: number[] = [];
  let emptyError: string = "none";
  let emptyReason: string = "Distance reader returned normally.";
  try { emptyMeasured = A.distances(empty, [[0, 0, 0]]); }
  catch (error) { emptyError = errorCategory(error); emptyReason = errorReason(error); }
  audit.scope({ ...context("empty triangles", empty, [0, 0, 0]), actualError: { category: emptyError, reason: emptyReason }, actualDistance: emptyMeasured[0] ?? "missing", distanceUnits: "mm" });
  audit.category("empty reader error", emptyError, "none");
  audit.measure("empty returned query count", emptyMeasured.length, 1, 0, "count");
  audit.category("empty distance", String(emptyMeasured[0]), "Infinity");
  refuses(audit, "non-finite query", ordinary, [NaN, 0, 0], "non-finite query");
  refuses(audit, "missing vertex", { ...ordinary, I: Uint32Array.from([0, 1, ordinary.P.length]) }, [0, 0, 0], "missing vertex");
  refuses(audit, "non-finite skin", { ...ordinary, P: Float64Array.from([NaN, 0, 0]) }, [0, 0, 0], "non-finite vertex");
  for (const [label, coordinates, indices] of [
    ["point triangle", [0, 0, 0], [0, 0, 0]],
    ["line triangle", [0, 0, 0, 1, 0, 0, 2, 0, 0], [0, 1, 2]],
    ["overflowing area", [1e308, 0, 0, -1e308, 0, 0, 0, 1e308, 0], [0, 1, 2]],
  ] as [string, number[], number[]][]) {
    const invalid: A.ISkin = { ...ordinary, P: Float64Array.from(coordinates), I: Uint32Array.from(indices), tri: new Int32Array(1) };
    refuses(audit, label, invalid, [0, 0, 0], "non-positive or unresolved triangle area");
  }
  observerFailures(audit, ordinary);
  audit.finish();
}

/** Exercise the actual anatomy observer with valid, multiply defective and empty skin. */
function observerFailures(audit: HumanFixtureAudit, ordinary: A.ISkin): void {
  const count: number = ordinary.I.length / 3;
  const defective: A.ISkin = {
    ...ordinary,
    I: Uint32Array.from([...ordinary.I, 0, 0, 0, 0, 1, ordinary.P.length]),
    tri: Int32Array.from([...ordinary.tri, 1, 2]),
    chains: [...ordinary.chains, "defect.point", "defect.missing"],
  };
  const empty: A.ISkin = { ...ordinary, I: new Uint32Array(), tri: new Int32Array() };

  // X translation preserves the world-Z mirror plane that this observer owns.
  const translated: A.ISkin = { ...ordinary, P: Float64Array.from(ordinary.P, (value: number, index: number): number => index % 3 === 0 ? value + 25 : value) };

  // A failed observer must return its row so the next real skin observation runs.
  for (const [label, skin, available] of [
    ["valid before refusal", ordinary, true],
    ["two defective triangles", defective, false],
    ["empty symmetry", empty, false],
    ["valid after refusal", translated, true],
  ] as [string, A.ISkin, boolean][]) {
    let rows: HumanAnatomyAudit.IRow[] = [];
    let category: string = "none";
    let reason: string = "Observer returned normally.";
    try { rows = HumanAnatomyAudit.symmetry(label, skin, /^arm/, label); }
    catch (error) { category = errorCategory(error); reason = errorReason(error); }
    audit.scope({ ...context(label, skin, [0, 0, 0]), actualError: { category, reason }, actualRows: rows });
    audit.category("symmetry observer error", category, "none");
    audit.measure("retained symmetry row count", rows.length, 1, 0, "count");
    audit.category("symmetry observation status", rows[0]?.status, available ? "measured" : "unavailable");
    if (available) audit.measure("symmetric skin offset", rows[0]?.value ?? NaN, 0, 1e-7, "mm");
    else {
      audit.check("unavailable symmetry cannot pass", rows[0] !== undefined && !HumanAnatomyAudit.passes(rows[0]));
      audit.check("unavailable symmetry has its cause", (rows[0]?.reason?.length ?? 0) > 0);
      if (label === "two defective triangles") {
        const text: string = rows[0]?.reason ?? "";
        audit.check("point triangle attribution retained", text.includes(`"triangle":${count}`) && text.includes('"chain":"defect.point"') && text.includes('"observedArea":0'));
        audit.check("missing vertex attribution retained", text.includes(`"triangle":${count + 1}`) && text.includes('"chain":"defect.missing"') && text.includes('"coordinates":'));
      }
    }
  }

  // A programming error is not an expected geometry refusal and must propagate.
  const broken: A.ISkin = { ...ordinary, chains: null as unknown as string[] };
  let category: string = "returned normally";
  let reason: string = "No programming error propagated.";
  try { HumanAnatomyAudit.symmetry("broken metadata", broken, /^arm/, "broken metadata"); }
  catch (error) { category = errorCategory(error); reason = errorReason(error); }
  audit.scope({ ...context("unexpected metadata error", broken, [0, 0, 0]), actualError: { category, reason } });
  audit.category("unexpected observer error propagates", category, "TypeError");
}

/** Observe every refusal without ending the remaining geometry cases. */
function refuses(audit: HumanFixtureAudit, label: string, skin: A.ISkin, point: A.V3, expectedIssue: string): void {
  let category: string = "returned normally";
  let reason: string = "The invalid geometry produced a distance instead of refusing.";
  let intended: boolean = false;
  let measured: number[] = [];
  try { measured = A.distances(skin, [point]); }
  catch (error) { category = errorCategory(error); reason = errorReason(error); intended = error instanceof HumanSkinDistance.MeasurementError; }
  audit.scope({ ...context(label, skin, point), expectedError: "HumanSkinDistance.MeasurementError", expectedIssue, actualError: { category, reason, intended }, actualDistances: measured, distanceUnits: "mm" });
  audit.category("invalid geometry refusal", category, "RangeError");
  audit.check("refusal has the intended measurement class", intended);
  audit.check("refusal identifies the intended geometric cause", reason.includes(JSON.stringify(expectedIssue)) && reason.includes('"issue":'));
}

/** Preserve the actual thrown category, including values that are not Errors. */
function errorCategory(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

/** Preserve the original refusal explanation instead of reducing it to a boolean. */
function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Keep the actual query, all emitted triangle coordinates and their original indices. */
function context(label: string, skin: A.ISkin, point: A.V3): Record<string, unknown> {
  const triangles: { indices: number[]; coordinates: (A.V3 | string)[] }[] = [];
  for (let at: number = 0; at < skin.I.length; at += 3) {
    const indices: number[] = Array.from(skin.I.slice(at, at + 3));
    triangles.push({ indices, coordinates: indices.map((vertex: number): A.V3 | string => vertex < skin.P.length / 3 ? A.point(skin, vertex) : "missing vertex") });
  }
  return { case: label, chains: skin.chains, queryPoint: point, skinPositions: Array.from(skin.P), triangles, coordinateUnits: "mm" };
}

/** Connect two interior evaluations; construction waypoints are not the observed skin. */
function shaft(span: number, radius: number): A.ISkin {
  const chain: IAutoMovieHumanLoftChain = {
    name: "arm.left", order: 1, rule: "polar", samples: 8,
    layers: [0, span].map((y: number): IAutoMovieHumanLoftChain.ILayer => ({ y, coefficients: [0, radius, 0, 0, 0, radius], slopes: [0, 0, 0, 0, 0, 0] })),
  };
  const mesh: Mesh.IContext = Mesh.create();
  const phases: number[] = Array.from({ length: 8 }, (_: unknown, index: number): number => index * Math.PI / 4);
  const low: number[] = Mesh.vertices(mesh, Chain.ring(chain, span / 4, phases));
  const high: number[] = Mesh.vertices(mesh, Chain.ring(chain, 3 * span / 4, phases));
  Mesh.band(mesh, low, high);
  return { name: "evaluated-interior", P: Float64Array.from(mesh.positions), I: Uint32Array.from(mesh.indices), tri: new Int32Array(mesh.indices.length / 3), chains: [chain.name], joints: new Map() };
}

/** Prescribe a face-normal offset whose closest distance follows from plane geometry. */
function offset(skin: A.ISkin, distance: number): A.V3 {
  const a: A.V3 = A.point(skin, skin.I[0]!);
  const b: A.V3 = A.point(skin, skin.I[1]!);
  const c: A.V3 = A.point(skin, skin.I[2]!);
  const normal: A.V3 = A.unit(A.cross(A.sub(b, a), A.sub(c, a)));
  const centre: A.V3 = A.scale(A.add(A.add(a, b), c), 1 / 3);
  return A.add(centre, A.scale(normal, distance));
}

/** Rotate the actual emitted skin, preserving distances while changing grid occupancy. */
function rotated(skin: A.ISkin): A.ISkin {
  const coordinates: number[] = [];
  for (let at: number = 0; at < skin.P.length; at += 3) {
    const x: number = (skin.P[at]! - skin.P[at + 1]!) / Math.SQRT2;
    const y: number = (skin.P[at]! + skin.P[at + 1]!) / Math.SQRT2;
    const z: number = skin.P[at + 2]!;
    coordinates.push(x, (y - z) / Math.SQRT2, (y + z) / Math.SQRT2);
  }
  return { ...skin, P: Float64Array.from(coordinates) };
}
