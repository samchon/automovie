import {
  AutoMovieConstructionContinuation,
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  realizeAutoMovieConstruction,
  type AutoMovieConstructionRealization,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionContinuation, IAutoMovieConstructionDiagnostic } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionNativeContinuation as Made } from "../../internal/construction/ConstructionNativeContinuation";
import { nclose } from "../../internal/nclose";

/**
 * Different output densities consume an already common native endpoint.
 *
 * Scenarios:
 * 1. All four end pairings, three uniform unit scales and the actual 256/64
 *    orders retain complete circle world2 and both original adjacent intervals.
 * 2. A nonzero phase-constant lift2 survives without coefficient conversion.
 *    Whole native fullness/physical2, frame2, lift2, stale bindings, poles,
 *    unavailable derivatives and unsupported phase-dependent lift refuse.
 * 3. Real source leaves with 24/40 own phase grids publish one shared 24-point
 *    cycle and a final skin. Both faces use its exact vertex IDs, every shared
 *    edge has one incident triangle from each face in opposite directions.
 *    All adjacent-strip mesh vertices replay the independent circle directly
 *    and every triangle faces outward. Ring samples and section orders differ.
 * 4. A part subtree that consumes the proposed end rolls back completely,
 *    preserving the outer host and a named shared-end diagnostic.
 * 5. Legal nested continuations share both ends of the same middle leaf;
 *    an outer mismatch preserves its named refusal and rolls both walks back.
 *
 * Expectations come from r(y)=3+y+y^2 and elementary differentiation, not
 * compatibility controls. Source2 equality covers all phases by the native
 * family; the observed phase sweep additionally checks the actual consumer.
 * Binary64 oracle allowance is an absolute 2e-8 per component, in its declared
 * mm/station/radian units, for native inverse arithmetic.
 * One synchronous CPU question owns only synthetic sources, starts no process
 * or viewer, and collects every scenario before reporting its findings.
 */
export function test_construction_native_continuation(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000])
    for (const hostEnd of ["bottom", "top"] as const)
      for (const partEnd of ["bottom", "top"] as const)
        collect(`${scale}/${hostEnd}/${partEnd}`, failures, (): void => {
          equivalent(scale, hostEnd, partEnd, failures);
        });
  collect("lift2", failures, (): void => Made.lifted(failures));
  collect("refusals", failures, (): void => Made.refusals(failures));
  collect("actual skin", failures, (): void => skin(failures));
  collect("part end rollback", failures, (): void => rollback(failures));
  collect("nested pending endpoints", failures, (): void => Made.nested(failures));
  TestValidator.predicate(failures.join("\n"), (): boolean => failures.length === 0);
}

/** Every made scenario runs even when another scenario has a refusal or exception. */
function collect(name: string, failures: string[], job: () => void): void {
  try { job(); }
  catch (error: unknown) { failures.push(`${name}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`); }
}

/** Preserve whole native source data and every compatibility row at its own order. */
function equivalent(scale: number, hostEnd: "bottom" | "top", partEnd: "bottom" | "top", failures: string[]): void {
  const sign: 1 | -1 = hostEnd === partEnd ? -1 : 1;
  const hs: number = hostEnd === "bottom" ? 0 : scale;
  const ps: number = partEnd === "bottom" ? 0 : scale;
  const offset: number = hs - sign * ps;
  const host: IAutoMovieLoftChain = Made.chain(Made.source("host", 256, 24, 0, 1, scale));
  const part: IAutoMovieLoftChain = Made.chain(Made.source("part", 64, 40, offset, sign, scale));
  const before: string = JSON.stringify([host.nativeSource, host.layers, part.nativeSource, part.layers]);
  const result: IAutoMovieLoftChain | string = AutoMovieConstructionContinuation.apply(host, hostEnd, part, partEnd);
  if (typeof result === "string") throw new Error(result);
  if (result !== part || result.order !== 64 || host.order !== 256 || result.sectionSpans !== part.sectionSpans)
    failures.push("An already shared native boundary rewrote its density or source intervals.");
  if (before !== JSON.stringify([host.nativeSource, host.layers, part.nativeSource, part.layers]))
    failures.push("Native boundary admission mutated an input.");
  for (const phi of [-0.37, 0, 0.23, Math.PI / 2, 2.1, 4.7, 7.3]) {
    const expected: AutoMovieLoftJet.IJet = Made.oracle(hs, sign * phi, scale);
    const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(result, ps, phi);
    jets(actual, expected, sign, failures, "whole boundary");
    for (const station of [0.125 * scale, 0.375 * scale, 0.625 * scale, 0.875 * scale]) {
      const world: number = offset + sign * station;
      jets(AutoMovieLoftJet.at(result, station, phi), Made.oracle(world, sign * phi, scale), sign, failures, "preserved native interval");
      close(AutoMovieLoftChain.point(result, station, phi), Made.oracle(world, sign * phi, scale).p, failures, "Point0 interval");
    }
  }
}

