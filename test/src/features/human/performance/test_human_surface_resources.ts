import { createHash } from "node:crypto";
import path from "node:path";

import { HumanDebugEnvironment } from "../../../../../packages/human/debug/server/HumanDebugEnvironment";
import { HumanDebugGenerationSlot } from "../../../../../packages/human/debug/server/HumanDebugGenerationSlot";
import type { IHumanDebugEnvironment } from "../../../../../packages/human/debug/server/IHumanDebugEnvironment";
import type { IAutoMovieHumanPose } from "../../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "../../internal/HumanAnatomy";
import { HumanAnatomyPose } from "../../internal/HumanAnatomyPose";
import { HumanAnatomySkins } from "../../internal/HumanAnatomySkins";
import { HumanAnatomySurface } from "../../internal/HumanAnatomySurface";
import { HumanPeople } from "../../internal/HumanPeople";

/**
 * Read one selected person's actual observer storage without running an anatomy
 * acceptance audit. Counts and typed-buffer bytes have deterministic meanings;
 * process memory and elapsed time are observations, never acceptance limits.
 *
 * Scenarios:
 * 1. Generation acquires the existing shared viewer/probe slot and releases it in finally before diagnostics, queries or posing. Its wait and UTC boundaries are reported separately. A fresh views object owns no skin buffers; bind generation acquires one position buffer and one shared topology.
 * 2. Actual nearest-distance and both signed rays on all axes acquire one shared hierarchy. Distances are finite for nonempty skins, ray counts agree with the presence of their nearest hits, and the global distance cannot exceed a ray hit's distance. Repeated identical queries agree and keep the same population. Typed capacity is linear in triangles, without guessing JavaScript container overhead.
 * 3. Every supported audit pose and both full-flexion volume requests are read and queried, acquiring each pose's real hierarchy. Repeating their value-equivalent requests hits the existing cache, retains no further skin and changes no earlier position buffer. Releasing the local views reference ends this test's ownership; no deterministic garbage-collection claim is made.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual observer views, ray and distance entries, validates their numerical results, then reads cache populations and typed-buffer byte lengths. It catches NaN or missing nonempty distances, inconsistent ray hits, counters that generate geometry, duplicated topology accounting and new skins retained on equivalent repeated requests.
 * @evidence contracts/testing.md#independent-expectations A finite nonempty closed-triangle set has a finite nonnegative nearest distance, at most the distance of any ray hit; zero ray hits have no nearest hit and a positive integer count has a finite positive nearest hit. Position bytes come from byteLength; each distinct pose owns one same-sized position buffer. Integer-cell spans independently derive old replication. A binary primitive tree has fewer than 2 T nodes with one occurrence per triangle, giving a linear typed-capacity bound including doubling scratch. No measured time, heap reading or old snapshot supplies a pass threshold.
 * @evidence contracts/testing.md#distinguishing-cases Covers no skin, bind only, first and repeated spatial queries, neutral, every supported audit pose, full flexions and JSON-value-equivalent repeated requests. Synthetic query geometry and empty/singleton indexes belong to human_surface_queries; anatomical correctness remains with the audits.
 * @evidence contracts/testing.md#execution-ownership One async Node CPU reading reached by --include human_surface_resources. It reuses HumanDebugEnvironment's absolute shared slot root/count, acquires the existing GenerationSlot before person/bind generation and releases it in finally on success or failure; slot wait is separate from measurement and the seven pose/query reads hold no slot. HumanPeople supplies the selected population and the campaign uses AUTOMOVIE_HUMAN_PEOPLE=f1. No browser, process, renderer, private lock system or saved fixture is started.
 */
