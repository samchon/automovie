import { TestValidator } from "@nestia/e2e";
import { HumanRawGeometry as G } from "../internal/HumanRawGeometry";
import { HumanRawProfileAudit as P } from "../internal/HumanRawProfileAudit";
import { nclose } from "../internal/nclose";

/**
 * Complete intrinsic sections distinguish extra inward folds from source muscle grooves.
 *
 * Scenarios:
 * 1. A correct concave source groove stays green after independent side triangulation,
 *    exact collinear subdivision, reversed face winding and a rigid coordinate permutation.
 * 2. An inserted V fold in actual triangle buffers is red; angle beta contributes
 *    exactly 4*beta excess turning and beta's prescribed change has the known response.
 * 3. Large convex curvature alone stays green; no universal curvature limit is invented.
 * 4. Missing, additional, open, coplanar, non-finite, degenerate and unresolved near-tangent support cannot pass.
 *
 * @evidence contracts/testing.md#behavioral-verification The same complete raw mesh-section comparator consumes every positive/negative case. Defects alter actual prism mesh vertices and triangles. It retains original cut faces, all connected components, cut coordinates, expected/observed angles, arithmetic screen and refusal reasons.
 * @evidence contracts/testing.md#independent-expectations The exterior-turn theorem gives 2*pi net turn for each simple closed polygon. A straight edge replaced by an inward V contributes beta,-2*beta,beta, hence 4*beta additional absolute-minus-net turning. These analytic answers do not call the implementation or any Human geometry. The exact raw-source reconstruction supplies its own normal concavity rather than an anatomical claim.
 * @evidence contracts/testing.md#distinguishing-cases Exercises normal grooves, dense collinear re-tessellation, diagonal choice, rigid transformation, face-winding reversal, convex profiles with different radii, explicit extra-component coverage, open seams, coplanar ambiguity, unresolved thin transverse support and malformed actual buffers. Side/interpolation uncertainty propagates through cut coordinates into directional and winding screens. Aggregate profile agreement explicitly does not prove local arc correspondence, longitudinal loft continuity or absence of compensated folds.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU function imports only raw-array geometry/profile observers and a pure numeric comparator; no Human generator, production interpolation, measurements, rig, viewer or private reference installation is loaded.
 */
