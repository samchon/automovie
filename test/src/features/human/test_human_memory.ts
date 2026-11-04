import v8 from "node:v8";

import { AutoMovieHuman } from "../../../../packages/human/src/AutoMovieHuman";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanPeople } from "../internal/HumanPeople";

/** Bytes in a mebibyte. */
const MB: number = 1024 * 1024;

/**
 * Pins that the Human tests hold one person at a time within the default
 * heap: each person's generated figure is measured part by part, and the heap
 * after the person's views are dropped returns to where it started.
 *
 * Scenarios:
 * 1. For every person of the run: the heap before, the bytes of the generated calibration (its chains and every other field, by `v8.serialize`), of the bind skin's typed arrays, and of the public figure's parts by kind (skin, hair, eyes, mouth, construction curves and the rest), then the heap with those views alive; each person is dropped before the next.
 * 2. The test fails when one person's views take more than a quarter of the heap's limit, or when the heap after the last person stays a quarter of the limit above where it started (a view that outlives its test).
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person along the generator's own stages (`AutoMovieHumanBodyLaw.calibrate`, `AutoMovieHumanBodySurface.generate` for the bind skin, `AutoMovieHuman.generate` for the public figure), reads `process.memoryUsage().heapUsed` after a full collection when the process exposes `gc`, and sizes each part by its own buffers. It catches a cache that keeps people past their test, which ran the four-person gate out of the default 4 GB heap at 03:17, and a generator output whose own size makes one person a large share of the heap.
 * @evidence contracts/testing.md#independent-expectations The bound is the default V8 heap limit (`v8.getHeapStatistics().heap_size_limit`): the tests run one function at a time, so a person's views plus one test's work must fit in it, and a quarter of it per person leaves the rest to the test; anything still held after the scope ends is a leak by definition. Oracle limits: without `--expose-gc` the heap readings include garbage not yet collected, so the readings are upper bounds; `v8.serialize` sizes the calibration's structured data, not its in-heap layout.
 * @evidence contracts/testing.md#distinguishing-cases Every person of the run, short and tall, slight and heavy; the reference bodies belong to the reference tests alone.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_memory`, generating each person in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_memory(): void {
  const limit: number = v8.getHeapStatistics().heap_size_limit;
  const heap: () => number = (): number => {
    (globalThis as { gc?: () => void }).gc?.();
    return process.memoryUsage().heapUsed;
  };
  const lines: string[] = [`heap limit ${(limit / MB).toFixed(0)} MB; gc ${(globalThis as { gc?: () => void }).gc === undefined ? "not exposed (readings are upper bounds)" : "exposed"}`];
  const findings: string[] = [];
  const start: number = heap();
  for (const name of HumanPeople.names()) {
    const before: number = heap();
    const calibration: IAutoMovieHumanBodyCalibration = AutoMovieHumanBodyLaw.calibrate(HumanPeople.params(name)).body;
    const body: number = v8.serialize(calibration).byteLength;
    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(calibration, []);
    const skinBytes: number = 8 * (surface.mesh.positions.length + surface.mesh.indices.length);
    const parts: IAutoMovieModelPart[] = AutoMovieHuman.generate(HumanPeople.params(name)).model.parts;
    const kinds: Map<string, number> = new Map();
    for (const p of parts) {
      const kind: string = p.id.split(".").slice(0, 2).join(".");
      const bytes: number = p.geometry.type === "mesh" ? meshBytes(p.geometry.mesh) : 0;
      kinds.set(kind, (kinds.get(kind) ?? 0) + bytes);
    }
    const alive: number = heap();
    const views: number = alive - before;
    lines.push(
      `${name.padEnd(8)} calibration ${(body / MB).toFixed(1)} MB, bind skin ${(skinBytes / MB).toFixed(1)} MB, figure parts ${[...kinds].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).map(([k, v]: [string, number]): string => `${k} ${(v / MB).toFixed(1)}`).join(", ")} MB; heap with views +${(views / MB).toFixed(0)} MB`,
    );
    if (views > limit / 4) findings.push(`${name}: its views take ${(views / MB).toFixed(0)} MB, over a quarter of the ${(limit / MB).toFixed(0)} MB heap`);
  }
  const end: number = heap();
  lines.push(`heap at start ${(start / MB).toFixed(0)} MB, after every person dropped ${(end / MB).toFixed(0)} MB`);
  if (end - start > limit / 4) findings.push(`the heap stays ${((end - start) / MB).toFixed(0)} MB above its start after every view was dropped: something outlives its test`);
  console.log(lines.join("\n"));
  if (findings.length !== 0) throw new Error(`${findings.length} memory findings:\n${findings.join("\n")}\n${lines.join("\n")}`);
}

/** A mesh's own buffers, bytes as packed doubles: positions, normals, uvs, colours, skin weights and every morph target. */
function meshBytes(m: IAutoMovieMesh): number {
  const n: (a: readonly number[] | null | undefined) => number = (a: readonly number[] | null | undefined): number => 8 * (a?.length ?? 0);
  return (
    n(m.positions) +
    n(m.normals) +
    n(m.uvs) +
    n(m.colors) +
    n(m.indices) +
    n(m.skin?.boneIndices) +
    n(m.skin?.weights) +
    (m.targets ?? []).reduce((s: number, t: { positions: number[]; normals: number[] | null }): number => s + n(t.positions) + n(t.normals), 0)
  );
}