export async function test_human_surface_resources(): Promise<void> {
  const failures: string[] = [];
  const environment: IHumanDebugEnvironment = HumanDebugEnvironment(path.resolve(__dirname, "../../../../../packages/human"));
  if (!path.isAbsolute(environment.slotRoot)) throw new Error("The shared Human generation slot root must be absolute");
  for (const name of HumanPeople.names()) {
    const waiting: number = performance.now();
    console.log(JSON.stringify({ name, pid: process.pid, phase: "waiting-for-generation-slot", atUtc: new Date().toISOString(), slotRoot: environment.slotRoot, slots: environment.slots }));
    const slot: HumanDebugGenerationSlot = await HumanDebugGenerationSlot.acquire(environment.slotRoot, environment.slots, `surface resources ${name}`);
    const started: number = performance.now();
    const slotWaitMs: number = started - waiting;
    let views: HumanAnatomySkins.IViews;
    let bind: HumanAnatomy.ISkin;
    let generationMs: number;
    try {
      console.log(JSON.stringify({ name, pid: process.pid, phase: "before-generation", atUtc: new Date().toISOString(), slotWaitMs, memory: process.memoryUsage() }));
      views = HumanAnatomySkins.views(name);
      if (views.statistics().positionBytes !== 0) throw new Error("Reading fresh statistics generated a skin");
      bind = views.bind();
      generationMs = performance.now() - started;
    } finally {
      slot.release();
    }
    console.log(JSON.stringify({ name, pid: process.pid, phase: "generation-released", atUtc: new Date().toISOString(), generationMs, slotWaitMs }));
    const diagnosticStarted: number = performance.now();
    const expected: { ray: number; distance: number } = references(bind);
    console.log(JSON.stringify({ name, phase: "bind", elapsedMs: performance.now() - started, generationMs, diagnosticMs: performance.now() - diagnosticStarted, vertices: bind.P.length / 3, triangles: bind.I.length / 3, legacyReferences: expected, retained: views.statistics(), memory: process.memoryUsage() }));

    const queryStarted: number = performance.now();
    observe(bind, [0.13, 700.17, 0.19], failures);
    const indexed: HumanAnatomySurface.IStatistics = HumanAnatomySurface.statistics(bind);
    observe(bind, [0.13, 700.17, 0.19], failures);
    const repeated: HumanAnatomySurface.IStatistics = HumanAnatomySurface.statistics(bind);
    if (JSON.stringify(indexed) !== JSON.stringify(repeated)) throw new Error("Repeated queries changed the retained index population");
    if (indexed.indexes !== 1 || indexed.triangleReferences !== bind.I.length / 3 || indexed.typedBytes > 188 * (bind.I.length / 3) + 256) throw new Error("Observer index capacity is not linear in its triangle population");
    observe(bind, [0.23, 700.27, 0.29], failures);
    console.log(JSON.stringify({ name, phase: "indexed", elapsedMs: performance.now() - started, queryMs: performance.now() - queryStarted, index: indexed, memory: process.memoryUsage() }));

    const requests: IAutoMovieHumanPose[] = [...Object.values(HumanAnatomyPose.POSES), ...HumanAnatomyPose.FLEXION.map((entry: [string, IAutoMovieHumanPose, string[]]): IAutoMovieHumanPose => entry[1])];
    const unique: Set<string> = new Set();
    let first: HumanAnatomy.ISkin | undefined;
    let witness: string = "";
    let poseIndexBytes: number = 0;
    for (const request of requests) {
      const skin: HumanAnatomy.ISkin = views.posed(request);
      if (first === undefined) {
        first = skin;
        witness = digest(skin.P);
      }
      const key: string = JSON.stringify(request);
      if (!unique.has(key)) {
        observe(skin, [0.13, 700.17, 0.19], failures);
        const retained: HumanAnatomySurface.IStatistics = HumanAnatomySurface.statistics(skin);
        if (retained.indexes !== 1 || retained.triangleReferences !== skin.I.length / 3 || retained.typedBytes > 188 * (skin.I.length / 3) + 256) failures.push(`${name} pose ${key}: index capacity is not linear`);
        poseIndexBytes += retained.typedBytes;
      }
      unique.add(key);
      if (skin.I !== bind.I || skin.tri !== bind.tri) throw new Error("A posed skin copied shared topology");
    }
    const beforeRepeat: HumanAnatomySkins.IStatistics = views.statistics();
    for (const request of requests) views.posed(structuredClone(request));
    const afterRepeat: HumanAnatomySkins.IStatistics = views.statistics();
    if (afterRepeat.posedSkins !== unique.size || afterRepeat.positionBytes !== (unique.size + 1) * bind.P.byteLength) throw new Error("Retained pose position bytes disagree with distinct requests");
    if (afterRepeat.posedSkins !== beforeRepeat.posedSkins || afterRepeat.poseHits - beforeRepeat.poseHits !== requests.length) throw new Error("Value-equivalent pose reads did not reuse their cached skin");
    if (first !== undefined && digest(first.P) !== witness) throw new Error("A later pose mutated an earlier skin");
    console.log(JSON.stringify({ name, phase: "poses", elapsedMs: performance.now() - started, requests: requests.length, distinct: unique.size, poseIndexBytes, retained: afterRepeat, memory: process.memoryUsage() }));
  }
  if (failures.length !== 0) throw new Error(`${failures.length} actual surface-query findings:\n${failures.join("\n")}`);
}