/** The actual skin must consume the same ring across unequal native and tessellation densities. */
function skin(failures: string[]): void {
  const host: IAutoMovieViewPart = Made.source("skin.host", 256, 24);
  const part: IAutoMovieViewPart = Made.source("skin.part", 64, 40, 1);
  const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "native", root: tree(host.name, part.name) }, { chord: 0.00005, sources: new Map([[host.name, host], [part.name, part]]) });
  if (real.diagnostics.length !== 0) failures.push(`native skin: ${JSON.stringify(real.diagnostics)}`);
  if (real.chains.length !== 2 || real.mesh.indices.length === 0) throw new Error("Native continuation lost a face or its final skin.");
  const a: typeof real.body.faces[number] = real.body.faces[0]!;
  const b: typeof real.body.faces[number] = real.body.faces[1]!;
  const ac: typeof a.cycles[number] = a.cycles[0]!;
  const bc: typeof b.cycles[number] = b.cycles[0]!;
  if (ac === undefined || bc === undefined || ac.points.length !== 24 || bc.points.length !== 24 || ac.points.some((id: number, index: number): boolean => id !== bc.points[index]))
    throw new Error("Different output grids did not consume one shared ring.");
  for (const [face, offset] of [[real.surfaces[0]!, 0], [real.surfaces[1]!, 1]] as const)
    for (const station of [0.125, 0.375, 0.625, 0.875])
      for (const phi of [0.23, 1.9, 4.3])
        surfaceJet(face, station, phi, Made.oracle(offset + station, phi, 1), failures);
  const vertices: number[] = ac.points.map((id: number): number => {
    const point: typeof real.body.points[number] = real.body.points[id]!;
    const owner: number = real.mesh.owners.indexOf(point.chain);
    const found: number[] = [];
    for (let q: number = 0; q < real.mesh.coordinates.length; q += 3)
      if (real.mesh.coordinates[q] === owner && real.mesh.coordinates[q + 1] === point.chart[0] && real.mesh.coordinates[q + 2] === point.chart[1])
        found.push(q / 3);
    if (found.length !== 1) throw new Error("A shared source/chart identity was duplicated or lost in final skin.");
    return found[0]!;
  });
  meshStrip(real.mesh, vertices, [host.name, part.name], failures);
}

/** Observe actual adjacent mesh triangles by face, never reconstructing product geometry from them. */
function meshStrip(mesh: AutoMovieConstructionRealization.IMesh, ring: readonly number[], faces: readonly [string, string], failures: string[]): void {
  const boundary: Set<number> = new Set(ring);
  if (boundary.size !== ring.length) failures.push("The shared native ring repeats a mesh vertex.");
  const triangles: { ids: number[]; face: number }[] = [];
  for (let q: number = 0; q < mesh.indices.length; q += 3) {
    const ids: number[] = mesh.indices.slice(q, q + 3);
    if (!ids.some((id: number): boolean => boundary.has(id))) continue;
    const inside: number[] = ids.filter((id: number): boolean => !boundary.has(id));
    const owner: string | undefined = mesh.owners[mesh.coordinates[3 * inside[0]!]!];
    const face: number = owner === faces[0] ? 0 : owner === faces[1] ? 1 : -1;
    if (face < 0 || inside.some((id: number): boolean => mesh.owners[mesh.coordinates[3 * id]!] !== owner)) {
      failures.push("An adjacent mesh triangle has no unique original face owner.");
      continue;
    }
    triangles.push({ ids, face });
    for (const id of ids) {
      const station: number = mesh.coordinates[3 * id + 1]!;
      const phase: number = mesh.coordinates[3 * id + 2]!;
      const shared: boolean = boundary.has(id);
      if (!shared && !(face === 0 ? station >= 0 && station < 1 : station > 0 && station <= 1))
        failures.push("A strip vertex is outside its face's retained source interval.");
      const expected: number[] = Made.oracle(shared ? 1 : face + station, phase, 1).p;
      close(position(mesh, id), expected, failures, `actual mesh strip face ${face}`);
    }
    const [a, b, c]: [number[], number[], number[]] = [position(mesh, ids[0]!), position(mesh, ids[1]!), position(mesh, ids[2]!)];
    const nx: number = (b[1]! - a[1]!) * (c[2]! - a[2]!) - (b[2]! - a[2]!) * (c[1]! - a[1]!);
    const nz: number = (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!);
    const facing: number = nx * (a[0]! + b[0]! + c[0]!) + nz * (a[2]! + b[2]! + c[2]!);
    if (!(Number.isFinite(facing) && facing > 0)) failures.push(`Mesh strip face ${face} has a degenerate or inward triangle.`);
  }
  for (let k: number = 0; k < ring.length; k++) {
    const from: number = ring[k]!;
    const to: number = ring[(k + 1) % ring.length]!;
    const counts: number[] = [0, 0];
    for (const triangle of triangles) {
      if (!triangle.ids.includes(from) || !triangle.ids.includes(to)) continue;
      counts[triangle.face]!++;
      const direction: number = triangle.ids[(triangle.ids.indexOf(from) + 1) % 3] === to ? 1 : -1;
      if (direction !== (triangle.face === 0 ? 1 : -1)) failures.push(`Shared edge ${k} has the wrong direction on face ${triangle.face}.`);
    }
    if (counts[0] !== 1 || counts[1] !== 1) failures.push(`Shared edge ${k}: per-face incidence ${counts}, expected one each.`);
  }
}

