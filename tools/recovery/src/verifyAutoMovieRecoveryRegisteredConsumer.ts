import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Exercise installed observation and continuation commands on one registered cube.
 * The declared saved-curve hash must remain the continuation graph authority.
 *
 * @evidence contracts/common.md#principled-implementation A fixed generic cube and explicit registration exercise public installed commands, then compare the exact generated curve bytes to the declared graph identity.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the registered-input scenario; the caller owns installation, child execution policy and evidence retention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original subject, source alias, geometry override, global replacement or mesh fallback supplies the installed consumer.
 * @evidence contracts/common.md#meaningful-documentation States the generic input and exact continuation-authority expectation.
 * @evidence contracts/performance.md#efficient-algorithms Fixture construction has constant size; the delegated observation runs once and hashing scans its saved bytes once.
 * @evidence contracts/performance.md#reuse-equivalent-work Continuation reuses the observed saved artifact; it does not refit the cube or regenerate a second curve authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's synchronous time-bounded runner owns children; synchronous file calls close handles and the caller retains generated evidence.
 */
export function verifyAutoMovieRecoveryRegisteredConsumer(props: {
  consumer: string;
  cli: string;
  sourceEpoch: string;
  run: (command: string, args: string[], cwd: string) => string;
}): void {
  const { consumer, cli: packageCli, sourceEpoch, run }: typeof props = props;
  const meshBytes: Buffer = Buffer.from(
    JSON.stringify({
      vertices: [
        [0, 0, 0],
        [3, 0, 0],
        [3, 3, 0],
        [0, 3, 0],
        [0, 0, 3],
        [3, 0, 3],
        [3, 3, 3],
        [0, 3, 3],
      ],
      triangles: [
        [0, 2, 1],
        [0, 3, 2],
        [4, 5, 6],
        [4, 6, 7],
        [0, 1, 5],
        [0, 5, 4],
        [1, 2, 6],
        [1, 6, 5],
        [3, 7, 6],
        [3, 6, 2],
        [0, 4, 7],
        [0, 7, 3],
      ],
    }),
  );
  fs.writeFileSync(path.join(consumer, "outputs", "mesh.json"), meshBytes);
  const specFile: string = path.join(consumer, "outputs", "input.json");
  fs.writeFileSync(
    specFile,
    JSON.stringify({
      units: "mm",
      frame: "registered-box",
      pose: "fixed",
      registration: {
        schema: "automovie-recovery-registration-v1",
        units: "mm",
        frame: "registered-box",
        handedness: "right-handed",
        sourceToRegistered: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        evaluatedPose: "fixed",
        componentPolicy: "all-evaluated",
        uncertainty: [],
      },
      meshes: [
        {
          path: "mesh.json",
          sha256: createHash("sha256").update(meshBytes).digest("hex"),
        },
      ],
      policy: {
        axis: [0, 1, 0],
        reference: [1, 0, 0],
        stepMm: 1,
        toleranceMm: 0.01,
        chordToleranceMm: 0.01,
        maxSections: 32,
        maxSpans: 32,
        exactCoordinateAliases: false,
        sourceOrientationSign: 1,
        cornerDegrees: 45,
      },
    }),
  );
  const observedFile: string = path.join(consumer, "outputs", "observed.json"),
    graphFile: string = path.join(consumer, "outputs", "continuation.json");
  run(
    process.execPath,
    [
      packageCli,
      "recovery",
      "--source-epoch",
      sourceEpoch,
      "extract",
      specFile,
      observedFile,
    ],
    consumer,
  );
  run(
    process.execPath,
    [
      packageCli,
      "recoveryOpen",
      "--source-epoch",
      sourceEpoch,
      "observe",
      specFile,
      observedFile,
      graphFile,
    ],
    consumer,
  );
  const graph: { schema: string; provenance: { curveBundleSha256: string } } =
    JSON.parse(fs.readFileSync(graphFile, "utf8"));
  if (
    graph.schema !== "automovie-recovery-open-continuation-v1" ||
    graph.provenance.curveBundleSha256 !==
      createHash("sha256").update(fs.readFileSync(observedFile)).digest("hex")
  )
    throw new Error(
      "Installed continuation observation lost the exact registered saved-curve authority",
    );
}
