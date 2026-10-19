import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Preserve one independent open plane across malformed run and analytic metadata.
 * Installed grid and streamed commands consume the same authored coefficients and
 * graph; neither receives a source mesh. Missing names cannot erase the valid run.
 *
 * @evidence contracts/common.md#principled-implementation A valid 3 by 2 millimetre plane has independent area six square millimetres while a disjoint missing curve must remain a local failed run.
 * @evidence contracts/common.md#clear-and-simple-design One bounded host integration exercises both installed command families and measures their unchanged finite geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original mesh, normal replacement, global patch, invented identity, generated-face snapshot or source fallback supplies the assertions.
 * @evidence contracts/common.md#meaningful-documentation States independent plane retention, local metadata failure and installed source-free execution.
 * @evidence contracts/performance.md#efficient-algorithms Constant-size coefficients and two graph pairs generate bounded small models; each output vertex and face is measured once.
 * @evidence contracts/performance.md#reuse-equivalent-work Both hosts reuse the same exact saved input bytes and graph; their separate numerical executions are explicitly measured as distinct conditions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the external output tree and bounded child runner; synchronous file handles close within each operation and only scalar receipts return.
 */
export function verifyAutoMovieRecoveryOpenFailures(input: {
  consumer: string;
  cli: string;
  sourceEpoch: string;
  curves: Buffer;
  run: (command: string, args: string[], cwd: string) => string;
}): { command: string; area: number; failedRuns: number }[] {
  const bundle: {
    reports: { open: unknown[] }[];
    analyticDomains?: unknown[];
  } = JSON.parse(input.curves.toString("utf8"));
  for (const report of bundle.reports) report.open.push({});
  bundle.analyticDomains = [null];
  const bytes: Buffer = Buffer.from(JSON.stringify(bundle));
  const curves: string = path.join(
    input.consumer,
    "outputs",
    "open-malformed-curves.json",
  );
  const graph: string = path.join(
    input.consumer,
    "outputs",
    "open-malformed-graph.json",
  );
  fs.writeFileSync(curves, bytes);
  fs.writeFileSync(
    graph,
    JSON.stringify({
      schema: "automovie-recovery-open-continuation-v1",
      criticalPolicy: "boundary-regular-path-v1",
      intervals: [
        {
          beforeSection: 0,
          afterSection: 1,
          pairs: [
            { before: 0, after: 0, reverseAfter: false },
            { before: 1, after: 1, reverseAfter: false },
          ],
          unresolved: [],
        },
      ],
      orientations: [
        [1, 1],
        [1, 1],
      ],
      diagnostics: [],
      resolutionMm: 1,
      maxVerticesPerRun: 1000,
      provenance: {
        curveBundleSha256: createHash("sha256").update(bytes).digest("hex"),
      },
    }),
  );
  const receipts: { command: string; area: number; failedRuns: number }[] = [];
  for (const command of ["recoveryOpen", "recoveryLocal"]) {
    const output: string = path.join(
      input.consumer,
      "outputs",
      `${command}-malformed-model.json`,
    );
    input.run(
      process.execPath,
      [
        "--permission",
        `--allow-fs-read=${input.consumer}`,
        `--allow-fs-write=${path.join(input.consumer, "outputs")}`,
        input.cli,
        command,
        "--source-epoch",
        input.sourceEpoch,
        ...(command === "recoveryOpen"
          ? ["reconstruct", curves, graph, output]
          : [curves, graph, output, "ruled", "final-only"]),
      ],
      input.consumer,
    );
    const model: {
      model: {
        parts: {
          geometry: {
            type: string;
            mesh: { positions: number[]; indices: number[] };
          };
        }[];
      };
      openReports: {
        runs: {
          generated: boolean;
          reason: string | null;
          curves: string[];
          unqualifiedFitMetadata?: number;
          fitPolylineUpperEstimateMaximumMm?: number | null;
        }[];
      };
      analyticOwnership?: { admitted: boolean | null; id: string | null }[];
    } = JSON.parse(fs.readFileSync(output, "utf8"));
    let area: number = 0;
    for (const part of model.model.parts) {
      const mesh: (typeof part.geometry)["mesh"] = part.geometry.mesh;
      if (
        part.geometry.type !== "mesh" ||
        mesh.positions.length % 3 ||
        mesh.indices.length % 3 ||
        !mesh.positions.every(Number.isFinite) ||
        !mesh.indices.every(
          (index: number): boolean =>
            Number.isSafeInteger(index) &&
            index >= 0 &&
            index * 3 + 2 < mesh.positions.length,
        )
      )
        throw new Error(
          "Malformed metadata erased valid finite indexed plane geometry",
        );
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const p: number[][] = mesh.indices
          .slice(i, i + 3)
          .map((index: number): number[] =>
            mesh.positions.slice(index * 3, index * 3 + 3),
          );
        const a: number[] = p[0]!,
          b: number[] = p[1]!,
          c: number[] = p[2]!;
        const u: number[] = b.map(
            (value: number, axis: number): number => value - a[axis]!,
          ),
          v: number[] = c.map(
            (value: number, axis: number): number => value - a[axis]!,
          );
        area +=
          Math.hypot(
            u[1]! * v[2]! - u[2]! * v[1]!,
            u[2]! * v[0]! - u[0]! * v[2]!,
            u[0]! * v[1]! - u[1]! * v[0]!,
          ) / 2;
      }
    }
    const failed: typeof model.openReports.runs = model.openReports.runs.filter(
      (run: (typeof model.openReports.runs)[number]): boolean => !run.generated,
    );
    if (
      !Number.isFinite(area) ||
      Math.abs(area - 6e-6) > 1e-12 ||
      failed.length !== 1 ||
      failed[0]!.reason === null ||
      failed[0]!.curves.length !== 0
    )
      throw new Error(
        "Installed malformed open run lost independent area or its explicit local failure",
      );
    if (
      command === "recoveryLocal" &&
      (failed[0]!.unqualifiedFitMetadata !== 2 ||
        failed[0]!.fitPolylineUpperEstimateMaximumMm !== null ||
        model.analyticOwnership?.length !== 1 ||
        model.analyticOwnership[0]!.admitted !== null ||
        model.analyticOwnership[0]!.id !== null)
    )
      throw new Error(
        "Unknown streamed fit or analytic ownership metadata was fabricated",
      );
    receipts.push({ command, area, failedRuns: failed.length });
  }
  if (!fs.readFileSync(curves).equals(bytes))
    throw new Error("Saved malformed input was mutated");
  return receipts;
}