/** Read actual emitted metre positions in the independent oracle's millimetres. */
function position(mesh: AutoMovieConstructionRealization.IMesh, id: number): number[] {
  return mesh.positions.slice(3 * id, 3 * id + 3).map((value: number): number => 1000 * value);
}

/** A nested continuation consuming the same part end must leave only the outer host. */
function rollback(failures: string[]): void {
  const a: IAutoMovieViewPart = Made.source("rollback.host", 256, 24);
  const b: IAutoMovieViewPart = Made.source("rollback.part", 64, 40, 1);
  const c: IAutoMovieViewPart = Made.source("rollback.inner", 64, 16);
  const root: IAutoMovieConstructionContinuation = tree(a.name, b.name);
  root.part = { ...tree(b.name, c.name), name: "inner", hostEnd: "bottom", partEnd: "top" };
  const real: AutoMovieConstructionRealization.IWithoutSkin = realizeAutoMovieConstruction({ name: "rollback", root }, { chord: 0.00005, skin: false, sources: new Map([[a.name, a], [b.name, b], [c.name, c]]) });
  if (real.chains.length !== 1 || real.chains[0]!.name !== a.name || real.body.faces.length !== 1 || real.body.faces[0]!.cycles.length !== 0 || real.body.points.length !== 0)
    failures.push("Part-end refusal did not restore the exact outer host populations.");
  if (!real.diagnostics.some((diagnostic: IAutoMovieConstructionDiagnostic): boolean => diagnostic.node === "native.join" && diagnostic.contract === "shared end" && diagnostic.detail.includes("part face")))
    failures.push("Part-end refusal lost its named continuation diagnostic.");
}

/** Closed source AST leaves preserve each distinct anatomical/source name. */
function tree(host: string, part: string): IAutoMovieConstructionContinuation {
  return { type: "continue", name: "native.join", host: { type: "source", name: host, source: host }, hostFace: host, hostEnd: "top", part: { type: "source", name: part, source: part }, partFace: part, partEnd: "bottom" };
}

/** Solid surface chart names map directly to the physical station/phase derivative contract. */
function surfaceJet(surface: IAutoMovieSolidSurface, station: number, phi: number, expected: AutoMovieLoftJet.IJet, failures: string[]): void {
  const actual: IAutoMovieSolidSurface.IJet = surface.jet(station, phi);
  jets({ p: actual.p, s: actual.u, t: actual.v, ss: actual.uu, st: actual.uv, tt: actual.vv }, expected, 1, failures, "actual strip");
}

/** Both chart coordinates receive sign; the mixed second derivative therefore keeps its sign. */
function jets(actual: AutoMovieLoftJet.IJet, expected: AutoMovieLoftJet.IJet, sign: 1 | -1, failures: string[], label: string): void {
  for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
    close(actual[key], expected[key].map((value: number): number => (key === "s" || key === "t" ? sign : 1) * value), failures, `${label}/${key}`);
}

/** Independent finite arithmetic budget, unrelated to mesh chord or density admission. */
function close(actual: readonly number[], expected: readonly number[], failures: string[], label: string): void {
  if (actual.some((value: number, index: number): boolean => !Number.isFinite(value) || !nclose(value, expected[index]!, 2e-8)))
    failures.push(`${label}: actual ${actual}, expected ${expected}`);
}