/**
 * Read real scalar results as well as resource counters, collecting every
 * numerical inconsistency without asserting that this person's anatomy passes.
 *
 * Calls global distance twice and each signed-axis ray twice on the actual skin, catching nonfinite distances, mismatched hit/count results and unstable repeat reads.
 * Every ray hit is a point on some triangle, so global nearest distance is no greater. A nonempty finite mesh has a finite nonnegative nearest distance; a zero count has no nearest hit, and a positive count has a positive finite one. Repeated immutable-input queries have the same scalar results. No inside/outside parity or anatomy tolerance is inferred.
 * Both signs of all axes, two bind probes and every retained pose are read; zero-hit rays may legitimately return Infinity. All findings are collected until the owning resource test finishes.
 * Synchronous CPU queries retain only scalar results and finding strings, with O(1) scratch independent of the mesh's population or extent.
 */
function observe(skin: HumanAnatomy.ISkin, p: HumanAnatomy.V3, failures: string[]): void {
  const distance: number = HumanAnatomySurface.distances(skin, [p])[0]!;
  if (skin.I.length === 0 || !Number.isFinite(distance) || distance < 0) failures.push(`${skin.name}: nonempty finite skin has distance ${distance}`);
  if (HumanAnatomySurface.distances(skin, [p])[0] !== distance) failures.push(`${skin.name}: repeated distance changed`);
  for (let axis: number = 0; axis < 3; axis++)
    for (const sign of [-1, 1] as const) {
      const hit: { crossings: number; nearest: number } = HumanAnatomySurface.ray(skin, p, axis, sign);
      const again: { crossings: number; nearest: number } = HumanAnatomySurface.ray(skin, p, axis, sign);
      if (!Number.isInteger(hit.crossings) || hit.crossings < 0 || (hit.crossings === 0 ? hit.nearest !== Infinity : !Number.isFinite(hit.nearest) || hit.nearest <= 0)) failures.push(`${skin.name} axis ${axis} sign ${sign}: inconsistent hit ${JSON.stringify(hit)}`);
      if (hit.crossings !== again.crossings || hit.nearest !== again.nearest) failures.push(`${skin.name} axis ${axis} sign ${sign}: repeated ray changed`);
      if (Number.isFinite(hit.nearest) && distance > hit.nearest + 1e-9 * Math.max(1, hit.nearest)) failures.push(`${skin.name} axis ${axis} sign ${sign}: global distance ${distance} exceeds ray hit ${hit.nearest}`);
    }
}

/**
 * Hash all existing position bytes through a zero-copy Buffer view.
 *
 * Detects mutation anywhere in an earlier returned skin after later pose requests.
 * The observer's immutable-output contract requires the same bytes before and after unrelated requests; no stored generated snapshot is an oracle.
 * Reads every component, including a change outside the first vertex, and preserves the original buffer.
 * Local synchronous CPU hashing of the existing buffer with a borrowed byte view, retaining only a digest string.
 */
function digest(positions: Float64Array): string {
  return createHash("sha256").update(Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength)).digest("hex");
}

/**
 * Derive old grid entries by summing bounding-box cell populations, using only
 * scalar scratch instead of allocating the cells being investigated.
 *
 * Reports the old strategy's required entries before the real queries acquire their hierarchy.
 * A closed integer interval has floor(max/cell)-floor(min/cell)+1 cells; Cartesian products give the three projected rectangles and the volume box.
 * Reads every emitted indexed triangle, including long triangles and negative coordinates, for the historical 4 mm ray and 6 mm distance cells formerly used by the real audit consumers.
 * A local synchronous O(T) diagnostic with O(1) scratch, called only by the resource reading.
 */
function references(skin: HumanAnatomy.ISkin): { ray: number; distance: number } {
  let ray: number = 0;
  let distance: number = 0;
  for (let t: number = 0; t < skin.I.length; t += 3) {
    const x: number = span(skin, t, 0, 4);
    const y: number = span(skin, t, 1, 4);
    const z: number = span(skin, t, 2, 4);
    ray += x * y + y * z + z * x;
    distance += span(skin, t, 0, 6) * span(skin, t, 1, 6) * span(skin, t, 2, 6);
  }
  return { ray, distance };
}

/**
 * Count integer cells along one coordinate of a triangle's bounding box.
 *
 * Supplies scalar spans to the resource reading, allocating no per-triangle arrays.
 * Inclusive integer interval cardinality, including a maximum exactly on a cell boundary.
 * Uses indexed corners, all axes, negative coordinates and each queried cell width.
 * A local pure CPU arithmetic helper owned by human_surface_resources.
 */
function span(skin: HumanAnatomy.ISkin, t: number, axis: number, cell: number): number {
  const a: number = skin.P[3 * skin.I[t]! + axis]!;
  const b: number = skin.P[3 * skin.I[t + 1]! + axis]!;
  const c: number = skin.P[3 * skin.I[t + 2]! + axis]!;
  return Math.floor(Math.max(a, b, c) / cell) - Math.floor(Math.min(a, b, c) / cell) + 1;
}
