import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { assertHumanSourceSampleBuffers } from "./assertHumanSourceSampleBuffers.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";
import type { IHumanSourceSampleManifest } from "./structures/IHumanSourceSampleManifest.ts";
import type { IHumanSourceSampleWeights } from "./structures/IHumanSourceSampleWeights.ts";

/**
 * Load one sampling run and verify every file against the run's own manifest
 * digests, so a partially overwritten or mixed directory is refused rather
 * than compiled.
 */
export function readHumanSourceSample(directory: string): IHumanSourceSample {
  const manifestBytes = fs.readFileSync(path.join(directory, "manifest.json"));
  const manifest: IHumanSourceSampleManifest = JSON.parse(
    manifestBytes.toString("utf8"),
  );
  const bytes = (name: string): Buffer => {
    const data = fs.readFileSync(path.join(directory, name));
    const expected = manifest.files[name];
    if (expected === undefined)
      throw new Error(`Sample file ${name} is not in its manifest.`);
    const actual = crypto.createHash("sha256").update(data).digest("hex");
    if (actual !== expected.sha256 || data.length !== expected.bytes)
      throw new Error(
        `Sample file ${name} does not match its manifest digest.`,
      );
    return data;
  };
  const f64 = (name: string): Float64Array => {
    const data = bytes(name);
    return new Float64Array(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    );
  };
  const i32 = (name: string): Int32Array => {
    const data = bytes(name);
    return new Int32Array(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    );
  };
  const weights: IHumanSourceSampleWeights = JSON.parse(
    bytes("weights.json").toString("utf8"),
  );
  const sample: IHumanSourceSample = {
    directory,
    manifestBytes,
    manifest,
    neutral: f64("neutral.f64"),
    landmarksNeutral: f64("landmarks-neutral.f64"),
    loopStart: i32("loop-start.i32"),
    loopTotal: i32("loop-total.i32"),
    loopVertex: i32("loop-vertex.i32"),
    loopUv: f64("loop-uv.f64"),
    weights,
    flattenInterior: i32("flatten-interior.i32"),
    flattenBoundary: i32("flatten-boundary.i32"),
    flattenOperator: f64("flatten-operator.f64"),
    genitalInterior: i32("genital-fill-interior.i32"),
    genitalBoundary: i32("genital-fill-boundary.i32"),
    genitalOperator: f64("genital-fill-operator.f64"),
    rowsVertex: i32("rows.i32"),
    rowsDelta: f64("rows.f64"),
    landmarkDelta: f64("landmarks.f64"),
    states: new Map(manifest.states.map((state) => [state.name, state])),
    partPositions: new Map(
      manifest.parts.map((part) => [
        part.id,
        new Map(
          Object.entries(part.files).map(([level, file]) => [level, f64(file)]),
        ),
      ]),
    ),
  };
  assertHumanSourceSampleBuffers(sample);
  return sample;
}
