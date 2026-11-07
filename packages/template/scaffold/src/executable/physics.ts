import {
  AutoMoviePhysicalPlayback,
  AutoMoviePhysicalSimulation,
} from "@automovie/engine";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Precompute the authored numerical input in Node; Viewer playback only downloads its archive. */
async function main(): Promise<void> {
  const [file, destination, byteLimit]: string[] = process.argv.slice(2);
  if (!file || !destination)
    throw new Error(
      "Usage: physics <input-module.ts> <output.amphys> [maximum-bytes]",
    );
  const producer: {
    createPhysicalInput?: () =>
      | AutoMoviePhysicalSimulation.IInput
      | Promise<AutoMoviePhysicalSimulation.IInput>;
  } = await import(pathToFileURL(path.resolve(file)).href);
  if (typeof producer.createPhysicalInput !== "function")
    throw new Error("Input module must export createPhysicalInput()");
  const input: AutoMoviePhysicalSimulation.IInput =
    await producer.createPhysicalInput();
  const run: AutoMoviePhysicalSimulation =
    await AutoMoviePhysicalSimulation.compute(input);
  const bytes: Uint8Array = await AutoMoviePhysicalPlayback.encode(
    run.cache,
    Number(byteLimit ?? 268435456),
  );
  const output: string = path.resolve(destination);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bytes);
  const manifest: object = {
    identity: run.cache.identity,
    protocol: run.cache.protocol,
    duration: run.cache.duration,
    rate: run.cache.rate,
    bytes: bytes.length,
  };
  await writeFile(`${output}.json`, JSON.stringify(manifest, null, 2), "utf8");
  console.log(manifest);
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