export function test_human_raw_profile_oracle(): void {
  const failures: string[] = [];
  const plane: P.Plane = { part: "analytic intrinsic section", origin: [0, 0, 0], tangent: [0, 0, 1], basis: "Analytically prescribed extrusion axis; exact polygon reconstruction contract" };
  const source: G.Mesh = prism(groove(Math.PI / 12), false, 1);
  for (const variant of [prism(groove(Math.PI / 12), true, 1), prism(groove(Math.PI / 12), true, 7), reverse(prism(groove(Math.PI / 12), false, 3))]) {
    const result: P.Report = P.compare("analytic", source, variant, plane);
    if (result.status !== "PASS" || result.registration.status !== "RESOLVED" || !nclose(result.registeredFinding?.expected ?? NaN, Math.PI / 3, 1e-11) || result.source.components.length !== 1 || result.candidate.components.length !== 1) failures.push(JSON.stringify({ label: "normal source groove survives exact re-tessellation and reversed faces", result }));
  }
  const movedPlane: P.Plane = { ...plane, origin: [13, 17, 19], tangent: [1, 0, 0] };
  const moved: P.Report = P.compare("analytic", movedMesh(source), movedMesh(prism(groove(Math.PI / 12), true, 4)), movedPlane);
  if (moved.status !== "PASS" || !nclose(moved.finding?.observed ?? NaN, Math.PI / 3, 1e-11)) failures.push(JSON.stringify({ label: "intrinsic rigid coordinate permutation", moved }));
  const convex: G.Mesh = prism([[-2, -2], [2, -2], [2, 2], [-2, 2]], false, 1);
  const readings: number[] = [];
  for (const beta of [Math.PI / 12, Math.PI / 6]) {
    const result: P.Report = P.compare("analytic", convex, prism(groove(beta), true, 4), plane);
    readings.push(result.finding?.observed ?? NaN);
    if (result.status !== "FAIL" || result.finding?.triangle === null || result.finding?.coordinate === null || !nclose(result.finding?.observed ?? NaN, 4 * beta, 1e-11) || !nclose(result.finding?.expected ?? NaN, 0, 1e-11) || !result.candidate.components[0]?.turns.some((row: P.Turn): boolean => row.observed < 0)) failures.push(JSON.stringify({ label: "actual output buffer inward fold with independently known angle", beta, result }));
  }
  if (!nclose(readings[1]! - readings[0]!, Math.PI / 3, 1e-11)) failures.push(JSON.stringify({ label: "known V angle change", readings, expectedDelta: Math.PI / 3, units: "rad" }));
  const ellipse: [number, number][] = Array.from({ length: 80 }, (_: unknown, index: number): [number, number] => [20 * Math.cos(index * 2 * Math.PI / 80), 0.2 * Math.sin(index * 2 * Math.PI / 80)]);
  const smooth: P.Report = P.compare("analytic", convex, prism(ellipse, true, 2), plane);
  if (smooth.status !== "PASS") failures.push(JSON.stringify({ label: "large valid convex curvature is not a concave fold", smooth }));
  const open: G.Mesh = { ...convex, indices: Array.from(convex.indices).slice(6) };
  const extra: G.Mesh = merge(convex, shifted(convex, 10));
  const separate: P.Report = P.compare("analytic", source, merge(prism(groove(Math.PI / 12), true, 2), shifted(convex, 10)), plane);
  if (separate.status !== "FAIL" || separate.registration.status !== "RESOLVED" || separate.candidate.components.length !== 2 || !nclose(separate.registeredFinding?.deviation ?? NaN, 0, 1e-11)) failures.push(JSON.stringify({ label: "fixed source anchor separates the registered normal groove while retaining extra complete coverage", separate }));
  const absentAnchor: P.Report = P.compare("analytic", convex, shifted(convex, 10), plane);
  if (absentAnchor.status !== "UNAVAILABLE" || absentAnchor.registration.status !== "UNAVAILABLE" || absentAnchor.registeredFinding !== null) failures.push(JSON.stringify({ label: "equal global convex turning cannot admit missing fixed source-anchor registration", absentAnchor }));
  const boundaryAnchor: P.Report = P.compare("analytic", convex, prism([[-2, -2], [2, -2], [2, 2], [-2, 2]], true, 2), { ...plane, origin: [2, 0, 0] });
  if (boundaryAnchor.status !== "UNAVAILABLE" || boundaryAnchor.registeredFinding !== null) failures.push(JSON.stringify({ label: "source anchor on the actual boundary lacks strict interior support", boundaryAnchor }));
  for (const [label, mesh] of [["open seam", open], ["extra component", extra], ["absent actual surface", { positions: [], indices: [] }], ["non-finite actual coordinate", { ...convex, positions: [NaN, ...Array.from(convex.positions).slice(1)] }], ["collapsed actual triangle", { ...convex, indices: [0, 0, 1] }]] as const) {
    const result: P.Report = P.compare("analytic", convex, mesh, plane);
    if (result.status === "PASS" || (result.finding === null && result.candidate.refusals.length === 0)) failures.push(JSON.stringify({ label, result }));
  }
  const coplanar: P.Report = P.compare("analytic", convex, convex, { ...plane, tangent: [0, 1, 0], origin: [0, 2, 0] });
  if (coplanar.status !== "UNAVAILABLE" || !coplanar.source.refusals.some((row: P.Refusal): boolean => row.reason.includes("Coplanar"))) failures.push(JSON.stringify({ label: "coplanar surface ambiguity is not zero curvature", coplanar }));
  for (const tangent of [[0, 0, 0], [NaN, 0, 1]] as G.Point[]) if (P.compare("analytic", convex, convex, { ...plane, tangent }).status !== "UNAVAILABLE") failures.push("Invalid own-tangent section must not pass");
  const thin: G.Mesh = { ...convex, positions: Array.from(convex.positions).map((value: number, index: number): number => index % 3 === 2 ? value * 1e-16 : value) };
  const unresolved: P.Report = P.compare("analytic", convex, thin, plane);
  if (unresolved.status !== "UNAVAILABLE" || !unresolved.candidate.refusals.some((row: P.Refusal): boolean => row.reason.includes("side classification")) || unresolved.finding !== null) failures.push(JSON.stringify({ label: "unresolved near-tangent actual support cannot fabricate a finite normal profile", unresolved }));
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** A straight top edge acquires an inward V of independently prescribed half-angle beta. */
function groove(beta: number): [number, number][] { return [[-2, -2], [2, -2], [2, 2], [1, 2], [0, 2 - Math.tan(beta)], [-1, 2], [-2, 2]]; }

/** Emit actual extruded side triangles; different diagonals/densities share the same analytic surface. */
function prism(polygon: [number, number][], diagonal: boolean, density: number): G.Mesh {
  const outline: [number, number][] = [];
  for (let edge: number = 0; edge < polygon.length; edge++) for (let step: number = 0; step < density; step++) { const a: [number, number] = polygon[edge]!; const b: [number, number] = polygon[(edge + 1) % polygon.length]!; outline.push([a[0] + step / density * (b[0] - a[0]), a[1] + step / density * (b[1] - a[1])]); }
  const positions: number[] = outline.flatMap(([x, y]: [number, number]): number[] => [x, y, -1, x, y, 1]);
  const indices: number[] = [];
  for (let edge: number = 0; edge < outline.length; edge++) { const a: number = 2 * edge; const b: number = 2 * ((edge + 1) % outline.length); indices.push(...(diagonal ? [a, b, a + 1, b, b + 1, a + 1] : [a, b, b + 1, a, b + 1, a + 1])); }
  return { positions, indices };
}

/** Reverse actual triangles without changing the intersected surface or its profile. */
function reverse(mesh: G.Mesh): G.Mesh { return { positions: mesh.positions, indices: Array.from(mesh.indices).map((_: number, index: number): number => mesh.indices[Math.floor(index / 3) * 3 + (2 - index % 3)]!) }; }
/** Exact coordinate-axis permutation plus a prescribed translation is a rigid isometry. */
function movedMesh(mesh: G.Mesh): G.Mesh { const positions: number[] = []; for (let i: number = 0; i < mesh.positions.length; i += 3) positions.push(mesh.positions[i + 2]! + 13, mesh.positions[i]! + 17, mesh.positions[i + 1]! + 19); return { positions, indices: mesh.indices }; }
/** The separate extra surface changes complete coverage and cannot be cropped away. */
function shifted(mesh: G.Mesh, offset: number): G.Mesh { return { positions: Array.from(mesh.positions).map((value: number, index: number): number => index % 3 === 0 ? value + offset : value), indices: mesh.indices }; }
/** Join independent actual triangle buffers while retaining all their indices. */
function merge(a: G.Mesh, b: G.Mesh): G.Mesh { return { positions: [...Array.from(a.positions), ...Array.from(b.positions)], indices: [...Array.from(a.indices), ...Array.from(b.indices).map((index: number): number => index + a.positions.length / 3)] }; }
